"""丸型ディスプレイ（240×240）の画面を Pillow で描く

ハードウェアを使わないので、preview.py でパソコン上でも画面を確かめられる。
"""

import os
from datetime import datetime, timezone

from PIL import Image, ImageDraw, ImageFont

SIZE = 240
CENTER = SIZE // 2

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (140, 140, 140)
DARK_GRAY = (90, 90, 90)
RED = (255, 80, 70)
BLUE = (80, 160, 255)
GREEN = (60, 210, 110)
YELLOW = (255, 200, 0)

# データが届かなくなってから「通信なし」にするまで（ダッシュボードの7インチ画面と同じ）
OFFLINE_AFTER_SECONDS = 15 * 60

DEFAULT_THRESHOLDS = {"temperature": (18, 30), "humidity": (50, 80)}

DAY_LABELS = ("今日", "明日", "あさって")

# fonts-noto-cjk（sudo apt install fonts-noto-cjk）の場所。ttc の 0 番目が日本語（JP）
FONT_CANDIDATES = {
    "regular": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ],
    "bold": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ],
}


def find_font(kind, override=None):
    for path in ([override] if override else []) + FONT_CANDIDATES[kind]:
        if path and os.path.exists(path):
            return path
    raise FileNotFoundError(
        "日本語フォントが見つかりません。sudo apt install fonts-noto-cjk を実行してください")


class Fonts:
    def __init__(self, regular=None, bold=None):
        regular = find_font("regular", regular)
        bold = find_font("bold", bold)
        self.small = ImageFont.truetype(regular, 17)
        self.medium = ImageFont.truetype(regular, 24)
        self.large = ImageFont.truetype(bold, 58)
        self.unit = ImageFont.truetype(regular, 22)


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


def format_age(timestamp, now):
    """最終更新からの時間（「たった今」「5分前」「通信なし」）と色"""
    if timestamp is None:
        return "データなし", GRAY
    seconds = (now - timestamp).total_seconds()
    if seconds >= OFFLINE_AFTER_SECONDS:
        return "通信なし", RED
    if seconds < 60:
        return "たった今", GREEN
    return "{}分前".format(int(seconds // 60)), GREEN


def _centered(draw, y, runs):
    """runs = [(文字, フォント, 色), ...] を横につなげて中央に描く（y は行の中心、下端そろえ）"""
    widths = [draw.textlength(text, font=font) for text, font, _ in runs]
    x = CENTER - sum(widths) / 2
    bottom = y + max(font.size for _, font, _ in runs) / 2
    for (text, font, color), width in zip(runs, widths):
        draw.text((x, bottom), text, font=font, fill=color, anchor="ls")
        x += width


def _dots(draw, count, current):
    gap = 14
    x0 = CENTER - gap * (count - 1) / 2
    for i in range(count):
        x = x0 + i * gap
        r = 4
        if i == current:
            draw.ellipse((x - r, 218 - r, x + r, 218 + r), fill=WHITE)
        else:
            draw.ellipse((x - r, 218 - r, x + r, 218 + r), outline=GRAY, width=1)


def draw_house(fonts, house, reading, now, page, page_count, connected=True):
    """ハウス1棟分の画面

    house: {"id", "name", "crop", "thresholds": {"temperature": (min, max), "humidity": (min, max)}}
    reading: {"temperature", "humidity", "soilMoisture", "timestamp"(datetime)} または None
    """
    image = Image.new("RGB", (SIZE, SIZE), BLACK)
    draw = ImageDraw.Draw(image)
    reading = reading or {}
    thresholds = house.get("thresholds") or DEFAULT_THRESHOLDS
    temperature = reading.get("temperature")
    humidity = reading.get("humidity")
    soil = reading.get("soilMoisture")

    _centered(draw, 36, [(house.get("name") or house["id"], fonts.medium, WHITE)])
    if house.get("crop"):
        _centered(draw, 62, [(house["crop"], fonts.small, GRAY)])

    temp_text = "--" if temperature is None else "{:.1f}".format(temperature)
    _centered(draw, 104, [(temp_text, fonts.large, WHITE), (" ℃", fonts.unit, GRAY)])

    runs = [("湿度 ", fonts.small, GRAY),
            ("--" if humidity is None else "{:.0f}".format(humidity), fonts.medium, WHITE),
            ("%", fonts.small, GRAY)]
    if soil is not None:
        runs += [("  土 ", fonts.small, GRAY), ("{:.0f}".format(soil), fonts.medium, WHITE), ("%", fonts.small, GRAY)]
    _centered(draw, 146, runs)

    t_label, t_color = judge(temperature, *thresholds["temperature"], "低温", "高温")
    h_label, h_color = judge(humidity, *thresholds["humidity"], "乾燥", "多湿")
    states = []
    if t_label and t_label != "正常":
        states.append((t_label, t_color))
    if h_label and h_label != "正常":
        states.append((h_label, h_color))
    if not states and t_label:
        states.append(("正常", GREEN))
    runs = []
    for i, (label, color) in enumerate(states):
        runs.append(((" " if i else "") + label, fonts.medium, color))
    if runs:
        _centered(draw, 176, runs)

    age, age_color = format_age(reading.get("timestamp"), now)
    if not connected:
        age, age_color = "通信なし", RED
    _centered(draw, 199, [(age, fonts.small, age_color)])
    _dots(draw, page_count, page)
    return image


def draw_weather(fonts, forecast, page, page_count):
    """天気予報（3日分）。forecast: [(天気コード, 最高, 最低, 降水確率), ...] または None"""
    image = Image.new("RGB", (SIZE, SIZE), BLACK)
    draw = ImageDraw.Draw(image)
    _centered(draw, 34, [("天気予報", fonts.medium, WHITE)])
    if not forecast:
        _centered(draw, 120, [("取得中", fonts.medium, GRAY)])
    else:
        for i, (code, high, low, rain) in enumerate(forecast[:3]):
            y = 70 + i * 50
            word, color = weather_word(code)
            _centered(draw, y, [(DAY_LABELS[i] + " ", fonts.medium, WHITE), (word, fonts.medium, color)])
            _centered(draw, y + 24, [
                ("--°" if high is None else "{:.0f}°".format(high), fonts.small, RED),
                ("/", fonts.small, GRAY),
                ("--°" if low is None else "{:.0f}°".format(low), fonts.small, BLUE),
                (" 降水", fonts.small, GRAY),
                ("--%" if rain is None else "{}%".format(rain), fonts.small,
                 BLUE if (rain or 0) >= 60 else WHITE),
            ])
    _dots(draw, page_count, page)
    return image


def draw_message(fonts, lines):
    """起動中やエラーのときの画面"""
    image = Image.new("RGB", (SIZE, SIZE), BLACK)
    draw = ImageDraw.Draw(image)
    top = CENTER - (len(lines) - 1) * 16
    for i, (text, color) in enumerate(lines):
        _centered(draw, top + i * 32, [(text, fonts.medium if i == 0 else fonts.small, color)])
    return image


def now_utc():
    return datetime.now(timezone.utc)
