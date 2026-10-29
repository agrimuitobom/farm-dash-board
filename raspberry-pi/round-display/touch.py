"""CST816S（丸型ディスプレイのタッチパネル）を Raspberry Pi の I2C で読む

CST816S はスワイプやタップを自分で判定し、0x01 番地にその種類を入れてくれる。
触ると INT ピンが Low になるので、そのときだけ読む（pico/cst816s.py と同じ考え方）。
"""

import threading
import time

ADDRESS = 0x15

NONE = 0x00
SWIPE_UP = 0x01
SWIPE_DOWN = 0x02
SWIPE_LEFT = 0x03
SWIPE_RIGHT = 0x04
TAP = 0x05
DOUBLE_TAP = 0x0B
LONG_PRESS = 0x0C

NAMES = {
    SWIPE_UP: "上スワイプ", SWIPE_DOWN: "下スワイプ", SWIPE_LEFT: "左スワイプ",
    SWIPE_RIGHT: "右スワイプ", TAP: "タップ", DOUBLE_TAP: "ダブルタップ", LONG_PRESS: "長押し",
}

# 1回の操作で INT が何度も来るので、続けて同じ操作を受け付けない時間（秒）
_REPEAT_GUARD = 0.4


class CST816S:
    def __init__(self, irq, rst, bus=1):
        # ハードウェア用のライブラリはここで読み込む（操作の種類の定数だけならパソコンでも使えるように）
        from gpiozero import Button, DigitalOutputDevice
        try:
            from smbus2 import SMBus
        except ImportError:
            from smbus import SMBus

        self.i2c = SMBus(bus)
        self.rst = DigitalOutputDevice(rst, initial_value=True)
        self._touched = threading.Event()
        self._last = 0.0
        self.reset()
        self.chip_id = self.i2c.read_byte_data(ADDRESS, 0xA7)  # CST816S なら 0xB5
        self.i2c.write_byte_data(ADDRESS, 0xEC, 0x01)  # ダブルタップも判定する
        self.i2c.write_byte_data(ADDRESS, 0xFA, 0x11)  # 操作のたびに INT を出す
        self.i2c.write_byte_data(ADDRESS, 0xFE, 0x01)  # 自動スリープしない
        self.irq = Button(irq, pull_up=True)
        self.irq.when_pressed = self._touched.set

    def reset(self):
        self.rst.off()
        time.sleep(0.005)
        self.rst.on()
        time.sleep(0.05)

    def wait(self, timeout):
        """触られるか timeout 秒たつまで待つ"""
        return self._touched.wait(timeout)

    def gesture(self):
        """新しい操作があればその種類（SWIPE_LEFT など）、なければ NONE"""
        if not self._touched.is_set():
            return NONE
        self._touched.clear()
        try:
            code = self.i2c.read_byte_data(ADDRESS, 0x01)
        except OSError:
            return NONE
        if code not in NAMES:
            return NONE
        now = time.monotonic()
        if now - self._last < _REPEAT_GUARD:
            return NONE
        self._last = now
        return code
