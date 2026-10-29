# 丸型ディスプレイ用のフォント（pico/fonts/*.bin）を作るスクリプト
#
# パソコン（またはラズパイ）の Python で実行する。Pico では実行しない。
#   pip install pillow
#   python3 pico/tools/make_fonts.py <NotoSansJP の Medium の ttf> <NotoSansJP の Bold の ttf>
#
# フォントは Noto Sans JP（SIL Open Font License 1.1）。Google Fonts
# （https://fonts.google.com/noto/specimen/Noto+Sans+JP）からダウンロードできる。
#
# 画面に出す文字だけを、2ビット（4段階の濃さ）の画像にして fonts/*.bin に書き出す。
# Pico のメモリに全部は載らないので、表示するときに1文字ずつファイルから読む（読み方は display.py の Font）。
#
# ファイルの形式（数値はリトルエンディアン）
#   "GF2"、版(1)、高さ(1バイト)、文字数(2バイト)
#   文字ごとに: 文字コード(2バイト)、幅(1バイト)、データの位置(4バイト)  ※文字コード順
#   画像データ（framebuf.GS2_HMSB の並び。1行は (幅+3)//4 バイト）
# 画面に新しい日本語を出すときは JA_CHARS に文字を足して実行し直す。

import os
import struct
import sys

from PIL import Image, ImageDraw, ImageFont

ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
# display.py で使う日本語（＋記号）
JA_CHARS = (
    "温度湿土壌水分天気予報今日明あさって晴れくもり雨雪雷霧"
    "送信通なし測定エラー起動中高低多乾燥正常室ハウス取得未降"
    "°℃●○"
)

# 左右の余白を詰める記号（22°/13° のように数字のすぐ後に置くため）
NARROW = "°"

# 名前: (太さ, 文字の大きさ(px), 文字)
FONTS = {
    "small": ("medium", 18, ASCII + JA_CHARS),
    "medium": ("medium", 26, ASCII + JA_CHARS),
    "large": ("bold", 64, "0123456789.-"),
}


def render(path, size, chars):
    font = ImageFont.truetype(path, size)
    ascent, descent = font.getmetrics()
    height = ascent + descent
    glyphs = {}
    for ch in chars:
        width = max(1, round(font.getlength(ch)))
        image = Image.new("L", (width, height), 0)
        ImageDraw.Draw(image).text((0, 0), ch, font=font, fill=255)
        if ch in NARROW and image.getbbox():
            # 全角の記号は数字のあとに置くと間が空くので、左右の余白を詰める
            left, _, right, _ = image.getbbox()
            image = image.crop((max(0, left - 1), 0, min(width, right + 1), height))
        glyphs[ch] = image

    # 行の上下の空白を、使う文字が全部入る範囲まで詰める（どの文字も同じだけ詰めるので並びはそろう）
    boxes = [image.getbbox() for image in glyphs.values() if image.getbbox()]
    top = min(box[1] for box in boxes)
    bottom = max(box[3] for box in boxes)
    return {ch: image.crop((0, top, image.width, bottom)) for ch, image in glyphs.items()}, bottom - top


def pack_gs2(image):
    """MicroPython の framebuf.GS2_HMSB の並び（1バイトに4画素、左の画素が下位ビット）にする"""
    width, height = image.size
    stride = (width + 3) & ~3
    data = bytearray(stride // 4 * height)
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            level = pixels[x, y] >> 6  # 0〜3
            data[(x + y * stride) >> 2] |= level << ((x & 3) * 2)
    return bytes(data)


def write_font(out_path, glyphs, height):
    entries = []
    blob = bytearray()
    for ch in sorted(glyphs, key=ord):
        image = glyphs[ch]
        entries.append(struct.pack("<HBI", ord(ch), image.width, len(blob)))
        blob += pack_gs2(image)
    with open(out_path, "wb") as f:
        f.write(b"GF2" + struct.pack("<BBH", 1, height, len(entries)))
        f.write(b"".join(entries))
        f.write(blob)
    return len(blob)


def main():
    if len(sys.argv) != 3:
        print("使い方: python3 make_fonts.py <NotoSansJP の Medium の ttf> <NotoSansJP の Bold の ttf>", file=sys.stderr)
        sys.exit(1)
    paths = {"medium": sys.argv[1], "bold": sys.argv[2]}
    out_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts"))
    os.makedirs(out_dir, exist_ok=True)
    for name, (weight, size, chars) in FONTS.items():
        glyphs, height = render(paths[weight], size, chars)
        out_path = os.path.join(out_dir, name + ".bin")
        size_bytes = write_font(out_path, glyphs, height)
        print("書き出し: {}  高さ {}px  {} 文字  {} バイト".format(out_path, height, len(glyphs), size_bytes),
              file=sys.stderr)


if __name__ == "__main__":
    main()
