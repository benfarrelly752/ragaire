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
