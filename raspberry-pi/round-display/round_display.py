"""丸型タッチディスプレイ（Waveshare 1.28インチ）に各ハウスの環境データと天気予報を出す（Raspberry Pi 用）

画面: ハウス1 → ハウス2 → … → 天気予報。左右にスワイプ（またはタップ）で切り替える。
データはダッシュボードと同じ Firestore から、表示用アカウント（読み取り専用）で読む。

  python3 round_display.py          # 表示する
  python3 round_display.py --test   # 配線の確認（色の帯とスワイプの向き）

設定は同じフォルダの config.json（config.example.json をコピーして作る）。
"""

import json
import os
import signal
import sys
import threading
import time

import farm_data
import screens

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "config.json")

DEFAULT_CONFIG = {
    "email": "display@farm-dashboard.local",
    "password": "",
    "houses": [],  # 表示するハウスIDの一覧（空なら全部）
    "brightness": 80,
    "reverse_swipe": False,
    "bgr": True,
    "invert": True,
    "refresh_seconds": 60,
    # 配線（BCM の GPIO 番号）。CS は SPI0 の CE0（GPIO8）、MOSI は GPIO10、SCLK は GPIO11
    "pins": {"dc": 25, "rst": 27, "bl": 18, "tp_int": 22, "tp_rst": 17},
    "font_regular": None,
    "font_bold": None,
}

HOUSES_REFRESH = 10 * 60  # ハウスの一覧を読み直す間隔（秒）
FORECAST_REFRESH = 60 * 60  # 天気予報を取り直す間隔（秒）
FORECAST_RETRY = 10 * 60  # 天気予報を取れなかったとき
REDRAW_SECONDS = 30  # 「○分前」の表示を進めるため、変化がなくても描き直す間隔


def log(*args):
    print(time.strftime("[%Y-%m-%d %H:%M:%S]"), *args, flush=True)


def load_config():
    config = json.loads(json.dumps(DEFAULT_CONFIG))
    if not os.path.exists(CONFIG_PATH):
        sys.exit("config.json がありません。config.example.json をコピーして作ってください")
    with open(CONFIG_PATH, encoding="utf-8") as f:
        user = json.load(f)
    pins = dict(config["pins"], **user.pop("pins", {}))
    config.update(user)
    config["pins"] = pins
    return config


class Collector(threading.Thread):
    """Firestore と Open-Meteo からデータを取り続ける（画面の操作を止めないよう別スレッド）"""

    def __init__(self, config):
        super().__init__(daemon=True)
        self.config = config
        self.data = farm_data.FarmData(config["email"], config["password"])
        self.lock = threading.Lock()
        self.version = 0  # データが変わるたびに増える
        self.houses = None
        self.readings = {}
        self.connected = True
        self.forecast = None
        self.error = None

    def snapshot(self):
        with self.lock:
            return self.version, self.houses, dict(self.readings), self.connected, self.forecast, self.error

    def _update(self, **values):
        with self.lock:
            for key, value in values.items():
                setattr(self, key, value)
            self.version += 1

    def run(self):
        next_houses = next_forecast = 0
        houses = None
        while True:
            now = time.time()
            try:
                if houses is None or now >= next_houses:
                    houses = self.data.houses(self.config["houses"])
                    next_houses = now + HOUSES_REFRESH
                    self._update(houses=houses)
                readings = {h["id"]: self.data.latest_reading(h["id"]) for h in houses}
                self._update(readings=readings, connected=True, error=None)
            except Exception as e:  # 通信エラーなど。前のデータを出したまま、次の回にやり直す
                log("データの取得に失敗:", e)
                self._update(connected=False, error=str(e))
            if now >= next_forecast:
                try:
                    self._update(forecast=farm_data.fetch_forecast())
                    next_forecast = now + FORECAST_REFRESH
                except Exception as e:
                    log("天気予報の取得に失敗:", e)
                    next_forecast = now + FORECAST_RETRY
            time.sleep(self.config["refresh_seconds"])


def page_step(gesture, reverse):
    import touch
    if gesture in (touch.SWIPE_LEFT, touch.SWIPE_UP, touch.TAP):
        step = 1
    elif gesture in (touch.SWIPE_RIGHT, touch.SWIPE_DOWN):
        step = -1
    else:
        return 0
    return -step if reverse and gesture != touch.TAP else step


def render(fonts, houses, readings, connected, forecast, error, page):
    """今のページの画像と、ページ数"""
    if not houses:
        if error:
            return screens.draw_message(fonts, [("通信なし", screens.RED), (error[:18], screens.GRAY)]), 1
        return screens.draw_message(fonts, [("読み込み中", screens.WHITE)]), 1
    count = len(houses) + 1
    page %= count
    if page == len(houses):
        return screens.draw_weather(fonts, forecast, page, count), count
    house = houses[page]
    return screens.draw_house(fonts, house, readings.get(house["id"]), screens.now_utc(),
                              page, count, connected), count


def open_devices(config):
    import lcd
    import touch
    pins = config["pins"]
    display = lcd.GC9A01(pins["dc"], pins["rst"], pins["bl"], bgr=config["bgr"], invert=config["invert"])
    display.backlight(config["brightness"])
    try:
        panel = touch.CST816S(pins["tp_int"], pins["tp_rst"])
        log("タッチパネル OK（チップID 0x{:02X}）".format(panel.chip_id))
    except OSError as e:
        log("タッチパネルが見つかりません（表示は続けます）:", e)
        panel = None
    return display, panel


def run(config):
    fonts = screens.Fonts(config["font_regular"], config["font_bold"])
    display, panel = open_devices(config)
    collector = Collector(config)
    collector.start()
    page = 0
    shown = None
    last_draw = 0
    try:
        while True:
            if panel:
                panel.wait(0.2)
                step = page_step(panel.gesture(), config["reverse_swipe"])
            else:
                time.sleep(0.2)
                step = 0
            version, houses, readings, connected, forecast, error = collector.snapshot()
            count = len(houses) + 1 if houses else 1
            page = (page + step) % count
            key = (version, page)
            if key != shown or time.time() - last_draw >= REDRAW_SECONDS:
                image, _ = render(fonts, houses, readings, connected, forecast, error, page)
                display.show(image)
                shown = key
                last_draw = time.time()
    finally:
        display.close()


def run_test(config):
    """配線の確認: 赤・緑・青の帯を出し、タッチの操作を表示する"""
    from PIL import Image, ImageDraw
    import touch
    fonts = screens.Fonts(config["font_regular"], config["font_bold"])
    display, panel = open_devices(config)
    image = Image.new("RGB", (240, 240), screens.BLACK)
    draw = ImageDraw.Draw(image)
    for i, (color, text) in enumerate((((255, 0, 0), "RED"), ((0, 255, 0), "GREEN"), ((0, 0, 255), "BLUE"))):
        draw.rectangle((0, 40 + i * 55, 239, 90 + i * 55), fill=color)
        draw.text((120, 65 + i * 55), text, font=fonts.medium, fill=screens.BLACK if i == 1 else screens.WHITE,
                  anchor="mm")
    display.show(image)
    print("画面: 上から赤・緑・青の帯が出ていれば OK（赤と青が逆なら config.json の bgr を false に）")
    if not panel:
        print("タッチパネルが見つかりません。TP_SDA・TP_SCL・TP_INT・TP_RST の配線と I2C の有効化を確認")
        input("Enter で終了")
        display.close()
        return
    print("画面をスワイプ・タップしてください（Ctrl + C で終了）")
    try:
        while True:
            panel.wait(0.2)
            gesture = panel.gesture()
            if gesture:
                print("操作:", touch.NAMES.get(gesture, gesture))
                shown = image.copy()
                ImageDraw.Draw(shown).text((120, 218), touch.NAMES.get(gesture, "?"), font=fonts.small,
                                           fill=screens.WHITE, anchor="mm")
                display.show(shown)
    except KeyboardInterrupt:
        pass
    finally:
        display.close()


def main():
    # systemctl stop のときも画面を消して終わる
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    config = load_config()
    if "--test" in sys.argv:
        run_test(config)
        return
    if not config["password"]:
        sys.exit("config.json に表示用アカウントのパスワード（password）を書いてください")
    log("起動")
    run(config)


if __name__ == "__main__":
    main()
