/*
                       .-""""-.
                      /  _  _  \
                     |  (o)(o)  |        you read source code.
                      \  ----  /         you are one of us now.
                      |||||||||||        type  ragaire.debts()
                       |_|_|_|_|         in the console.
                        ragaire

   site.js — all the site's moving parts, in reading order:
     1. chrome     — header / overlay menu / cart drawer, injected once here
                     instead of copy-pasted into every page
     2. cart       — localStorage, survives reloads. checkout = stripe
                     payment links straight off products.js
     3. renderers  — shop grid + home latest-drop from products.js,
                     archive tiles from assets/manifest.js
     4. archive    — scatter layout, hover, lightbox, conspiracy lines
     5. glitch     — rare, brief misbehaviour. did you see that
*/
(function () {
    'use strict';

    var R = window.RAGAIRE = window.RAGAIRE || {};
    var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    /* =====================================================
       1. CHROME — header, overlay menu, cart drawer
       ===================================================== */
    var NAV = [
        ['index.html', 'home'],
        ['shop.html', 'shop'],
        ['archive.html', 'archive'],
        ['game.html', 'Escape The Afters'],
        ['why.html', 'why']
        // add back when the real handle is confirmed:
        // ['https://instagram.com/YOUR_HANDLE', 'instagram']
    ];

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function injectChrome() {
        if (document.querySelector('.site-header')) return; // page brought its own
        var nav = NAV.map(function (n) {
            var active = n[0] === PAGE ? ' class="is-active"' : '';
            return '<a href="' + n[0] + '"' + active + '>' + esc(n[1]) + '</a>';
        }).join('\n    ');

        var html =
        '<header class="site-header">' +
            '<button class="cart-link" type="button" aria-label="Cart" data-cart-toggle>' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M1.5 2h3l2.4 12.3a1.8 1.8 0 0 0 1.8 1.45h8.3a1.8 1.8 0 0 0 1.8-1.45L22 5.5H6"/></svg>' +
                '<span class="cart-count">0</span>' +
            '</button>' +
            '<a class="brand" href="index.html"><img src="assets/web/logo.gif" alt="ragaire"></a>' +
            '<button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false">' +
                '<span class="bar"></span><span class="bar"></span>' +
            '</button>' +
        '</header>' +
        '<nav class="overlay-menu" aria-label="Main menu">\n    ' + nav + '\n</nav>' +
        '<div class="cart-scrim" aria-hidden="true"></div>' +
        '<aside class="cart-drawer" aria-label="Cart">' +
            '<div class="cart-head"><span>the damage</span>' +
            '<button class="cart-close" type="button" aria-label="Close cart">&#x2715;</button></div>' +
            '<div class="cart-items"></div>' +
            '<div class="cart-foot"></div>' +
        '</aside>';

        document.body.insertAdjacentHTML('afterbegin', html);

        document.querySelector('.menu-toggle').addEventListener('click', function () {
            var open = document.body.classList.toggle('menu-open');
            document.body.classList.remove('cart-open');
            this.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.querySelector('[data-cart-toggle]').addEventListener('click', function () {
            document.body.classList.toggle('cart-open');
            document.body.classList.remove('menu-open');
            renderCart();
        });
        document.querySelector('.cart-close').addEventListener('click', function () {
            document.body.classList.remove('cart-open');
        });
        // tap anywhere off the drawer to put it away (phones have no Esc key)
        document.querySelector('.cart-scrim').addEventListener('click', function () {
            document.body.classList.remove('cart-open');
        });

        // cart changed in another tab — keep this one honest
        window.addEventListener('storage', function (e) {
            if (e.key !== CART_KEY) return;
            updateCount();
            if (document.body.classList.contains('cart-open')) renderCart();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            document.body.classList.remove('menu-open');
            document.body.classList.remove('cart-open');
            var b = document.querySelector('.menu-toggle');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    }

    /* =====================================================
       2. CART — localStorage: { productId: qty }
       ===================================================== */
    var CART_KEY = 'ragaire-cart';

    function loadCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
        catch (e) { return {}; }
    }
    function saveCart(c) {
        try { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
        catch (e) { /* private mode / storage off — cart lives for this page only */ }
        updateCount();
    }
    function cartQty(c) {
        return Object.keys(c).reduce(function (n, k) { return n + c[k]; }, 0);
    }
    function updateCount() {
        var el = document.querySelector('.cart-count');
        if (el) el.textContent = cartQty(loadCart());
    }
    function productById(id) {
        return (R.products || []).filter(function (p) { return p.id === id; })[0];
    }
    function euro(n) { return '€' + n.toFixed(2).replace(/\.00$/, ''); }

    function addToCart(id) {
        var c = loadCart();
        c[id] = (c[id] || 0) + 1;
        saveCart(c);
        document.body.classList.add('cart-open');
        renderCart();
    }

    function changeQty(id, delta) {
        var c = loadCart();
        c[id] = (c[id] || 0) + delta;
        if (c[id] <= 0) delete c[id];
        saveCart(c);
        renderCart();
    }

    function renderCart() {
        var wrap = document.querySelector('.cart-items');
        var foot = document.querySelector('.cart-foot');
        if (!wrap) return;
        var c = loadCart();
        var ids = Object.keys(c);
        if (!ids.length) {
            wrap.innerHTML = '<p class="cart-empty">nothing yet. the couch keeps what it takes.</p>';
            foot.innerHTML = '';
            return;
        }
        var total = 0;
        wrap.innerHTML = ids.map(function (id) {
            var p = productById(id);
            if (!p) return '';
            total += p.price * c[id];
            var placeholder = p.stripe.indexOf('PLACEHOLDER') > -1;
            var checkout = placeholder
                ? '<span class="cart-nolink" title="stripe link not wired up yet">checkout not wired yet</span>'
                : '<a class="cart-checkout" href="' + esc(p.stripe) + '" target="_blank" rel="noopener">checkout →</a>';
            return '<div class="cart-item">' +
                '<img src="' + esc(p.img) + '" alt="" loading="lazy">' +
                '<div class="cart-item-mid">' +
                    '<span class="cart-item-name">' + esc(p.name) + '</span>' +
                    '<span class="cart-item-price">' + euro(p.price) + '</span>' +
                    checkout +
                '</div>' +
                '<div class="cart-item-qty">' +
                    '<button type="button" data-minus="' + esc(id) + '">−</button>' +
                    '<span>' + c[id] + '</span>' +
                    '<button type="button" data-plus="' + esc(id) + '">+</button>' +
                '</div>' +
            '</div>';
        }).join('');
        foot.innerHTML = '<div class="cart-total"><span>total</span><span>' + euro(total) + '</span></div>' +
            '<p class="cart-note">each piece checks out on its own stripe page. one thing at a time — this is not amazon.</p>';

        wrap.querySelectorAll('[data-minus]').forEach(function (b) {
            b.addEventListener('click', function () { changeQty(b.getAttribute('data-minus'), -1); });
        });
        wrap.querySelectorAll('[data-plus]').forEach(function (b) {
            b.addEventListener('click', function () { changeQty(b.getAttribute('data-plus'), 1); });
        });
    }

    /* =====================================================
       3. RENDERERS — shop grid, home latest drop, archive tiles
       ===================================================== */
    function renderShop() {
        var grid = document.querySelector('.product-grid');
        if (!grid || !R.products) return;
        grid.innerHTML = R.products.map(function (p) {
            var action = p.soldout
                ? '<span class="soldout">sold out</span>'
                : '<button class="buy" type="button" data-add="' + esc(p.id) + '">add to cart</button>';
            return '<article class="product">' +
                '<div class="product-thumb"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
                '<div class="product-info"><h3>' + esc(p.name) + '</h3><span class="price">' + euro(p.price) + '</span></div>' +
                action +
            '</article>';
        }).join('');
        grid.querySelectorAll('[data-add]').forEach(function (b) {
            b.addEventListener('click', function () { addToCart(b.getAttribute('data-add')); });
        });
    }

    function renderLatestDrop() {
        var slot = document.querySelector('[data-latest-drop]');
        if (!slot || !R.products) return;
        var p = R.products.filter(function (x) { return x.latest && !x.soldout; })[0] ||
                R.products.filter(function (x) { return !x.soldout; })[0];
        if (!p) { slot.innerHTML = ''; return; }
        slot.innerHTML = '<a class="latest-drop" href="shop.html">' +
            'latest drop — ' + esc(p.name) + ' · ' + euro(p.price) + ' →</a>';
    }

    // the wall shows pixelated thumbs (assets/web/thumbs/, ~2KB each, some
    // deliberately fogged) — the lightbox loads the real file on click
    function thumbOf(src) {
        var base = src.split('/').pop().replace(/\.[^.]+$/, '');
        return 'assets/web/thumbs/' + base + '.jpg';
    }

    function renderArchiveTiles() {
        var field = document.querySelector('.scatter-field');
        if (!field || !R.archive) return;
        var html = R.archive.map(function (e) {
            if (e.video) {
                return '<div class="scatter-tile" data-local-video="' + esc(e.video) + '">' +
                    '<img src="' + esc(thumbOf(e.video)) + '" alt="' + esc(e.cap || '') + '" loading="lazy">' +
                    '<span class="s-cap">▶ ' + esc(e.cap || '') + '</span></div>';
            }
            return '<div class="scatter-tile" data-full="' + esc(e.src) + '">' +
                '<img src="' + esc(thumbOf(e.src)) + '" alt="' + esc(e.cap || '') + '" loading="lazy">' +
                '<span class="s-cap">' + esc(e.cap || '') + '</span></div>';
        }).join('');
        field.insertAdjacentHTML('beforeend', html);
    }

    /* =====================================================
       4. ARCHIVE — scatter, hover, lightbox, conspiracy lines
       ===================================================== */
    function initArchive() {
        var field = document.querySelector('.scatter-field');
        if (!field) return;

        var tiles = Array.prototype.slice.call(field.querySelectorAll('.scatter-tile'));
        var tileData = [];
        var lastW = 0;          // only re-scatter when the WIDTH changes — mobile
                                // url bars fire resize on every scroll otherwise
        var lines = null;       // conspiracy-line controller (set below)
        var DX = [], DY = [], DR = [];   // current drift offset per tile (px, px, deg)
        var hovered = {};                // tiles under the cursor stop drifting
        function tf(i, scale) {
            var d = tileData[i];
            return 'translate(' + (DX[i] || 0).toFixed(1) + 'px,' + (DY[i] || 0).toFixed(1) + 'px) ' +
                d.baseT + (DR[i] ? ' rotate(' + DR[i].toFixed(2) + 'deg)' : '') +
                (scale ? ' scale(' + scale + ')' : '');
        }

        tiles.forEach(function (tile) {
            tile.setAttribute('tabindex', '0');
            tile.setAttribute('role', 'button');
        });

        function makeRng(seed) {
            var s = seed >>> 0;
            return function () {
                s = ((s * 1664525) + 1013904223) >>> 0;
                return s / 4294967296;
            };
        }

        function scatter() {
            var rand = makeRng(17);
            var fw = field.offsetWidth || window.innerWidth;
            lastW = fw;
            var isMobile = fw < 600;
            tileData = [];

            var minW, maxW, canvasH;
            if (isMobile) {
                minW = Math.max(120, fw * 0.28);
                maxW = Math.min(fw * 0.70, 300);
                canvasH = tiles.length * 110;
            } else {
                minW = Math.max(70, fw * 0.08);
                maxW = Math.min(200, fw * 0.22);
                canvasH = window.innerHeight - 120;
            }

            field.style.height = canvasH + 'px';

            tiles.forEach(function (tile, i) {
                var w = minW + rand() * (maxW - minW);
                var left = rand() * Math.max(0, fw - w - 10);
                var top;
                if (isMobile) {
                    var rowH = 110;
                    var baseTop = (i / tiles.length) * (canvasH - rowH);
                    top = Math.max(0, baseTop + (rand() - 0.5) * rowH * 1.6);
                } else {
                    top = rand() * Math.max(0, canvasH - 80);
                }
                var rot = (rand() - 0.5) * 30;
                var baseT = 'rotate(' + rot.toFixed(2) + 'deg)';

                tile.style.width = w + 'px';
                tile.style.left = left + 'px';
                tile.style.top = top + 'px';
                tile.style.transform = baseT;
                tile.style.zIndex = i + 1;
                // pin position cached here so the string never has to
                // measure the DOM while it animates
                tileData.push({ baseT: baseT, z: i + 1, px: left + w / 2, py: top + 4 });
            });
        }

        // warm the real file on hover so the lightbox opens without a wait
        var warmed = {};
        function warm(tile) {
            var full = tile.getAttribute('data-full');
            if (!full || warmed[full]) return;
            warmed[full] = true;
            var im = new Image();
            im.decoding = 'async';
            im.src = full;
        }

        // touch screens fake a mouseenter on tap and never send the leave,
        // which left tiles stuck enlarged
        var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

        function initHover() {
            tiles.forEach(function (tile, i) {
                function lift() {
                    var d = tileData[i];
                    if (!d) return;
                    hovered[i] = true;
                    tile.style.transition = 'transform 0.18s ease';
                    tile.style.transform = tf(i, 1.06);
                    tile.style.zIndex = 100000;
                    warm(tile);
                }
                function drop() {
                    var d = tileData[i];
                    if (!d) return;
                    hovered[i] = false;
                    tile.style.transition = 'transform 0.18s ease';
                    tile.style.transform = tf(i);
                    tile.style.zIndex = d.z;
                }
                if (canHover) {
                    tile.addEventListener('mouseenter', lift);
                    tile.addEventListener('mouseleave', drop);
                }
                // keyboard focus lifts the tile; a tap's focus doesn't
                tile.addEventListener('focus', function () {
                    try { if (!tile.matches(':focus-visible')) return; } catch (e) {}
                    lift();
                });
                tile.addEventListener('blur', drop);
            });
        }

        function initLightbox() {
            var lb = document.querySelector('.lightbox');
            if (!lb) return;
            var lbImg = lb.querySelector('img');
            var lbFrame = lb.querySelector('iframe');
            var lbVideo = lb.querySelector('video');
            var lbCap = lb.querySelector('.lightbox-cap');
            var openedAt = 0;
            var current = -1;
            var returnFocus = null;
            var loadToken = 0;

            function hideMedia() {
                if (lbFrame) { lbFrame.style.display = 'none'; lbFrame.src = ''; }
                if (lbVideo) { lbVideo.style.display = 'none'; lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); }
                lbImg.style.display = 'none';
            }

            function show(i) {
                var tile = tiles[i];
                if (!tile) return;
                current = i;
                var img = tile.querySelector('img');
                var cap = tile.querySelector('.s-cap');
                var embedUrl = tile.getAttribute('data-video');
                var localUrl = tile.getAttribute('data-local-video');
                if (lbCap) lbCap.textContent = cap ? cap.textContent.trim() : '';
                hideMedia();

                if (localUrl && lbVideo) {
                    lbVideo.style.display = 'block';
                    lbVideo.src = localUrl;
                    var p = lbVideo.play();
                    if (p && p.catch) p.catch(function () {});
                } else if (embedUrl && lbFrame) {
                    lbFrame.style.display = 'block';
                    lbFrame.src = embedUrl + (embedUrl.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
                } else {
                    // the fog clears: the pixel thumb goes up instantly (it's
                    // already cached), the real file swaps in once decoded
                    var full = tile.getAttribute('data-full');
                    var token = ++loadToken;
                    lbImg.alt = img ? (img.alt || '') : '';
                    lbImg.src = img ? img.currentSrc || img.src : '';
                    lbImg.classList.add('is-fog');
                    lbImg.style.display = 'block';
                    if (full) {
                        var real = new Image();
                        real.onload = function () {
                            if (token !== loadToken) return; // they moved on
                            lbImg.src = full;
                            lbImg.classList.remove('is-fog');
                        };
                        real.src = full;
                    }
                    // and get the neighbours ready
                    if (tiles[i + 1]) warm(tiles[i + 1]);
                    if (tiles[i - 1]) warm(tiles[i - 1]);
                }
            }

            function open(i) {
                openedAt = Date.now();
                returnFocus = tiles[i];
                show(i);
                lb.classList.add('is-open');
                document.body.classList.add('lightbox-open');
                if (lines) lines.pause();
                var closeBtn = lb.querySelector('.lightbox-close');
                if (closeBtn) closeBtn.focus({ preventScroll: true, focusVisible: false });
            }

            function close() {
                if (!lb.classList.contains('is-open')) return;
                lb.classList.remove('is-open');
                loadToken++;
                hideMedia();
                document.body.classList.remove('lightbox-open');
                if (lines) lines.resume();
                if (returnFocus) returnFocus.focus({ preventScroll: true });
            }

            function step(d) {
                if (current < 0) return;
                show((current + d + tiles.length) % tiles.length);
            }

            tiles.forEach(function (tile, i) {
                tile.addEventListener('click', function () { open(i); });
                tile.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
                });
            });

            lb.addEventListener('click', function (e) {
                if (Date.now() - openedAt < 250) return; // swallow the opening click's echo
                if (e.target === lb || e.target.classList.contains('lightbox-close')) close();
            });

            document.addEventListener('keydown', function (e) {
                if (!lb.classList.contains('is-open')) return;
                if (e.key === 'Escape') close();
                else if (e.key === 'ArrowRight') step(1);
                else if (e.key === 'ArrowLeft') step(-1);
            });

            // thumb-swipe between pieces on phones
            var sx = null, sy = null;
            lb.addEventListener('touchstart', function (e) {
                if (e.touches.length !== 1) return;
                sx = e.touches[0].clientX; sy = e.touches[0].clientY;
            }, { passive: true });
            lb.addEventListener('touchend', function (e) {
                if (sx === null) return;
                var dx = e.changedTouches[0].clientX - sx;
                var dy = e.changedTouches[0].clientY - sy;
                sx = sy = null;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    openedAt = Date.now(); // don't let the swipe's click close it
                    step(dx < 0 ? 1 : -1);
                }
            }, { passive: true });
        }

        /* the red string. drawn once into three viewport-sized canvases
           pinned behind the wall; each canvas breathes on its own CSS
           opacity cycle, so the pulse costs the CPU nothing. redraws happen
           only on scroll/resize and only for strings on screen. (the old
           version redrew a canvas the size of the whole wall every frame —
           28M pixels on a phone, past what iOS will even allocate.) */
        function initConspiracy() {
            var base = document.getElementById('conspiracy-lines');
            if (!base || !base.getContext) return null;

            tiles.forEach(function (tile) {
                if (!tile.querySelector('.pin')) {
                    var pin = document.createElement('span');
                    pin.className = 'pin';
                    tile.insertBefore(pin, tile.firstChild);
                }
            });

            var rand2 = makeRng(42);
            var connections = [];
            var added = {};
            tiles.forEach(function (tile, i) {
                var count = 2 + Math.floor(rand2() * 2);
                for (var c = 0; c < count; c++) {
                    var j = Math.floor(rand2() * tiles.length);
                    if (j === i) continue;
                    var key = Math.min(i, j) + '-' + Math.max(i, j);
                    if (added[key]) continue;
                    added[key] = true;
                    connections.push({ a: i, b: j, g: Math.floor(rand2() * 3) });
                }
            });

            // three layers, three pulse phases
            var layers = [base];
            for (var n = 1; n < 3; n++) {
                var c2 = base.cloneNode(false);
                c2.removeAttribute('id');
                c2.className = 'conspiracy-layer';
                base.parentNode.insertBefore(c2, base.nextSibling);
                layers.push(c2);
            }
            layers.forEach(function (c, k) { c.setAttribute('data-phase', k); });
            var ctxs = layers.map(function (c) { return c.getContext('2d'); });

            var vw = 0, vh = 0, dirty = true, queued = false, visible = true;

            function resizeCanvas() {
                var dpr = Math.min(window.devicePixelRatio || 1, 2); // a thin red line doesn't need 3x
                vw = window.innerWidth;
                vh = window.innerHeight;
                layers.forEach(function (c, k) {
                    c.width = Math.round(vw * dpr);
                    c.height = Math.round(vh * dpr);
                    c.style.width = vw + 'px';
                    c.style.height = vh + 'px';
                    ctxs[k].setTransform(dpr, 0, 0, dpr, 0, 0); // set, never stack
                });
                touch();
            }

            function draw() {
                queued = false;
                if (!dirty || !visible) return;
                dirty = false;
                var r = field.getBoundingClientRect();
                var top = -r.top, bottom = -r.top + vh;
                var y0 = Math.max(0, r.top), y1 = Math.min(vh, r.bottom);
                ctxs.forEach(function (ctx) {
                    ctx.clearRect(0, 0, vw, vh);
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(r.left, y0, r.width, Math.max(0, y1 - y0));
                    ctx.clip();
                    ctx.translate(r.left, r.top);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = 'rgba(220,30,30,0.5)';
                    ctx.beginPath();
                });
                for (var k = 0; k < connections.length; k++) {
                    var conn = connections[k];
                    var a = tileData[conn.a], b = tileData[conn.b];
                    if (!a || !b) continue;
                    // off-screen strings cost nothing
                    if ((a.py < top && b.py < top) || (a.py > bottom && b.py > bottom)) continue;
                    var ctx = ctxs[conn.g];
                    ctx.moveTo(a.px + (DX[conn.a] || 0), a.py + (DY[conn.a] || 0));
                    ctx.lineTo(b.px + (DX[conn.b] || 0), b.py + (DY[conn.b] || 0));
                }
                ctxs.forEach(function (ctx) { ctx.stroke(); ctx.restore(); });
            }

            function touch() {
                dirty = true;
                if (!queued) { queued = true; requestAnimationFrame(draw); }
            }

            // the wall scrolls under fixed canvases — redraw once per frame at most
            window.addEventListener('scroll', touch, { passive: true });

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    visible = entries[0].isIntersecting;
                    document.body.classList.toggle('wall-offscreen', !visible);
                    if (visible) touch();
                }).observe(field);
            }

            resizeCanvas();

            function setPaused(p) { document.body.classList.toggle('wall-paused', p); }
            return {
                resize: resizeCanvas,
                pause: function () { setPaused(true); },
                resume: function () { setPaused(false); touch(); },
                touch: touch
            };
        }


        /* the wall is alive. every tile wanders slowly on its own lazy loop,
           and every few seconds one surfaces over its neighbours (or sinks
           under them). cheap on purpose: JS only sets a new target 5x a
           second for tiles near the screen; the browser's compositor glides
           between targets. the string redraws on the same beat — tiles move
           a pixel or two per beat, so the pins never visibly come loose. */
        function initDrift() {
            var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (calm) return;
            var STEP = 200; // ms between targets
            var rnd = makeRng(99);
            var P = tiles.map(function () {
                return {
                    ax: 0, ay: 0,                          // amplitude, set per layout below
                    fx: 1 / (25 + rnd() * 45),             // cycles per second (25–70s loops)
                    fy: 1 / (25 + rnd() * 45),
                    px: rnd() * Math.PI * 2, py: rnd() * Math.PI * 2,
                    fr: 1 / (30 + rnd() * 40), pr: rnd() * Math.PI * 2,
                    k: 0.5 + rnd()                         // how restless this one is
                };
            });
            function amplitudes() {
                var small = (field.offsetWidth || innerWidth) < 600;
                P.forEach(function (p) {
                    p.ax = (small ? 14 : 34) * p.k;
                    p.ay = (small ? 18 : 26) * p.k;
                });
            }
            amplitudes();
            tiles.forEach(function (t) { t.style.willChange = 'transform'; });

            var topZ = tiles.length + 1;
            var t0 = performance.now();
            var nextShuffle = 0;

            function near(i) {
                var d = tileData[i];
                if (!d) return false;
                var r = field.getBoundingClientRect();
                var y = r.top + d.py;
                return y > -400 && y < innerHeight + 400;
            }

            function beat() {
                if (document.hidden || document.body.classList.contains('lightbox-open') ||
                    document.body.classList.contains('wall-offscreen')) return;
                var s = (performance.now() - t0 + STEP) / 1000; // aim where we'll be at the next beat
                var moved = false;
                for (var i = 0; i < tiles.length; i++) {
                    if (hovered[i] || !near(i)) continue;
                    var p = P[i];
                    DX[i] = Math.sin(s * p.fx * 2 * Math.PI + p.px) * p.ax;
                    DY[i] = Math.sin(s * p.fy * 2 * Math.PI + p.py) * p.ay;
                    DR[i] = Math.sin(s * p.fr * 2 * Math.PI + p.pr) * 2.5 * p.k;
                    tiles[i].style.transition = 'transform ' + STEP + 'ms linear';
                    tiles[i].style.transform = tf(i);
                    moved = true;
                }
                if (moved && lines) lines.touch();

                // now and then, one surfaces or sinks
                var now = performance.now();
                if (now > nextShuffle) {
                    nextShuffle = now + 2500 + Math.random() * 4000;
                    var pool = [];
                    for (var j = 0; j < tiles.length; j++) if (!hovered[j] && near(j)) pool.push(j);
                    if (pool.length) {
                        var n = pool[Math.floor(Math.random() * pool.length)];
                        var z = Math.random() < 0.75 ? ++topZ : 1; // mostly rise, sometimes drown
                        tileData[n].z = z;
                        tiles[n].style.zIndex = z;
                    }
                }
            }
            setInterval(beat, STEP);
            beat();
            return amplitudes;
        }

        scatter();
        initHover();
        initLightbox();
        lines = initConspiracy();
        var reDrift = initDrift();

        var resizeTimer;
        window.addEventListener('resize', function () {
            if (lines) lines.resize(); // cheap: viewport-sized now
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                var fw = field.offsetWidth || window.innerWidth;
                // height-only resizes (mobile url bar) keep the layout as is
                if (fw !== lastW) { scatter(); if (reDrift) reDrift(); if (lines) lines.touch(); }
            }, 150);
        });
    }
    /* =====================================================
       5. GLITCH — the site misbehaves, rarely and briefly.
          just often enough that you're not sure you saw it.
          - logo flickers (every page)
          - two archive tiles swap pictures for a blink
          - the home image jolts sideways for a frame
          first one no sooner than ~20s in, then every 40–150s,
          only while the tab is visible. off for reduced-motion.
          testing: add ?glitch to the url (every ~2s), or type
          ragaire.glitch() in the console.
       ===================================================== */
    var glitchOften = /[?&]glitch\b/.test(location.search);

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function flash(el, cls, ms) {
        if (!el) return;
        el.classList.add(cls);
        setTimeout(function () { el.classList.remove(cls); }, ms);
    }

    function glitchLogo() {
        flash(document.querySelector('.brand img'), 'glitch-flicker', 90 + Math.random() * 140);
        return true;
    }

    function glitchSwap() {
        if (document.body.classList.contains('lightbox-open')) return false;
        // only tiles actually on screen — a glitch nobody sees is wasted
        var onScreen = Array.prototype.filter.call(
            document.querySelectorAll('.scatter-tile img'),
            function (im) {
                var r = im.getBoundingClientRect();
                return r.bottom > 0 && r.top < innerHeight && r.width > 0;
            });
        if (onScreen.length < 2) return false;
        var a = pick(onScreen), b = a;
        while (b === a) b = pick(onScreen);
        var sa = a.src, sb = b.src;
        a.src = sb; b.src = sa;
        setTimeout(function () { a.src = sa; b.src = sb; }, 120 + Math.random() * 260);
        return true;
    }

    function glitchJolt() {
        flash(document.querySelector('.archive-wall.is-single img'), 'glitch-jolt', 70 + Math.random() * 60);
        return true;
    }

    function glitchOnce() {
        var moves = [glitchLogo];
        if (document.querySelector('.scatter-tile')) moves.push(glitchSwap, glitchSwap); // archive: mostly swaps
        if (document.querySelector('.archive-wall.is-single')) moves.push(glitchJolt);
        var move = pick(moves);
        if (!move()) glitchLogo();
    }

    function scheduleGlitch(first) {
        var wait = glitchOften
            ? 1500 + Math.random() * 1500
            : (first ? 20000 : 40000) + Math.random() * (first ? 40000 : 110000);
        setTimeout(function () {
            if (!document.hidden) glitchOnce();
            scheduleGlitch(false);
        }, wait);
    }

    function initGlitch() {
        var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (calm && !glitchOften) return;
        scheduleGlitch(true);
    }

    /* ===================================================== */
    function boot() {
        injectChrome();
        updateCount();
        renderShop();
        renderLatestDrop();
        renderArchiveTiles();
        initArchive();
        initGlitch();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // for the ones who look behind the curtain
    window.ragaire = {
        glitch: function () { glitchOnce(); return 'did you see that'; },
        debts: function () {
            document.body.style.transition = 'filter 0.4s';
            document.body.style.filter = 'invert(1)';
            setTimeout(function () { document.body.style.filter = ''; }, 1200);
            return 'wheres my money ya little fucker';
        }
    };
    if (window.console && console.log) {
        console.log('%cragaire %c— type ragaire.debts() if you’re owed something',
            'color:#33ff33;font-size:16px', 'color:#888');
    }
}());
