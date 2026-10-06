"""Kontaktbogen fuer die Erklaerfilme: jeder Zeitpunkt wird frisch per URL geladen
(beweist Seekbarkeit) und als Raster zusammengesetzt.

Aufruf (Camoufox-venv + Pillow):
  python scripts/motion-contact-sheet.py <base-url> <film> <format> <out.png> t1 t2 ...
"""
import io, sys
from camoufox.sync_api import Camoufox
from PIL import Image, ImageDraw

base, film, fmt, out, *ts = sys.argv[1:]
w, h = (1920, 1080) if fmt == '16x9' else (1080, 1920)
shots = []
with Camoufox(headless=True) as b:
    p = b.new_page(viewport={'width': w, 'height': h})
    for t in ts:
        p.goto(f'{base}/motion-render?film={film}&format={fmt}&t={t}', wait_until='networkidle')
        p.wait_for_function('document.fonts.status === "loaded" && [...document.images].every(i => i.complete)')
        p.wait_for_timeout(150)
        shots.append((t, Image.open(io.BytesIO(p.screenshot())).convert('RGB')))
tw = 640 if fmt == '16x9' else 300
th = int(tw * h / w)
cols = 3 if fmt == '16x9' else 4
rows = (len(shots) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 10) + 10, rows * (th + 34) + 10), '#ffffff')
d = ImageDraw.Draw(sheet)
for i, (t, im) in enumerate(shots):
    x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 34)
    sheet.paste(im.resize((tw, th)), (x, y + 24))
    d.text((x, y + 4), f't = {t}s', fill='#171717')
sheet.save(out)
print(out, sheet.size)
