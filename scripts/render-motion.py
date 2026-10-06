"""Rendert die Erklaerfilme Frame fuer Frame aus /motion-render und kodiert MP4 + Poster.

Jeder Frame wird per window.__setT(t) gesetzt (Film ist seekbar/deterministisch),
wartet bis data-frame == t, dann Screenshot; am Ende ffmpeg.

Aufruf (Camoufox + Playwright 1.57):
  python scripts/render-motion.py <base-url> <out-dir> [film:format ...]
  z. B. python scripts/render-motion.py http://localhost:3123 public/motion brands:16x9 creator:9x16
"""
import os, shutil, subprocess, sys, tempfile
from camoufox.sync_api import Camoufox

FPS, DURATION = 30, 16.0
base, out_dir, *jobs = sys.argv[1:]
jobs = jobs or ['brands:16x9', 'brands:9x16', 'creator:16x9', 'creator:9x16']
os.makedirs(out_dir, exist_ok=True)

# main_world_eval: Camoufox isoliert evaluate() sonst von der Seite, window.__setT waere unsichtbar.
with Camoufox(headless=True, main_world_eval=True) as browser:
    for job in jobs:
        film, fmt = job.split(':')
        w, h = (1920, 1080) if fmt == '16x9' else (1080, 1920)
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto(f'{base}/motion-render?film={film}&format={fmt}&t=0', wait_until='networkidle')
        page.wait_for_function('document.fonts.status === "loaded" && [...document.images].every(i => i.complete) && !!document.querySelector("[data-frame]")')
        for _ in range(100):  # wait_for_function kennt kein 'mw:' -> selbst pollen
            if page.evaluate('mw:typeof window.__setT === "function"'):
                break
            page.wait_for_timeout(100)
        else:
            raise SystemExit('window.__setT nicht gefunden')
        tmp = tempfile.mkdtemp(prefix=f'motion-{film}-{fmt}-')
        frames = int(DURATION * FPS)
        for i in range(frames):
            t = round(i / FPS, 4)
            page.evaluate(f'mw:window.__setT({t})')
            # erst weiter, wenn React den Frame wirklich gerendert hat
            page.wait_for_function(f'Math.abs(Number(document.querySelector("[data-frame]").dataset.frame) - {t}) < 1e-6')
            page.screenshot(path=f'{tmp}/f_{i:04d}.png')
            if i % 60 == 0:
                print(f'{film} {fmt}: {i}/{frames}', flush=True)
        name = f'ugc-vz-{film}-{fmt}'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{tmp}/f_%04d.png',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow',
                        '-movflags', '+faststart', f'{out_dir}/{name}.mp4'], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{tmp}/f_{frames - 1:04d}.png',
                        '-q:v', '3', f'{out_dir}/{name}-poster.jpg'], check=True)
        shutil.rmtree(tmp)
        page.close()
        print(f'fertig: {out_dir}/{name}.mp4', flush=True)
