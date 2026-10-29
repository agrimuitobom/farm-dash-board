# 丸型タッチディスプレイ（Waveshare 1.28インチ、GC9A01 + CST816S）に計測値と天気予報を出す
#
# main.py から使う（secrets.py に DISPLAY = True と書いたときだけ）。
# 画面: 温度 → 湿度 → 土壌水分（センサーがあるとき）→ 天気予報。左右にスワイプで切り替える。
#
# Pico W のメモリは少ないので、画面全体の画像は持たず、文字の行ごとに作って送る。
# 文字は fonts/*.bin（pico/tools/make_fonts.py で作る）から1文字ずつ読む。

import framebuf
import machine

import cst816s
from gc9a01 import GC9A01, WIDTH, rgb565, swap565

# ===== 配線（Pico W のピン番号 GPxx）=====
PIN_SCK = 10    # SCL（液晶の SPI クロック）
PIN_MOSI = 11   # SDA（液晶の SPI データ）
PIN_CS = 9      # CS
PIN_DC = 8      # DC
PIN_RST = 12    # RST
PIN_BL = 13     # BL（バックライト）
PIN_TP_SDA = 6  # TP_SDA（タッチの I2C）
PIN_TP_SCL = 7  # TP_SCL
PIN_TP_INT = 14  # TP_INT
PIN_TP_RST = 16  # TP_RST

# 西条市（ダッシュボードと同じ地点）の3日分の予報
FORECAST_URL = (
    "https://api.open-meteo.com/v1/forecast?latitude=33.9197&longitude=133.1823"
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
    "&forecast_days=3&timezone=Asia%2FTokyo"
)

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (140, 140, 140)
RED = (255, 80, 70)
BLUE = (80, 160, 255)
GREEN = (60, 210, 110)
YELLOW = (255, 200, 0)
ORANGE = (255, 150, 40)

PAGE_TEMP = "temp"
PAGE_HUM = "hum"
PAGE_SOIL = "soil"
PAGE_WEATHER = "weather"

DAY_LABELS = ("今日", "明日", "あさって")


class Font:
    """fonts/*.bin を開き、表示するときに1文字ずつ読む"""

    def __init__(self, path):
        self.file = open(path, "rb")
        head = self.file.read(7)
        if head[:3] != b"GF2":
            raise ValueError("フォントファイルではありません: " + path)
        self.height = head[4]
        count = head[5] | (head[6] << 8)
        table = self.file.read(count * 7)
        self.index = {}
        for i in range(count):
            o = i * 7
            code = table[o] | (table[o + 1] << 8)
            offset = table[o + 3] | (table[o + 4] << 8) | (table[o + 5] << 16) | (table[o + 6] << 24)
            self.index[code] = (table[o + 2], offset)
        self.data_start = 7 + count * 7

    def _entry(self, ch):
        return self.index.get(ord(ch)) or self.index.get(ord("?")) or (0, 0)

    def width(self, text):
        return sum(self._entry(ch)[0] for ch in text)

    def glyph(self, ch):
        """(幅, GS2_HMSB の画像)。フォントに無い文字は ? になる"""
        width, offset = self._entry(ch)
        self.file.seek(self.data_start + offset)
        return width, bytearray(self.file.read((width + 3) // 4 * self.height))


def _palette(fg, bg):
    """4段階の濃さを背景色から文字色へ変える色の表（framebuf 用にバイトを入れ替えた色）"""
    pal = framebuf.FrameBuffer(bytearray(8), 4, 1, framebuf.RGB565)
    for level in range(4):
        r = (bg[0] * (3 - level) + fg[0] * level) // 3
        g = (bg[1] * (3 - level) + fg[1] * level) // 3
        b = (bg[2] * (3 - level) + fg[2] * level) // 3
        pal.pixel(level, 0, swap565(rgb565(r, g, b)))
    return pal


def judge(value, low, high, low_label, high_label):
    """値を範囲と比べて (文字, 色) を返す"""
    if value is None:
        return "", WHITE
    if value > high:
        return high_label, RED
    if value < low:
        return low_label, BLUE
    return "正常", GREEN


def weather_word(code):
    """WMO 天気コード → (日本語, 色)"""
    if code is None:
        return "--", GRAY
    if code <= 2:
        return "晴れ", YELLOW
    if code == 3:
        return "くもり", (190, 190, 190)
    if code in (45, 48):
        return "霧", GRAY
    if 71 <= code <= 77 or code in (85, 86):
        return "雪", (220, 240, 255)
    if code >= 95:
        return "雷雨", (190, 130, 255)
    return "雨", BLUE


def fetch_forecast(requests):
    """Open-Meteo から3日分の予報を取る。[(天気コード, 最高, 最低, 降水確率), ...]"""
    r = requests.get(FORECAST_URL)
    try:
        if r.status_code != 200:
            raise RuntimeError("天気予報の取得に失敗 {}".format(r.status_code))
        daily = r.json()["daily"]
    finally:
        r.close()
    days = []
    for i in range(len(daily["time"])):
        days.append((
            daily["weather_code"][i],
            daily["temperature_2m_max"][i],
            daily["temperature_2m_min"][i],
            daily["precipitation_probability_max"][i],
        ))
    return days


def _make_lcd(bgr, invert):
    spi = machine.SPI(1, baudrate=40_000_000, sck=machine.Pin(PIN_SCK), mosi=machine.Pin(PIN_MOSI))
    return GC9A01(spi, PIN_CS, PIN_DC, PIN_RST, PIN_BL, bgr=bgr, invert=invert)


def _make_touch():
    i2c = machine.I2C(1, sda=machine.Pin(PIN_TP_SDA), scl=machine.Pin(PIN_TP_SCL), freq=400_000)
    return cst816s.CST816S(i2c, PIN_TP_RST, PIN_TP_INT)


class Display:
    def __init__(self, location, has_soil, temp_range=(18, 30), hum_range=(50, 80),
                 brightness=80, reverse_swipe=False, bgr=True, invert=True,
                 lcd=None, touch=None, font_dir="fonts", log=print):
        self.location = location
        self.temp_range = temp_range
        self.hum_range = hum_range
        self.reverse_swipe = reverse_swipe
        self.lcd = lcd or _make_lcd(bgr, invert)
        if touch is None:
            try:
                touch = _make_touch()
            except OSError as e:
                # タッチが読めなくても表示は続ける（配線を確認）
                log("タッチパネルが見つかりません:", e)
                touch = False
        self.touch = touch or None
        self.small = Font(font_dir + "/small.bin")
        self.medium = Font(font_dir + "/medium.bin")
        self.large = Font(font_dir + "/large.bin")

        self.pages = [PAGE_TEMP, PAGE_HUM] + ([PAGE_SOIL] if has_soil else []) + [PAGE_WEATHER]
        self.page = 0
        self.temperature = None
        self.humidity = None
        self.soil = None
        self.sensor_error = False
        self.status = "起動中"
        self.status_color = GRAY
        self.forecast = None
        self._clear = True
        self._dirty = True
        self.lcd.fill(0)
        self.lcd.backlight(brightness)

    # ===== 値の更新（変わったときだけ描き直す）=====
    def _set(self, name, value):
        if getattr(self, name) != value:
            setattr(self, name, value)
            self._dirty = True

    def set_reading(self, temperature, humidity, soil):
        self._set("temperature", temperature)
        self._set("humidity", humidity)
        self._set("soil", soil)
        self._set("sensor_error", False)

    def set_sensor_error(self):
        self._set("sensor_error", True)

    def set_sent(self, ok):
        self._set("status", "送信OK" if ok else "通信なし")
        self._set("status_color", GREEN if ok else RED)

    def set_forecast(self, forecast):
        self._set("forecast", forecast)

    # ===== タッチと描画 =====
    def poll(self):
        """タッチを確かめ、必要なら描き直す。main.py のループから短い間隔で呼ぶ"""
        if self.touch:
            g = self.touch.gesture()
            step = 0
            if g in (cst816s.SWIPE_LEFT, cst816s.SWIPE_UP, cst816s.TAP):
                step = 1
            elif g in (cst816s.SWIPE_RIGHT, cst816s.SWIPE_DOWN):
                step = -1
            if step and self.reverse_swipe and g != cst816s.TAP:
                step = -step
            if step:
                self.page = (self.page + step) % len(self.pages)
                self._clear = True
                self._dirty = True
        if self._dirty:
            self.render()

    def _line(self, runs, cy, area_w, bg=BLACK):
        """runs = [(フォント, 文字, 色), ...] を中央寄せで1行に描く（下端そろえ）。
        幅 area_w の範囲は背景色で塗り直すので、前の表示は消える"""
        height = max(font.height for font, _, _ in runs)
        buf = bytearray(area_w * height * 2)
        fb = framebuf.FrameBuffer(buf, area_w, height, framebuf.RGB565)
        if bg != BLACK:
            fb.fill(swap565(rgb565(*bg)))
        x = (area_w - sum(font.width(text) for font, text, _ in runs)) // 2
        for font, text, color in runs:
            pal = _palette(color, bg)
            y = height - font.height
            for ch in text:
                w, data = font.glyph(ch)
                if w:
                    fb.blit(framebuf.FrameBuffer(data, w, font.height, framebuf.GS2_HMSB), x, y, -1, pal)
                x += w
        self.lcd.blit_buffer(buf, (WIDTH - area_w) // 2, cy - height // 2, area_w, height)

    def _status_text(self):
        if self.sensor_error:
            return "測定エラー", YELLOW
        return self.status, self.status_color

    def render(self):
        if self._clear:
            self.lcd.fill(0)
            self._clear = False
        self._dirty = False
        page = self.pages[self.page]
        if page == PAGE_WEATHER:
            self._render_weather()
        else:
            self._render_value(page)
        dots = "".join("●" if i == self.page else "○" for i in range(len(self.pages)))
        self._line([(self.small, dots, GRAY)], 218, 100)

    def _render_value(self, page):
        if page == PAGE_TEMP:
            label, unit, value = "温度", "℃", self.temperature
            text = "--" if value is None else "{:.1f}".format(value)
            state = judge(value, self.temp_range[0], self.temp_range[1], "低温", "高温")
        elif page == PAGE_HUM:
            label, unit, value = "湿度", "%", self.humidity
            text = "--" if value is None else "{:.0f}".format(value)
            state = judge(value, self.hum_range[0], self.hum_range[1], "乾燥", "多湿")
        else:
            label, unit, value = "土壌水分", "%", self.soil
            text = "--" if value is None else "{:.0f}".format(value)
            state = ("", WHITE)  # 土壌水分は目安がまだ無いので判定しない

        self._line([(self.small, self.location, GRAY)], 34, 140)
        self._line([(self.medium, label, WHITE)], 62, 180)
        self._line([(self.large, text, WHITE), (self.medium, " " + unit, GRAY)], 116, 210)
        self._line([(self.medium, state[0], state[1])], 160, 180)
        status = self._status_text()
        self._line([(self.small, status[0], status[1])], 188, 150)

    def _render_weather(self):
        self._line([(self.medium, "天気予報", WHITE)], 36, 140)
        if not self.forecast:
            self._line([(self.medium, "取得中", GRAY)], 120, 180)
            return
        for i, (code, high, low, rain) in enumerate(self.forecast[:3]):
            y = 70 + i * 50
            word, color = weather_word(code)
            self._line([(self.medium, DAY_LABELS[i] + " ", WHITE), (self.medium, word, color)], y, 200)
            runs = [
                (self.small, "--°" if high is None else "{:.0f}°".format(high), RED),
                (self.small, "/", GRAY),
                (self.small, "--°" if low is None else "{:.0f}°".format(low), BLUE),
                (self.small, " 降水", GRAY),
                (self.small, "--%" if rain is None else "{}%".format(rain), BLUE if (rain or 0) >= 60 else WHITE),
            ]
            self._line(runs, y + 24, 180)
