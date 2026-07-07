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
        localStorage.setItem(CART_KEY, JSON.stringify(c));
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

    function renderArchiveTiles() {
        var field = document.querySelector('.scatter-field');
        if (!field || !R.archive) return;
        var html = R.archive.map(function (e) {
            if (e.video) {
                return '<div class="scatter-tile" data-local-video="' + esc(e.video) + '">' +
                    '<video src="' + esc(e.video) + '" muted preload="metadata"></video>' +
                    '<span class="s-cap">▶ ' + esc(e.cap || '') + '</span></div>';
            }
            return '<div class="scatter-tile">' +
                '<img src="' + esc(e.src) + '" alt="' + esc(e.cap || '') + '" loading="lazy">' +
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
                tileData.push({ baseT: baseT, z: i + 1 });
            });
        }

        function initHover() {
            tiles.forEach(function (tile, i) {
                tile.addEventListener('mouseenter', function () {
                    var d = tileData[i];
                    if (!d) return;
                    tile.style.transition = 'transform 0.18s ease';
                    tile.style.transform = d.baseT + ' scale(1.06)';
                    tile.style.zIndex = 200;
                });
                tile.addEventListener('mouseleave', function () {
                    var d = tileData[i];
                    if (!d) return;
                    tile.style.transition = 'transform 0.18s ease';
                    tile.style.transform = d.baseT;
                    tile.style.zIndex = d.z;
                });
            });
        }

        function initLightbox() {
            var lb = document.querySelector('.lightbox');
            if (!lb) return;
            var lbImg = lb.querySelector('img');
            var lbFrame = lb.querySelector('iframe');
            var lbVideo = lb.querySelector('video');
            var lbCap = lb.querySelector('.lightbox-cap');

            function open(tile) {
                var img = tile.querySelector('img');
                var thumbVideo = tile.querySelector('video');
                var cap = tile.querySelector('.s-cap');
                var embedUrl = tile.getAttribute('data-video');
                var localUrl = tile.getAttribute('data-local-video');
                if (lbCap) lbCap.textContent = cap ? cap.textContent : '';

                if (localUrl && lbVideo) {
                    lbImg.style.display = 'none';
                    if (lbFrame) { lbFrame.style.display = 'none'; lbFrame.src = ''; }
                    lbVideo.style.display = 'block';
                    lbVideo.src = localUrl;
                    var p = lbVideo.play();
                    if (p && p.catch) p.catch(function () {});
                } else if (embedUrl && lbFrame) {
                    lbImg.style.display = 'none';
                    if (lbVideo) { lbVideo.style.display = 'none'; lbVideo.pause(); lbVideo.src = ''; }
                    lbFrame.style.display = 'block';
                    lbFrame.src = embedUrl + (embedUrl.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
                } else {
                    if (lbFrame) { lbFrame.style.display = 'none'; lbFrame.src = ''; }
                    if (lbVideo) { lbVideo.style.display = 'none'; lbVideo.pause(); lbVideo.src = ''; }
                    lbImg.style.display = 'block';
                    lbImg.src = img ? img.src : (thumbVideo ? thumbVideo.src : '');
                    lbImg.alt = img ? (img.alt || '') : '';
                }
                lb.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            }

            function close() {
                lb.classList.remove('is-open');
                if (lbFrame) lbFrame.src = '';
                if (lbVideo) { lbVideo.pause(); lbVideo.src = ''; }
                document.body.style.overflow = '';
            }

            tiles.forEach(function (tile) {
                tile.addEventListener('click', function () { open(tile); });
            });

            lb.addEventListener('click', function (e) {
                if (e.target === lb || e.target.classList.contains('lightbox-close')) close();
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
            });
        }

        function initConspiracy() {
            var canvas = document.getElementById('conspiracy-lines');
            if (!canvas) return null;
            var ctx = canvas.getContext('2d');

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
                    connections.push({ a: i, b: j, phase: rand2() * Math.PI * 2 });
                }
            });

            var dpr = window.devicePixelRatio || 1;

            function resizeCanvas() {
                var w = field.offsetWidth;
                var h = field.offsetHeight;
                canvas.width = w * dpr;
                canvas.height = h * dpr;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                ctx.scale(dpr, dpr);
            }
            resizeCanvas();

            var t = 0;
            function draw() {
                ctx.clearRect(0, 0, field.offsetWidth, field.offsetHeight);
                t += 0.012;
                ctx.lineWidth = 1.5;
                connections.forEach(function (conn) {
                    var ta = tiles[conn.a];
                    var tb = tiles[conn.b];
                    var x1 = ta.offsetLeft + ta.offsetWidth / 2;
                    var y1 = ta.offsetTop + 4;
                    var x2 = tb.offsetLeft + tb.offsetWidth / 2;
                    var y2 = tb.offsetTop + 4;
                    var alpha = 0.35 + Math.sin(t + conn.phase) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = 'rgba(220,30,30,' + alpha.toFixed(3) + ')';
                    ctx.stroke();
                });
                requestAnimationFrame(draw);
            }
            draw();
            return resizeCanvas;
        }

        var refreshLines;
        scatter();
        initHover();
        initLightbox();
        refreshLines = initConspiracy();

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                scatter();
                if (refreshLines) refreshLines();
            }, 150);
        });
    }

    /* ===================================================== */
    function boot() {
        injectChrome();
        updateCount();
        renderShop();
        renderLatestDrop();
        renderArchiveTiles();
        initArchive();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // for the ones who look behind the curtain
    window.ragaire = {
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
