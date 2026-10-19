# Raspberry Pi 用プログラム

| ファイル | 役割 |
|---|---|
| `sensor.py` | DHT22 の温度・湿度を `environmental_data` に1分ごとに送る |
| `alert_monitor.py` | 全ハウスの最新データを見張り、閾値を外れたらアラートを作る（戻ったら自動解決） |
| `farm-sensor.service` / `farm-alert-monitor.service` | 上の2つを常時動かす systemd の設定 |

どちらも `~/farm-sensor/` に置き、同じフォルダの `serviceAccount.json`（Firebase のサービスアカウント鍵）と
`venv`（`pip install adafruit-circuitpython-dht firebase-admin` 済み）を使う。
**`serviceAccount.json` は Git に入れないこと。**

ユーザー名が `saino-rasp22` 以外の Pi で使うときは、`.service` ファイルの `User=` とパスを書き換える。

## アラートの見張り（alert_monitor.py）

- 閾値はハウスごとに、ダッシュボードの「温室ハウス一覧」→ 各ハウスの編集画面（または「アラート」→「閾値の設定」）で設定する
  （未設定のハウスは 気温 18〜30℃、湿度 50〜80%）
- 範囲を外れたらアラートを作り、範囲内に戻ったら自動で解決済みにする
  （境界付近で繰り返さないよう、気温は 0.5℃、湿度は 2% 内側に戻ってから解決）
- センサーから10分以上データが来ないときは「通信なし」のアラートを作る（最後のデータが24時間以上前のハウスは対象外）
- 手動で解決済みにしたアラートは、いったん正常に戻るまで作り直さない
- 見張るのは1台だけにすること（複数台で動かすと同じアラートが重複する）

### 設置

```bash
cd ~/farm-sensor
curl -fsSL -O https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/raspberry-pi/alert_monitor.py
curl -fsSL -O https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/raspberry-pi/farm-alert-monitor.service
sudo cp farm-alert-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now farm-alert-monitor
journalctl -u farm-alert-monitor -f   # 動作確認（Ctrl+C で表示だけ止まる）
```

起動すると `ハウス 5 件を見張っています` と表示され、範囲外のハウスがあれば `アラート追加: …` と出る。
