"""環境データの「1時間ごとのまとめ」（environmental_hourly）を作る

グラフで過去24時間・1週間の推移を出すとき、environmental_data を1件ずつ読むと
24時間で720件（2分間隔）、1週間で約5,000件の読み取りになる。
そこで、ハウスごと・1時間ごとに1つのドキュメントへ、その1時間の計測値をまとめておく。
画面は24時間なら25件、1週間なら169件を読むだけで済む（計測値は全部入っているので細かさは同じ）。

  environmental_hourly/{ハウスID}_{YYYYMMDDHH（UTC）}
    location: ハウスID
    hour:     その1時間の始まり（Timestamp）
    readings: [{t: 計測時刻, temperature, humidity, soilMoisture}, ...]

alert_monitor.py が新しい計測値を受け取るたびに追記する（ArrayUnion なので同じ値を何度追記しても1つ）。
"""
from datetime import datetime, timedelta, timezone

from google.cloud.firestore_v1 import ArrayUnion
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1.query import Query

COLLECTION = "environmental_hourly"
FIELDS = ("temperature", "humidity", "soilMoisture")


def hour_start(timestamp):
    return timestamp.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)


def bundle_id(location, timestamp):
    """ドキュメントID（同じハウスなら時刻の順に並ぶ）"""
    return "{}_{}".format(location, hour_start(timestamp).strftime("%Y%m%d%H"))


def to_point(data):
    """environmental_data の1件 → まとめに入れる形。時刻が無ければ None"""
    timestamp = data.get("timestamp")
    if not isinstance(timestamp, datetime):
        return None
    point = {"t": timestamp}
    for key in FIELDS:
        value = data.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            point[key] = value
    return point


def append(db, location, points):
    """計測値をまとめに追記する（1時間ごとに1回書き込む）"""
    by_bundle = {}
    for point in points:
        by_bundle.setdefault(bundle_id(location, point["t"]), []).append(point)
    for doc_id, items in by_bundle.items():
        db.collection(COLLECTION).document(doc_id).set({
            "location": location,
            "hour": hour_start(items[0]["t"]),
            "readings": ArrayUnion(items),
        }, merge=True)
    return len(by_bundle)


def last_bundled_time(db, location, max_hours, now=None):
    """そのハウスのまとめに入っている一番新しい計測時刻（max_hours 時間前まで探す）。無ければ None。
    今の1時間のまとめから順に1つずつ見るので、たいていは1〜2件の読み取りで済む"""
    now = now or datetime.now(timezone.utc)
    for h in range(max_hours + 1):
        doc = db.collection(COLLECTION).document(bundle_id(location, now - timedelta(hours=h))).get()
        if not doc.exists:
            continue
        times = [r.get("t") for r in (doc.to_dict() or {}).get("readings", []) if isinstance(r, dict)]
        times = [t for t in times if isinstance(t, datetime)]
        if times:
            return max(times)
    return None


def backfill(db, location, max_hours, now=None, after_last=True):
    """まとめに入っていない計測値（最大 max_hours 時間前まで）を environmental_data から読んで追記する。
    after_last なら、まとめの一番新しい計測値より後だけを読む（足りない分だけ読む）。
    戻り値は追記した計測値の数"""
    now = now or datetime.now(timezone.utc)
    since = now - timedelta(hours=max_hours)
    last = last_bundled_time(db, location, max_hours, now) if after_last else None
    if last is not None and last > since:
        since = last
    # 並び順はダッシュボードの履歴の読み込みと同じ（location 昇順・timestamp 降順の複合インデックスを使う）
    query = (
        db.collection("environmental_data")
        .where(filter=FieldFilter("location", "==", location))
        .where(filter=FieldFilter("timestamp", ">", since))
        .order_by("timestamp", direction=Query.DESCENDING)
    )
    points = [p for p in (to_point(doc.to_dict() or {}) for doc in query.stream()) if p]
    if points:
        append(db, location, points)
    return len(points)
