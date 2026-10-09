# Pico W 温湿度センサー（DHT22 → ダッシュボード）

Raspberry Pi Pico W から校内 Wi-Fi 経由で Firestore の `environmental_data` に直接送信する。
`LOCATION` に登録済みのハウスIDを設定すると、そのハウスの環境データとしてダッシュボードに表示される。

## 配線

| DHT22 | Pico W |
|---|---|
| VCC（+） | 3V3(OUT)（36番ピン） |
| DATA（out） | GP15（20番ピン） |
| GND（−） | GND（38番ピン） |

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

1. `secrets_example.py` をコピーして `secrets.py` を作り、Wi-Fi とセンサー用アカウントのパスワードを書く
2. Thonny で `secrets.py` と `main.py` を開き、それぞれ「名前を付けて保存」→「Raspberry Pi Pico」に同じ名前で保存する
3. Thonny の実行ボタン（または Pico の再起動）で動き始める。シェルに `送信: 25.3 °C  70.1 %` と出れば成功

`main.py` という名前で保存しているので、ハウスに設置した後は USB 電源をつなぐだけで自動的に送信を始める。

## よくあるエラー

| 表示 | 原因と対処 |
|---|---|
| `Wi-Fi 接続失敗` | SSID・パスワード、電波強度（-80 dBm 未満は不安定）を確認 |
| `ログイン失敗 400` | `secrets.py` のメールアドレスかパスワードが違う |
| `送信拒否(403)` | ハウスIDが未登録、または Firestore のルールが未反映 |
| `[Errno 110] ETIMEDOUT` など | 校内ネットワークで外部への通信が止められている可能性 |

10 回続けて失敗すると Pico が自動で再起動する。
