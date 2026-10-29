# CST816S（丸型ディスプレイのタッチパネル）を I2C で読むドライバ
#
# CST816S はスワイプやタップを自分で判定し、0x01 番地にその種類を入れてくれる。
# 触ると INT ピンが Low になるので、そのときだけ読む。

import time

import machine

ADDRESS = 0x15

# 0x01 番地（GestureID）の値
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

# 1回の操作で INT が何度も来るので、続けて同じ操作を受け付けない時間
_REPEAT_GUARD_MS = 400


class CST816S:
    def __init__(self, i2c, rst, irq):
        self.i2c = i2c
        self.rst = machine.Pin(rst, machine.Pin.OUT, value=1)
        self._touched = False
        self._last_ms = time.ticks_ms()
        self.reset()
        self.chip_id = self._read(0xA7, 1)[0]  # CST816S なら 0xB5
        # 操作を判定する設定（Waveshare のサンプルと同じ）。0xEC: ダブルタップも判定する
        self._write(0xEC, 0x01)
        # 0xFA: 操作のたびに INT を出す
        self._write(0xFA, 0x11)
        # 0xFE: 自動スリープしない（スリープすると I2C で読めなくなる）
        self._write(0xFE, 0x01)
        self.irq_pin = machine.Pin(irq, machine.Pin.IN, machine.Pin.PULL_UP)
        self.irq_pin.irq(trigger=machine.Pin.IRQ_FALLING, handler=self._on_irq)

    def reset(self):
        self.rst(0)
        time.sleep_ms(5)
        self.rst(1)
        time.sleep_ms(50)

    def _read(self, register, n):
        return self.i2c.readfrom_mem(ADDRESS, register, n)

    def _write(self, register, value):
        self.i2c.writeto_mem(ADDRESS, register, bytes((value,)))

    def _on_irq(self, _pin):
        self._touched = True

    def gesture(self):
        """新しい操作があればその種類（SWIPE_LEFT など）、なければ NONE"""
        if not self._touched:
            return NONE
        self._touched = False
        try:
            code = self._read(0x01, 1)[0]
        except OSError:
            return NONE
        if code == NONE or code not in NAMES:
            return NONE
        now = time.ticks_ms()
        if time.ticks_diff(now, self._last_ms) < _REPEAT_GUARD_MS:
            return NONE
        self._last_ms = now
        return code
