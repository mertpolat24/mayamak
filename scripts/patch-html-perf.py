"""Patch HTML pages with perf head assets and image dimensions."""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")

HEAD_ASSETS = """  <link rel="preload" href="fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/inter-700.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/critical.css">
  <link rel="preload" href="css/style.css" as="style">
  <link rel="stylesheet" href="css/style.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="css/style.css"></noscript>"""

LCP_PRELOAD = """  <link rel="preload" as="image" href="images/products/denizalti.webp" fetchpriority="high">
"""

LOGO_HEADER_OLD = '<img src="images/logo/logo-header.png" alt="Mayamak" class="logo-img">'
LOGO_HEADER_NEW = '<img src="images/logo/logo-header.png" alt="Mayamak" class="logo-img" width="1040" height="316" decoding="async">'

for name in os.listdir(ROOT):
    if not name.endswith(".html"):
        continue
    path = os.path.join(ROOT, name)
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if 'href="css/style.css"' in text and "css/fonts.css" not in text:
        text = text.replace('  <link rel="stylesheet" href="css/style.css">', HEAD_ASSETS)
    if name == "index.html" and "denizalti.webp" not in text.split("</head>")[0]:
        text = text.replace("  <link rel=\"preload\" href=\"fonts/inter-400.woff2\"", LCP_PRELOAD + "  <link rel=\"preload\" href=\"fonts/inter-400.woff2\"", 1)
    text = text.replace(LOGO_HEADER_OLD, LOGO_HEADER_NEW)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("patched", name)
