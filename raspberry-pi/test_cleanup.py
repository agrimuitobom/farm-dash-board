"""Firestore を使わないテスト（python3 -m pytest test_cleanup.py）"""
from datetime import datetime, timedelta, timezone

import pytest

import cleanup

NOW = datetime(2026, 11, 16, 3, 0, tzinfo=timezone.utc)


class FakeDoc:
    def __init__(self, collection, doc_id):
        self.collection, self.id = collection, doc_id
        self.reference = self

    def to_dict(self):
        return dict(self.collection.docs[self.id])

    def set(self, data, merge=False):
        if self.collection.fail_writes:
            raise RuntimeError("書き込み失敗")
        current = self.collection.docs.setdefault(self.id, {})
        for key, value in data.items():
            if hasattr(value, "values"):  # ArrayUnion
                items = current.setdefault(key, [])
                items.extend(v for v in value.values if v not in items)
            else:
                current[key] = value


class FakeQuery:
    def __init__(self, collection, cutoff=None, count=None):
        self.collection, self.cutoff, self.count = collection, cutoff, count

    def where(self, filter):
        assert (filter.field_path, filter.op_string) == ("timestamp", "<")
        return FakeQuery(self.collection, filter.value, self.count)

    def order_by(self, field):
        assert field == "timestamp"
        return self

    def limit(self, count):
        return FakeQuery(self.collection, self.cutoff, count)

    def stream(self):
        self.collection.reads += 1
        ids = [i for i, d in self.collection.docs.items()
               if isinstance(d.get("timestamp"), datetime) and d["timestamp"] < self.cutoff]
        ids.sort(key=lambda i: self.collection.docs[i]["timestamp"])
        return [FakeDoc(self.collection, i) for i in ids[:self.count]]


class FakeCollection(FakeQuery):
    def __init__(self):
        super().__init__(self)
        self.docs, self.reads, self.fail_writes = {}, 0, False

    def document(self, doc_id):
        return FakeDoc(self, doc_id)


class FakeBatch:
    def __init__(self):
        self.refs = []

    def delete(self, ref):
        self.refs.append(ref)

    def commit(self):
        assert len(self.refs) <= 500
        for ref in self.refs:
            del ref.collection.docs[ref.id]


class FakeDb:
    def __init__(self):
        self.collections = {}

    def collection(self, name):
        return self.collections.setdefault(name, FakeCollection())

    def batch(self):
        return FakeBatch()


def add_reading(db, doc_id, location, age, **values):
    data = {"temperature": 20.0, "humidity": 60, "timestamp": NOW - age, **values}
    if location is not None:
        data["location"] = location
    db.collection("environmental_data").docs[doc_id] = data


def bundled_times(db):
    return sorted(point["t"] for bundle in db.collection("environmental_hourly").docs.values()
                  for point in bundle["readings"])


def make_db(old=10, recent=5):
    db = FakeDb()
    for i in range(old):
        add_reading(db, f"old{i}", "house1", timedelta(days=31, minutes=20 * i), co2=400 + i)
    for i in range(recent):
        add_reading(db, f"new{i}", "house1", timedelta(days=29, minutes=20 * i))
    return db


def test_old_readings_are_bundled_then_deleted_and_recent_ones_stay():
    db = make_db()
    old_times = sorted(d["timestamp"] for i, d in db.collection("environmental_data").docs.items() if i.startswith("old"))

    assert cleanup.cleanup(db, 30, 1000, NOW) == 10

    assert sorted(db.collection("environmental_data").docs) == [f"new{i}" for i in range(5)]
    assert bundled_times(db) == old_times
    bundle = db.collection("environmental_hourly").docs["house1_2026101602"]
    assert bundle["location"] == "house1"
    assert {"temperature", "humidity", "co2", "t"} == set(bundle["readings"][0])


def test_already_bundled_readings_are_not_duplicated():
    db = make_db()
    oldest = dict(db.collection("environmental_data").docs["old9"])
    assert cleanup.cleanup(db, 30, 4, NOW) == 4
    # 同じ計測値がもう一度届いても（まとめに入っているものを書き写しても）増えない
    db.collection("environmental_data").docs["again"] = oldest
    cleanup.cleanup(db, 30, 1000, NOW)
    assert len(bundled_times(db)) == 10


def test_stops_at_the_limit_and_deletes_oldest_first():
    db = make_db()
    assert cleanup.cleanup(db, 30, 3, NOW) == 3
    assert sorted(i for i in db.collection("environmental_data").docs if i.startswith("old")) == [f"old{i}" for i in range(7)]


def test_nothing_is_deleted_when_bundling_fails():
    db = make_db()
    db.collection("environmental_hourly").fail_writes = True
    with pytest.raises(RuntimeError):
        cleanup.cleanup(db, 30, 1000, NOW)
    assert len(db.collection("environmental_data").docs) == 15


def test_reading_without_location_is_deleted_without_bundling():
    db = FakeDb()
    add_reading(db, "orphan", None, timedelta(days=40))
    assert cleanup.cleanup(db, 30, 1000, NOW) == 1
    assert db.collection("environmental_data").docs == {}
    assert db.collection("environmental_hourly").docs == {}


def test_pages_through_more_than_one_batch():
    db = make_db(old=cleanup.PAGE_SIZE * 2 + 7, recent=1)
    assert cleanup.cleanup(db, 30, 100000, NOW) == cleanup.PAGE_SIZE * 2 + 7
    assert list(db.collection("environmental_data").docs) == ["new0"]


def test_too_short_retention_is_refused():
    db = make_db()
    with pytest.raises(ValueError):
        cleanup.cleanup(db, 1, 1000, NOW)
    assert len(db.collection("environmental_data").docs) == 15


def test_daily_limit_survives_restart(tmp_path, monkeypatch):
    monkeypatch.setenv("FARM_RETENTION_DAYS", "30")
    monkeypatch.setenv("FARM_CLEANUP_MAX_PER_DAY", "6")
    state = str(tmp_path / "state.json")
    db = make_db(old=10, recent=0)

    assert cleanup.DailyCleaner(db, state, log=lambda *a: None).run(NOW) == 6
    # 再起動しても（新しい DailyCleaner でも）同じ日はもう消さない
    assert cleanup.DailyCleaner(db, state, log=lambda *a: None).run(NOW + timedelta(hours=1)) == 0
    # 翌日は残りを消す
    assert cleanup.DailyCleaner(db, state, log=lambda *a: None).run(NOW + timedelta(days=1)) == 4


def test_retention_zero_disables_cleanup(tmp_path, monkeypatch):
    monkeypatch.setenv("FARM_RETENTION_DAYS", "0")
    db = make_db()
    assert cleanup.DailyCleaner(db, str(tmp_path / "state.json")).run(NOW) == 0
    assert len(db.collection("environmental_data").docs) == 15
