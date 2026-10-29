# 丸型タッチディスプレイ（Raspberry Pi 用）

Waveshare 1.28インチ円形タッチディスプレイ（240×240、GC9A01 + CST816S）に、
各ハウスの環境データと天気予報を表示する。Raspberry Pi 5 で動く（Pi 4 なども可）。

- 画面: **温室ハウス1 → 温室ハウス2 → … → 天気予報（西条市・3日分）**
- **左にスワイプ（またはタップ）で次へ、右にスワイプで前へ**
- ハウスの画面: 温度（大きく）・湿度・土壌水分（センサーのあるハウスだけ）、
  ハウスごとの閾値で「正常」「高温」「多湿」など、最終更新（「3分前」、15分以上届かなければ「通信なし」）
- データはダッシュボードと同じ Firestore から **表示用アカウント（読み取り専用）** で1分ごとに読む。
  天気予報は1時間ごと

Pico W に直接つなぐ版は `pico/README.md` の「丸型タッチディスプレイを使う」を参照。

## 配線

ケーブルの色は製品によって違うので、基板の印字（ラベル）で合わせる。MISO は使わない。

| ディスプレイ | Raspberry Pi（物理ピン番号） |
|---|---|
| VCC | 3.3V（1番） |
| GND | GND（6番） |
| MOSI | GPIO10 / SPI0 MOSI（19番） |
| SCLK | GPIO11 / SPI0 SCLK（23番） |
| LCD_CS | GPIO8 / SPI0 CE0（24番） |
| LCD_DC | GPIO25（22番） |
| LCD_RST | GPIO27（13番） |
| LCD_BL | GPIO18（12番） |
| TP_SDA | GPIO2 / I2C SDA（3番） |
| TP_SCL | GPIO3 / I2C SCL（5番） |
| TP_INT | GPIO22（15番） |
| TP_RST | GPIO17（11番） |

- Waveshare の説明書は TP_INT を GPIO4（7番）にしているが、ここでは DHT22 と同じピンにならないよう GPIO22 にした。
  説明書どおり GPIO4 につないだ場合は `config.json` の `"tp_int": 4` にする
- 別のピンにつないだときも `config.json` の `pins` を変える（GPIO 番号で書く）

## セットアップ（初回だけ）

```bash
# SPI と I2C を有効にする
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_i2c 0

# 必要なもの（日本語フォントを含む）
sudo apt update
sudo apt install -y git python3-spidev python3-gpiozero python3-lgpio python3-smbus2 \
  python3-pil python3-numpy python3-requests fonts-noto-cjk

# プログラムを置く（すでに clone してあれば cd ~/farm-dash-board && git pull）
cd ~
git clone https://github.com/agrimuitobom/farm-dash-board.git

# 設定ファイルを作り、表示用アカウントのパスワードを書く
cd ~/farm-dash-board/raspberry-pi/round-display
cp config.example.json config.json
nano config.json

sudo reboot
```

`config.json` の `password` には、7インチ画面と同じ表示用アカウント（`display@farm-dashboard.local`）のパスワードを書く。
このファイルは Git に入らない（`.gitignore` 済み）。

## 動作確認

```bash
cd ~/farm-dash-board/raspberry-pi/round-display
python3 round_display.py --test
```

- 上から赤・緑・青の帯が出れば OK。赤と青が逆なら `config.json` の `"bgr": false`、
  色が反転して見えたら `"invert": false`
- スワイプ・タップすると画面とターミナルに操作の種類が出る。
  左にスワイプして「右スワイプ」と出るなら `"reverse_swipe": true`
- Ctrl + C で終了

続けて `python3 round_display.py` で実際の表示を確かめる（Ctrl + C で終了）。

## 電源を入れたら自動で表示する

```bash
cd ~/farm-dash-board/raspberry-pi/round-display
sudo cp round-display@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now round-display@$USER

# 動いているかとログの確認
systemctl status round-display@$USER
journalctl -u round-display@$USER -f
```

止めるときは `sudo systemctl stop round-display@$USER`、自動起動をやめるときは `disable`。

プログラムを更新したとき: `cd ~/farm-dash-board && git pull` のあと `sudo systemctl restart round-display@$USER`

## 設定（config.json）

| 項目 | 既定 | 内容 |
|---|---|---|
| `email` / `password` | 表示用アカウント | Firestore を読むアカウント |
| `houses` | `[]`（全部） | 表示するハウスIDの一覧。例: `["温室ハウス1", "温室ハウス3"]`（この順に並ぶ） |
| `brightness` | `80` | 明るさ（0〜100） |
| `reverse_swipe` | `false` | スワイプの向きを逆にする |
| `bgr` / `invert` | `true` | 色の並び・反転（動作確認で合わなければ変える） |
| `refresh_seconds` | `60` | データを読み直す間隔（秒）。短くすると Firestore の読み取り回数が増える |
| `pins` | 上の配線表 | つないだ GPIO 番号 |

## 画面をパソコンで確かめる・テスト

```bash
python3 preview.py            # 見本のデータで preview.png を作る（ハードウェア不要）
python3 -m pytest test_round_display.py
```

## よくあるエラー

| 表示 | 原因と対処 |
|---|---|
| `No such file or directory: '/dev/spidev0.0'` | SPI が無効。`sudo raspi-config nonint do_spi 0` のあと再起動 |
| `タッチパネルが見つかりません` | I2C が無効か、TP_SDA・TP_SCL・TP_RST の配線。`sudo i2cdetect -y 1` で `15` が出るか確認 |
| `日本語フォントが見つかりません` | `sudo apt install fonts-noto-cjk` |
| `ログインに失敗しました（400）` | `config.json` のメールアドレスかパスワードが違う |
| 画面に「通信なし」 | ネットワーク、または Firestore への接続。ログ（`journalctl`）を確認 |
| 画面が真っ暗 | VCC・GND・LCD_BL の配線 |
