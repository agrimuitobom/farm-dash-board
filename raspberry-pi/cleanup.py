"""古い環境データ（environmental_data）を消す

センサーは2分ごとに1件ずつ environmental_data に書き込むので、消さないと1ハウスあたり
1年で約26万件たまり続ける。グラフ・CSV・まとめページは「1時間ごとのまとめ」
（environmental_hourly。計測値は全部入っている）を読むので、古い元データは消してよい。

  - 保存期間（既定 30 日）より古い environmental_data を、古い順に消す
  - 消す前に、その計測値を必ず1時間ごとのまとめへ書き写す（書き写せなかった分は消さない）。
    まとめを作り始める前のデータも、消すときにまとめへ移るので、計測値は失われない
  - 1日に消す件数に上限がある（既定 10,000 件）。1件消すのに「読み取り1・削除1」かかるため、
    Firestore の無料枠（1日あたり 読み取り5万・削除2万）を使い切らないようにしている。
    たまっている分は毎日少しずつ減っていく
  - 1時間ごとのまとめ（environmental_hourly）は消さない（1ハウス1年で 8,760 件）

alert_monitor.py が1時間ごとに呼び出す。手動でも動かせる:

  python3 cleanup.py --dry-run          # 消さずに、対象の件数だけ数える
  python3 cleanup.py                    # 今日の上限まで消す
  python3 cleanup.py --days 60          # 保存期間を変えて消す
  python3 cleanup.py --max 15000        # 今日の残り枠に関係なく、この件数まで消す

設定（環境変数。farm-alert-monitor.service の Environment= で指定する）:
  FARM_RETENTION_DAYS       保存期間（日）。0 にすると消さない。既定 30
  FARM_CLEANUP_MAX_PER_DAY  1日に消す件数の上限。既定 10000
"""
import argparse
import json
import os
from datetime import datetime, timedelta, timezone

from google.cloud.firestore_v1.base_query import FieldFilter

import hourly_bundles

COLLECTION = "environmental_data"
DEFAULT_RETENTION_DAYS = 30
DEFAULT_MAX_PER_DAY = 10000
# これより短い保存期間は受け付けない（まとめが無いときのグラフや、止まっていた機器の取り込み直しが
# 直近24時間の元データを読むため）
MIN_RETENTION_DAYS = 2
# 1回に読んで消す件数（Firestore のバッチ書き込みは500件まで）
PAGE_SIZE = 300
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cleanup_state.json")


def env_int(name, default):
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def retention_days():
    return env_int("FARM_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)


def max_per_day():
    return env_int("FARM_CLEANUP_MAX_PER_DAY", DEFAULT_MAX_PER_DAY)


def check_retention(days):
    if days < MIN_RETENTION_DAYS:
        raise ValueError(f"保存期間は {MIN_RETENTION_DAYS} 日以上にしてください（指定: {days} 日）")


def old_data_query(db, cutoff):
    return (
        db.collection(COLLECTION)
        .where(filter=FieldFilter("timestamp", "<", cutoff))
        .order_by("timestamp")
    )


def count_old(db, days, now=None):
    """保存期間より古い元データの件数（集計クエリなので、読み取りは1,000件につき1件分）"""
    check_retention(days)
    now = now or datetime.now(timezone.utc)
    result = old_data_query(db, now - timedelta(days=days)).count().get()
    return int(result[0][0].value)


def cleanup(db, days, max_deletes, now=None):
    """保存期間より古い元データを、まとめへ書き写してから消す。戻り値は消した件数"""
    check_retention(days)
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)
    deleted = 0
    while deleted < max_deletes:
        docs = list(old_data_query(db, cutoff).limit(min(PAGE_SIZE, max_deletes - deleted)).stream())
        if not docs:
            break

        # 先にまとめへ書き写す（ArrayUnion なので、すでに入っている計測値は増えない）。
        # ここで失敗したら例外で抜けるので、書き写せていない元データは消えない
        by_location = {}
        for doc in docs:
            data = doc.to_dict() or {}
            location = data.get("location")
            point = hourly_bundles.to_point(data)
            # ハウスIDの無いデータはどの画面にも出ないので、書き写さずに消す
            if isinstance(location, str) and location and point is not None:
                by_location.setdefault(location, []).append(point)
        for location, points in by_location.items():
            hourly_bundles.append(db, location, points)

        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        deleted += len(docs)
    return deleted


class DailyCleaner:
    """1日の上限を守りながら消す。その日に消した件数はファイルに覚えておく
    （サービスが再起動しても、同じ日に上限を超えて消さないため）"""

    def __init__(self, db, state_file=STATE_FILE, log=print):
        self.db = db
        self.state_file = state_file
        self.log = log
        self.memory = {}  # ファイルに書けないときの控え

    def _today(self, now):
        return now.astimezone().strftime("%Y-%m-%d")

    def _deleted_today(self, today):
        state = self.memory
        try:
            with open(self.state_file, encoding="utf-8") as f:
                state = json.load(f)
        except (OSError, ValueError):
            pass
        if not isinstance(state, dict) or state.get("day") != today:
            return 0
        deleted = state.get("deleted")
        return deleted if isinstance(deleted, int) and deleted > 0 else 0

    def _save(self, today, deleted):
        self.memory = {"day": today, "deleted": deleted}
        try:
            with open(self.state_file, "w", encoding="utf-8") as f:
                json.dump(self.memory, f)
        except OSError as e:
            self.log("消した件数を保存できませんでした:", e)

    def run(self, now=None):
        """今日の残り枠の分だけ消す。戻り値は今回消した件数"""
        days = retention_days()
        if days <= 0:
            return 0
        now = now or datetime.now(timezone.utc)
        today = self._today(now)
        done = self._deleted_today(today)
        remaining = max_per_day() - done
        if remaining <= 0:
            return 0
        # 途中で失敗しても数え漏らさないよう、1ページごとに記録する
        total = 0
        while remaining > 0:
            deleted = cleanup(self.db, days, min(PAGE_SIZE, remaining), now)
            if deleted == 0:
                break
            total += deleted
            remaining -= deleted
            self._save(today, done + total)
        return total


def main():
    parser = argparse.ArgumentParser(description="古い環境データ（environmental_data）を消す")
    parser.add_argument("--days", type=int, default=None, help="保存期間（日）。既定は FARM_RETENTION_DAYS または 30")
    parser.add_argument("--max", type=int, default=None, help="今日の残り枠に関係なく、この件数まで消す")
    parser.add_argument("--dry-run", action="store_true", help="消さずに、対象の件数だけ数える")
    args = parser.parse_args()

    import alert_monitor  # Firestore への接続方法を共有する

    days = args.days if args.days is not None else retention_days()
    if days <= 0:
        print("保存期間が 0 日（消さない設定）です。--days で日数を指定してください")
        return
    try:
        check_retention(days)
    except ValueError as e:
        parser.error(str(e))
    if args.days is not None:
        os.environ["FARM_RETENTION_DAYS"] = str(days)
    db = alert_monitor.make_db()

    if args.dry_run:
        print(f"{days} 日より古い元データ: {count_old(db, days)} 件（消していません）")
        return
    if args.max is not None:
        deleted = cleanup(db, days, args.max)
    else:
        deleted = DailyCleaner(db).run()
    print(f"{days} 日より古い元データを {deleted} 件消しました（残り {count_old(db, days)} 件）")


if __name__ == "__main__":
    main()
