"""ハードウェアを使わないテスト（python3 -m pytest test_round_display.py）"""

from datetime import datetime, timedelta, timezone

import farm_data
import round_display
import screens
import touch


class FakeResponse:
    def __init__(self, status, body):
        self.status_code = status
        self.body = body

    def json(self):
        return self.body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)


def house_doc(house_id, **fields):
    return {"name": farm_data.DOCUMENTS + "/houses/" + house_id, "fields": fields}


class FakeSession:
    def __init__(self):
        self.calls = []

    def post(self, url, json=None, headers=None, timeout=None):
        self.calls.append(("post", url, json))
        if "signInWithPassword" in url:
            if json["password"] != "secret":
                return FakeResponse(400, {})
            return FakeResponse(200, {"idToken": "tok", "expiresIn": "3600"})
        assert headers == {"Authorization": "Bearer tok"}
        location = json["structuredQuery"]["where"]["fieldFilter"]["value"]["stringValue"]
        if location == "温室ハウス3":
            return FakeResponse(200, [{"document": {"fields": {
                "location": {"stringValue": location},
                "temperature": {"doubleValue": 24.1},
                "humidity": {"integerValue": "70"},
                "soilMoisture": {"doubleValue": 46.3},
                "timestamp": {"timestampValue": "2026-10-29T03:12:45.123456789Z"},
            }}}])
        return FakeResponse(200, [{"readTime": "2026-10-29T03:13:00Z"}])  # データなし

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append(("get", url, params))
        return FakeResponse(200, {"documents": [
            house_doc("温室ハウス3", name={"stringValue": "温室ハウス3"},
                      currentCrop={"stringValue": "R6ミニトマト"},
                      crops={"arrayValue": {"values": [
                          {"mapValue": {"fields": {"cropName": {"stringValue": "サラダ菜"}}}},
                          {"mapValue": {"fields": {"cropName": {"stringValue": "レタス"}}}},
                      ]}},
                      thresholds={"mapValue": {"fields": {
                          "temperature": {"mapValue": {"fields": {"min": {"integerValue": "15"},
                                                                  "max": {"doubleValue": 28.5}}}},
                      }}}),
            house_doc("温室ハウス1", name={"stringValue": "温室ハウス1"}, currentCrop={"stringValue": "キュウリ"}),
            house_doc("温室ハウス9", name={"stringValue": "使っていない"}, isActive={"booleanValue": False}),
            house_doc("_meta"),
        ]})


def test_houses_and_readings():
    data = farm_data.FarmData("display@farm-dashboard.local", "secret", session=FakeSession())
    houses = data.houses()
    assert [h["id"] for h in houses] == ["温室ハウス1", "温室ハウス3"]
    h3 = houses[1]
    assert h3["crop"] == "サラダ菜・レタス"  # 栽培作物を優先
    assert h3["thresholds"] == {"temperature": (15, 28.5), "humidity": (50, 80)}
    assert houses[0]["crop"] == "キュウリ"
    assert [h["id"] for h in data.houses(["温室ハウス3", "無い"])] == ["温室ハウス3"]

    reading = data.latest_reading("温室ハウス3")
    assert reading["temperature"] == 24.1 and reading["humidity"] == 70 and reading["soilMoisture"] == 46.3
    assert reading["timestamp"] == datetime(2026, 10, 29, 3, 12, 45, 123456, tzinfo=timezone.utc)
    assert data.latest_reading("温室ハウス1") is None


def test_sign_in_failure_message():
    data = farm_data.FarmData("display@farm-dashboard.local", "wrong", session=FakeSession())
    try:
        data.houses()
        assert False
    except RuntimeError as e:
        assert "config.json" in str(e)


def test_parse_timestamp_variants():
    assert farm_data.parse_timestamp("2026-10-29T03:12:45Z") == datetime(2026, 10, 29, 3, 12, 45, tzinfo=timezone.utc)
    assert farm_data.parse_timestamp("2026-10-29T03:12:45.5Z").microsecond == 500000


def test_age_and_judge():
    now = datetime(2026, 10, 29, 3, 0, tzinfo=timezone.utc)
    assert screens.format_age(now - timedelta(seconds=10), now)[0] == "たった今"
    assert screens.format_age(now - timedelta(minutes=5), now)[0] == "5分前"
    assert screens.format_age(now - timedelta(minutes=20), now)[0] == "通信なし"
    assert screens.format_age(None, now)[0] == "データなし"
    assert screens.judge(31, 18, 30, "低温", "高温")[0] == "高温"
    assert screens.judge(None, 18, 30, "低温", "高温")[0] == ""


def test_page_step():
    assert round_display.page_step(touch.SWIPE_LEFT, False) == 1
    assert round_display.page_step(touch.SWIPE_RIGHT, False) == -1
    assert round_display.page_step(touch.SWIPE_LEFT, True) == -1
    assert round_display.page_step(touch.TAP, True) == 1
    assert round_display.page_step(touch.NONE, False) == 0


def test_render_pages(tmp_path=None):
    fonts = screens.Fonts(*FONTS)
    houses = [{"id": "a", "name": "A", "crop": "", "thresholds": screens.DEFAULT_THRESHOLDS}]
    image, count = round_display.render(fonts, houses, {}, True, None, None, 0)
    assert count == 2 and image.size == (240, 240)
    image, count = round_display.render(fonts, houses, {}, True, None, None, 1)  # 天気予報
    assert count == 2
    image, count = round_display.render(fonts, None, {}, False, None, "timeout", 0)
    assert count == 1


# 日本語フォント（None なら fonts-noto-cjk を探す）
FONTS = (None, None)
