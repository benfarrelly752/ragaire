// ragaire — overlay menu toggle
function toggleMenu(btn) {
    var open = document.body.classList.toggle('menu-open');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// close the menu on Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        var b = document.querySelector('.menu-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
    }
});

// ---- archive: scatter layout + lightbox ----
(function () {
    var field = document.querySelector('.scatter-field');
    if (!field) return;

    var tiles = Array.from(field.querySelectorAll('.scatter-tile'));
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
        var canvasH = window.innerHeight - 120;
        field.style.height = canvasH + 'px';
        tileData = [];

        var isMobile = fw < 600;
        var minW = isMobile ? Math.max(100, fw * 0.22) : Math.max(70, fw * 0.08);
        var maxW = isMobile ? Math.min(fw * 0.55, 260) : Math.min(200, fw * 0.22);

        tiles.forEach(function (tile, i) {
            var w = minW + rand() * (maxW - minW);
            var left = rand() * Math.max(0, fw - w - 10);
            var top = rand() * Math.max(0, canvasH - 80);
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

    function init() {
        scatter();
        initHover();
        initLightbox();
        refreshLines = initConspiracy();
    }

    window.addEventListener('load', init);

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            scatter();
            if (refreshLines) refreshLines();
        }, 150);
    });
}());
