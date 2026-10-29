# 丸型タッチディスプレイの動作確認（Thonny で開いて実行する。Pico には保存しなくてよい）
#
# 1. 画面の上から「RED」「GREEN」「BLUE」がそれぞれ赤・緑・青の帯で出るか確認する
#    - 赤と青が逆 → secrets.py に DISPLAY_BGR = False
#    - 黒地が白っぽく、色が反転している → secrets.py に DISPLAY_INVERT = False
# 2. 画面をスワイプ・タップすると、画面とシェルに操作の種類が出る
#    - 左にスワイプしたのに RIGHT と出る（向きが逆）→ secrets.py に DISPLAY_REVERSE_SWIPE = True
# 止めるときは Thonny の停止ボタン

import time

import cst816s
import display
from gc9a01 import rgb565

try:
    import secrets
except ImportError:
    secrets = None

ui = display.Display(
    "TEST", False,
    bgr=getattr(secrets, "DISPLAY_BGR", True),
    invert=getattr(secrets, "DISPLAY_INVERT", True),
)
lcd = ui.lcd
lcd.fill_rect(0, 40, 240, 50, rgb565(255, 0, 0))
lcd.fill_rect(0, 95, 240, 50, rgb565(0, 255, 0))
lcd.fill_rect(0, 150, 240, 50, rgb565(0, 0, 255))
ui._line([(ui.medium, "RED", display.WHITE)], 65, 120, bg=(255, 0, 0))
ui._line([(ui.medium, "GREEN", display.BLACK)], 120, 120, bg=(0, 255, 0))
ui._line([(ui.medium, "BLUE", display.WHITE)], 175, 120, bg=(0, 0, 255))
print("画面: 上から赤・緑・青の帯が出ていれば OK")

if ui.touch is None:
    print("タッチパネルが見つかりません。TP_SDA(GP6)・TP_SCL(GP7)・TP_INT(GP14)・TP_RST(GP16) の配線を確認")
else:
    print("タッチ: チップID 0x{:02X}（CST816S なら 0xB5）".format(ui.touch.chip_id))
    print("画面をスワイプ・タップしてください")
    labels = {
        cst816s.SWIPE_LEFT: "LEFT", cst816s.SWIPE_RIGHT: "RIGHT", cst816s.SWIPE_UP: "UP",
        cst816s.SWIPE_DOWN: "DOWN", cst816s.TAP: "TAP", cst816s.DOUBLE_TAP: "DOUBLE TAP",
        cst816s.LONG_PRESS: "LONG PRESS",
    }
    while True:
        g = ui.touch.gesture()
        if g:
            print("操作:", cst816s.NAMES.get(g, g))
            ui._line([(ui.medium, labels.get(g, "?"), display.WHITE)], 215, 140)
        time.sleep_ms(30)
