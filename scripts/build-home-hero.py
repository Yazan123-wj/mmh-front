#!/usr/bin/env python3
"""Build public/home/hero.png from catalog product artwork."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "catalog"
OUT = ROOT / "public" / "home"
OUT.mkdir(parents=True, exist_ok=True)

CANVAS_SIZE = (1040, 840)
BG = (23, 24, 43, 255)


def rounded(im: Image.Image, radius: int) -> Image.Image:
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def fit_cover(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / im.width, target_h / im.height)
    resized = im.resize((int(im.width * scale), int(im.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def load_card(name: str) -> Image.Image:
    path = CATALOG / name
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGBA")


def paste_card(canvas: Image.Image, card: Image.Image, box: tuple[int, int, int, int], radius: int, shadow: bool = True) -> None:
    x, y, w, h = box
    fitted = fit_cover(card, (w, h))
    fitted = rounded(fitted, radius)
    if shadow:
        shadow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        shadow_img = fitted.copy()
        alpha = shadow_img.split()[3]
        shadow_img = Image.new("RGBA", fitted.size, (0, 0, 0, 180))
        shadow_img.putalpha(alpha)
        shadow_layer.paste(shadow_img, (x + 10, y + 14), shadow_img)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(12))
        canvas.alpha_composite(shadow_layer)
    canvas.paste(fitted, (x, y), fitted)


def main() -> None:
    canvas = Image.new("RGBA", CANVAS_SIZE, BG)
    glow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((40, 80, 520, 560), fill=(86, 88, 149, 70))
    glow_draw.ellipse((560, 120, 980, 520), fill=(247, 192, 55, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    canvas = Image.alpha_composite(canvas, glow)

    psn = load_card("psn-store.webp")
    roblox = load_card("roblox-card.webp")
    pubg = load_card("pubg-uc.webp")

    paste_card(canvas, psn, (72, 96, 560, 620), 28)
    paste_card(canvas, roblox, (620, 72, 360, 300), 22)
    paste_card(canvas, pubg, (520, 470, 320, 270), 22)

    out_path = OUT / "hero.png"
    canvas.convert("RGB").save(out_path, format="PNG", optimize=True)
    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
