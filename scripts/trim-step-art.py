#!/usr/bin/env python3
"""Trim the letterbox bars off generated step art and resize for the web.

gemini-2.5-flash-image ignores aspect-ratio direction and returns a square
canvas with the requested banner padded top and bottom in flat white. This
detects those near-uniform border rows, crops to the actual picture, then
downsizes to the width the layout uses so a ~1.5MB PNG doesn't ship as a
~1.5MB PNG.

    python3 scripts/trim-step-art.py
"""

from pathlib import Path

from PIL import Image

OUT_WIDTH = 900  # 2x the 450px slot, enough for retina
DIR = Path("public/howitworks")
# A row counts as a bar if every pixel sits within this distance of pure white.
WHITE_CUTOFF = 246


def content_rows(img: Image.Image) -> tuple[int, int]:
    """First and last row that isn't a flat near-white bar."""
    grey = img.convert("L")
    w, h = grey.size
    # Sample across the row rather than reading every pixel; bars are uniform.
    xs = range(0, w, max(1, w // 64))

    def is_bar(y: int) -> bool:
        return all(grey.getpixel((x, y)) >= WHITE_CUTOFF for x in xs)

    top = 0
    while top < h and is_bar(top):
        top += 1
    bottom = h - 1
    while bottom > top and is_bar(bottom):
        bottom -= 1
    return top, bottom


def main() -> None:
    for path in sorted(DIR.glob("step-*.png")):
        img = Image.open(path).convert("RGB")
        w, h = img.size
        top, bottom = content_rows(img)

        if bottom - top + 1 < h:
            img = img.crop((0, top, w, bottom + 1))
            note = f"trimmed {h - (bottom - top + 1)}px of bars"
        else:
            note = "no bars"

        cw, ch = img.size
        if cw > OUT_WIDTH:
            img = img.resize((OUT_WIDTH, round(ch * OUT_WIDTH / cw)), Image.LANCZOS)

        out = path.with_suffix(".webp")
        img.save(out, "WEBP", quality=86, method=6)
        path.unlink()

        kb = out.stat().st_size / 1024
        print(f"{out.name:16} {img.size[0]}x{img.size[1]}  {kb:6.0f}KB  ({note}, from {w}x{h})")


if __name__ == "__main__":
    main()
