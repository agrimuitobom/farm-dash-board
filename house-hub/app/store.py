"""蓄積部: SQLite に環境データの長期履歴を保存する

時刻は日本時間の ISO 8601（マイクロ秒まで、+09:00 付き）の文字列で保存する。
すべて同じ形なので、文字列のまま大小を比べて期間を絞り込める。
"""
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

JST = timezone(timedelta(hours=9))

SCHEMA = """
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  house TEXT NOT NULL,          -- ハウスID（例: 温室ハウス1）
  ts TEXT NOT NULL,             -- 測定時刻（日本時間の ISO 8601）
  temperature REAL,
  humidity REAL,
  soil_moisture REAL,
  co2 REAL,
  fetched_at TEXT NOT NULL,     -- ハブが取り込んだ時刻
  UNIQUE(house, ts)             -- 二重取り込み防止
);
CREATE INDEX IF NOT EXISTS idx_readings_house_ts ON readings(house, ts);
CREATE TABLE IF NOT EXISTS houses (
  id TEXT PRIMARY KEY,          -- ハウスID
  name TEXT NOT NULL,
  crop TEXT,
  updated_at TEXT NOT NULL
);
"""

FIELDS = ("temperature", "humidity", "soil_moisture", "co2")


def to_ts(dt):
    """datetime → 保存用の文字列（日本時間・マイクロ秒まで）"""
    if dt.tzinfo is None:
        raise ValueError("タイムゾーンの無い時刻は保存できません")
    return dt.astimezone(JST).isoformat(timespec="microseconds")


def from_ts(text):
    return datetime.fromisoformat(text)


def now_jst():
    return datetime.now(JST)


class Store:
    def __init__(self, db_path):
        self.db_path = str(db_path)
        if self.db_path != ":memory:":
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        # fetcher と server を別のプロセスで動かすので、同時に読み書きしやすい WAL にする
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30)
        self.conn.row_factory = sqlite3.Row
        if self.db_path != ":memory:":
            self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def close(self):
        self.conn.close()

    # ===== 書き込み（fetcher から） =====

    def save_readings(self, readings, fetched_at=None):
        """計測値を保存する。すでにある（同じハウス・同じ時刻）ものは無視する。
        readings: [{house, ts(datetime), temperature, humidity, soil_moisture, co2}, ...]
        戻り値: 新しく保存した件数"""
        fetched = to_ts(fetched_at or now_jst())
        rows = [
            (r["house"], to_ts(r["ts"]), *(r.get(f) for f in FIELDS), fetched)
            for r in readings
        ]
        before = self.conn.total_changes
        self.conn.executemany(
            "INSERT OR IGNORE INTO readings (house, ts, temperature, humidity, soil_moisture, co2, fetched_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            rows,
        )
        self.conn.commit()
        return self.conn.total_changes - before

    def save_houses(self, houses):
        """ハウスの一覧（id, name, crop）を保存する"""
        updated = to_ts(now_jst())
        self.conn.executemany(
            "INSERT INTO houses (id, name, crop, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET name = excluded.name, crop = excluded.crop, updated_at = excluded.updated_at",
            [(h["id"], h.get("name") or h["id"], h.get("crop"), updated) for h in houses],
        )
        self.conn.commit()

    # ===== 読み取り（server から） =====

    def last_ts(self, house):
        """そのハウスで保存済みの一番新しい測定時刻（無ければ None）"""
        row = self.conn.execute("SELECT MAX(ts) AS ts FROM readings WHERE house = ?", (house,)).fetchone()
        return from_ts(row["ts"]) if row and row["ts"] else None

    def houses(self):
        """ハウスの一覧（ハウス一覧に無くても、データがあるハウスは出す）"""
        rows = self.conn.execute(
            "SELECT id, name, crop FROM houses "
            "UNION SELECT DISTINCT house, house, NULL FROM readings WHERE house NOT IN (SELECT id FROM houses) "
            "ORDER BY id"
        ).fetchall()
        return [dict(r) for r in rows]

    def latest(self, house):
        row = self.conn.execute(
            "SELECT * FROM readings WHERE house = ? ORDER BY ts DESC LIMIT 1", (house,)
        ).fetchone()
        return dict(row) if row else None

    def history(self, house, start, end, limit=5000):
        """期間内の計測値（古い順、最大 limit 件）"""
        rows = self.conn.execute(
            "SELECT house, ts, temperature, humidity, soil_moisture, co2 FROM readings "
            "WHERE house = ? AND ts >= ? AND ts <= ? ORDER BY ts LIMIT ?",
            (house, to_ts(start), to_ts(end), limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def count(self):
        return self.conn.execute("SELECT COUNT(*) AS n FROM readings").fetchone()["n"]

    def last_fetched_at(self):
        row = self.conn.execute("SELECT MAX(fetched_at) AS t FROM readings").fetchone()
        return row["t"] if row else None
