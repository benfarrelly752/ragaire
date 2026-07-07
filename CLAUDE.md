# ragaire — site guide

Lo-fi personal brand site + shop. Pure static HTML/CSS/JS — no build step, no framework.
Repo: https://github.com/benfarrelly752/ragaire

## Run locally

```
python -m http.server 8000 --bind 127.0.0.1
```

then open http://127.0.0.1:8000/ (serve from this folder).

## Pages

- `index.html` — home / landing
- `shop.html` — products (checkout = Stripe Payment Links; hrefs with `buy.stripe.com/PLACEHOLDER_*` still need real URLs from the Stripe dashboard)
- `archive.html` — scattered collage of everything ever made (tiles positioned by `site.js`, animated "conspiracy lines" canvas, lightbox for images/video)
- `game.html` — "Escape The Afters" text adventure (uses `body.css`, `room.js`, `conversations.js`, `script.js` + jQuery; separate styling from the rest of the site)
- `why.html` — one-line text page

## Shared pieces

- `site.css` — all site styling (black bg, white ink, `--accent: #33ff33`). Serif display font: Cormorant Garamond via Google Fonts.
- `site.js` — overlay menu toggle + archive scatter layout, hover, lightbox, conspiracy-lines canvas.
- Header on every page: cart (top-left) · logo gif (center) · hamburger (top-right) opening a full-screen overlay menu. Keep this consistent when adding pages.
- `assets/` — all images. Big design sources (*.psd etc.) are gitignored on purpose.

## Aesthetic rules

Lo-fi, minimal, sketchy. Black background, white line art, slight random rotations,
lowercase text. Don't make it slick.

## Watch out

- `.gitignore` excludes `assets/IMG_5219.png` and `assets/abhartach_color.jpg`, but `archive.html` references both — they exist locally so the site works here, but they'll 404 on a fresh clone/deploy unless un-ignored or removed from the page.
- Game JS (`script.js`) defines `playerInput()`; the game page's submit button must call that (an older `processInput` name never existed).
