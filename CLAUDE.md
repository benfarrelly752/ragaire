# ragaire — site guide

Lo-fi personal brand site + shop. Pure static HTML/CSS/JS — no build step, no framework, no dependencies at runtime.
Repo: https://github.com/benfarrelly752/ragaire

## Run locally

```
python -m http.server 8000 --bind 127.0.0.1
```

then open http://127.0.0.1:8000/ (serve from this folder).

## THE rule

Lo-fi, minimal, sketchy. Black background, white line art, slight random
rotations, lowercase text, `--accent: #33ff33`. Every change must make the
site MORE itself, not more generic. **Don't make it slick.**

## Architecture (one source for everything)

The five pages carry only their own content. Everything shared is generated:

- **`site.js`** — injects the header / overlay menu / cart drawer on every
  page (nav list is `NAV` at the top — edit it once, changes everywhere).
  Also: localStorage cart, shop/home renderers, archive scatter engine
  (layout, hover, lightbox, conspiracy-lines canvas).
- **`products.js`** — THE product list. Shop grid, home "latest drop" strip
  and the cart all render from it. To sell something: add an entry, run the
  image through the pipeline (below), paste its Stripe Payment Link into
  `stripe:` (create at https://dashboard.stripe.com/payment-links).
  `PLACEHOLDER` links render as "checkout not wired yet" — swapping in the
  real URL is the only step left to launch checkout.
- **`assets/manifest.js`** — THE archive. One line per piece
  (`{src, cap}` or `{video, cap}`); tiles/pins/lines are generated.
- **`site.css`** — all styling. Serif display font: Cormorant Garamond.

Pages: `index.html` (single image + latest-drop strip), `shop.html`,
`archive.html`, `why.html` (one line), `404.html`,
`game.html` ("Escape The Afters" text adventure — its own world: `body.css`,
`room.js`, `conversations.js`, `script.js`, local jQuery, static mini-nav;
does NOT load site.js).

## Asset pipeline

- `assets/web/` — optimized copies, the ONLY thing pages reference. Committed.
- `assets/originals/` — full-size sources. Gitignored, local only.
- Adding art: drop the file in `assets/`, reference it as `assets/<name>` in
  HTML **or** add it to manifest/products pointing at the eventual
  `assets/web/<slug>` name, then run:

```
python tools/optimize.py
```

(needs `pip install Pillow` + ffmpeg on PATH). It resizes to ≤1400px /
~300KB, converts opaque PNGs to JPG when smaller, compresses video to 720p,
moves originals to `assets/originals/`, and rewrites HTML references.

## Cart / checkout model

localStorage key `ragaire-cart` = `{productId: qty}`. Checkout is per-item
Stripe Payment Links (no server, no webhooks). The drawer says so in plain
words. Stock is manual: flip `soldout: true` in products.js.

## Watch out

- The instagram link is commented out (in `site.js` NAV and nowhere else)
  until the real handle is known.
- `assets/web/final44.mp4` is 44MB (5-min film, 720p) — lightbox-only,
  `preload="metadata"`, deliberate exception to the size target.
- Git history still contains the old heavy originals (~380MB). Fresh clones
  are slow; a history rewrite (`git filter-repo`) would fix it but rewrites
  shared history — do it deliberately or never.
- Game JS defines `playerInput()`; the game page's submit button must call
  that (an older `processInput` name never existed).
