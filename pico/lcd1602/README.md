# LCD1602（I2C）用ライブラリ

Pico で I2C 接続の文字液晶（LCD1602 + PCF8574 の I2C 変換基板）を使うためのライブラリ。
研修で使う。温湿度センサー用の `pico/main.py` とは関係なく、単独で使える。

| ファイル | 役割 |
|---|---|
| `lcd_api.py` | 液晶（HD44780）に送る命令をまとめたもの |
| `pico_i2c_lcd.py` | I2C で液晶につなぐ部分（`I2cLcd`）。`lcd_api.py` を読み込む |
| `LICENSE` | ライセンス（MIT）と著作権表示 |

2つの `.py` は、GitHub の [T-622/RPI-PICO-I2C-LCD](https://github.com/T-622/RPI-PICO-I2C-LCD) から取ってきたものを**そのまま**置いている（中身は変えていない）。
もとは Dave Hylands さんの [python_lcd](https://github.com/dhylands/python_lcd) を Pico 向けにしたもの。

## Pico への入れ方（Thonny）

1. このフォルダの `lcd_api.py` と `pico_i2c_lcd.py` を Thonny で開く
2. 「ファイル」→「名前を付けて保存」→「Raspberry Pi Pico」を選ぶ
3. ファイル名は変えずに、そのまま保存する（`.py` まで同じ名前に）

2つとも Pico に入っていないと動かない（`pico_i2c_lcd.py` が `lcd_api.py` を読み込むため）。
入れ忘れると `ImportError: no module named 'lcd_api'` と出る。

## 使い方

```python
from machine import I2C, Pin
from pico_i2c_lcd import I2cLcd

i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)
lcd = I2cLcd(i2c, 0x27, 2, 16)   # アドレス, 行数, 列数（LCD1602 は 2行16列）

lcd.putstr("Hello!")
lcd.move_to(0, 1)                # 列, 行（0 から数える）。2行目の先頭へ
lcd.putstr("Temp: " + str(25))   # 数値は str() で文字にする
lcd.clear()                      # 全部消す
```

ほかに `lcd.backlight_on()` / `lcd.backlight_off()`、`lcd.show_cursor()` / `lcd.hide_cursor()` などがある。
カタカナ・漢字は表示できない（英数字と記号だけ）。

## 動かないとき

**アドレスを調べる**：液晶によっては `0x27` ではなく `0x3F` のことがある。次を実行して確かめる。

```python
from machine import I2C, Pin
i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)
print([hex(a) for a in i2c.scan()])   # 例: ['0x27']
```

`[]`（空）なら、配線か電源がつながっていない。

- `OSError: [Errno 5] EIO` … 配線（SDA・SCL の入れ違い、抜け）を確認する
- 何も表示されない・四角が並ぶだけ … 変換基板の青い半固定抵抗（コントラスト）をドライバーで回す

**電源について**：もとのリポジトリの README には「3.3V↔5V のレベル変換を推奨」と書かれている。
変換なしで、液晶の VCC を VBUS（5V）につないでも動くことが多いが、研修の前に手元の液晶で一度確かめておくこと。
