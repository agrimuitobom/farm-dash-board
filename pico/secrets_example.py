# このファイルを secrets.py という名前でコピーし、値を書き換えて Pico に保存する。
# secrets.py にはパスワードが入るので Git には入れない（.gitignore 済み）。

WIFI_SSID = "EHWLAN_EDU"
WIFI_PASSWORD = "Wi-Fi のパスワード"

# Firebase Authentication に作成したセンサー用アカウント
# メールアドレスは firestore.rules の isSensor() と一致させる
SENSOR_EMAIL = "sensor@farm-dashboard.local"
SENSOR_PASSWORD = "センサー用アカウントのパスワード"
