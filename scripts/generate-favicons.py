"""Build website icons from images/logo.png. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent


def generate(root=ROOT):
    source = Image.open(root / 'images/logo.png').convert('RGBA')
    icons = root / 'favicons'
    icons.mkdir(exist_ok=True)

    def square(size):
        artwork = ImageOps.contain(source, (size, size), Image.Resampling.LANCZOS)
        result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        result.alpha_composite(artwork, ((size - artwork.width) // 2, (size - artwork.height) // 2))
        return result

    for name, size in {
        'favicon-16x16.png': 16,
        'favicon-32x32.png': 32,
        'favicon.png': 32,
        'apple-touch-icon.png': 180,
        'android-chrome-192x192.png': 192,
        'android-chrome-512x512.png': 512,
    }.items():
        icon = square(size)
        if name == 'apple-touch-icon.png':
            # iOS supplies its own rounded corners; use an opaque black tile.
            tile = Image.new('RGBA', icon.size, (0, 0, 0, 255))
            tile.alpha_composite(icon)
            icon = tile.convert('RGB')
        icon.save(icons / name, optimize=True)
    square(256).save(icons / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    (root / 'favicon.ico').write_bytes((icons / 'favicon.ico').read_bytes())
    # Keep the existing public alias used by authored and generated game pages.
    square(512).save(root / 'images/favicon-rounded.png', optimize=True)


if __name__ == '__main__':
    generate()
