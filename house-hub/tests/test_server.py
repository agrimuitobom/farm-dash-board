"""server（API と簡易ページ）のテスト"""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.calc import humidity_deficit
from app.fetcher import normalize
from app.server import create_app
from app.store import JST, Store

NOW = datetime(2026, 11, 6, 8, 30, tzinfo=JST)


def at(minutes_ago, **values):
    return normalize(values.pop("house"), {"timestamp": NOW - timedelta(minutes=minutes_ago), **values})


@pytest.fixture
def client():
    store = Store(":memory:")
    store.save_houses([
        {"id": "温室ハウス1", "name": "温室ハウス1", "crop": "サラダ菜"},
        {"id": "温室ハウス2", "name": "温室ハウス2", "crop": None},
        {"id": "温室ハウス4", "name": "温室ハウス4", "crop": None},
    ])
    store.save_readings([
        at(60 * 8, house="温室ハウス1", temperature=18.0, humidity=80.0),   # 今日 0:30
        at(4, house="温室ハウス1", temperature=24.0, humidity=60.0, co2=612),
        at(2, house="温室ハウス1", temperature=26.0, humidity=50.0, soilMoisture=40),
        at(45, house="温室ハウス2", temperature=20.0, humidity=70.0),
        at(60 * 24, house="温室ハウス2", temperature=10.0, humidity=90.0),  # 昨日
    ], fetched_at=NOW)
    yield TestClient(create_app(store, clock=lambda: NOW))
    store.close()


def test_health(client):
    body = client.get("/health").json()
    assert body == {"status": "ok", "last_fetch": "2026-11-06T08:30:00+09:00", "rows": 5}


def test_latest(client):
    body = client.get("/api/latest").json()
    assert body["generated_at"] == "2026-11-06T08:30:00+09:00"
    h1, h2, h4 = body["houses"]
    assert h1 == {
        "house": "温室ハウス1", "name": "温室ハウス1", "crop": "サラダ菜", "ts": "2026-11-06T08:28:00+09:00",
        "temperature": 26.0, "humidity": 50.0, "humidity_deficit": 12.2, "soil_moisture": 40.0, "co2": None,
        "stale_seconds": 120, "status": "受信中",
    }
    assert (h2["stale_seconds"], h2["status"]) == (2700, "通信なし")
    assert (h4["status"], h4["temperature"]) == ("データなし", None)


def test_history(client):
    body = client.get("/api/history", params={"house": "温室ハウス1"}).json()
    assert body["from"] == "2026-11-05T08:30:00+09:00" and body["count"] == 3 and body["truncated"] is False
    assert [r["temperature"] for r in body["readings"]] == [18.0, 24.0, 26.0]
    assert body["readings"][1]["co2"] == 612.0
    # 日付だけでも、時刻付きでも指定できる（タイムゾーンが無ければ日本時間）
    body = client.get("/api/history", params={"house": "温室ハウス1", "from": "2026-11-06T08:00", "to": "2026-11-06"}).json()
    assert [r["temperature"] for r in body["readings"]] == [24.0, 26.0]
    assert client.get("/api/history", params={"house": "温室ハウス1", "from": "きのう"}).status_code == 400
    assert client.get("/api/history").status_code == 422  # house は必須


def test_summary_daily(client):
    body = client.get("/api/summary/daily").json()
    assert body["date"] == "2026-11-06"
    h1 = body["houses"][0]
    assert h1["count"] == 3
    assert h1["temperature"] == {"avg": 22.7, "max": 26.0, "min": 18.0}
    assert h1["co2"] == {"avg": 612, "max": 612, "min": 612}
    assert h1["soil_moisture"] == {"avg": 40.0, "max": 40.0, "min": 40.0}
    assert body["houses"][1]["count"] == 1  # 昨日の分は入らない
    yesterday = client.get("/api/summary/daily", params={"date": "2026-11-05"}).json()
    assert yesterday["houses"][1]["temperature"]["avg"] == 10.0


def test_index_page(client):
    page = client.get("/")
    assert page.status_code == 200 and "text/html" in page.headers["content-type"]
    assert "温室ハウス1" in page.text and "通信なし" in page.text and "サラダ菜" in page.text


def test_humidity_deficit_matches_dashboard():
    # ダッシュボードのテスト（src/utils/humidityDeficit.test.js）と同じ値
    assert humidity_deficit(25, 60) == 9.2
    assert humidity_deficit(20, 80) == 3.5
    assert humidity_deficit(30, 100) == 0
    assert humidity_deficit(None, 50) is None
