"""
archive thumbnails — the wall shows pixel mush, the lightbox shows the truth.

Reads assets/manifest.js, writes tiny thumbs to assets/web/thumbs/:
  - most pieces: ~110px wide, heavy jpg compression (a few KB each)
  - a seeded handful: ~18px wide — pure pixel fog, deliberately obscured
  - videos: a poster frame grabbed with ffmpeg, same treatment

Rerun after adding to the manifest:  python tools/thumbs.py
"""
import os, re, json, hashlib, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

from PIL import Image

THUMBS = 'assets/web/thumbs'
os.makedirs(THUMBS, exist_ok=True)

NORMAL_W = 110
OBSCURED_W = 18
JPG_Q = 40

def out_name(src):
    base = os.path.splitext(os.path.basename(src))[0]
    return os.path.join(THUMBS, base + '.jpg').replace('\\', '/')

def is_obscured(src):
    # seeded by filename: same files stay foggy forever, roughly 1 in 5
    h = int(hashlib.md5(os.path.basename(src).encode()).hexdigest(), 16)
    return h % 5 == 0

def make_thumb(im, dst, obscured):
    im = im.convert('RGBA')
    black = Image.new('RGBA', im.size, (0, 0, 0, 255))
    im = Image.alpha_composite(black, im).convert('RGB')
    w = OBSCURED_W if obscured else NORMAL_W
    ratio = w / im.width
    im = im.resize((w, max(1, round(im.height * ratio))), Image.LANCZOS)
    im.save(dst, quality=JPG_Q, optimize=True)

manifest = open('assets/manifest.js', encoding='utf-8').read()
entries = [json.loads(m.group(0)) for m in
           re.finditer(r'\{"(?:src|video)"[^}]*\}', manifest)]

made, fog = 0, []
for e in entries:
    src = e.get('src') or e.get('video')
    if not src or not os.path.exists(src):
        print('  missing:', src)
        continue
    dst = out_name(src)
    obscured = is_obscured(src)
    if e.get('video'):
        # grab a frame ~1s in as the poster
        tmp = os.path.join(tempfile.gettempdir(), 'ragaire_poster.png')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', '1', '-i', src,
                        '-frames:v', '1', tmp], check=True)
        with Image.open(tmp) as im:
            make_thumb(im, dst, obscured)
        os.remove(tmp)
    else:
        with Image.open(src) as im:
            im.load()
            make_thumb(im, dst, obscured)
    made += 1
    if obscured:
        fog.append(os.path.basename(src))

total = sum(os.path.getsize(os.path.join(THUMBS, f)) for f in os.listdir(THUMBS))
print(f"{made} thumbs, wall payload: {total/1024:.0f}KB total")
print(f"{len(fog)} obscured in the fog: " + ', '.join(fog))
