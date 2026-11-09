"""提供部: 最新値・履歴・日次まとめを返す Web/API（校内ネットワーク向け）

  python3 -m app.server    # SERVER_HOST:SERVER_PORT で待ち受ける（既定 0.0.0.0:8080）

応答は JSON（/ だけ人が見る HTML）。時刻はすべて日本時間の ISO 8601。
"""
import html
from datetime import date, datetime, time, timedelta

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse

from .calc import humidity_deficit, summarize
from .store import JST, Store, from_ts, now_jst

HISTORY_LIMIT = 5000
# これより古いデータは「通信なし」（ダッシュボードと同じ）
OFFLINE_AFTER_SECONDS = 10 * 60


def iso(dt):
    return dt.astimezone(JST).isoformat(timespec="seconds") if dt else None


def parse_time(text, end_of_day=False):
    """"2026-11-05" または "2026-11-05T08:00"（タイムゾーンが無ければ日本時間）"""
    try:
        if len(text) == 10:
            d = date.fromisoformat(text)
            return datetime.combine(d, time.max if end_of_day else time.min, tzinfo=JST)
        dt = datetime.fromisoformat(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=JST)
    except ValueError:
        raise HTTPException(status_code=400, detail="日時の形式が正しくありません: {}（例: 2026-11-05 や 2026-11-05T08:00）".format(text))


def reading_json(row):
    return {
        "ts": iso(from_ts(row["ts"])),
        "temperature": row["temperature"],
        "humidity": row["humidity"],
        "humidity_deficit": humidity_deficit(row["temperature"], row["humidity"]),
        "soil_moisture": row["soil_moisture"],
        "co2": row["co2"],
    }


def create_app(store: Store, clock=now_jst):
    app = FastAPI(title="ハウスハブ", description="温室の環境データ（校内向け・読み取り専用）")

    def latest_houses():
        now = clock()
        result = []
        for house in store.houses():
            row = store.latest(house["id"])
            item = {"house": house["id"], "name": house["name"], "crop": house["crop"]}
            if row:
                item.update(reading_json(row))
                stale = int((now - from_ts(row["ts"])).total_seconds())
                item["stale_seconds"] = stale
                item["status"] = "通信なし" if stale > OFFLINE_AFTER_SECONDS else "受信中"
            else:
                item.update({"ts": None, "temperature": None, "humidity": None, "humidity_deficit": None,
                             "soil_moisture": None, "co2": None, "stale_seconds": None, "status": "データなし"})
            result.append(item)
        return now, result

    @app.get("/health")
    async def health():
        last = store.last_fetched_at()
        return {"status": "ok", "last_fetch": iso(from_ts(last)) if last else None, "rows": store.count()}

    @app.get("/api/latest")
    async def latest():
        now, houses = latest_houses()
        return {"generated_at": iso(now), "offline_after_seconds": OFFLINE_AFTER_SECONDS, "houses": houses}

    @app.get("/api/history")
    async def history(
        house: str = Query(..., description="ハウスID（例: 温室ハウス1）"),
        from_: str = Query(None, alias="from", description="開始（既定: 24時間前）"),
        to: str = Query(None, description="終了（既定: 今）"),
    ):
        now = clock()
        start = parse_time(from_) if from_ else now - timedelta(hours=24)
        end = parse_time(to, end_of_day=True) if to else now
        rows = store.history(house, start, end, limit=HISTORY_LIMIT + 1)
        return {
            "house": house,
            "from": iso(start),
            "to": iso(end),
            "count": min(len(rows), HISTORY_LIMIT),
            "truncated": len(rows) > HISTORY_LIMIT,  # 多すぎて途中で切ったか（期間を短くする）
            "readings": [reading_json(r) for r in rows[:HISTORY_LIMIT]],
        }

    @app.get("/api/summary/daily")
    async def summary_daily(date_: str = Query(None, alias="date", description="日付（既定: 今日）")):
        day = parse_time(date_).date() if date_ else clock().date()
        start = datetime.combine(day, time.min, tzinfo=JST)
        end = datetime.combine(day, time.max, tzinfo=JST)
        houses = []
        for house in store.houses():
            rows = store.history(house["id"], start, end, limit=100000)
            houses.append({
                "house": house["id"],
                "name": house["name"],
                "count": len(rows),
                "temperature": summarize([r["temperature"] for r in rows]),
                "humidity": summarize([r["humidity"] for r in rows]),
                "humidity_deficit": summarize([humidity_deficit(r["temperature"], r["humidity"]) for r in rows]),
                "soil_moisture": summarize([r["soil_moisture"] for r in rows]),
                "co2": summarize([r["co2"] for r in rows], digits=0),
            })
        return {"date": day.isoformat(), "houses": houses}

    @app.get("/", response_class=HTMLResponse)
    async def index():
        now, houses = latest_houses()

        def cell(value, digits=1):
            return "-" if value is None else ("{:." + str(digits) + "f}").format(value)

        rows = "".join(
            "<tr><td>{name}</td><td>{crop}</td><td>{ts}</td><td class='{cls}'>{status}</td>"
            "<td>{t}</td><td>{h}</td><td>{d}</td><td>{s}</td><td>{c}</td></tr>".format(
                name=html.escape(h["name"]), crop=html.escape(h["crop"] or "-"),
                ts=html.escape((h["ts"] or "-").replace("T", " ")[:16]),
                cls="ng" if h["status"] != "受信中" else "", status=h["status"],
                t=cell(h["temperature"]), h=cell(h["humidity"]), d=cell(h["humidity_deficit"]),
                s=cell(h["soil_moisture"]), c=cell(h["co2"], 0))
            for h in houses
        )
        return """<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="60"><title>ハウスハブ</title>
<style>
body {{ font-family: sans-serif; margin: 16px; color: #111; }}
table {{ border-collapse: collapse; }} th, td {{ border: 1px solid #ccc; padding: 4px 8px; }}
th {{ background: #f3f4f6; text-align: left; }} .ng {{ color: #b91c1c; font-weight: bold; }}
p.small {{ color: #555; font-size: 0.9em; }}
</style></head><body>
<h1>ハウスハブ（校内）</h1>
<p>{now}（日本時間）時点・保存済み {rows_total:,} 件・最後の取り込み {last}</p>
<table><thead><tr><th>ハウス</th><th>作物</th><th>測定時刻</th><th>状態</th><th>温度(℃)</th><th>湿度(%)</th>
<th>飽差(g/m³)</th><th>土壌水分(%)</th><th>CO2(ppm)</th></tr></thead><tbody>{rows}</tbody></table>
<p class="small">60秒ごとに更新。API: <a href="/api/latest">/api/latest</a>・
<a href="/api/summary/daily">/api/summary/daily</a>・/api/history?house=ハウスID・<a href="/docs">API の説明</a></p>
</body></html>""".format(
            now=iso(now).replace("T", " ")[:16], rows_total=store.count(),
            last=(iso(from_ts(store.last_fetched_at())) or "-").replace("T", " ")[:16] if store.last_fetched_at() else "-",
            rows=rows or "<tr><td colspan='9'>データがまだありません</td></tr>")

    return app


def main():
    import uvicorn

    from .config import load_config

    config = load_config()
    uvicorn.run(create_app(Store(config.db_path)), host=config.server_host, port=config.server_port,
                log_level=config.log_level.lower())


if __name__ == "__main__":
    main()
