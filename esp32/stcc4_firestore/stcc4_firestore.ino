// XIAO ESP32C6 + DFRobot Gravity STCC4（CO2・温湿度）→ Firestore（ダッシュボードの environmental_data）
//
// pico/main.py と同じ方法で送る:
//   1. センサー用アカウント（sensor@farm-dashboard.local）でログインしてトークンを取る（1時間有効）
//   2. Firestore の commit API で1件追加する。timestamp はサーバーの時刻（REQUEST_TIME）を使う
//      （Firestore のルールが timestamp == サーバー時刻 を求めるので、ESP32 の時計は使わない。NTP も不要）
// Wi-Fi やパスワード、送信先のハウスIDは secrets.h に書く（secrets_example.h をコピーして作る）。
//
// 必要なもの: ボード「esp32 by Espressif Systems」、ライブラリ「DFRobot_STCC4」
// 配線: VCC→3V3, GND→GND, SDA(D)→D4, SCL(C)→D5（I2C アドレス 0x64）

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <esp_random.h>
#include "DFRobot_STCC4.h"
#include "secrets.h"

// Firebase の Web 用 API キーとプロジェクトID（ダッシュボードの src/firebase.js と同じ公開値）
const char* API_KEY = "AIzaSyAHduV83j0eSdJQIvUGRqmmyN6sH0b4L0k";
const char* PROJECT_ID = "farm-dashboard-95875";

const unsigned long SEND_INTERVAL_MS = 2UL * 60UL * 1000UL;  // 2分ごと（Pico W と同じ）
const int MAX_FAILURES = 10;  // この回数続けて失敗したら再起動する（Wi-Fi などの不調からの復帰用）

// STCC4 の状態フラグのうちエラーを表すもの（電源電圧・デバッグ・SHT未接続・メモリ・テストモード）
const uint16_t STATUS_ERROR_MASK = 1 | 16 | 96 | 16384;

DFRobot_STCC4_I2C sensor(&Wire, 0x64);

String idToken;
unsigned long tokenExpiresAt = 0;  // millis() 基準
unsigned long lastSend = 0;
int failures = 0;

String documentsPath() {
  return String("projects/") + PROJECT_ID + "/databases/(default)/documents";
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Wi-Fi 接続中: ");
  Serial.print(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf(" 接続OK  IP: %s  電波: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println(" 接続失敗");
  }
}

// JSON の "key": "値" から値を取り出す（ログインの応答を読むだけなので簡単な方法で）
String jsonString(const String& json, const char* key) {
  String pattern = String("\"") + key + "\"";
  int i = json.indexOf(pattern);
  if (i < 0) return "";
  i = json.indexOf(':', i + pattern.length());
  if (i < 0) return "";
  i = json.indexOf('"', i + 1);
  if (i < 0) return "";
  int end = json.indexOf('"', i + 1);
  if (end < 0) return "";
  return json.substring(i + 1, end);
}

// HTTPS で JSON を POST し、ステータスコードを返す（応答の本文は response に入る）
int postJson(const String& url, const String& body, const String& bearer, String& response) {
  WiFiClientSecure client;
  client.setInsecure();  // 証明書の確認を省略（校内での運用向け。README の「今後」を参照）
  HTTPClient http;
  if (!http.begin(client, url)) {
    response = "接続を始められません";
    return -1;
  }
  http.setTimeout(20000);
  http.addHeader("Content-Type", "application/json");
  if (bearer.length() > 0) http.addHeader("Authorization", "Bearer " + bearer);
  int code = http.POST(body);
  response = code > 0 ? http.getString() : http.errorToString(code);
  http.end();
  return code;
}

// センサー用アカウントでログインして ID トークンを取る
bool signIn() {
  String url = String("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=") + API_KEY;
  String body = String("{\"email\":\"") + SENSOR_EMAIL + "\",\"password\":\"" + SENSOR_PASSWORD +
                "\",\"returnSecureToken\":true}";
  String response;
  int code = postJson(url, body, "", response);
  if (code != 200) {
    Serial.printf("ログイン失敗 %d: %s\n", code, response.c_str());
    idToken = "";
    return false;
  }
  idToken = jsonString(response, "idToken");
  long expiresIn = jsonString(response, "expiresIn").toInt();
  if (idToken.length() == 0 || expiresIn <= 0) {
    Serial.println("ログインの応答を読めませんでした");
    idToken = "";
    return false;
  }
  // 期限の5分前に取り直す
  tokenExpiresAt = millis() + (unsigned long)(expiresIn - 300) * 1000UL;
  Serial.println("ログイン OK");
  return true;
}

bool tokenValid() {
  return idToken.length() > 0 && (long)(tokenExpiresAt - millis()) > 0;
}

String randomDocId() {
  const char* hex = "0123456789abcdef";
  String id;
  for (int i = 0; i < 20; i++) id += hex[esp_random() & 0x0F];
  return id;
}

// environmental_data に1件追加する。成功なら true
bool sendReading(uint16_t co2, float temperature, float humidity) {
  String fields = "{";
  fields += "\"location\":{\"stringValue\":\"" + String(LOCATION) + "\"},";
  fields += "\"temperature\":{\"doubleValue\":" + String(temperature, 1) + "},";
  fields += "\"humidity\":{\"doubleValue\":" + String(humidity, 1) + "},";
  fields += "\"co2\":{\"integerValue\":\"" + String(co2) + "\"}";
  fields += "}";

  String body = "{\"writes\":[{";
  body += "\"update\":{\"name\":\"" + documentsPath() + "/environmental_data/" + randomDocId() + "\",";
  body += "\"fields\":" + fields + "},";
  body += "\"updateTransforms\":[{\"fieldPath\":\"timestamp\",\"setToServerValue\":\"REQUEST_TIME\"}],";
  body += "\"currentDocument\":{\"exists\":false}";
  body += "}]}";

  String url = "https://firestore.googleapis.com/v1/" + documentsPath() + ":commit";
  String response;
  int code = postJson(url, body, idToken, response);
  Serial.printf("送信結果: %d\n", code);
  if (code == 200) return true;
  if (code == 401) idToken = "";  // トークン切れ。次回ログインし直す
  if (code == 403) {
    Serial.printf("送信拒否(403): ハウスID「%s」がダッシュボードに登録されているか、"
                  "Firestore のルールが反映されているか確認\n", LOCATION);
  }
  Serial.println(response);
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.printf("起動  送信先: %s  間隔: %lu 秒\n", LOCATION, SEND_INTERVAL_MS / 1000);

  while (!sensor.begin()) {
    Serial.println("STCC4 が見つかりません（配線と I2C アドレス 0x64 を確認）");
    delay(1000);
  }
  sensor.wakeup();
  delay(10);
  sensor.startMeasurement();

  connectWiFi();
  lastSend = millis() - SEND_INTERVAL_MS;  // 起動直後に1回送る
}

void loop() {
  if (millis() - lastSend < SEND_INTERVAL_MS) {
    delay(100);
    return;
  }
  lastSend = millis();

  bool ok = false;
  uint16_t co2, status;
  float temperature, humidity;
  if (!sensor.measurement(&co2, &temperature, &humidity, &status)) {
    Serial.println("測定値の読み取りに失敗");
  } else if (status & STATUS_ERROR_MASK) {
    Serial.printf("センサーエラーのため送信しません（状態 %u）\n", status);
  } else {
    Serial.printf("CO2: %u ppm  温度: %.1f ℃  湿度: %.1f %%\n", co2, temperature, humidity);
    connectWiFi();
    if (WiFi.status() == WL_CONNECTED && (tokenValid() || signIn())) {
      ok = sendReading(co2, temperature, humidity);
    }
  }

  failures = ok ? 0 : failures + 1;
  if (failures >= MAX_FAILURES) {
    Serial.println("失敗が続いたため再起動します");
    delay(5000);
    ESP.restart();
  }
}
