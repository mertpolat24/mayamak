#!/usr/bin/env python3
"""Static dev server with clean URL rewrites (mirrors web.config)."""
from __future__ import annotations

import http.server
import os
import socketserver
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "5500"))

ROUTES: dict[str, str] = {
    "": "index.html",
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

HTML_TO_ROUTE: dict[str, str] = {"index.html": "/"}
for slug, html in ROUTES.items():
    if slug:
        HTML_TO_ROUTE[html] = f"/{slug}"


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[dev-server] {self.address_string()} - {fmt % args}")

    def _split_path(self) -> tuple[str, str]:
        parsed = urllib.parse.urlparse(self.path)
        return urllib.parse.unquote(parsed.path), parsed.query

    def _redirect(self, location: str, code: int = 301) -> None:
        if not location.startswith("/"):
            location = "/" + location
        self.send_response(code)
        self.send_header("Location", location)
        self.end_headers()

    def _serve_file(self, rel_path: str, status: int = 200) -> None:
        abs_path = os.path.join(ROOT, rel_path.replace("/", os.sep))
        if not os.path.isfile(abs_path):
            self.send_error(404, "File not found")
            return
        self.send_response(status)
        content_type = self.guess_type(abs_path)
        if content_type:
            self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(os.path.getsize(abs_path)))
        self.end_headers()
        with open(abs_path, "rb") as fh:
            self.wfile.write(fh.read())

    def do_GET(self) -> None:
        path, query = self._split_path()
        suffix = f"?{query}" if query else ""
        clean = path.strip("/")

        if clean == "index.html":
            self._redirect("/" + suffix)
            return

        if clean.endswith(".html") and clean != "404.html":
            target = HTML_TO_ROUTE.get(clean)
            if target:
                self._redirect(target + suffix)
                return

        if clean == "":
            self.path = "/index.html" + suffix
            return super().do_GET()

        if clean in ROUTES:
            self.path = "/" + ROUTES[clean] + suffix
            return super().do_GET()

        abs_path = os.path.join(ROOT, clean.replace("/", os.sep))
        if os.path.isfile(abs_path):
            return super().do_GET()

        if "." not in os.path.basename(clean):
            self._serve_file("404.html", status=404)
            return

        return super().do_GET()


def main() -> None:
    os.chdir(ROOT)
    with socketserver.TCPServer(("", PORT), DevHandler) as httpd:
        print(f"Serving {ROOT}")
        print(f"Clean URLs enabled: http://127.0.0.1:{PORT}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
