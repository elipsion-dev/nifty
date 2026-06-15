from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "brand"
ICONS = ROOT / "assets" / "icons"
ICONS.mkdir(parents=True, exist_ok=True)


def trimmed(path: Path, padding: int = 24) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if not box:
        raise ValueError(f"{path} has no visible pixels")
    left, top, right, bottom = box
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def contain(image: Image.Image, size: tuple[int, int], padding: int = 0, background=(0, 0, 0, 0)) -> Image.Image:
    canvas = Image.new("RGBA", size, background)
    target = (max(1, size[0] - padding * 2), max(1, size[1] - padding * 2))
    copy = image.copy()
    copy.thumbnail(target, Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.alpha_composite(copy, (x, y))
    return canvas


logo = trimmed(BRAND / "nifty-utilities-logo.png", 18)
icon = trimmed(BRAND / "nifty-utilities-icon.png", 18)

logo.save(BRAND / "nifty-utilities-logo.png", optimize=True)
icon.save(BRAND / "nifty-utilities-icon.png", optimize=True)
logo.save(BRAND / "nifty-utilities-logo.webp", format="WEBP", lossless=True, quality=100)
icon.save(BRAND / "nifty-utilities-icon.webp", format="WEBP", lossless=True, quality=100)
contain(logo, (1024, 512), padding=30).save(BRAND / "nifty-utilities-logo-1024.png", optimize=True)
contain(logo, (512, 256), padding=15).save(BRAND / "nifty-utilities-logo-512.png", optimize=True)

for size in (16, 32, 48):
    contain(icon, (size, size), padding=max(1, round(size * 0.08))).save(ICONS / f"favicon-{size}x{size}.png", optimize=True)

contain(icon, (64, 64), padding=5).save(ICONS / "favicon-64x64.png", optimize=True)
contain(icon, (180, 180), padding=18, background=(255, 255, 255, 255)).convert("RGB").save(ICONS / "apple-touch-icon.png", optimize=True)
contain(icon, (150, 150), padding=13, background=(255, 255, 255, 255)).convert("RGB").save(ICONS / "mstile-150x150.png", optimize=True)
contain(icon, (70, 70), padding=6, background=(255, 255, 255, 255)).convert("RGB").save(ICONS / "mstile-70x70.png", optimize=True)
contain(icon, (310, 310), padding=28, background=(255, 255, 255, 255)).convert("RGB").save(ICONS / "mstile-310x310.png", optimize=True)
contain(logo, (310, 150), padding=15, background=(255, 255, 255, 255)).convert("RGB").save(ICONS / "mstile-310x150.png", optimize=True)

for size in (192, 512):
    contain(icon, (size, size), padding=round(size * 0.08), background=(255, 255, 255, 255)).convert("RGB").save(ICONS / f"icon-{size}x{size}.png", optimize=True)
    contain(icon, (size, size), padding=round(size * 0.08), background=(255, 255, 255, 255)).convert("RGB").save(ICONS / f"android-chrome-{size}x{size}.png", optimize=True)
    contain(icon, (size, size), padding=round(size * 0.18), background=(0, 133, 255, 255)).convert("RGB").save(ICONS / f"maskable-icon-{size}x{size}.png", optimize=True)

contain(icon, (512, 512), padding=36).save(ICONS / "icon-512x512-transparent.png", optimize=True)
contain(icon, (1024, 1024), padding=72).save(ICONS / "icon-1024x1024-transparent.png", optimize=True)

favicon_frames = [
    contain(icon, (size, size), padding=max(1, round(size * 0.08))).convert("RGBA")
    for size in (16, 32, 48)
]
favicon_frames[0].save(
    ROOT / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=favicon_frames[1:],
)

social = Image.new("RGB", (1200, 630), (247, 250, 252))
social_logo = contain(logo, (1000, 440), padding=60)
social.paste(social_logo, (100, 65), social_logo)
social.save(BRAND / "nifty-utilities-social-card.png", optimize=True, quality=92)
social.save(BRAND / "nifty-utilities-social-card.jpg", optimize=True, quality=92)

print("Generated Nifty Utilities brand asset package.")
