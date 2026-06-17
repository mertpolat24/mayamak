import re

path = __file__.replace("scripts\\update-data-webp.py", "js\\data.js").replace("scripts/update-data-webp.py", "js/data.js")
with open(path, encoding="utf-8") as f:
    s = f.read()
s2 = re.sub(
    r"(images/[^\"']+)\.(png|jpg|jpeg|avif)",
    lambda m: m.group(1) + ".webp",
    s,
)
with open(path, "w", encoding="utf-8") as f:
    f.write(s2)
print("Updated", path)
