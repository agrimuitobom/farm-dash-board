# Pico W 温湿度・土壌水分センサー（DHT22 + 土壌水分センサー → ダッシュボード）

Raspberry Pi Pico W から校内 Wi-Fi 経由で Firestore の `environmental_data` に直接送信する。
`secrets.py` の `LOCATION` に登録済みのハウスIDを書くと、そのハウスの環境データとしてダッシュボードに表示される。
`main.py` はどの Pico でも同じで、Pico ごとの違い（ハウスID・土壌水分センサーの有無）は `secrets.py` に書く。

| Pico | `LOCATION` | センサー |
|---|---|---|
| 1台目 | `温室ハウス2` | DHT22 |
| 2台目 | `温室ハウス3` | DHT22 + 土壌水分センサー + 丸型タッチディスプレイ |

土壌水分センサーがあるハウスは、ハウスカードと7インチ画面に「土 ○○%」が表示される。

## 配線

### DHT22（温湿度）

| DHT22 | Pico W |
|---|---|
| VCC（+） | 3V3(OUT)（36番ピン） |
| DATA（out） | GP15（20番ピン） |
| GND（−） | GND（38番ピン） |

### 土壌水分センサー（静電容量式、アナログ出力）

| 土壌水分センサー | Pico W |
|---|---|
| VCC | 3V3(OUT)（36番ピン。DHT22 と共用） |
| GND | GND（33番ピンなど。どの GND でもよい） |
| AOUT | GP26 / ADC0（31番ピン） |

- 3V3 と GND は DHT22 と同じピンに2本ずつつなぐか、ブレッドボードで分ける
- 電源は 3.3 V（3V3）につなぐ。5 V（VBUS・VSYS）につなぐと Pico の ADC に 3.3 V を超える電圧がかかる場合がある
- Pico は土のそばに置き、センサーの線は延ばさない。Pico には USB 電源（5 V）をつなぐ
- センサーは線の印（白い線）より上を土に入れない。上の電子部品の部分は防湿剤（ハヤコートなど）で保護するとよい。DHT22 の白い格子の部分には塗らない

### 丸型タッチディスプレイ（温室ハウス3。つなぐ Pico だけ）

Waveshare 1.28インチ円形タッチディスプレイ（GC9A01 + CST816S）。ケーブルの色は製品によって違うので、
基板の印字（ラベル）で合わせる。MISO は使わない。

| ディスプレイ | Pico W |
|---|---|
| VCC | 3V3(OUT)（36番ピン。DHT22・土壌水分センサーと共用） |
| GND | GND（18番ピン） |
| MOSI | GP11（15番ピン） |
| SCLK | GP10（14番ピン） |
| LCD_CS | GP9（12番ピン） |
| LCD_DC | GP8（11番ピン） |
| LCD_RST | GP12（16番ピン） |
| LCD_BL | GP13（17番ピン） |
| TP_SDA | GP6（9番ピン） |
| TP_SCL | GP7（10番ピン） |
| TP_INT | GP14（19番ピン） |
| TP_RST | GP16（21番ピン） |

## 初回だけの準備（Firebase 側）

1. **センサー用アカウントを作る**：Firebase コンソール →「Authentication」→「ユーザーを追加」で
   `sensor@farm-dashboard.local` と十分に長いパスワードを登録する
2. **Firestore のルールを反映する**：リポジトリの `firestore.rules` の内容を
   Firebase コンソール →「Firestore Database」→「ルール」に貼り付けて「公開」
   （GitHub Actions のデプロイは Hosting のみで、ルールは自動では反映されない）
3. **ハウスを登録する**：ダッシュボードの「温室ハウス一覧」→「ハウスを登録」で、
   `main.py` の `LOCATION` と同じハウスID（例：`温室ハウス2`）を登録する

センサー用アカウントは環境データの追加しかできず、送信先も登録済みのハウスに限られる。
Pico が盗まれてパスワードが漏れても、ほかのデータは読み書きできない。

## Pico への書き込み（Thonny）

1. `secrets_example.py` をコピーして `secrets.py` を作り、Wi-Fi とセンサー用アカウントのパスワード、
   `LOCATION`（送信先のハウスID）を書く。土壌水分センサーが無い Pico では `SOIL_PIN = None` にする
2. Thonny で `secrets.py` と `main.py` を開き、それぞれ「名前を付けて保存」→「Raspberry Pi Pico」に同じ名前で保存する
3. Thonny の実行ボタン（または Pico の再起動）で動き始める。シェルに `送信: 25.3 °C  70.1 %` と出れば成功

土壌水分センサーがある場合は `送信: 25.3 °C  70.1 %  土壌水分 46.3 %` と出る。

`main.py` という名前で保存しているので、ハウスに設置した後は USB 電源をつなぐだけで自動的に送信を始める。

## 丸型タッチディスプレイを使う（温室ハウス3）

温度 → 湿度 → 土壌水分 → 天気予報（西条市・3日分）の画面を、左右のスワイプ（またはタップ）で切り替える。
画面の値は10秒ごとに測り直し、ダッシュボードへの送信はこれまでどおり60秒ごと。天気予報は1時間ごとに取り直す。

1. **ファイルを Pico に入れる**：このリポジトリをラズパイに置き（`git clone https://github.com/agrimuitobom/farm-dash-board.git`）、
   Thonny の「表示」→「ファイル」で上の欄（パソコン側）の `farm-dash-board/pico` を開く。
   次のファイルとフォルダを右クリック →「/ にアップロード」で Pico に入れる
   - `main.py`、`display.py`、`gc9a01.py`、`cst816s.py`
   - `fonts` フォルダ（中に `small.bin`・`medium.bin`・`large.bin`）
2. **動作確認**：Thonny で `display_test.py` を開いて実行する
   - 上から赤・緑・青の帯が出れば OK（赤と青が逆なら `secrets.py` に `DISPLAY_BGR = False`、
     色が反転していたら `DISPLAY_INVERT = False`）
   - スワイプすると画面とシェルに操作の種類が出る（左にスワイプして RIGHT と出るなら `DISPLAY_REVERSE_SWIPE = True`）
3. **`secrets.py` に `DISPLAY = True` を書いて** Pico に保存し直し、Ctrl + D で再起動する

`secrets.py` で変えられる設定（書かなければ右の値）

| 設定 | 既定 | 内容 |
|---|---|---|
| `DISPLAY` | `False` | ディスプレイを使うか |
| `DISPLAY_BRIGHTNESS` | `80` | 明るさ（0〜100） |
| `TEMP_RANGE` | `(18, 30)` | 温度の正常範囲。外れると「高温」「低温」 |
| `HUM_RANGE` | `(50, 80)` | 湿度の正常範囲。外れると「多湿」「乾燥」 |
| `DISPLAY_REVERSE_SWIPE` | `False` | スワイプの向きを逆にする |
| `DISPLAY_BGR` / `DISPLAY_INVERT` | `True` | 色の並び・反転（手順2で合わなければ変える） |

画面の下の「送信OK」はダッシュボードへの送信に成功したこと、「通信なし」は失敗したことを表す。
ディスプレイが動かなくても、データの送信は続く（シェルに `ディスプレイを使わずに続けます` と出る）。

画面の日本語は `fonts/*.bin` に入っている文字だけ出せる（無い文字は「?」になる）。文字を足すときは
`tools/make_fonts.py` の `JA_CHARS` に足し、パソコンで
`python3 pico/tools/make_fonts.py <NotoSansJP-Medium.ttf> <NotoSansJP-Bold.ttf>` を実行して `fonts` を作り直す。
フォントは Noto Sans JP（SIL Open Font License 1.1、[Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+JP)）。

## 土壌水分センサーの校正（最初に1回）

センサーは個体ごとに値が違うので、「乾いた状態 = 0 %」「水中 = 100 %」になるよう値を測って `secrets.py` に書く。

1. Thonny で `soil_check.py` を開いて実行する（Pico に保存しなくてよい）。1秒ごとに `値: 48213` のように出る
2. センサーを空気中に置いたときの値を `SOIL_DRY` に書く
3. センサーをコップの水に挿したとき（線の印より上はぬらさない）の値を `SOIL_WET` に書く
4. Thonny の停止ボタンで止め、`secrets.py` を Pico に保存し直して再起動する

校正後、乾いた土・水やり直後の土に挿して、ダッシュボードの値が見た目と合うか確かめる。
水やりの目安（何 % を切ったら水やりか）は、しばらく値の動きを見てから決める。

## よくあるエラー

| 表示 | 原因と対処 |
|---|---|
| `Wi-Fi 接続失敗` | SSID・パスワード、電波強度（-80 dBm 未満は不安定）を確認 |
| `ログイン失敗 400` | `secrets.py` のメールアドレスかパスワードが違う |
| `送信拒否(403)` | ハウスIDが未登録、または Firestore のルールが未反映 |
| `[Errno 110] ETIMEDOUT` など | 校内ネットワークで外部への通信が止められている可能性 |
| 土壌水分を付けると `送信拒否(403)` | Firestore のルールが古い（土壌水分の項目を許可する前のもの）。`firestore.rules` を貼り直して「公開」 |
| 土壌水分がいつも 0 % か 100 % | AOUT の配線（GP26）か、`SOIL_DRY`・`SOIL_WET` の値を確認 |
| `ディスプレイを使わずに続けます: ... fonts/small.bin` | `fonts` フォルダを Pico に入れていない |
| 画面が真っ暗 | LCD_BL（GP13）・VCC・GND の配線、`DISPLAY = True` を確認 |
| `タッチパネルが見つかりません` | TP_SDA・TP_SCL・TP_RST の配線を確認（表示はそのまま使える） |

10 回続けて失敗すると Pico が自動で再起動する。
