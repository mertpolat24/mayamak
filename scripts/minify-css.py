"""Minify style.css -> style.min.css"""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "css", "style.css")
DST = os.path.join(ROOT, "css", "style.min.css")

with open(SRC, encoding="utf-8") as f:
    css = f.read()

css = re.sub(r"/\*[\s\S]*?\*/", "", css)
css = re.sub(r"\s*([{}:;,>+~])\s*", r"\1", css)
css = re.sub(r";}", "}", css)
css = re.sub(r"\s+", " ", css)
css = css.strip()

with open(DST, "w", encoding="utf-8") as f:
    f.write(css)

print("Wrote", DST, "(%d bytes, was %d)" % (len(css.encode("utf-8")), os.path.getsize(SRC)))
