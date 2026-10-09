# Raspberry Pi Pico W + DHT22 → Firestore（ダッシュボードの environmental_data）
#
# Pico に main.py として保存すると電源投入時に自動実行される。
# Wi-Fi やセンサーアカウントのパスワードは同じフォルダの secrets.py に書く
# （secrets_example.py をコピーして作る。secrets.py は Git に入れない）。

import gc
import os
import time

import dht
import machine
import network
import ubinascii
import ujson

try:
    import requests
except ImportError:
    import urequests as requests

import secrets

# ===== 設定 =====
LOCATION = "温室ハウス2"  # ダッシュボードで登録したハウスID
INTERVAL = 60  # 送信間隔（秒）。DHT22 は 2 秒以上あける
DHT_PIN = 15  # DHT22 の DATA を GP15 に接続

# Firebase の Web 用 API キーとプロジェクトID（ダッシュボードの src/firebase.js と同じ公開値）
API_KEY = "AIzaSyAHduV83j0eSdJQIvUGRqmmyN6sH0b4L0k"
PROJECT_ID = "farm-dashboard-95875"

# この回数続けて失敗したら Pico を再起動する（Wi-Fi やメモリの不調からの復帰用）
MAX_FAILURES = 10

DOCUMENTS = "projects/{}/databases/(default)/documents".format(PROJECT_ID)
COMMIT_URL = "https://firestore.googleapis.com/v1/{}:commit".format(DOCUMENTS)
SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + API_KEY

led = machine.Pin("LED", machine.Pin.OUT)
sensor = dht.DHT22(machine.Pin(DHT_PIN))
wlan = network.WLAN(network.STA_IF)

id_token = None
token_expires_at = 0  # time.ticks_ms() 基準


def log(*args):
    print("[{}]".format(time.ticks_ms() // 1000), *args)


def connect_wifi():
    if wlan.isconnected():
        return True
    log("Wi-Fi 接続中:", secrets.WIFI_SSID)
    wlan.active(True)
    wlan.connect(secrets.WIFI_SSID, secrets.WIFI_PASSWORD)
    for _ in range(20):
        if wlan.isconnected():
            log("Wi-Fi 接続 OK  IP:", wlan.ifconfig()[0], " 電波:", wlan.status("rssi"), "dBm")
            return True
        time.sleep(1)
    log("Wi-Fi 接続失敗")
    return False


def post_json(url, body, token=None):
    """JSON を POST して (ステータスコード, 応答JSON) を返す"""
    gc.collect()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    # 日本語を含むため、文字数ではなくバイト数で送るよう bytes にして渡す
    r = requests.post(url, data=ujson.dumps(body).encode(), headers=headers)
    try:
        status = r.status_code
        try:
            data = r.json()
        except ValueError:
            data = None
    finally:
        r.close()
    return status, data


def sign_in():
    """センサーアカウントでログインして ID トークンを取得する（有効期限 1 時間）"""
    global id_token, token_expires_at
    status, data = post_json(SIGN_IN_URL, {
        "email": secrets.SENSOR_EMAIL,
        "password": secrets.SENSOR_PASSWORD,
        "returnSecureToken": True,
    })
    if status != 200:
        id_token = None
        raise RuntimeError("ログイン失敗 {}: {}".format(status, data))
    id_token = data["idToken"]
    # 期限の 5 分前に取り直す
    token_expires_at = time.ticks_add(time.ticks_ms(), (int(data["expiresIn"]) - 300) * 1000)
    log("ログイン OK")


def token_valid():
    return id_token is not None and time.ticks_diff(token_expires_at, time.ticks_ms()) > 0


def send_reading(temperature, humidity):
    """environmental_data に 1 件追加する。timestamp はサーバー時刻を使う"""
    global id_token
    doc_id = ubinascii.hexlify(os.urandom(10)).decode()
    body = {
        "writes": [{
            "update": {
                "name": "{}/environmental_data/{}".format(DOCUMENTS, doc_id),
                "fields": {
                    "location": {"stringValue": LOCATION},
                    "temperature": {"doubleValue": temperature},
                    "humidity": {"doubleValue": humidity},
                },
            },
            "updateTransforms": [{"fieldPath": "timestamp", "setToServerValue": "REQUEST_TIME"}],
            "currentDocument": {"exists": False},
        }]
    }
    status, data = post_json(COMMIT_URL, body, id_token)
    if status == 401:
        # トークン切れ。次回ログインし直す
        id_token = None
    if status == 403:
        raise RuntimeError("送信拒否(403): ハウスID「{}」がダッシュボードに登録されているか、"
                           "Firestore のルールが反映されているか確認".format(LOCATION))
    if status != 200:
        message = data.get("error", {}).get("message") if isinstance(data, dict) else data
        raise RuntimeError("送信失敗 {}: {}".format(status, message))


def read_sensor():
    sensor.measure()
    return round(sensor.temperature(), 1), round(sensor.humidity(), 1)


def main():
    log("起動  送信先:", LOCATION, " 間隔:", INTERVAL, "秒")
    failures = 0
    while True:
        started = time.ticks_ms()
        try:
            temperature, humidity = read_sensor()
            if not connect_wifi():
                raise RuntimeError("Wi-Fi 未接続")
            if not token_valid():
                sign_in()
            send_reading(temperature, humidity)
            log("送信: {} °C  {} %".format(temperature, humidity))
            failures = 0
            led.on()
            time.sleep_ms(200)
            led.off()
        except Exception as e:
            # DHT22 の読み取り失敗、通信エラー、ログイン・送信の失敗など
            failures += 1
            log("エラー({}回目):".format(failures), e)

        if failures >= MAX_FAILURES:
            log("失敗が続いたため再起動します")
            time.sleep(5)
            machine.reset()

        elapsed = time.ticks_diff(time.ticks_ms(), started) // 1000
        time.sleep(max(2, INTERVAL - elapsed))


main()
