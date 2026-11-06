"""取得部: Firestore の新しい環境データを定期的に取り込み、SQLite に保存する

  python3 -m app.fetcher                     # 常駐して POLL_INTERVAL_SECONDS ごとに取り込む
  python3 -m app.fetcher --once              # 1回だけ取り込んで終わる（動作確認用）
  python3 -m app.fetcher --backfill-days 30  # 過去30日分を1時間ごとのまとめから取り込んで終わる

ハウスごとに「保存済みの一番新しい測定時刻」より後のデータだけを読む（重複して読まない）。
読み取り件数は、ハウスあたり1回1件（新着が無くても1件と数えられる）＋新着の件数。
4ハウス・5分ごとなら1日 約1,200件＋新着 約2,900件。
"""
import argparse
import logging
import time
from datetime import timedelta

from . import exporter
from .config import load_config
from .firestore_client import FirestoreReader
from .store import Store, now_jst

log = logging.getLogger("house-hub.fetcher")

# 長く止まっていたあとでも、1回に読むのはこの時間分まで（読み取り件数を抑えるため。
# それより前の欠けは --backfill-days で1時間ごとのまとめから埋める）
MAX_CATCH_UP = timedelta(hours=24)
# ハウスの一覧を読み直す間隔
HOUSES_REFRESH = timedelta(hours=1)


def normalize(house_id, data):
    """Firestore の1件 → 保存する形（単位はそのまま。無い項目・数値でない項目は None）"""
    def number(key):
        value = data.get(key)
        return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else None

    return {
        "house": house_id,
        "ts": data["timestamp"],
        "temperature": number("temperature"),
        "humidity": number("humidity"),
        "soil_moisture": number("soilMoisture"),
        "co2": number("co2"),
    }


class Fetcher:
    def __init__(self, store, reader, clock=now_jst):
        self.store = store
        self.reader = reader
        self.clock = clock
        self.houses = []
        self.houses_loaded_at = None

    def refresh_houses(self, force=False):
        now = self.clock()
        if force or not self.houses_loaded_at or now - self.houses_loaded_at >= HOUSES_REFRESH:
            self.houses = self.reader.houses()
            self.store.save_houses(self.houses)
            self.houses_loaded_at = now
        return self.houses

    def poll(self):
        """全ハウスの新着を取り込む。戻り値は新しく保存した件数。
        1つのハウスで失敗しても、ほかのハウスは続ける"""
        self.reader.read_count = 0
        now = self.clock()
        saved_total = 0
        for house in self.refresh_houses():
            house_id = house["id"]
            try:
                last = self.store.last_ts(house_id)
                since = last if last and now - last < MAX_CATCH_UP else now - MAX_CATCH_UP
                docs = self.reader.readings_after(house_id, since)
                readings = [normalize(house_id, d) for d in docs if d.get("timestamp")]
                saved = self.store.save_readings(readings, fetched_at=now)
                saved_total += saved
                if saved:
                    exporter.export_new_readings(readings)
                    log.info("%s: %d 件を保存", house_id, saved)
            except Exception as e:  # 次の周期でやり直す
                log.warning("%s: 取得に失敗しました: %s", house_id, e)
        log.debug("Firestore の読み取り %d 件", self.reader.read_count)
        return saved_total

    def backfill(self, days):
        """1時間ごとのまとめから、過去 days 日分を取り込む（ハウスあたり 24×days＋1 件の読み取り）"""
        now = self.clock()
        start = now - timedelta(days=days)
        total = 0
        for house in self.refresh_houses(force=True):
            points = self.reader.hourly_bundles(house["id"], start, now)
            readings = [normalize(house["id"], p) for p in points]
            saved = self.store.save_readings(readings, fetched_at=now)
            log.info("%s: まとめから %d 件を保存（%d 件中）", house["id"], saved, len(readings))
            total += saved
        return total


def make_fetcher(config):
    if not config.firebase_password:
        raise SystemExit(".env に FIREBASE_PASSWORD（表示用アカウントのパスワード）を書いてください")
    reader = FirestoreReader(config.firebase_project_id, config.firebase_api_key,
                             config.firebase_email, config.firebase_password)
    return Fetcher(Store(config.db_path), reader)


def main():
    parser = argparse.ArgumentParser(description="Firestore の環境データを SQLite に取り込む")
    parser.add_argument("--once", action="store_true", help="1回だけ取り込んで終わる")
    parser.add_argument("--backfill-days", type=int, default=0, help="過去の分を1時間ごとのまとめから取り込んで終わる")
    args = parser.parse_args()

    config = load_config()
    logging.basicConfig(level=config.log_level, format="%(asctime)s %(levelname)s %(message)s")
    fetcher = make_fetcher(config)

    if args.backfill_days:
        log.info("過去 %d 日分を取り込みます", args.backfill_days)
        fetcher.backfill(args.backfill_days)
        log.info("Firestore の読み取り %d 件", fetcher.reader.read_count)
        return
    if args.once:
        fetcher.poll()
        log.info("Firestore の読み取り %d 件、保存済み %d 件", fetcher.reader.read_count, fetcher.store.count())
        return

    log.info("取り込みを始めます（%d 秒ごと）", config.poll_interval_seconds)
    while True:
        try:
            fetcher.poll()
        except Exception as e:  # ハウスの一覧が読めないときなど。止まらずに次の周期でやり直す
            log.warning("取り込みに失敗しました: %s", e)
        time.sleep(config.poll_interval_seconds)


if __name__ == "__main__":
    main()
