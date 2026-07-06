"""Replace .html links with clean routes across site HTML files."""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")

HREF_MAP = {
    "hakkimizda.html": "/hakkimizda",
    "urunler.html": "/urunler",
    "makine-parki.html": "/makine-parki",
    "makine-doluluk.html": "/makine-doluluk",
    "referanslar.html": "/referanslar",
    "sertifikalar.html": "/sertifikalar",
    "sirketlerimiz.html": "/sirketlerimiz",
    "iletisim.html": "/iletisim",
    "catalog.html": "/katalog",
    "index.html": "/",
}

CANONICAL_MAP = {
    "hakkimizda.html": "hakkimizda",
    "urunler.html": "urunler",
    "makine-parki.html": "makine-parki",
    "makine-doluluk.html": "makine-doluluk",
    "referanslar.html": "referanslar",
    "sertifikalar.html": "sertifikalar",
    "sirketlerimiz.html": "sirketlerimiz",
    "iletisim.html": "iletisim",
    "catalog.html": "katalog",
}

SITE = "https://www.mayamak.com"


def update_html(path: str) -> bool:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    original = text

    for old, new in HREF_MAP.items():
        text = text.replace(f'href="{old}"', f'href="{new}"')

    for old, slug in CANONICAL_MAP.items():
        text = text.replace(f"{SITE}/{old}", f"{SITE}/{slug}")

    if text != original:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
        return True
    return False


def main():
    for name in os.listdir(ROOT):
        if not name.endswith(".html"):
            continue
        path = os.path.join(ROOT, name)
        if update_html(path):
            print("updated:", name)


if __name__ == "__main__":
    main()
