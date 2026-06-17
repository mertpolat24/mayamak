"""Convert PNG/JPG under images/ to WebP (+ mobile variant for large files)."""
from PIL import Image
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "images")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "js", "image-manifest.json")
MOBILE_MAX_W = 900
LARGE_BYTES = 120_000

manifest = {}

for dirpath, _, filenames in os.walk(ROOT):
    for name in filenames:
        lower = name.lower()
        if not lower.endswith((".png", ".jpg", ".jpeg")):
            continue
        src = os.path.join(dirpath, name)
        rel = os.path.relpath(src, os.path.join(ROOT, "..")).replace("\\", "/")
        base, _ = os.path.splitext(src)
        webp_abs = base + ".webp"
        webp_rel = os.path.relpath(webp_abs, os.path.join(ROOT, "..")).replace("\\", "/")

        with Image.open(src) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            w, h = img.size
            img.save(webp_abs, "WEBP", quality=82, method=6)

            entry = {"width": w, "height": h, "webp": webp_rel}
            if os.path.getsize(src) >= LARGE_BYTES:
                ratio = min(1.0, MOBILE_MAX_W / w)
                mw = max(1, int(w * ratio))
                mh = max(1, int(h * ratio))
                mobile_abs = base + "-mobile.webp"
                mobile_rel = os.path.relpath(mobile_abs, os.path.join(ROOT, "..")).replace("\\", "/")
                resized = img.resize((mw, mh), Image.Resampling.LANCZOS)
                resized.save(mobile_abs, "WEBP", quality=78, method=6)
                entry["mobileWebp"] = mobile_rel
                entry["mobileWidth"] = mw
                entry["mobileHeight"] = mh

        manifest[rel] = entry
        print(rel, "->", webp_rel)

with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

js_path = os.path.join(os.path.dirname(__file__), "..", "js", "image-manifest.js")
with open(js_path, "w", encoding="utf-8") as f:
    f.write("window.MAYAMAK_IMAGE_MANIFEST=" + json.dumps(manifest, separators=(",", ":")) + ";\n")

print("Wrote", MANIFEST_PATH, "entries:", len(manifest))
