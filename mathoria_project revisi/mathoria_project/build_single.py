#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gabungkan proyek menjadi SATU file Python mandiri (seperti prototipe awal).

Jalankan: python build_single.py  ->  dist/MATHORIA_Odyssey.py
"""
import base64, re, zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JS = ["icons", "data", "engine", "puzzles", "game-state", "game-art", "game-arcade", "game-app"]


def data_uri(path: str) -> str:
    p = ROOT / path.replace("../../", "")
    mime = "font/ttf" if p.suffix == ".ttf" else "image/png"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def inline_assets(text: str) -> str:
    return re.sub(r"(?:\.\./\.\./)?assets/[\w/.\-]+\.(?:ttf|png)", lambda m: data_uri(m.group()), text)


def build_html() -> bytes:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = inline_assets((ROOT / "src/css/style.css").read_text(encoding="utf-8"))
    js = "\n".join(
        inline_assets((ROOT / f"src/js/{n}.js").read_text(encoding="utf-8")) for n in JS
    )
    html = html.replace("assets/img/image1.png", data_uri("assets/img/image1.png"))
    html = html.replace('<link rel="stylesheet" href="src/css/style.css">', f"<style>{css}</style>")
    html = re.sub(r'\s*<script src="src/js/[^"]+"></script>', "", html)
    html = html.replace("</body>", f"<script>(()=>{{\n{js}\n}})();</script></body>")
    return html.encode("utf-8")


LAUNCHER = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MATHORIA Odyssey — peluncur Python dengan seluruh game disematkan.
Jalankan: python MATHORIA_Odyssey.py   (Python 3.10+, tanpa pip)
"""
import argparse, base64, webbrowser, zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--no-browser", action="store_true")
    args = p.parse_args()
    content = zlib.decompress(base64.b64decode(_GAME))

    class H(BaseHTTPRequestHandler):
        def do_GET(self):
            if urlsplit(self.path).path not in ("/", "/index.html"):
                self.send_error(404); return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers(); self.wfile.write(content)
        def log_message(self, *a): pass

    srv = ThreadingHTTPServer(("127.0.0.1", args.port), H)
    url = f"http://127.0.0.1:{args.port}/"
    print("MATHORIA Odyssey siap dimainkan:", url)
    if not args.no_browser: webbrowser.open(url)
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
    finally: srv.server_close()


_GAME = (
'''


if __name__ == "__main__":
    blob = base64.b64encode(zlib.compress(build_html(), 9)).decode()
    chunks = "\n".join(f"    '{blob[i:i+110]}'" for i in range(0, len(blob), 110))
    out = ROOT / "dist"
    out.mkdir(exist_ok=True)
    (out / "MATHORIA_Odyssey.py").write_text(
        LAUNCHER + chunks + "\n)\n\nif __name__ == '__main__':\n    main()\n", encoding="utf-8"
    )
    print("Selesai:", out / "MATHORIA_Odyssey.py")
