"""Firestore を読み取り専用で読む（REST API）

表示用アカウント（display@farm-dashboard.local）でログインして読む。
このアカウントは Firestore のルールで読み取りしかできない。このファイルにも、読む処理しか書かない
（書き込み・削除の API は呼ばない）。
"""
import time
from datetime import datetime, timezone

import requests

TIMEOUT = 30


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
    """"2026-11-06T03:12:45.123456789Z" → タイムゾーン付きの datetime（マイクロ秒まで）"""
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    if "." in text:
        head, rest = text.split(".", 1)
        n = 0
        while n < len(rest) and rest[n].isdigit():
            n += 1
        text = "{}.{}{}".format(head, (rest[:n] + "000000")[:6], rest[n:])
    return datetime.fromisoformat(text)


def to_rest_time(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class FirestoreReader:
    def __init__(self, project_id, api_key, email, password, session=None):
        self.project_id = project_id
        self.api_key = api_key
        self.email = email
        self.password = password
        self.http = session or requests.Session()
        self.documents = "projects/{}/databases/(default)/documents".format(project_id)
        self.base = "https://firestore.googleapis.com/v1/" + self.documents
        self.token = None
        self.token_expires = 0
        self.read_count = 0  # この回で読んだドキュメントの数（読み取り件数の確認用）

    def _sign_in(self):
        url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + self.api_key
        r = self.http.post(url, json={"email": self.email, "password": self.password, "returnSecureToken": True},
                           timeout=TIMEOUT)
        if r.status_code != 200:
            raise RuntimeError("ログインに失敗しました（{}）。.env の FIREBASE_EMAIL / FIREBASE_PASSWORD を確認".format(
                r.status_code))
        data = r.json()
        self.token = data["idToken"]
        self.token_expires = time.time() + int(data["expiresIn"]) - 300  # 期限の5分前に取り直す

    def _headers(self):
        if not self.token or time.time() >= self.token_expires:
            self._sign_in()
        return {"Authorization": "Bearer " + self.token}

    def _run_query(self, structured_query):
        r = self.http.post(self.base + ":runQuery", json={"structuredQuery": structured_query},
                           headers=self._headers(), timeout=TIMEOUT)
        if r.status_code == 401:
            self.token = None
        r.raise_for_status()
        docs = [row["document"] for row in r.json() if "document" in row]
        self.read_count += max(1, len(docs))  # 結果が0件でも1件と数えられる
        return docs

    def houses(self):
        """登録されている（無効にしていない）ハウスの一覧 [{id, name, crop}, ...]"""
        r = self.http.get(self.base + "/houses", params={"pageSize": 300}, headers=self._headers(), timeout=TIMEOUT)
        r.raise_for_status()
        docs = r.json().get("documents", [])
        self.read_count += max(1, len(docs))
        result = []
        for doc in docs:
            house_id = doc["name"].rsplit("/", 1)[-1]
            data = decode_fields(doc.get("fields", {}))
            if house_id.startswith("_") or data.get("isActive") is False:
                continue
            crops = [c.get("cropName", "").strip() for c in (data.get("crops") or []) if isinstance(c, dict)]
            crop = "・".join(dict.fromkeys(c for c in crops if c)) or data.get("currentCrop") or None
            result.append({"id": house_id, "name": data.get("name") or house_id, "crop": crop})
        return sorted(result, key=lambda h: h["id"])

    def readings_after(self, house_id, since):
        """environmental_data のうち、since より後の計測値（新しい順）。
        ダッシュボードの履歴と同じ形の問い合わせ（location 昇順・timestamp 降順の複合インデックスを使う）"""
        docs = self._run_query({
            "from": [{"collectionId": "environmental_data"}],
            "where": {"compositeFilter": {"op": "AND", "filters": [
                {"fieldFilter": {"field": {"fieldPath": "location"}, "op": "EQUAL",
                                 "value": {"stringValue": house_id}}},
                {"fieldFilter": {"field": {"fieldPath": "timestamp"}, "op": "GREATER_THAN",
                                 "value": {"timestampValue": to_rest_time(since)}}},
            ]}},
            "orderBy": [{"field": {"fieldPath": "timestamp"}, "direction": "DESCENDING"}],
        })
        return [decode_fields(doc.get("fields", {})) for doc in docs]

    def hourly_bundles(self, house_id, start, end):
        """1時間ごとのまとめ（environmental_hourly）の計測値。ID の範囲で取り出す（1時間に1件）"""
        def ref(dt):
            key = dt.astimezone(timezone.utc).strftime("%Y%m%d%H")
            return {"referenceValue": "{}/environmental_hourly/{}_{}".format(self.documents, house_id, key)}

        docs = self._run_query({
            "from": [{"collectionId": "environmental_hourly"}],
            "where": {"compositeFilter": {"op": "AND", "filters": [
                {"fieldFilter": {"field": {"fieldPath": "__name__"}, "op": "GREATER_THAN_OR_EQUAL", "value": ref(start)}},
                {"fieldFilter": {"field": {"fieldPath": "__name__"}, "op": "LESS_THAN_OR_EQUAL", "value": ref(end)}},
            ]}},
        })
        points = []
        for doc in docs:
            data = decode_fields(doc.get("fields", {}))
            if data.get("location") != house_id:
                continue
            for point in data.get("readings") or []:
                if isinstance(point, dict) and isinstance(point.get("t"), datetime):
                    points.append({**point, "timestamp": point["t"]})
        return points
