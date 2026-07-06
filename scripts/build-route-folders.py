"""Build physical route folders (slug/index.html) for hosts without mod_rewrite."""
from __future__ import annotations

import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")

ROUTES = {
    "hakkimizda": "hakkimizda.html",
    "urunler": "urunler.html",
    "makine-parki": "makine-parki.html",
    "makine-doluluk": "makine-doluluk.html",
    "kapasite-takip": "makine-doluluk.html",
    "referanslar": "referanslar.html",
    "sertifikalar": "sertifikalar.html",
    "sirketlerimiz": "sirketlerimiz.html",
    "iletisim": "iletisim.html",
    "katalog": "catalog.html",
}


def inject_base(html: str) -> str:
    if re.search(r"<base\s", html, re.I):
        return html
    return re.sub(r"(<head[^>]*>)", r'\1\n  <base href="/">', html, count=1, flags=re.I)


def build() -> None:
    for slug, source in ROUTES.items():
        src_path = os.path.join(ROOT, source)
        if not os.path.isfile(src_path):
            print("skip missing:", source)
            continue
        with open(src_path, encoding="utf-8") as f:
            html = inject_base(f.read())
        out_dir = os.path.join(ROOT, slug)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "index.html")
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        print("built:", out_path)


if __name__ == "__main__":
    build()
