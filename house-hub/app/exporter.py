"""送り出し部（将来フェーズ用の置き場）

学校のネットワークは外から入れないので、外で見たいもの（最新の小さい写真・毎日のまとめ）は
ハブから外へ送る。その処理をここに入れる予定。今は何もしない。

fetcher が新しい計測値を保存するたびに export_new_readings が呼ばれる。
"""
import logging

log = logging.getLogger("house-hub.exporter")


def export_new_readings(readings):
    """新しく保存した計測値を受け取る（今は何もしない）

    readings: [{house, ts(datetime), temperature, humidity, soil_moisture, co2}, ...]
    """
    log.debug("exporter: %d 件（今は送り出しをしない）", len(readings))
