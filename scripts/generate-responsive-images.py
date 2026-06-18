"""Generate 480/768/1200 WebP variants for products, references and logos."""
import json
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
WIDTHS = (480, 768, 1200)
QUALITY = 80

DIRS = [
    os.path.join(ROOT, "images", "products"),
    os.path.join(ROOT, "images", "references"),
]
EXTRA = [
    os.path.join(ROOT, "images", "logo", "logo-header.png"),
    os.path.join(ROOT, "images", "logo", "logo2.webp"),
]

manifest_path = os.path.join(ROOT, "js", "image-manifest.json")
if os.path.isfile(manifest_path):
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
else:
    manifest = {}


def is_base_webp(name):
    lower = name.lower()
    if not lower.endswith(".webp"):
        return False
    for w in WIDTHS:
        if lower.endswith("-%d.webp" % w):
            return False
    if "-mobile.webp" in lower:
        return False
    return True


def save_variants(abs_path):
    rel_key = os.path.relpath(abs_path, ROOT).replace("\\", "/")
    if rel_key.endswith(".png"):
        webp_abs = abs_path.rsplit(".", 1)[0] + ".webp"
        with Image.open(abs_path) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            img.save(webp_abs, "WEBP", quality=QUALITY, method=6)
        abs_path = webp_abs
        rel_key = os.path.relpath(abs_path, ROOT).replace("\\", "/")

    with Image.open(abs_path) as img:
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        orig_w, orig_h = img.size

    entry = manifest.get(rel_key, {})
    entry["width"] = orig_w
    entry["height"] = orig_h
    entry["webp"] = rel_key
    srcset = {}

    for tw in WIDTHS:
        if orig_w <= tw:
            continue
        variant_name = abs_path.rsplit(".", 1)[0] + "-%d.webp" % tw
        variant_rel = os.path.relpath(variant_name, ROOT).replace("\\", "/")
        if not os.path.isfile(variant_name):
            ratio = tw / orig_w
            th = max(1, int(orig_h * ratio))
            with Image.open(abs_path) as img:
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
                resized = img.resize((tw, th), Image.Resampling.LANCZOS)
                resized.save(variant_name, "WEBP", quality=QUALITY, method=6)
        srcset[str(tw)] = variant_rel

    if srcset:
        entry["srcset"] = srcset

    mobile_abs = abs_path.replace(".webp", "-mobile.webp")
    if os.path.isfile(mobile_abs):
        entry["mobileWebp"] = os.path.relpath(mobile_abs, ROOT).replace("\\", "/")
        with Image.open(mobile_abs) as mimg:
            entry["mobileWidth"] = mimg.size[0]
            entry["mobileHeight"] = mimg.size[1]

    manifest[rel_key] = entry
    return rel_key


count = 0
for d in DIRS:
    if not os.path.isdir(d):
        continue
    for name in sorted(os.listdir(d)):
        if not is_base_webp(name):
            continue
        save_variants(os.path.join(d, name))
        count += 1

for path in EXTRA:
    if os.path.isfile(path):
        save_variants(path)
        count += 1

out_json = manifest_path
out_js = os.path.join(ROOT, "js", "image-manifest.js")
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
with open(out_js, "w", encoding="utf-8") as f:
    f.write("window.MAYAMAK_IMAGE_MANIFEST=" + json.dumps(manifest, separators=(",", ":")) + ";\n")

print("Processed", count, "images; manifest has", len(manifest), "entries")
