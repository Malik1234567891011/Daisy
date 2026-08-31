#!/usr/bin/env python3
"""Swap the people in the How It Works panels, changing nothing else.

This is an *edit*, not a regeneration: the existing panel is sent to Gemini as
the input image and the prompt asks only for new faces. Everything that makes
the panel match the rest of the set — card positions, tilt, duotone wash,
halftone screen, film border, crop — has to survive untouched, so it is never
described from scratch, only preserved.

Two things are then forced back mechanically rather than trusted to the model:

  * placement — the edited art is fitted into the exact pixel box the original
    art occupied, so the panel lands in the column identically;
  * the cut-out — the original alpha channel is reapplied verbatim, so the
    transparent surround is bit-identical to what shipped before.

    python3 scripts/swap-people.py         # both panels
    python3 scripts/swap-people.py 2       # just step 2
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

DIR = Path("public/howitworks")
RAW_DIR = Path(".artwork")
# gemini-3-pro-image holds a composition together best when editing; the flash
# models are the fallback when its quota is gone.
MODELS = ["gemini-3-pro-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]

KEEP = (
    "Keep absolutely everything else pixel-identical. Do not move, resize, rotate, recolour, "
    "recrop, or restyle anything. Do not change the background. Only the people change."
)

EDITS = {
    "2": (
        "Edit this image: replace the person inside each of the four cards with a completely "
        "different person — different face, hair, and clothing, still a happy university student "
        "in their early twenties. Use four different people, varied ethnicities, a mix of genders. "
        "The four cards must stay in exactly the same positions, at the same tilt angles, with the "
        "same overlaps and the same sizes. Each card keeps its existing flat duotone colour wash "
        "(gold, blue, pink, green from left to right). "
        # The flash models smooth this away unless it is pushed hard: it is the
        # texture that ties this panel to the rest of the set.
        "Critically, preserve the heavy coarse halftone dot screen and gritty print dither at full "
        "strength across every card — the new people must be rendered through that same visible "
        "dot texture, not smooth or clean. Match the original grain exactly. "
        + KEEP
    ),
    "4": (
        "Edit this image: replace the two people at the table with two completely different "
        "people — different faces, hair, and clothing, still two university students on a date. "
        "They keep the same poses, the same seats, and the same places in the frame. The 35mm "
        "film frame border, the sprocket holes, the cafe interior, the window with blurred city "
        "lights, the table, the cups, the warm amber lighting and the colour grade all stay "
        "exactly as they are. " + KEEP
    ),
}


def api_key() -> str:
    """GEMINI_API_KEY from the environment, else from .env."""
    if key := os.environ.get("GEMINI_API_KEY"):
        return key
    for line in Path(".env").read_text().splitlines():
        name, _, value = line.partition("=")
        if name.strip() == "GEMINI_API_KEY":
            return value.strip().strip("\"'")
    sys.exit("GEMINI_API_KEY not found in environment or .env")


def edit(model: str, png: bytes, prompt: str, key: str) -> bytes:
    """One editing round trip. Raises on anything that isn't an image."""
    body = json.dumps(
        {
            "contents": [
                {
                    "parts": [
                        {"inlineData": {"mimeType": "image/png", "data": base64.b64encode(png).decode()}},
                        {"text": prompt},
                    ]
                }
            ],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }
    ).encode()

    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as res:
            payload = json.load(res)
    except urllib.error.HTTPError as err:
        detail = json.loads(err.read() or b"{}").get("error", {}).get("message", "")
        raise RuntimeError(f"{err.code} {detail[:120]}") from None

    candidate = (payload.get("candidates") or [{}])[0]
    for part in candidate.get("content", {}).get("parts", []):
        if data := part.get("inlineData", {}).get("data"):
            return base64.b64decode(data)
    raise RuntimeError(f"no image returned ({candidate.get('finishReason', 'empty response')})")


def content_box(img: Image.Image, cutoff: int = 244) -> tuple[int, int, int, int]:
    """Bounding box of everything that isn't flat white."""
    grey = img.convert("L")
    return grey.point(lambda v: 0 if v >= cutoff else 255).getbbox() or (0, 0, *img.size)


def swap(n: str, key: str) -> None:
    dest = DIR / f"how_it_works_{n}.webp"
    original = Image.open(dest).convert("RGBA")
    alpha = original.getchannel("A")
    # Where the artwork actually sits inside the panel; the rest is transparent
    # padding that the model never needs to see or reproduce.
    box = alpha.point(lambda v: 255 if v > 8 else 0).getbbox() or (0, 0, *original.size)

    # Flatten onto white so the model gets a clean plate rather than an
    # undefined transparent one, and send only the artwork itself.
    plate = Image.new("RGB", original.size, (255, 255, 255))
    plate.paste(original, (0, 0), original)
    buf = RAW_DIR / f"in-{n}.png"
    RAW_DIR.mkdir(exist_ok=True)
    plate.crop(box).save(buf)

    failures = []
    for model in MODELS:
        try:
            out = edit(model, buf.read_bytes(), EDITS[n], key)
            break
        except RuntimeError as err:
            failures.append(f"{model}: {err}")
    else:
        print(f"step {n}  FAILED\n    " + "\n    ".join(failures))
        return

    (RAW_DIR / f"out-{n}.png").write_bytes(out)
    edited = Image.open(RAW_DIR / f"out-{n}.png").convert("RGB")

    # Trim any white the model padded around the edit, then stretch what's left
    # back over the exact box the original artwork filled.
    edited = edited.crop(content_box(edited))
    target = (box[2] - box[0], box[3] - box[1])
    canvas = Image.new("RGB", original.size, (255, 255, 255))
    canvas.paste(edited.resize(target, Image.LANCZOS), (box[0], box[1]))

    result = canvas.convert("RGBA")
    result.putalpha(alpha)  # the cut-out is the original's, untouched
    result.save(dest, "WEBP", quality=90, method=6)
    print(f"step {n}  {dest.name}  {result.size[0]}x{result.size[1]}  {dest.stat().st_size/1024:5.0f}KB  via {model}")


def main() -> None:
    key = api_key()
    wanted = sys.argv[1:] or sorted(EDITS)
    for n in wanted:
        if n not in EDITS:
            sys.exit(f"no panel {n} — choose from {', '.join(sorted(EDITS))}")
        swap(n, key)


if __name__ == "__main__":
    main()
