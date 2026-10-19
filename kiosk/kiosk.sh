#!/bin/bash
# 常時表示用ディスプレイで、ダッシュボードを Chromium の全画面（キオスク）で表示する
# labwc の autostart から起動する（設置手順は kiosk/README.md）

# 7インチ画面専用の表示ページ（/display）。?kiosk=1 で定期的に再読み込みする
URL="https://farm-dashboard-95875.web.app/display?kiosk=1"

# 普段使いの Chromium（Google アカウントや Firebase コンソールのログイン）と
# 混ざらないよう、キオスク専用のプロフィールを使う
PROFILE="$HOME/.config/chromium-kiosk"

CHROMIUM="$(command -v chromium || command -v chromium-browser)"

# 電源断などで異常終了しても「正しく終了しませんでした」バーを出さない
PREFS="$PROFILE/Default/Preferences"
if [ -f "$PREFS" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$PREFS"
fi

# 起動直後は Wi-Fi がまだつながっていないことがあるので、最大2分待つ
for _ in $(seq 1 60); do
  curl -s --head --max-time 3 "$URL" > /dev/null && break
  sleep 2
done

# --ozone-platform=wayland / --touch-events=enabled:
#   タッチをマウスのクリックではなく指の操作として受け取る（指でのスクロールに必要）
# --disable-pinch / --overscroll-history-navigation=0:
#   2本指での拡大や、横スワイプでの「戻る」を誤操作で起こさない
exec "$CHROMIUM" \
  --user-data-dir="$PROFILE" \
  --kiosk \
  --ozone-platform=wayland \
  --touch-events=enabled \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run \
  --password-store=basic \
  --check-for-update-interval=31536000 \
  "$URL"
