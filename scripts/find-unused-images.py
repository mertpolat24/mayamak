"""Find image files in images/ with no reference in project source."""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMAGES = os.path.join(ROOT, "images")

text = ""
for dirpath, _, files in os.walk(ROOT):
    rp = dirpath.replace("\\", "/")
    if "/imagesold" in rp or "/images/" in rp and dirpath.endswith("images"):
        pass
    for name in files:
        if name.endswith((".html", ".js", ".css")) and "image-manifest.js" not in name:
            with open(os.path.join(dirpath, name), encoding="utf-8", errors="ignore") as f:
                text += f.read()

unused = []
for dirpath, _, files in os.walk(IMAGES):
    for name in files:
        rel = os.path.relpath(os.path.join(dirpath, name), ROOT).replace("\\", "/")
        if rel not in text and os.path.basename(rel) not in text:
            unused.append(rel)
        elif rel.endswith("-mobile.webp"):
            main = rel.replace("-mobile.webp", ".webp")
            if main not in text and os.path.basename(main) not in text:
                unused.append(rel)

print("UNUSED", len(unused))
for u in sorted(unused):
    print(u)
