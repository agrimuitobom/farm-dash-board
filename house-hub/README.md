# ハウスハブ（校内サーバー）

温室の環境データを Firestore から**読み取り専用**で取り込み、校内のサーバー（1TB のラズパイ OS サーバー）に
長期保存する。校内のブラウザから最新値・履歴・日次まとめを見られる。

- Firebase は今のまま（無料プラン）。センサーの送信・ダッシュボードには手を入れない
- ハブから Firebase へは**読むだけ**（表示用アカウントでログイン。Firestore のルールで書き込めない）
- 学校のネットワークは外から入れないので、画面と API は**校内からだけ**見る
- 外で見たいもの（最新の写真・毎日のまとめ）は、将来ハブから外へ送る（`app/exporter.py`。今は何もしない）

```
センサー ─→ Firestore ─→ ダッシュボード（今のまま）
               │ 読み取り専用（5分ごとに新着だけ）
               ▼
         ハウスハブ（1TB サーバー）
           ├ fetcher : 取り込み     app/fetcher.py
           ├ store   : SQLite に保存 app/store.py
           └ server  : 画面と API   app/server.py  → 校内のブラウザ
```

## Firestore の読み取り件数

| 処理 | 件数 |
|---|---|
| 5分ごとの取り込み（4ハウス） | 1日 約1,200件（新着が無くても1回1件）＋新着 約2,900件 ＝ **約4,000件** |
| ハウスの一覧（1時間ごと） | 1日 約100件 |
| 初回の過去分（`--backfill-days 30`、1回だけ） | 4ハウス × 721件 ＝ 約2,900件 |

無料枠（1日 5万件）に十分収まる。止まっていたあとでも、1回に読むのは24時間分まで。

## セットアップ（1TB のサーバーで、初回だけ）

```bash
# 1. プログラムを置く（すでにあれば cd ~/farm-dash-board && git pull）
cd ~
git clone https://github.com/agrimuitobom/farm-dash-board.git
cd ~/farm-dash-board/house-hub

# 2. Python の部品を入れる（このフォルダの venv に入る）
sudo apt install -y python3-venv sqlite3
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# 3. 設定ファイルを作り、表示用アカウントのパスワードを書く
cp .env.example .env
nano .env
```

`.env` で変えるところ:
- `FIREBASE_PASSWORD`: 表示用アカウント（`display@farm-dashboard.local`）のパスワード（7インチ画面と同じ）
- `DB_PATH`: 1TB のディスクを `/mnt/data` などに付けているなら `DB_PATH=/mnt/data/house-hub/hub.db` のようにそこにする
  （既定は `~/house-hub/data/hub.db`）

`.env` にはパスワードが入るので、Git に入れない（`.gitignore` 済み）。

## 動作確認

```bash
cd ~/farm-dash-board/house-hub

# 1回だけ取り込む（「温室ハウス1: ○件を保存」と出れば成功）
venv/bin/python -m app.fetcher --once

# 過去30日分を1時間ごとのまとめから取り込む（初回だけ。まとめがある期間の分だけ入る）
venv/bin/python -m app.fetcher --backfill-days 30

# 画面と API を起動して、ブラウザで http://<サーバーのIPアドレス>:8080 を開く（Ctrl + C で終了）
venv/bin/python -m app.server
```

サーバーの IP アドレスは `hostname -I` で分かる。

## 電源を入れたら自動で動かす

```bash
cd ~/farm-dash-board/house-hub
sudo cp systemd/house-hub-fetcher@.service systemd/house-hub-server@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now house-hub-fetcher@$USER house-hub-server@$USER

# 状態とログ
systemctl status house-hub-fetcher@$USER house-hub-server@$USER
journalctl -u house-hub-fetcher@$USER -f
```

プログラムを更新したとき: `cd ~/farm-dash-board && git pull` のあと
`sudo systemctl restart house-hub-fetcher@$USER house-hub-server@$USER`

## 画面と API（校内から）

| URL | 内容 |
|---|---|
| `/` | 各ハウスの最新値の一覧（60秒ごとに更新） |
| `/health` | 動いているか（`{"status": "ok", "last_fetch": ..., "rows": 件数}`） |
| `/api/latest` | ハウスごとの最新値。`stale_seconds`（何秒前の値か）と `status`（受信中／通信なし／データなし）付き |
| `/api/history?house=温室ハウス1&from=2026-11-01&to=2026-11-05` | 期間の計測値（最大 5,000 件。`from`/`to` を省くと直近24時間） |
| `/api/summary/daily?date=2026-11-05` | ハウスごとの日次まとめ（平均・最高・最低。`date` を省くと今日） |
| `/docs` | API の説明（自動で作られるページ） |

時刻はすべて日本時間。飽差はダッシュボードと同じ式で温度・湿度から計算して返す。

## バックアップ（おすすめ）

SQLite のファイルは、動かしたままでも次のコマンドで安全にコピーできる。ほかのラズパイ（256GB など）に1日1回コピーしておくと安心。

```bash
sqlite3 ~/house-hub/data/hub.db ".backup '/path/to/backup/hub-$(date +%F).db'"
```

## 確かめること（試運転）

1. `/health` が応答し、`--once` で行が増える
2. `/api/latest` の値がダッシュボードと一致する（同じ時刻の値で比べる）
3. 24時間動かして、欠けずに増え続ける。Firebase コンソールで読み取り件数が無料枠に収まっている
4. サーバーを再起動しても、自動で取り込みが再開する
5. ハブを止めても、ダッシュボードやセンサーは今まで通り動く

## テスト（開発用）

```bash
venv/bin/pip install -r requirements-dev.txt
venv/bin/python -m pytest
```

## よくあるエラー

| 表示 | 原因と対処 |
|---|---|
| `.env に FIREBASE_PASSWORD … を書いてください` | `.env` を作っていない、またはパスワードが空 |
| `ログインに失敗しました（400）` | `.env` のメールアドレスかパスワードが違う |
| `取得に失敗しました: 403` | 表示用ではないアカウント（センサー用など）を書いている |
| 他の PC からつながらない | `SERVER_HOST=0.0.0.0` か確認。校内ネットワークの設定でポート 8080 が通るか確認 |
