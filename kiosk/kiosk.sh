#!/bin/bash
# 常時表示用ディスプレイで、ダッシュボードを Chromium の全画面（キオスク）で表示する
# labwc の autostart から起動する（設置手順は kiosk/README.md）

URL="https://farm-dashboard-95875.web.app/?kiosk=1"

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

exec "$CHROMIUM" \
  --user-data-dir="$PROFILE" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run \
  --password-store=basic \
  --check-for-update-interval=31536000 \
  "$URL"
