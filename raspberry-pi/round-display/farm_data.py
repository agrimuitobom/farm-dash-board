"""ダッシュボードのデータ（Firestore）と天気予報（Open-Meteo）を取る

Firestore へは表示用アカウント（display@farm-dashboard.local、読み取り専用）でログインして
REST API で読む。サービスアカウント鍵は使わない（このラズパイからはデータを書き換えられない）。
"""

import time
from datetime import datetime

import requests

# ダッシュボードの src/firebase.js と同じ公開値
API_KEY = "AIzaSyAHduV83j0eSdJQIvUGRqmmyN6sH0b4L0k"
PROJECT_ID = "farm-dashboard-95875"

DOCUMENTS = "projects/{}/databases/(default)/documents".format(PROJECT_ID)
FIRESTORE = "https://firestore.googleapis.com/v1/"
SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + API_KEY

# 西条市（ダッシュボードと同じ地点）の3日分の予報
FORECAST_URL = (
    "https://api.open-meteo.com/v1/forecast?latitude=33.9197&longitude=133.1823"
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
    "&forecast_days=3&timezone=Asia%2FTokyo"
)

TIMEOUT = 20


def decode_value(value):
    """Firestore REST の値（{"doubleValue": 1.5} など）を Python の値にする"""
    if "nullValue" in value:
        return None
    for key in ("stringValue", "booleanValue", "doubleValue"):
        if key in value:
            return value[key]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "timestampValue" in value:
        return parse_timestamp(value["timestampValue"])
    if "mapValue" in value:
        return decode_fields(value["mapValue"].get("fields", {}))
    if "arrayValue" in value:
        return [decode_value(v) for v in value["arrayValue"].get("values", [])]
    return None


def decode_fields(fields):
    return {key: decode_value(value) for key, value in fields.items()}


def parse_timestamp(text):
    """"2026-10-29T03:12:45.123456Z" → タイムゾーン付きの datetime"""
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    # Python 3.11 未満でも読めるよう、小数点以下は6桁までにする
    if "." in text:
        head, rest = text.split(".", 1)
        n = 0
        while n < len(rest) and rest[n].isdigit():
            n += 1
        digits, zone = rest[:n], rest[n:]
        text = "{}.{}{}".format(head, (digits + "000000")[:6], zone)
    return datetime.fromisoformat(text)


def _range(thresholds, key, default):
    item = (thresholds or {}).get(key) or {}
    low = item.get("min")
    high = item.get("max")
    return (low if isinstance(low, (int, float)) else default[0],
            high if isinstance(high, (int, float)) else default[1])


def to_house(document):
    """houses のドキュメント → 画面で使うハウス情報。表示しないハウスは None"""
    house_id = document["name"].rsplit("/", 1)[-1]
    data = decode_fields(document.get("fields", {}))
    if house_id.startswith("_") or data.get("isActive") is False:
        return None
    crops = data.get("crops") or []
    names = []
    for crop in crops:
        name = (crop or {}).get("cropName", "").strip() if isinstance(crop, dict) else ""
        if name and name not in names:
            names.append(name)
    thresholds = data.get("thresholds") or {}
    return {
        "id": house_id,
        "name": data.get("name") or house_id,
        # 栽培作物が登録されていればそれを使う（ダッシュボードと同じ）
        "crop": "・".join(names) or data.get("currentCrop") or "",
        "thresholds": {
            "temperature": _range(thresholds, "temperature", (18, 30)),
            "humidity": _range(thresholds, "humidity", (50, 80)),
        },
    }


class FarmData:
    def __init__(self, email, password, session=None):
        self.email = email
        self.password = password
        self.http = session or requests.Session()
        self.token = None
        self.token_expires = 0

    def _sign_in(self):
        r = self.http.post(SIGN_IN_URL, json={
            "email": self.email, "password": self.password, "returnSecureToken": True,
        }, timeout=TIMEOUT)
        if r.status_code != 200:
            raise RuntimeError("ログインに失敗しました（{}）。config.json のメールアドレスとパスワードを確認".format(
                r.status_code))
        data = r.json()
        self.token = data["idToken"]
        # 期限の5分前に取り直す
        self.token_expires = time.time() + int(data["expiresIn"]) - 300

    def _headers(self):
        if not self.token or time.time() >= self.token_expires:
            self._sign_in()
        return {"Authorization": "Bearer " + self.token}

    def houses(self, only=None):
        """表示するハウスの一覧（名前順）。only にハウスIDの一覧を渡すとそのハウスだけ（その順）"""
        r = self.http.get(FIRESTORE + DOCUMENTS + "/houses", params={"pageSize": 100},
                          headers=self._headers(), timeout=TIMEOUT)
        r.raise_for_status()
        houses = [h for h in (to_house(d) for d in r.json().get("documents", [])) if h]
        if only:
            by_id = {h["id"]: h for h in houses}
            return [by_id[i] for i in only if i in by_id]
        return sorted(houses, key=lambda h: h["name"])

    def latest_reading(self, house_id):
        """ハウスの最新の環境データ。無ければ None"""
        query = {"structuredQuery": {
            "from": [{"collectionId": "environmental_data"}],
            "where": {"fieldFilter": {
                "field": {"fieldPath": "location"}, "op": "EQUAL", "value": {"stringValue": house_id},
            }},
            "orderBy": [{"field": {"fieldPath": "timestamp"}, "direction": "DESCENDING"}],
            "limit": 1,
        }}
        r = self.http.post(FIRESTORE + DOCUMENTS + ":runQuery", json=query,
                           headers=self._headers(), timeout=TIMEOUT)
        r.raise_for_status()
        for row in r.json():
            if "document" in row:
                return decode_fields(row["document"].get("fields", {}))
        return None


def fetch_forecast(session=None):
    """3日分の予報。[(天気コード, 最高, 最低, 降水確率), ...]"""
    r = (session or requests).get(FORECAST_URL, timeout=TIMEOUT)
    r.raise_for_status()
    daily = r.json()["daily"]
    return [
        (daily["weather_code"][i], daily["temperature_2m_max"][i],
         daily["temperature_2m_min"][i], daily["precipitation_probability_max"][i])
        for i in range(len(daily["time"]))
    ]
