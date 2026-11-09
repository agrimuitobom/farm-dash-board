"""store（保存・検索）と fetcher（重複防止・新着だけ読む）のテスト"""
from datetime import datetime, timedelta, timezone

import pytest

from app.fetcher import Fetcher, normalize
from app.store import JST, Store

NOW = datetime(2026, 11, 6, 8, 30, tzinfo=JST)


def ago(minutes):
    return NOW - timedelta(minutes=minutes)


@pytest.fixture
def store():
    s = Store(":memory:")
    yield s
    s.close()


class FakeReader:
    """FirestoreReader の代わり。readings_after に渡された since を記録する"""

    def __init__(self, data, houses=None, fail=()):
        self.data = data  # {house_id: [firestore の1件, ...]}
        self._houses = houses or [{"id": h, "name": h, "crop": None} for h in data]
        self.fail = set(fail)
        self.calls = []
        self.read_count = 0

    def houses(self):
        return self._houses

    def readings_after(self, house_id, since):
        self.calls.append((house_id, since))
        if house_id in self.fail:
            raise RuntimeError("通信エラー")
        rows = [d for d in self.data.get(house_id, []) if d["timestamp"] > since]
        return sorted(rows, key=lambda d: d["timestamp"], reverse=True)

    def hourly_bundles(self, house_id, start, end):
        return [{**d, "t": d["timestamp"]} for d in self.data.get(house_id, []) if start <= d["timestamp"] <= end]


def reading(minutes, temperature=25.0, **extra):
    return {"location": "x", "timestamp": ago(minutes), "temperature": temperature, "humidity": 60, **extra}


# ===== store =====

def test_save_and_ignore_duplicates(store):
    rows = [normalize("温室ハウス1", reading(4)), normalize("温室ハウス1", reading(2))]
    assert store.save_readings(rows, fetched_at=NOW) == 2
    assert store.save_readings(rows, fetched_at=NOW) == 0  # 同じハウス・同じ時刻は保存しない
    assert store.count() == 2
    assert store.last_ts("温室ハウス1") == ago(2)
    assert store.last_ts("無いハウス") is None


def test_history_latest_and_time_format(store):
    store.save_readings([
        normalize("温室ハウス1", reading(30, 20.0)),
        normalize("温室ハウス1", reading(10, 22.0, soilMoisture=40, co2=612)),
        normalize("温室ハウス2", reading(5, 30.0)),
    ], fetched_at=NOW)
    latest = store.latest("温室ハウス1")
    assert latest["ts"] == "2026-11-06T08:20:00.000000+09:00"
    assert (latest["temperature"], latest["soil_moisture"], latest["co2"]) == (22.0, 40.0, 612.0)
    history = store.history("温室ハウス1", ago(60), NOW)
    assert [h["temperature"] for h in history] == [20.0, 22.0]  # 古い順
    assert store.history("温室ハウス1", ago(15), NOW, limit=5)[0]["temperature"] == 22.0
    # 日本時間以外の時刻で保存しても、日本時間で保存される
    utc = datetime(2026, 11, 5, 23, 0, tzinfo=timezone.utc)
    store.save_readings([normalize("温室ハウス3", {"timestamp": utc, "temperature": 1})])
    assert store.latest("温室ハウス3")["ts"] == "2026-11-06T08:00:00.000000+09:00"


def test_normalize_keeps_missing_values_as_none():
    row = normalize("h", {"timestamp": NOW, "temperature": 25, "humidity": "abc", "soilMoisture": True})
    assert row == {"house": "h", "ts": NOW, "temperature": 25.0, "humidity": None, "soil_moisture": None, "co2": None}


def test_houses_include_unlisted_houses(store):
    store.save_houses([{"id": "温室ハウス1", "name": "温室ハウス1", "crop": "サラダ菜"}])
    store.save_readings([normalize("outdoor", reading(1))])
    assert store.houses() == [
        {"id": "outdoor", "name": "outdoor", "crop": None},
        {"id": "温室ハウス1", "name": "温室ハウス1", "crop": "サラダ菜"},
    ]


# ===== fetcher =====

def test_poll_reads_only_new_data(store):
    reader = FakeReader({"温室ハウス1": [reading(10), reading(4)], "温室ハウス2": [reading(6)]})
    fetcher = Fetcher(store, reader, clock=lambda: NOW)

    assert fetcher.poll() == 3
    # 2回目は、保存済みの一番新しい時刻より後だけを読む
    reader.data["温室ハウス1"].append(reading(1))
    reader.calls.clear()
    assert fetcher.poll() == 1
    assert dict(reader.calls) == {"温室ハウス1": ago(4), "温室ハウス2": ago(6)}
    assert fetcher.poll() == 0
    assert store.count() == 4


def test_first_poll_and_long_stop_read_at_most_24_hours(store):
    reader = FakeReader({"温室ハウス1": [reading(60 * 30), reading(60)]})
    fetcher = Fetcher(store, reader, clock=lambda: NOW)
    assert fetcher.poll() == 1  # 30時間前の分は読まない
    assert reader.calls[0][1] == NOW - timedelta(hours=24)


def test_one_house_failing_does_not_stop_others(store):
    reader = FakeReader({"温室ハウス1": [reading(3)], "温室ハウス2": [reading(3)]}, fail={"温室ハウス1"})
    fetcher = Fetcher(store, reader, clock=lambda: NOW)
    assert fetcher.poll() == 1
    assert store.latest("温室ハウス2") is not None


def test_backfill_from_hourly_bundles_without_duplicates(store):
    data = {"温室ハウス1": [reading(60 * 24 * 3), reading(60 * 30), reading(5)]}
    fetcher = Fetcher(store, FakeReader(data), clock=lambda: NOW)
    assert fetcher.poll() == 1
    assert fetcher.backfill(days=2) == 1  # 30時間前の分だけ増える（3日前は範囲外、5分前は保存済み）
    assert store.count() == 2
