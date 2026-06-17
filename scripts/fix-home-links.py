import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
for name in os.listdir(ROOT):
    if not name.endswith(".html"):
        continue
    path = os.path.join(ROOT, name)
    with open(path, encoding="utf-8") as f:
        text = f.read()
    count = text.count('href="index.html"')
    if count:
        text = text.replace('href="index.html"', 'href="/"')
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(name, count)
