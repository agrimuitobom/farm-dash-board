# 土壌水分センサーの値の確認・校正用（Thonny で開いて実行する。Pico には保存しなくてよい）
#
# 1. センサーを空気中に置いたときの値 → secrets.py の SOIL_DRY に書く
# 2. センサーをコップの水に挿したときの値（線の印より上は水につけない）→ SOIL_WET に書く
# 止めるときは Thonny の停止ボタン

import time

import machine

SOIL_PIN = 26  # AOUT をつないだピン（GP26 = ADC0）

adc = machine.ADC(machine.Pin(SOIL_PIN))

while True:
    total = 0
    for _ in range(20):
        total += adc.read_u16()
        time.sleep_ms(10)
    raw = total // 20
    print("値:", raw, "  電圧: {:.2f} V".format(raw * 3.3 / 65535))
    time.sleep(1)
