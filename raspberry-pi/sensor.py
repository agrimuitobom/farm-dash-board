"""DHT22 の温度・湿度を Firestore（environmental_data）に送信する（Raspberry Pi 用）

LOCATION にダッシュボードで登録したハウスID（外気なら "outdoor"）を設定する。
同じフォルダの serviceAccount.json（Firebase のサービスアカウント鍵）を使う。
"""
import os

os.environ.setdefault("GRPC_DNS_RESOLVER", "native")

import time

import adafruit_dht
import board
import firebase_admin
from firebase_admin import credentials, firestore

LOCATION = "温室ハウス1"  # ハウスID（外気なら "outdoor"）
INTERVAL = 60  # 送信間隔（秒）

SERVICE_ACCOUNT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "serviceAccount.json")

firebase_admin.initialize_app(credentials.Certificate(SERVICE_ACCOUNT))
db = firestore.client()
dht = adafruit_dht.DHT22(board.D4)

try:
    while True:
        try:
            t, h = dht.temperature, dht.humidity
            if t is not None and h is not None:
                db.collection("environmental_data").add({
                    "location": LOCATION,
                    "temperature": round(t, 1),
                    "humidity": round(h, 1),
                    "timestamp": firestore.SERVER_TIMESTAMP,
                }, timeout=20)
                print(f"送信: {t:.1f}°C {h:.1f}%", flush=True)
        except RuntimeError as e:
            print("読み取り再試行:", e, flush=True)
        except Exception as e:
            print("送信エラー（次回再送）:", e, flush=True)
        time.sleep(INTERVAL)
finally:
    dht.exit()
