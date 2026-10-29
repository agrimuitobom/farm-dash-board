"""ハードウェアなしで画面を確認する（見本のデータで preview.png を作る）

  python3 preview.py [Noto Sans CJK などのフォント（省略可）]
"""

import sys
from datetime import timedelta

from PIL import Image, ImageDraw

import screens


def main():
    font = sys.argv[1] if len(sys.argv) > 1 else None
    fonts = screens.Fonts(font, font)
    now = screens.now_utc()
    houses = [
        {"id": "温室ハウス1", "name": "温室ハウス1", "crop": "サラダ菜",
         "thresholds": {"temperature": (18, 30), "humidity": (50, 80)}},
        {"id": "温室ハウス2", "name": "温室ハウス2", "crop": "キュウリ",
         "thresholds": {"temperature": (18, 30), "humidity": (50, 80)}},
        {"id": "温室ハウス3", "name": "温室ハウス3", "crop": "パプリカ",
         "thresholds": {"temperature": (18, 30), "humidity": (50, 80)}},
        {"id": "温室ハウス4", "name": "温室ハウス4", "crop": "",
         "thresholds": {"temperature": (18, 30), "humidity": (50, 80)}},
    ]
    readings = [
        {"temperature": 25.3, "humidity": 62.4, "timestamp": now - timedelta(seconds=20)},
        {"temperature": 31.6, "humidity": 86.0, "timestamp": now - timedelta(minutes=3)},
        {"temperature": 24.1, "humidity": 70.2, "soilMoisture": 46.3, "timestamp": now - timedelta(minutes=1)},
        None,
    ]
    pages = [screens.draw_house(fonts, h, r, now, i, 5) for i, (h, r) in enumerate(zip(houses, readings))]
    pages.append(screens.draw_weather(fonts, [(1, 22.4, 13.2, 10), (61, 17.8, 9.6, 85), (3, 16.2, 4.2, None)], 4, 5))
    pages.append(screens.draw_house(fonts, houses[0], readings[0], now, 0, 5, connected=False))
    pages.append(screens.draw_house(fonts, houses[1], {"temperature": 20.0, "humidity": 60,
                                                        "timestamp": now - timedelta(hours=2)}, now, 1, 5))
    pages.append(screens.draw_weather(fonts, None, 4, 5))
    pages.append(screens.draw_message(fonts, [("読み込み中", screens.WHITE)]))

    sheet = Image.new("RGB", (5 * 250, 2 * 250), (60, 60, 60))
    mask = Image.new("L", (240, 240), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 239, 239), fill=255)
    for i, page in enumerate(pages):
        sheet.paste(page, ((i % 5) * 250 + 5, (i // 5) * 250 + 5), mask)
    sheet.save("preview.png")
    print("preview.png を作りました")


if __name__ == "__main__":
    main()
