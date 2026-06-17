"""Check data.js image paths against images/ folder."""
import re
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
with open(os.path.join(ROOT, "js", "data.js"), encoding="utf-8") as f:
    paths = re.findall(r'"images/[^"]+"', f.read())
paths = sorted({p.strip('"') for p in paths})

for p in paths:
    full = os.path.join(ROOT, p.replace("/", os.sep))
    if os.path.isfile(full):
        print("OK", p)
        continue
    webp = os.path.splitext(full)[0] + ".webp"
    if os.path.isfile(webp):
        print("WEBP_ONLY", p, "->", os.path.relpath(webp, ROOT).replace("\\", "/"))
    else:
        print("MISSING", p)
