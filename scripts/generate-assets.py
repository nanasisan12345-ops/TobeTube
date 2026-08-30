from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "og-image.png"
FONT_DIR = Path("C:/Windows/Fonts")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size=size)


def main() -> None:
    image = Image.new("RGB", (1200, 630), "#0C0E18")

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((-260, -250, 720, 590), fill=(122, 226, 195, 42))
    glow_draw.ellipse((880, -250, 1370, 240), fill=(255, 92, 88, 26))
    glow = glow.filter(ImageFilter.GaussianBlur(105))
    image = Image.alpha_composite(image.convert("RGBA"), glow)

    draw = ImageDraw.Draw(image)
    draw.polygon([(90, 82), (160, 112), (90, 142), (103, 112)], fill="#FF5C58")
    draw.polygon([(103, 112), (124, 103), (124, 121)], fill="#0C0E18")
    draw.text((178, 82), "TobeTube", font=font("segoeuib.ttf", 50), fill="#F8F8FB")

    headline = font("YuGothB.ttc", 74)
    body = font("YuGothR.ttc", 30)
    draw.text((90, 222), "ジャンルを選んで、", font=headline, fill="#F8F8FB")
    draw.text((90, 318), "まだ知らない動画へ。", font=headline, fill="#FF746F")
    draw.text((94, 455), "YouTube動画をランダムに発掘しよう。", font=body, fill="#A4AABD")

    draw.rounded_rectangle((912, 392, 1092, 486), radius=28, fill="#171B2C", outline="#32384F", width=2)
    draw.polygon([(979, 417), (1030, 439), (979, 461), (988, 439)], fill="#FF5C58")

    image.convert("RGB").save(OUTPUT, "PNG", optimize=True)
    print(f"Generated: {OUTPUT} (1200x630)")


if __name__ == "__main__":
    main()
