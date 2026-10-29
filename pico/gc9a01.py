# GC9A01（240×240 の丸型液晶）を SPI で動かす最小限のドライバ
#
# 色は RGB565。液晶へは上位バイトから送るので、framebuf（下位バイトから並ぶ）で
# 作った画像を送るときは swap565() で入れ替えた色を使う。

import time

import machine

WIDTH = 240
HEIGHT = 240

# 初期化コマンド（コマンド, データ）。GC9A01 の一般的な初期化手順
_INIT = (
    (0xEF, b""), (0xEB, b"\x14"), (0xFE, b""), (0xEF, b""), (0xEB, b"\x14"),
    (0x84, b"\x40"), (0x85, b"\xFF"), (0x86, b"\xFF"), (0x87, b"\xFF"), (0x88, b"\x0A"),
    (0x89, b"\x21"), (0x8A, b"\x00"), (0x8B, b"\x80"), (0x8C, b"\x01"), (0x8D, b"\x01"),
    (0x8E, b"\xFF"), (0x8F, b"\xFF"), (0xB6, b"\x00\x20"),
    (0x3A, b"\x05"),  # 1画素 16ビット（RGB565）
    (0x90, b"\x08\x08\x08\x08"), (0xBD, b"\x06"), (0xBC, b"\x00"), (0xFF, b"\x60\x01\x04"),
    (0xC3, b"\x13"), (0xC4, b"\x13"), (0xC9, b"\x22"), (0xBE, b"\x11"), (0xE1, b"\x10\x0E"),
    (0xDF, b"\x21\x0C\x02"),
    (0xF0, b"\x45\x09\x08\x08\x26\x2A"), (0xF1, b"\x43\x70\x72\x36\x37\x6F"),
    (0xF2, b"\x45\x09\x08\x08\x26\x2A"), (0xF3, b"\x43\x70\x72\x36\x37\x6F"),
    (0xED, b"\x1B\x0B"), (0xAE, b"\x77"), (0xCD, b"\x63"),
    (0x70, b"\x07\x07\x04\x0E\x0F\x09\x07\x08\x03"), (0xE8, b"\x34"),
    (0x62, b"\x18\x0D\x71\xED\x70\x70\x18\x0F\x71\xEF\x70\x70"),
    (0x63, b"\x18\x11\x71\xF1\x70\x70\x18\x13\x71\xF3\x70\x70"),
    (0x64, b"\x28\x29\xF1\x01\xF1\x00\x07"),
    (0x66, b"\x3C\x00\xCD\x67\x45\x45\x10\x00\x00\x00"),
    (0x67, b"\x00\x3C\x00\x00\x00\x01\x54\x10\x32\x98"),
    (0x74, b"\x10\x85\x80\x00\x00\x4E\x00"), (0x98, b"\x3E\x07"),
    (0x35, b""),  # TE ON
)


def rgb565(r, g, b):
    """液晶に送る順（上位バイトが先）の RGB565"""
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)


def swap565(color):
    """framebuf の RGB565 に入れる色（バイトを入れ替える）"""
    return ((color & 0xFF) << 8) | (color >> 8)


class GC9A01:
    def __init__(self, spi, cs, dc, rst, bl, bgr=True, invert=True):
        self.spi = spi
        self.cs = machine.Pin(cs, machine.Pin.OUT, value=1)
        self.dc = machine.Pin(dc, machine.Pin.OUT, value=0)
        self.rst = machine.Pin(rst, machine.Pin.OUT, value=1)
        self.bl = machine.PWM(machine.Pin(bl))
        self.bl.freq(1000)
        self.backlight(0)
        self._init(bgr, invert)

    def _write(self, command, data=b""):
        self.cs(0)
        self.dc(0)
        self.spi.write(bytes((command,)))
        if data:
            self.dc(1)
            self.spi.write(data)
        self.cs(1)

    def _init(self, bgr, invert):
        self.rst(1)
        time.sleep_ms(5)
        self.rst(0)
        time.sleep_ms(20)
        self.rst(1)
        time.sleep_ms(120)
        for command, data in _INIT:
            self._write(command, data)
        # 0x36: 表示の向きと色の並び（色の赤と青が逆なら bgr を変える）
        self._write(0x36, bytes((0x08 if bgr else 0x00,)))
        self._write(0x21 if invert else 0x20)  # 色の反転（白黒が逆なら invert を変える）
        self._write(0x11)  # スリープ解除
        time.sleep_ms(120)
        self._write(0x29)  # 表示オン
        time.sleep_ms(20)

    def backlight(self, percent):
        """バックライトの明るさ（0〜100）"""
        self.bl.duty_u16(int(max(0, min(100, percent)) * 655.35))

    def _window(self, x, y, w, h):
        x1 = x + w - 1
        y1 = y + h - 1
        self._write(0x2A, bytes((x >> 8, x & 0xFF, x1 >> 8, x1 & 0xFF)))
        self._write(0x2B, bytes((y >> 8, y & 0xFF, y1 >> 8, y1 & 0xFF)))

    def blit_buffer(self, buf, x, y, w, h):
        """RGB565（上位バイトが先）の画像 buf を (x, y) に描く"""
        self._window(x, y, w, h)
        self.cs(0)
        self.dc(0)
        self.spi.write(b"\x2C")
        self.dc(1)
        self.spi.write(buf)
        self.cs(1)

    def fill_rect(self, x, y, w, h, color):
        """四角を color（rgb565 の値）で塗る"""
        self._window(x, y, w, h)
        rows = max(1, min(h, 2048 // (w * 2) or 1))
        line = bytes((color >> 8, color & 0xFF)) * (w * rows)
        self.cs(0)
        self.dc(0)
        self.spi.write(b"\x2C")
        self.dc(1)
        left = h
        while left > 0:
            n = min(rows, left)
            self.spi.write(line if n == rows else line[:w * 2 * n])
            left -= n
        self.cs(1)

    def fill(self, color):
        self.fill_rect(0, 0, WIDTH, HEIGHT, color)
