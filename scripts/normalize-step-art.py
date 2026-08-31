#!/usr/bin/env python3
"""Crop the step art to one shared aspect ratio.

The generator returns whatever shape the model felt like — 2.4:1, 3.5:1, and a
couple of squares. Stacked in a single column that inconsistency reads as
sloppiness, so everything is cropped to one banner ratio.

Each image gets a vertical anchor because a blind centre crop cuts the subject:
the cafe street is most interesting slightly above centre, the table slightly
below. 0 is top, 1 is bottom, 0.5 is centred.

    python3 scripts/normalize-step-art.py
"""

from pathlib import Path

from PIL import Image

DIR = Path("public/howitworks")
RATIO = 2.6  # matches the wider of the two reference images
OUT_WIDTH = 900

ANCHORS = {
    "step-1.webp": 0.55,  # keep the hands and page, drop empty table above
    "step-2.webp": 0.50,
    "step-3.webp": 0.58,  # table and cups sit below centre
    "step-4.webp": 0.46,  # storefront and staircase sit above the bicycles
}


def main() -> None:
    for path in sorted(DIR.glob("step-*.webp")):
        img = Image.open(path).convert("RGB")
        w, h = img.size
        target_h = round(w / RATIO)

        if target_h <= h:
            anchor = ANCHORS.get(path.name, 0.5)
            # Clamp so the window stays inside the frame at either extreme.
            top = round((h - target_h) * anchor)
            img = img.crop((0, top, w, top + target_h))
        else:
            # Already wider than the target: trim width instead of stretching.
            target_w = round(h * RATIO)
            left = round((w - target_w) / 2)
            img = img.crop((left, 0, left + target_w, h))

        cw, ch = img.size
        img = img.resize((OUT_WIDTH, round(ch * OUT_WIDTH / cw)), Image.LANCZOS)
        img.save(path, "WEBP", quality=86, method=6)
        print(f"{path.name:16} {img.size[0]}x{img.size[1]}  {path.stat().st_size/1024:5.0f}KB  (was {w}x{h})")


if __name__ == "__main__":
    main()
