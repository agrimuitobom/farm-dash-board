# このファイルを secrets.py という名前でコピーし、値を書き換えて Pico に保存する。
# secrets.py にはパスワードが入るので Git には入れない（.gitignore 済み）。

WIFI_SSID = "EHWLAN_EDU"
WIFI_PASSWORD = "Wi-Fi のパスワード"

# Firebase Authentication に作成したセンサー用アカウント
# メールアドレスは firestore.rules の isSensor() と一致させる
SENSOR_EMAIL = "sensor@farm-dashboard.local"
SENSOR_PASSWORD = "センサー用アカウントのパスワード"

# 送信先のハウスID（ダッシュボードの「温室ハウス一覧」で登録したもの）
LOCATION = "温室ハウス3"

# 土壌水分センサー（つないでいない Pico では SOIL_PIN = None にする）
SOIL_PIN = 26  # AOUT をつないだピン（GP26 = 31番ピン）
SOIL_DRY = 50000  # 空気中での値（soil_check.py で測って書き換える）
SOIL_WET = 22000  # 水に挿したときの値（soil_check.py で測って書き換える）

# 丸型タッチディスプレイ（つないでいない Pico では False のまま）
DISPLAY = False
