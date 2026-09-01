#!/usr/bin/env python3
"""Strip supplier footer watermarks from catalog webp artwork."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "catalog"
# Keep the top portion only — 1Epin stamps its logo in the bottom footer band.
KEEP_RATIO = 0.78


def strip_footer(path: Path, keep: float = KEEP_RATIO) -> None:
    im = Image.open(path).convert("RGB")
    width, height = im.size
    cut = max(1, int(height * keep))
    if cut >= height:
        return
    im.crop((0, 0, width, cut)).save(path, format="WEBP", quality=90, method=6)


def main() -> None:
    files = sorted(CATALOG.glob("*.webp"))
    for path in files:
        if path.name.startswith("_"):
            continue
        before = Image.open(path).size
        strip_footer(path)
        after = Image.open(path).size
        print(f"{path.name}: {before[0]}x{before[1]} -> {after[0]}x{after[1]}")


if __name__ == "__main__":
    main()
