"""Build image-manifest from WebP files in images/."""
import json
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMAGES = os.path.join(ROOT, "images")
OUT_JSON = os.path.join(ROOT, "js", "image-manifest.json")
OUT_JS = os.path.join(ROOT, "js", "image-manifest.js")

manifest = {}

for dirpath, _, filenames in os.walk(IMAGES):
    for name in filenames:
        if not name.endswith(".webp") or name.endswith("-mobile.webp"):
            continue
        abs_path = os.path.join(dirpath, name)
        rel = os.path.relpath(abs_path, ROOT).replace("\\", "/")
        mobile_abs = abs_path.replace(".webp", "-mobile.webp")
        with Image.open(abs_path) as img:
            w, h = img.size
        entry = {"width": w, "height": h, "webp": rel}
        if os.path.isfile(mobile_abs):
            with Image.open(mobile_abs) as mimg:
                mw, mh = mimg.size
            entry["mobileWebp"] = os.path.relpath(mobile_abs, ROOT).replace("\\", "/")
            entry["mobileWidth"] = mw
            entry["mobileHeight"] = mh
        manifest[rel] = entry

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write("window.MAYAMAK_IMAGE_MANIFEST=" + json.dumps(manifest, separators=(",", ":")) + ";\n")

print("Wrote", len(manifest), "entries")
