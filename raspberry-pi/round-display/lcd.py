"""GC9A01（240×240 の丸型液晶）を Raspberry Pi の SPI で動かす

Raspberry Pi 5 でも動くよう、GPIO は gpiozero（lgpio）、SPI は spidev を使う。
初期化の手順は pico/gc9a01.py と同じ。
"""

import time

import spidev
from gpiozero import DigitalOutputDevice, PWMOutputDevice

try:
    import numpy
except ImportError:  # numpy が無くても動く（少し遅い）
    numpy = None

WIDTH = 240
HEIGHT = 240

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


def to_rgb565(image):
    """Pillow の RGB 画像 → 液晶に送るバイト列（RGB565、上位バイトが先）"""
    if numpy is not None:
        a = numpy.asarray(image.convert("RGB"), dtype=numpy.uint16)
        c = ((a[:, :, 0] & 0xF8) << 8) | ((a[:, :, 1] & 0xFC) << 3) | (a[:, :, 2] >> 3)
        return c.astype(">u2").tobytes()
    out = bytearray()
    for r, g, b in image.convert("RGB").getdata():
        c = ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)
        out += bytes((c >> 8, c & 0xFF))
    return bytes(out)


class GC9A01:
    def __init__(self, dc, rst, bl, bus=0, device=0, speed_hz=40_000_000, bgr=True, invert=True):
        self.spi = spidev.SpiDev()
        self.spi.open(bus, device)  # CS は SPI の CE0（GPIO8）
        self.spi.max_speed_hz = speed_hz
        self.spi.mode = 0
        self.dc = DigitalOutputDevice(dc)
        self.rst = DigitalOutputDevice(rst, initial_value=True)
        self.bl = PWMOutputDevice(bl, frequency=1000)
        self._init(bgr, invert)

    def _write(self, command, data=b""):
        self.dc.off()
        self.spi.writebytes([command])
        if data:
            self.dc.on()
            self.spi.writebytes2(data)

    def _init(self, bgr, invert):
        self.rst.on()
        time.sleep(0.005)
        self.rst.off()
        time.sleep(0.02)
        self.rst.on()
        time.sleep(0.12)
        for command, data in _INIT:
            self._write(command, data)
        # 0x36: 表示の向きと色の並び（赤と青が逆なら bgr を変える）
        self._write(0x36, bytes((0x08 if bgr else 0x00,)))
        self._write(0x21 if invert else 0x20)  # 色の反転（反転して見えたら invert を変える）
        self._write(0x11)  # スリープ解除
        time.sleep(0.12)
        self._write(0x29)  # 表示オン
        time.sleep(0.02)

    def backlight(self, percent):
        """バックライトの明るさ（0〜100）"""
        self.bl.value = max(0, min(100, percent)) / 100

    def show(self, image):
        """240×240 の Pillow 画像を表示する"""
        self._write(0x2A, bytes((0, 0, 0, WIDTH - 1)))
        self._write(0x2B, bytes((0, 0, 0, HEIGHT - 1)))
        self._write(0x2C, to_rgb565(image))

    def close(self):
        self.backlight(0)
        self.spi.close()
