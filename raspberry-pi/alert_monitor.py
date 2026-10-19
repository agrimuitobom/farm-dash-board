"""温室ハウスのアラート見張りプログラム

各ハウスの最新の環境データを見張り、ハウスごとの閾値（houses.thresholds）を外れたら
alerts にアラートを追加する。範囲内に戻ったら自動で解決済みにする。
センサーから10分以上データが来ないときは「通信なし」のアラートを出す。

Firestore の変更を購読（on_snapshot）して受け取るので、毎分すべてを読み直すことはない
（読み取り回数は、センサーが送ったデータの件数とほぼ同じで済む）。

Raspberry Pi で systemd のサービスとして常時動かす（設置手順は raspberry-pi/README.md）。
"""
import os

os.environ.setdefault("GRPC_DNS_RESOLVER", "native")

import sys
import threading
import time
from datetime import datetime, timedelta, timezone

from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1.query import Query

SERVICE_ACCOUNT = os.environ.get(
    "FARM_SERVICE_ACCOUNT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "serviceAccount.json")
)
CHECK_INTERVAL = 30  # 秒。通信なしの判定などをこの間隔で行う

# この時間データが来なければ「通信なし」
STALE_AFTER = timedelta(minutes=10)
# 最後のデータがこれより古いハウスは、センサーが外されたとみなして通信なしのアラートを出さない
GIVE_UP_AFTER = timedelta(hours=24)

# 閾値の既定値（ダッシュボードの src/utils/environmentalRanges.js と同じ値）
DEFAULT_THRESHOLDS = {
    "temperature": {"min": 18, "max": 30},
    "humidity": {"min": 50, "max": 80},
}
# 範囲内に戻ったと判定するときの余裕。境界付近で発生・解決を繰り返さないようにする
HYSTERESIS = {"temperature": 0.5, "humidity": 2.0}

LABELS = {"temperature": ("気温", "°C"), "humidity": ("湿度", "%")}
ADVICE = {
    "temperature_high": "換気や遮光を確認してください。",
    "temperature_low": "保温・暖房を確認してください。",
    "humidity_high": "換気や除湿を確認してください。",
    "humidity_low": "加湿やかん水を確認してください。",
    "connection_lost": "センサーの電源と Wi-Fi を確認してください。",
}


def log(*args):
    print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), *args, flush=True)


def get_thresholds(house):
    custom = house.get("thresholds") or {}
    result = {}
    for key, default in DEFAULT_THRESHOLDS.items():
        values = custom.get(key) or {}
        result[key] = {
            bound: values[bound] if isinstance(values.get(bound), (int, float)) else default[bound]
            for bound in ("min", "max")
        }
    return result


def evaluate(house, reading, now):
    """ハウスの状態を判定する

    戻り値: (active, clear)
      active: 今アラートを出すべき条件 {condition_key: アラート内容}
      clear:  解決済みにしてよい条件の集合（範囲内に十分戻った、通信が復旧した）
    どちらにも入らない条件は、今の状態を変えない（データが無い、境界付近など）。
    """
    active, clear = {}, set()
    name = house.get("name") or house["id"]
    timestamp = reading.get("timestamp") if reading else None

    if timestamp is None:
        return active, clear

    age = now - timestamp
    if age > STALE_AFTER:
        if age < GIVE_UP_AFTER:
            minutes = int(age.total_seconds() // 60)
            active["connection_lost"] = {
                "type": "connection",
                "severity": "medium",
                "title": f"{name}のセンサーから{minutes}分以上データが届いていません",
                "description": f"最後に受信したのは {timestamp.astimezone().strftime('%m/%d %H:%M')} です。"
                + ADVICE["connection_lost"],
                "value": None,
                "threshold": None,
            }
        # 古いデータで気温・湿度を判定しない
        return active, clear

    clear.add("connection_lost")
    thresholds = get_thresholds(house)
    for key, (label, unit) in LABELS.items():
        value = reading.get(key)
        if not isinstance(value, (int, float)):
            continue
        low, high = thresholds[key]["min"], thresholds[key]["max"]
        margin = HYSTERESIS[key]

        if value > high:
            active[f"{key}_high"] = {
                "type": key,
                "severity": "high",
                "title": f"{name}の{label}が高すぎます（{value}{unit}）",
                "description": f"{label}が上限 {high}{unit} を超えています（現在 {value}{unit}）。"
                + ADVICE[f"{key}_high"],
                "value": value,
                "threshold": high,
            }
        elif value <= high - margin:
            clear.add(f"{key}_high")

        if value < low:
            active[f"{key}_low"] = {
                "type": key,
                "severity": "high",
                "title": f"{name}の{label}が低すぎます（{value}{unit}）",
                "description": f"{label}が下限 {low}{unit} を下回っています（現在 {value}{unit}）。"
                + ADVICE[f"{key}_low"],
                "value": value,
                "threshold": low,
            }
        elif value >= low + margin:
            clear.add(f"{key}_low")

    return active, clear


class AlertMonitor:
    def __init__(self, db):
        self.db = db
        self.lock = threading.Lock()
        self.houses = {}  # ハウスID -> ハウス情報
        self.latest = {}  # ハウスID -> 最新の環境データ
        self.open_alerts = {}  # (ハウスID, 条件) -> 未解決アラートのドキュメントID
        self.alerts_loaded = False
        # この稼働中にアラートを出した条件。手動で解決済みにされても、
        # 状態が正常に戻るまでは同じアラートを出し直さない
        self.alerted = set()
        self.env_watches = {}

        self.houses_watch = db.collection("houses").on_snapshot(self._on_houses)
        self.alerts_watch = (
            db.collection("alerts")
            .where(filter=FieldFilter("resolved", "==", False))
            .on_snapshot(self._on_alerts)
        )

    # ---- Firestore の変更通知（別スレッドで呼ばれる） ----

    def _on_houses(self, docs, changes, read_time):
        with self.lock:
            houses = {}
            for doc in docs:
                data = doc.to_dict() or {}
                if doc.id.startswith("_") or data.get("isActive") is False:
                    continue
                houses[doc.id] = {**data, "id": doc.id}
            self.houses = houses

            for house_id in list(self.env_watches):
                if house_id not in houses:
                    self.env_watches.pop(house_id).unsubscribe()
                    self.latest.pop(house_id, None)
            for house_id in houses:
                if house_id not in self.env_watches:
                    self.env_watches[house_id] = self._watch_latest(house_id)
        log(f"ハウス {len(houses)} 件を見張っています")

    def _watch_latest(self, house_id):
        query = (
            self.db.collection("environmental_data")
            .where(filter=FieldFilter("location", "==", house_id))
            .order_by("timestamp", direction=Query.DESCENDING)
            .limit(1)
        )

        def on_snapshot(docs, changes, read_time):
            with self.lock:
                if docs:
                    self.latest[house_id] = docs[0].to_dict()

        return query.on_snapshot(on_snapshot)

    def _on_alerts(self, docs, changes, read_time):
        with self.lock:
            open_alerts = {}
            for doc in docs:
                data = doc.to_dict() or {}
                if data.get("autoGenerated") and data.get("conditionKey"):
                    open_alerts[(data.get("houseId"), data["conditionKey"])] = doc.id
            self.open_alerts = open_alerts
            self.alerts_loaded = True

    # ---- 定期チェック ----

    def check(self, now=None):
        now = now or datetime.now(timezone.utc)
        with self.lock:
            if not self.alerts_loaded:
                return  # 既存のアラートを読み込む前に判定すると重複して作ってしまう
            houses = dict(self.houses)
            latest = dict(self.latest)
            open_alerts = dict(self.open_alerts)

        for house_id, house in houses.items():
            active, clear = evaluate(house, latest.get(house_id), now)

            for condition, alert in active.items():
                key = (house_id, condition)
                if key in open_alerts or key in self.alerted:
                    continue
                self.db.collection("alerts").add({
                    **alert,
                    "houseId": house_id,
                    "houseName": house.get("name") or house_id,
                    "conditionKey": condition,
                    "autoGenerated": True,
                    "status": "pending",
                    "resolved": False,
                    "resolvedAt": None,
                    "timestamp": SERVER_TIMESTAMP,
                    "createdAt": SERVER_TIMESTAMP,
                })
                self.alerted.add(key)
                with self.lock:
                    # 変更通知が届くまでの間に同じアラートを作らないよう仮登録する
                    self.open_alerts.setdefault(key, None)
                log("アラート追加:", alert["title"])

            for condition in clear:
                key = (house_id, condition)
                self.alerted.discard(key)
                alert_id = open_alerts.get(key)
                if alert_id:
                    self.db.collection("alerts").document(alert_id).update({
                        "resolved": True,
                        "status": "resolved",
                        "resolvedAt": SERVER_TIMESTAMP,
                        "resolution": "自動解決（正常な状態に戻りました）",
                        "resolvedBy": "自動",
                        "updatedAt": SERVER_TIMESTAMP,
                    })
                    with self.lock:
                        self.open_alerts.pop(key, None)
                    log("自動解決:", house_id, condition)

    def watches_alive(self):
        watches = [self.houses_watch, self.alerts_watch, *self.env_watches.values()]
        return all(getattr(watch, "is_active", True) for watch in watches)

    def close(self):
        for watch in [self.houses_watch, self.alerts_watch, *self.env_watches.values()]:
            watch.unsubscribe()


def make_db():
    if os.environ.get("FIRESTORE_EMULATOR_HOST"):
        # 動作確認用（Firestore エミュレーター）
        from google.auth.credentials import AnonymousCredentials
        from google.cloud import firestore

        return firestore.Client(project=os.environ.get("FIRESTORE_PROJECT", "demo-farm"),
                                credentials=AnonymousCredentials())

    import firebase_admin
    from firebase_admin import credentials, firestore

    firebase_admin.initialize_app(credentials.Certificate(SERVICE_ACCOUNT))
    return firestore.client()


def main():
    log("アラート見張りを開始します")
    monitor = AlertMonitor(make_db())
    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            if not monitor.watches_alive():
                # 購読が切れたら終了し、systemd に再起動してもらう
                log("Firestore の購読が切れたため終了します（自動で再起動されます）")
                sys.exit(1)
            try:
                monitor.check()
            except Exception as e:  # 一時的な通信エラーなどで止まらないようにする
                log("チェック中にエラー:", e)
    finally:
        monitor.close()


if __name__ == "__main__":
    main()
