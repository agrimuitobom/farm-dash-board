// このファイルを secrets.h という名前でコピーし、値を書き換える。
// secrets.h にはパスワードが入るので Git には入れない（.gitignore 済み）。
#pragma once

#define WIFI_SSID "EHWLAN_EDU"
#define WIFI_PASSWORD "Wi-Fi のパスワード"

// Firebase Authentication に作成したセンサー用アカウント（Pico W と同じもの）
#define SENSOR_EMAIL "sensor@farm-dashboard.local"
#define SENSOR_PASSWORD "センサー用アカウントのパスワード"

// 送信先のハウスID（ダッシュボードの「温室ハウス一覧」で登録したもの）
// 同じハウスに別のセンサー（Pico W など）があるときは README の「同じハウスに2台置くとき」を読む
#define LOCATION "温室ハウス1"
