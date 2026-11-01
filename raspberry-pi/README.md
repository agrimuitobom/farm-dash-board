# Raspberry Pi 用プログラム

| ファイル | 役割 |
|---|---|
| `sensor.py` | DHT22 の温度・湿度を `environmental_data` に2分ごとに送る（10分間送信できなければ終了し、systemd が再起動する） |
| `alert_monitor.py` | 全ハウスの最新データを見張り、閾値を外れたらアラートを作る（戻ったら自動解決）。グラフ用の「1時間ごとのまとめ」も作る |
| `hourly_bundles.py` | 1時間ごとのまとめ（`environmental_hourly`）を作る処理。`alert_monitor.py` と同じフォルダに置く |
| `farm-sensor.service` / `farm-alert-monitor.service` | 上の2つを常時動かす systemd の設定 |
| `round-display/` | 丸型タッチディスプレイに各ハウスのデータと天気予報を出す（使い方は `round-display/README.md`） |

どちらも `~/farm-sensor/` に置き、同じフォルダの `serviceAccount.json`（Firebase のサービスアカウント鍵）と
`venv`（`pip install adafruit-circuitpython-dht firebase-admin` 済み）を使う。
**`serviceAccount.json` は Git に入れないこと。**

ユーザー名が `saino-rasp22` 以外の Pi で使うときは、`.service` ファイルの `User=` とパスを書き換える。

サービスを止めるときは `pkill` ではなく `sudo systemctl stop farm-sensor` を使う
（`pkill -f sensor.py` だとセンサー読み取り用の補助プロセス `libgpiod_pulsein` が残り、
GPIO4 がふさがって次に起動したとき `Unable to set line 4 to input` になる）。

## アラートの見張り（alert_monitor.py）

- 閾値はハウスごとに、ダッシュボードの「温室ハウス一覧」→ 各ハウスの編集画面（または「アラート」→「閾値の設定」）で設定する
  （未設定のハウスは 気温 18〜30℃、湿度 50〜80%）
- 範囲を外れたらアラートを作り、範囲内に戻ったら自動で解決済みにする
  （境界付近で繰り返さないよう、気温は 0.5℃、湿度は 2% 内側に戻ってから解決）
- センサーから10分以上データが来ないときは「通信なし」のアラートを作る（最後のデータが24時間以上前のハウスは対象外）
- 手動で解決済みにしたアラートは、いったん正常に戻るまで作り直さない
- 見張るのは1台だけにすること（複数台で動かすと同じアラートが重複する）

## 1時間ごとのまとめ（グラフ用）

ダッシュボード・ハウス詳細・7インチ画面のグラフは、`environmental_data` を1件ずつ読む代わりに、
ハウスごと・1時間ごとに計測値をまとめたドキュメント（`environmental_hourly/{ハウスID}_{YYYYMMDDHH}`）を読む。
24時間のグラフは25件、1週間は169件の読み取りで済む（1件ずつ読むと、2分間隔で 720件・5,040件）。

- `alert_monitor.py` が、新しい計測値を受け取るたびにまとめへ追記する（追加の読み取りはない。書き込みは計測値1件につき1回）
- 起動したときは、止まっていた間の分を最大24時間さかのぼって追記する（足りない分だけ読む）
- `alert_monitor.py` を止めている間はまとめが増えないので、グラフの新しい部分が欠ける（再起動すれば24時間分は埋まる）
- まとめが1件も無いハウスは、24時間のグラフだけ従来どおり1件ずつ読む（1週間は表示されない）

**導入したとき（1回だけ）**：1週間表示をすぐ使いたいときは、過去の分のまとめを作る。
2分間隔のデータなら1週間分で 4ハウス × 約5,000件 ＝ 約2万件（60秒間隔だった期間はその倍）の読み取りになるので、
読み取りに余裕のある日に1回だけ行う（`--backfill-hours 72` のように短くしてもよい）。

```bash
cd ~/farm-sensor
venv/bin/python alert_monitor.py --backfill-hours 168
```

### 設置

```bash
cd ~/farm-sensor
curl -fsSL -O https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/raspberry-pi/alert_monitor.py
curl -fsSL -O https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/raspberry-pi/hourly_bundles.py
curl -fsSL -O https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/raspberry-pi/farm-alert-monitor.service
sudo cp farm-alert-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now farm-alert-monitor
journalctl -u farm-alert-monitor -f   # 動作確認（Ctrl+C で表示だけ止まる）
```

起動すると `ハウス 5 件を見張っています` と表示され、範囲外のハウスがあれば `アラート追加: …` と出る。
