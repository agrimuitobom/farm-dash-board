# 常時表示用ディスプレイ（キオスク）

Raspberry Pi 5 + 7インチ DSI ディスプレイ（Waveshare 7-DSI-TOUCH-C）で、電源を入れると
ダッシュボードが全画面で表示されるようにする。

- 横置き 1024×600 で使う。7インチ画面専用の表示ページ `/display` を開く
  （メニューなし、外気と各ハウスの温度・湿度を大きく1画面に表示。タイルをタッチすると24時間の推移）
- 表示用アカウント `display@farm-dashboard.local` でログインしたままにする（読み取り専用）
- `?kiosk=1` 付きで開くので、60分ごとと、ネットワーク復帰時にページを自動で再読み込みする

`/boot/firmware/config.txt` の次の行は変更しないこと（`,dsi0` が無いとバックライトが点かない）。

```
dtoverlay=vc4-kms-dsi-waveshare-panel-v2,7_0_inch_c,dsi0
```

## 1. Firebase 側の準備（初回だけ）

1. Firebase コンソール →「Authentication」→「ユーザーを追加」で
   `display@farm-dashboard.local` とパスワードを登録する
2. リポジトリの `firestore.rules` を Firebase コンソール →「Firestore Database」→「ルール」に貼り付けて「公開」
   （表示用アカウントを読み取り専用にするルール）

## 2. Raspberry Pi の設定

ターミナルで順に実行する。

```bash
# 環境の確認（labwc と表示されること）
grep PRETTY_NAME /etc/os-release
echo $XDG_SESSION_TYPE
ps -e | grep -E "labwc|wayfire"

# デスクトップに自動ログインする
sudo raspi-config nonint do_boot_behaviour B4

# 画面を消さない（スクリーンブランキング無効）
sudo raspi-config nonint do_blanking 1

# キオスク起動スクリプトを置く
curl -fsSL -o ~/kiosk.sh https://raw.githubusercontent.com/agrimuitobom/farm-dash-board/main/kiosk/kiosk.sh
chmod +x ~/kiosk.sh

# labwc の自動起動に登録する（標準のデスクトップの起動内容は残す）
mkdir -p ~/.config/labwc
[ -f ~/.config/labwc/autostart ] || cp /etc/xdg/labwc/autostart ~/.config/labwc/autostart
grep -q kiosk.sh ~/.config/labwc/autostart || echo "$HOME/kiosk.sh &" >> ~/.config/labwc/autostart
```

## 3. 初回ログイン

1. HDMI モニターを外し、USB キーボードをつないで再起動する（`sudo reboot`）
2. 7インチ画面にログイン画面が出たら、`display@farm-dashboard.local` でログインする
3. 以降はログインしたままになり、電源を入れるだけでダッシュボードが表示される

## メンテナンス

- キオスクを一時的に閉じる：キーボードで `Alt + F4`（閉じない場合は SSH で `pkill chromium`）
- 自動起動をやめる：`~/.config/labwc/autostart` の `kiosk.sh` の行を削除して再起動
- 表示するページや再読み込み間隔を変える：`~/kiosk.sh` の `URL`（`?kiosk=30` で30分ごと）
- `kiosk.sh` を更新したとき：手順2の `curl` の行を実行し直して再起動する
