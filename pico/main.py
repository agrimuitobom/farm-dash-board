# Raspberry Pi Pico W + DHT22（+ 土壌水分センサー）→ Firestore（ダッシュボードの environmental_data）
# 丸型タッチディスプレイをつないだ Pico は、計測値と天気予報も画面に出す（secrets.py の DISPLAY）。
#
# Pico に main.py として保存すると電源投入時に自動実行される。
# Wi-Fi やセンサーアカウントのパスワード、送信先のハウスID、土壌水分センサーの設定は
# 同じフォルダの secrets.py に書く（secrets_example.py をコピーして作る。secrets.py は Git に入れない）。
# main.py はどの Pico でも同じものを使う。

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
# Pico ごとに違う値は secrets.py に書く（書いていなければ右の値になる）
LOCATION = getattr(secrets, "LOCATION", "温室ハウス2")  # ダッシュボードで登録したハウスID
SOIL_PIN = getattr(secrets, "SOIL_PIN", None)  # 土壌水分センサーの AOUT をつないだ ADC ピン（26〜28）。無ければ None
SOIL_DRY = getattr(secrets, "SOIL_DRY", 50000)  # 空気中（乾いた状態）での値。soil_check.py で測る
SOIL_WET = getattr(secrets, "SOIL_WET", 22000)  # 水に挿した状態での値。soil_check.py で測る
# 丸型タッチディスプレイ（Waveshare 1.28インチ）をつないでいれば True。配線は display.py
DISPLAY = getattr(secrets, "DISPLAY", False)
INTERVAL = 60  # 送信間隔（秒）。DHT22 は 2 秒以上あける
DHT_PIN = 15  # DHT22 の DATA を GP15 に接続
# 土壌水分センサーがつながっていないとみなす値（校正した範囲 SOIL_DRY〜SOIL_WET の幅に対する割合）
SOIL_MARGIN = 0.25  # 範囲の外にこれ以上はみ出したら
SOIL_MAX_SPREAD = 0.3  # 20回測った値のぶれがこれより大きければ
DISPLAY_READ_INTERVAL = 10  # ディスプレイの値を測り直す間隔（秒）
FORECAST_INTERVAL = 60 * 60  # 天気予報を取り直す間隔（秒）
FORECAST_RETRY = 10 * 60  # 天気予報を取れなかったときに取り直すまで（秒）

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
soil_adc = machine.ADC(machine.Pin(SOIL_PIN)) if SOIL_PIN is not None else None
wlan = network.WLAN(network.STA_IF)

id_token = None
soil_warned = False  # 土壌水分センサーの異常を一度ログに出したか
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


def send_reading(temperature, humidity, soil_moisture=None):
    """environmental_data に 1 件追加する。timestamp はサーバー時刻を使う"""
    global id_token
    doc_id = ubinascii.hexlify(os.urandom(10)).decode()
    fields = {
        "location": {"stringValue": LOCATION},
        "temperature": {"doubleValue": temperature},
        "humidity": {"doubleValue": humidity},
    }
    if soil_moisture is not None:
        fields["soilMoisture"] = {"doubleValue": soil_moisture}
    body = {
        "writes": [{
            "update": {
                "name": "{}/environmental_data/{}".format(DOCUMENTS, doc_id),
                "fields": fields,
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


def read_soil():
    """土壌水分（%）。乾いた値を 0 %、水中の値を 100 % として換算する。
    センサーが無い（SOIL_PIN = None）か、つながっていないと判断したときは None（土壌水分は送らない）"""
    global soil_warned
    if soil_adc is None:
        return None
    # ノイズを減らすため、少し間をあけて何回か読んだ平均を使う
    values = []
    for _ in range(20):
        values.append(soil_adc.read_u16())
        time.sleep_ms(10)
    raw = sum(values) / len(values)
    span = SOIL_DRY - SOIL_WET
    # つながっていないピンの値はでたらめなので、校正した範囲から大きく外れるか、
    # 測るたびに大きくぶれるときは「センサーなし」とみなす
    spread = max(values) - min(values)
    if raw > SOIL_DRY + span * SOIL_MARGIN or raw < SOIL_WET - span * SOIL_MARGIN or spread > span * SOIL_MAX_SPREAD:
        if not soil_warned:
            log("土壌水分センサーの値がおかしいため、土壌水分は送りません（値 {:.0f}、ぶれ {}）。"
                "つないでいなければ secrets.py を SOIL_PIN = None に".format(raw, spread))
            soil_warned = True
        return None
    if soil_warned:
        log("土壌水分センサーの値が戻りました")
        soil_warned = False
    percent = (SOIL_DRY - raw) * 100 / span
    return round(min(100, max(0, percent)), 1)


def take_reading():
    """(温度, 湿度, 土壌水分) を測る。土壌水分センサーが無ければ土壌水分は None"""
    temperature, humidity = read_sensor()
    return temperature, humidity, read_soil()


def start_display():
    """ディスプレイを使う設定なら準備する。使わない・動かないときは None"""
    if not DISPLAY:
        return None, None
    try:
        import display
        ui = display.Display(
            LOCATION, soil_adc is not None,
            temp_range=getattr(secrets, "TEMP_RANGE", (18, 30)),
            hum_range=getattr(secrets, "HUM_RANGE", (50, 80)),
            brightness=getattr(secrets, "DISPLAY_BRIGHTNESS", 80),
            reverse_swipe=getattr(secrets, "DISPLAY_REVERSE_SWIPE", False),
            bgr=getattr(secrets, "DISPLAY_BGR", True),
            invert=getattr(secrets, "DISPLAY_INVERT", True),
            log=log,
        )
        log("ディスプレイ OK")
        return ui, display
    except Exception as e:
        # 画面が動かなくても、データの送信は続ける
        log("ディスプレイを使わずに続けます:", e)
        return None, None


def due(deadline, now):
    return time.ticks_diff(now, deadline) >= 0


def main():
    log("起動  送信先:", LOCATION, " 間隔:", INTERVAL, "秒",
        " 土壌水分:", "GP{}".format(SOIL_PIN) if soil_adc else "なし")
    ui, display = start_display()
    failures = 0
    now = time.ticks_ms()
    next_send = next_read = next_forecast = now
    latest = None  # 画面用に測った最新の値
    latest_at = now

    while True:
        now = time.ticks_ms()

        # 画面の値は送信より短い間隔で測り直す
        if ui and due(next_read, now):
            next_read = time.ticks_add(now, DISPLAY_READ_INTERVAL * 1000)
            try:
                latest = take_reading()
                latest_at = now
                ui.set_reading(*latest)
            except Exception as e:
                latest = None
                ui.set_sensor_error()
                log("測定エラー:", e)

        if due(next_send, now):
            next_send = time.ticks_add(now, INTERVAL * 1000)
            try:
                # 画面用に測ったばかりの値があればそれを送る（DHT22 を続けて読まないため）
                if latest and time.ticks_diff(now, latest_at) < DISPLAY_READ_INTERVAL * 2000:
                    temperature, humidity, soil_moisture = latest
                else:
                    temperature, humidity, soil_moisture = take_reading()
                if not connect_wifi():
                    raise RuntimeError("Wi-Fi 未接続")
                if not token_valid():
                    sign_in()
                send_reading(temperature, humidity, soil_moisture)
                if soil_moisture is None:
                    log("送信: {} °C  {} %".format(temperature, humidity))
                else:
                    log("送信: {} °C  {} %  土壌水分 {} %".format(temperature, humidity, soil_moisture))
                failures = 0
                if ui:
                    ui.set_sent(True)
                led.on()
                time.sleep_ms(200)
                led.off()
            except Exception as e:
                # DHT22 の読み取り失敗、通信エラー、ログイン・送信の失敗など
                failures += 1
                log("エラー({}回目):".format(failures), e)
                if ui:
                    ui.set_sent(False)

            if failures >= MAX_FAILURES:
                log("失敗が続いたため再起動します")
                time.sleep(5)
                machine.reset()

        if ui and due(next_forecast, now):
            try:
                if not connect_wifi():
                    raise RuntimeError("Wi-Fi 未接続")
                gc.collect()
                ui.set_forecast(display.fetch_forecast(requests))
                next_forecast = time.ticks_add(now, FORECAST_INTERVAL * 1000)
                log("天気予報を更新")
            except Exception as e:
                next_forecast = time.ticks_add(now, FORECAST_RETRY * 1000)
                log("天気予報の取得に失敗:", e)

        if ui:
            # タッチに素早く反応するよう、短い間隔で画面を見る
            try:
                ui.poll()
            except Exception as e:
                # 描けない状態が続くとログがあふれるので、画面は止めて送信だけ続ける
                log("画面の更新に失敗したため、ディスプレイを止めます:", e)
                ui = None
            time.sleep_ms(30)
        else:
            # DHT22 は 2 秒以上あける
            time.sleep_ms(max(2000, time.ticks_diff(next_send, time.ticks_ms())))


main()
