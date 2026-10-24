#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MATHORIA Odyssey — server lokal untuk Visual Studio Code.

Jalankan  : python app.py            (atau tekan F5 di VS Code)
Port lain : python app.py --port 8766
Tanpa browser otomatis: python app.py --no-browser
Hanya Python 3.10+ standar, tanpa pip. Edit file di src/ lalu muat ulang browser.
"""
import argparse
import mimetypes
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent
ALLOWED = ("index.html", "src", "assets")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")


def resolve(url_path: str):
    rel = unquote(urlsplit(url_path).path).lstrip("/") or "index.html"
    target = (ROOT / rel).resolve()
    try:
        inside = target.relative_to(ROOT)
    except ValueError:
        return None
    if inside.parts[0] not in ALLOWED or not target.is_file():
        return None
    return target


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        target = resolve(self.path)
        if target is None:
            self.send_error(404)
            return
        data = target.read_bytes()
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype.endswith("javascript"):
            ctype += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


def main():
    p = argparse.ArgumentParser(description="MATHORIA Odyssey — petualangan matematika lokal.")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--no-browser", action="store_true")
    args = p.parse_args()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    except OSError:
        print(f"Port {args.port} sedang dipakai. Coba: python app.py --port {args.port + 1}")
        raise SystemExit(1)
    url = f"http://127.0.0.1:{args.port}/"
    print("MATHORIA Odyssey siap dimainkan:", url)
    print("Jaga terminal tetap terbuka. Tekan Ctrl+C untuk menutup server.")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
