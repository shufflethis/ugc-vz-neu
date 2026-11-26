"""Rendert die Erklaerfilme Frame fuer Frame aus /motion-render und kodiert MP4 + Poster.

Jeder Frame wird per window.__setT(t) gesetzt (Film ist seekbar/deterministisch),
wartet bis data-frame == t, dann Screenshot; am Ende ffmpeg.

Aufruf (Playwright Chromium):
  python3 scripts/render-motion.py <base-url> <out-dir> [film:format ...]
  z. B. python3 scripts/render-motion.py http://127.0.0.1:3123 public/motion brands:16x9 creator:9x16
"""
import os
import shutil
import subprocess
import sys
import tempfile
from playwright.sync_api import sync_playwright

FPS, DURATION = 30, 16.0
# Poster-Zeitpunkt (s): zeigt aussagekraeftige Produkt-UI-Szene statt leerer Endcard (Video endet weiter auf CloseScene)
POSTER_TIME = {
    'brands': 8.2,   # Creator-Raster mit Auswahl + Kampagne-starten-Leiste in ugcVZ CI
    'creator': 12.6, # Phone mit aktivem Profil + Offene-Kampagne-Karte (2,00 EUR / 1.000 Views)
}

base, out_dir, *jobs = sys.argv[1:]
jobs = jobs or ['brands:16x9', 'brands:9x16', 'creator:16x9', 'creator:9x16']
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for job in jobs:
        film, fmt = job.split(':')
        w, h = (1920, 1080) if fmt == '16x9' else (1080, 1920)
        context = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
        page = context.new_page()
        page.goto(f'{base}/motion-render?film={film}&format={fmt}&t=0', wait_until='networkidle')
        page.wait_for_function(
            'document.fonts.status === "loaded" && [...document.images].every(i => i.complete && i.naturalWidth > 0) && !!document.querySelector("[data-frame]") && typeof window.__setT === "function"',
            timeout=20000,
        )
        tmp = tempfile.mkdtemp(prefix=f'motion-{film}-{fmt}-')
        frames = int(DURATION * FPS)
        for i in range(frames):
            t = round(i / FPS, 4)
            page.evaluate(f'window.__setT({t})')
            page.wait_for_function(
                f'Math.abs(Number(document.querySelector("[data-frame]").dataset.frame) - {t}) < 1e-6'
            )
            page.screenshot(path=f'{tmp}/f_{i:04d}.png')
            if i % 60 == 0:
                print(f'{film} {fmt}: {i}/{frames}', flush=True)
        name = f'ugc-vz-{film}-{fmt}'
        subprocess.run(
            [
                'ffmpeg', '-y', '-loglevel', 'error',
                '-framerate', str(FPS),
                '-i', f'{tmp}/f_%04d.png',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-crf', '21', '-preset', 'medium',
                '-movflags', '+faststart',
                f'{out_dir}/{name}.mp4',
            ],
            check=True,
        )
        poster_idx = min(frames - 1, max(0, int(round(POSTER_TIME.get(film, DURATION - 0.1) * FPS))))
        subprocess.run(
            [
                'ffmpeg', '-y', '-loglevel', 'error',
                '-i', f'{tmp}/f_{poster_idx:04d}.png',
                '-q:v', '2',
                f'{out_dir}/{name}-poster.jpg',
            ],
            check=True,
        )
        shutil.rmtree(tmp)
        context.close()
        print(f'fertig: {out_dir}/{name}.mp4 + {name}-poster.jpg (frame {poster_idx})', flush=True)
    browser.close()
