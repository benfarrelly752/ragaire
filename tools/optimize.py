"""
ragaire asset pipeline.

Scans the site's HTML for asset references, writes optimized web copies to
assets/web/, moves the heavy originals to assets/originals/ (gitignored),
and rewrites the HTML references.

Usage:  python tools/optimize.py          (from the repo root)

Idempotent: already-optimized files are skipped, originals already moved
are found in assets/originals/. Drop a new file in assets/, reference it
in HTML as assets/<name>, rerun, done.

Needs: Pillow (pip install Pillow) and ffmpeg on PATH (for .mp4 / animated .gif).
"""
import os, re, sys, subprocess, urllib.parse, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = [f for f in os.listdir('.') if f.endswith('.html')]
WEB = 'assets/web'
ORIG = 'assets/originals'
MAX_EDGE = 1400          # px, long edge for stills
JPEG_Q = 82
VIDEO_HEIGHT = 720

os.makedirs(WEB, exist_ok=True)
os.makedirs(ORIG, exist_ok=True)

from PIL import Image

def slugify(name):
    base, ext = os.path.splitext(name)
    base = urllib.parse.unquote(base).lower()
    base = re.sub(r'[^a-z0-9]+', '-', base).strip('-')
    return base + ext.lower().replace('.jpeg', '.jpg')

def find_source(rel):
    """rel is 'assets/<name>' (decoded). Look in assets/, then assets/originals/."""
    if os.path.exists(rel):
        return rel
    alt = os.path.join(ORIG, os.path.basename(rel))
    return alt if os.path.exists(alt) else None

def is_animated_gif(path):
    try:
        with Image.open(path) as im:
            return getattr(im, 'is_animated', False)
    except Exception:
        return False

def optimize_image(src, dst):
    with Image.open(src) as im:
        im.load()
        has_alpha = im.mode in ('RGBA', 'LA', 'PA') or (
            im.mode == 'P' and 'transparency' in im.info)
        w, h = im.size
        scale = min(1.0, MAX_EDGE / max(w, h))
        if scale < 1.0:
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))),
                           Image.LANCZOS)
        if dst.endswith('.png'):
            if has_alpha:
                im = im.convert('RGBA')
                im.save(dst, optimize=True)
                if os.path.getsize(dst) > 300 * 1024:  # quantize line art
                    im.quantize(256, method=Image.FASTOCTREE).save(dst, optimize=True)
            else:
                # opaque png: photographic content is smaller as jpg
                dst_jpg = dst[:-4] + '.jpg'
                im.convert('RGB').save(dst_jpg, quality=JPEG_Q, optimize=True,
                                       progressive=True)
                png_try = dst + '.try'
                im.convert('RGB').quantize(256, method=Image.FASTOCTREE)\
                  .save(png_try, format='PNG', optimize=True)
                if os.path.getsize(png_try) < os.path.getsize(dst_jpg):
                    shutil.move(png_try, dst)
                    os.remove(dst_jpg)
                else:
                    os.remove(png_try)
                    return dst_jpg
        else:
            im = im.convert('RGB')
            im.save(dst, quality=JPEG_Q, optimize=True, progressive=True)
    return dst

def optimize_gif(src, dst):
    if os.path.getsize(src) <= 300 * 1024:
        shutil.copy2(src, dst)
        return dst
    # animated gif: resize with palette via ffmpeg
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src,
                    '-vf', 'scale=480:-1:flags=lanczos,split[a][b];'
                           '[a]palettegen[p];[b][p]paletteuse',
                    dst], check=True)
    return dst

def optimize_video(src, dst):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src,
                    '-vf', f"scale=-2:'min({VIDEO_HEIGHT},ih)'",
                    '-c:v', 'libx264', '-crf', '28', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    '-c:a', 'aac', '-b:a', '96k',
                    dst], check=True)
    return dst

# ---- collect refs ----
ref_re = re.compile(r'(?:src|href|data-local-video)="(assets/[^"]+)"')
refs = set()
for page in PAGES:
    for m in ref_re.finditer(open(page, encoding='utf-8').read()):
        raw = m.group(1)
        if raw.startswith('assets/web/'):
            continue
        refs.add(raw)

mapping = {}   # raw ref (as written in html) -> new web path
moved, skipped, missing = [], [], []

for raw in sorted(refs):
    rel = urllib.parse.unquote(raw)
    src = find_source(rel)
    if not src:
        missing.append(raw)
        continue
    name = os.path.basename(rel)
    slug = slugify(name)
    dst = os.path.join(WEB, slug).replace('\\', '/')
    ext = os.path.splitext(slug)[1]

    if any(os.path.exists(os.path.join(WEB, slugify(name))[:-len(ext)] + e)
           for e in (ext, '.jpg')) and find_source(rel) == os.path.join(ORIG, name):
        # already processed on a previous run
        out = dst if os.path.exists(dst) else dst[:-len(ext)] + '.jpg'
        mapping[raw] = out
        skipped.append(out)
        continue

    if ext == '.gif':
        out = optimize_gif(src, dst)
    elif ext in ('.png', '.jpg'):
        out = optimize_image(src, dst)
    elif ext in ('.mp4', '.mov', '.webm'):
        out = optimize_video(src, dst)
    else:
        shutil.copy2(src, dst)
        out = dst
    mapping[raw] = out.replace('\\', '/')

    # move original out of the way (into gitignored folder)
    if os.path.dirname(src) != ORIG:
        shutil.move(src, os.path.join(ORIG, name))
        moved.append(name)

# ---- rewrite html ----
for page in PAGES:
    html = open(page, encoding='utf-8').read()
    for raw, new in mapping.items():
        html = html.replace(f'"{raw}"', f'"{new}"')
    open(page, 'w', encoding='utf-8', newline='\n').write(html)

print(f"optimized/mapped {len(mapping)} refs, moved {len(moved)} originals, "
      f"skipped {len(skipped)} already done")
for raw in missing:
    print("  MISSING SOURCE:", raw)
big = [(os.path.getsize(os.path.join(WEB, f)), f) for f in os.listdir(WEB)]
for s, f in sorted(big, reverse=True)[:12]:
    print(f"  {s/1024:8.0f}KB  assets/web/{f}")
print(f"assets/web total: {sum(s for s, _ in big)/1024/1024:.1f}MB")
