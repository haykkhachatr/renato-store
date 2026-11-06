/* Renato — motion layer (GSAP + ScrollTrigger). Everything degrades to a plain static site
   when GSAP is missing or the visitor prefers reduced motion. */
(function () {
  'use strict';
  var D = window.Data, U = window.UI, CFG = window.RENATO;
  var $ = U.$, $$ = U.$$;
  var g = window.gsap, ST = window.ScrollTrigger;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var on = !!(g && ST) && !reduced;
  var ctx = null, mm = null;
  var introReady = Promise.resolve();

  if (g && ST) g.registerPlugin(ST);

  /* ---------------- header behaviour + announcement ---------------- */
  function initChrome() {
    document.documentElement.classList.toggle('anim-on', on);
    var hdr = $('#header'), lastY = window.scrollY, ticking = false;
    function setH() {
      var h = ($('#announce') ? $('#announce').offsetHeight : 0) + (hdr ? hdr.offsetHeight : 0);
      document.documentElement.style.setProperty('--hdr-h', (hdr ? hdr.offsetHeight : 64) + 'px');
      document.documentElement.style.setProperty('--top-h', h + 'px');
    }
    function onScroll() {
      var y = window.scrollY;
      hdr.classList.toggle('scrolled', y > 8);
      var d = y - lastY;
      if (!U.isOpen()) {
        if (y > 220 && d > 6) hdr.classList.add('hide');
        else if (d < -4 || y < 120) hdr.classList.remove('hide');
      }
      lastY = y; ticking = false;
      var tp = $('.to-top'); if (tp) tp.classList.toggle('on', y > 600);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', setH);
    setH(); onScroll();
    // header must reappear when keyboard focus enters it
    hdr.addEventListener('focusin', function () { hdr.classList.remove('hide'); });

    // rotating announcement
    var i = 0;
    setInterval(function () {
      var msgs = $$('.ann-msg');
      if (msgs.length < 2 || document.hidden) return;
      msgs[i].classList.remove('on'); i = (i + 1) % msgs.length; msgs[i].classList.add('on');
    }, 4200);
    window.__setHeaderH = setH;
  }

  /* ---------------- custom cursor (desktop only) ---------------- */
  function initCursor() {
    if (!on || !fine) return;
    var c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="cursor-dot"></span><span class="cursor-label"></span>';
    document.body.appendChild(c);
    var xTo = g.quickTo(c, 'x', { duration: .35, ease: 'power3' }), yTo = g.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    var label = $('.cursor-label', c);
    window.addEventListener('pointermove', function (e) {
      xTo(e.clientX); yTo(e.clientY); c.classList.add('vis');
      var el = e.target.closest ? e.target.closest('[data-cursor],a,button,input,select,textarea,label,summary') : null;
      var v = el && el.getAttribute('data-cursor') === 'view';
      c.classList.toggle('is-view', !!v);
      c.classList.toggle('is-link', !!el && !v);
      if (v) label.textContent = ({ hy: 'Դիտել', en: 'View', ru: 'Смотреть' })[window.I18N.getLang()];
    }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.remove('vis'); });
  }

  /* ---------------- loader ---------------- */
  function loader() {
    var el = $('#loader');
    var seen = false;
    try { seen = sessionStorage.getItem('renato.intro') === '1'; } catch (e) {}
    if (!el || !CFG.loader || !on || seen) {
      if (el) el.remove();
      document.documentElement.classList.remove('loading');
      return Promise.resolve();
    }
    try { sessionStorage.setItem('renato.intro', '1'); } catch (e) {}
    $('.ld-tag', el).textContent = window.I18N.t('ld.tag');
    var num = $('.ld-n', el), bar = $('.ld-bar i', el), wmk = $('.ld-wm', el);
    return new Promise(function (resolve) {
      var o = { v: 0 };
      var tl = g.timeline({ defaults: { ease: 'power3.out' } });
      g.set(wmk, { clipPath: 'inset(0 100% 0 0)' });
      tl.to(wmk, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut' }, 0)
        .to(o, { v: 100, duration: 1.2, ease: 'power1.inOut', onUpdate: function () { num.textContent = Math.round(o.v); bar.style.width = o.v + '%'; } }, 0)
        .to($('.ld-tag', el), { opacity: 1, y: 0, duration: .6 }, .5)
        .to($('.ld-in', el), { opacity: 0, y: -24, duration: .5, ease: 'power2.in' }, 1.35)
        .to(el, { yPercent: -100, duration: .95, ease: 'power4.inOut', onStart: resolve }, 1.45)
        .add(function () { el.remove(); document.documentElement.classList.remove('loading'); });
    });
  }

  /* ---------------- per-view setup ---------------- */
  function killView() {
    if (mm) { mm.revert(); mm = null; }
    if (ctx) { ctx.revert(); ctx = null; }
    $$('.fly').forEach(function (n) { n.remove(); });
  }

  function view(root, name, first) {
    if (!on) { magnetic(root); return; }
    var wait = first ? introReady : Promise.resolve();
    ctx = g.context(function () {
      /* generic reveals */
      $$('[data-stagger]', root).forEach(function (box) {
        Array.prototype.slice.call(box.children).forEach(function (ch) { ch.setAttribute('data-reveal', ''); });
      });
      var items = $$('[data-reveal]', root);
      items.forEach(function (el) { g.set(el, { opacity: 0, y: 34 }); });
      ST.batch(items, {
        start: 'top 92%', once: true,
        onEnter: function (b) { g.to(b, { opacity: 1, y: 0, duration: .95, ease: 'power3.out', stagger: .09, overwrite: 'auto' }); }
      });
      $$('[data-reveal-img]', root).forEach(function (el) {
        g.fromTo(el, { clipPath: 'inset(100% 0 0 0 round 28px)' }, { clipPath: 'inset(0% 0 0 0 round 28px)', duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });

      if (name === 'home') home(root, wait);
      if (name === 'product') pdp(root);
      if (name === 'shop' || name === 'wishlist') {
        g.from($$('.grid > .card', root).slice(0, 12), { opacity: 0, y: 30, duration: .8, stagger: .05, ease: 'power3.out', delay: .1, clearProps: 'all' });
      }
      footer();
    }, root);
    magnetic(root);
    requestAnimationFrame(function () { requestAnimationFrame(function () { ST.refresh(); }); });
  }

  function footer() {
    var big = $('.foot-big');
    if (!big) return;
    g.fromTo($('.foot-wm', big), { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: big, start: 'top 105%', end: 'bottom 80%', scrub: true } });
  }

  function home(root, wait) {
    /* hero intro (waits for the loader on first visit) */
    var tl = g.timeline({ paused: true, defaults: { ease: 'power4.out' } });
    g.set($$('.hero-eye, .hero-sub, .hero-cta > *, .hero-perks, .hero-scroll', root), { opacity: 0, y: 22 });
    g.to($('.hero-rings', root), { rotation: 360, duration: 160, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
    g.set($('.hero-rings', root), { opacity: 0 });
    g.to($('.hero-rings', root), { opacity: 1, duration: 2.4, delay: .4, ease: 'power2.out' });
    g.set($$('.hero-title .wi', root), { yPercent: 115, rotate: 3 });
    g.set($$('.arch', root), { opacity: 0, y: 90 });
    g.set($$('.arch-art', root), { scale: .9, y: 30 });
    g.set($$('.chip-tag', root), { scale: .6, opacity: 0 });
    g.set($('.spin', root), { scale: .4, opacity: 0, rotate: -90 });
    tl.to($('.hero-eye', root), { opacity: 1, y: 0, duration: .8 }, 0)
      .to($$('.hero-title .wi', root), { yPercent: 0, rotate: 0, duration: 1.15, stagger: .08 }, .05)
      .to($('.hero-sub', root), { opacity: 1, y: 0, duration: .9 }, .55)
      .to($$('.hero-cta > *', root), { opacity: 1, y: 0, duration: .8, stagger: .1 }, .7)
      .to($('.hero-perks', root), { opacity: 1, y: 0, duration: .8 }, .95)
      .to($$('.arch', root), { opacity: 1, y: 0, duration: 1.3, stagger: .14 }, .15)
      .to($$('.arch-art', root), { scale: 1, y: 0, duration: 1.4, stagger: .14, ease: 'power3.out' }, .3)
      .to($$('.chip-tag', root), { scale: 1, opacity: 1, duration: .7, stagger: .12, ease: 'back.out(2.2)' }, 1.1)
      .to($('.spin', root), { scale: 1, opacity: 1, rotate: 0, duration: 1.1, ease: 'power3.out' }, 1)
      .to($('.hero-scroll', root), { opacity: 1, y: 0, duration: .8 }, 1.3);
    wait.then(function () { tl.play(0); });

    /* floating + parallax (only after intro so props don't fight) */
    $$('.arch', root).forEach(function (a, i) {
      g.to(a, { y: i % 2 ? -10 : 10, duration: 3.2 + i * .6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
      g.to(a, { yPercent: -7 * (i + 1), ease: 'none', scrollTrigger: { trigger: $('.hero', root), start: 'top top', end: 'bottom top', scrub: true } });
    });
    g.to($('.hero-copy', root), { yPercent: 8, ease: 'none', scrollTrigger: { trigger: $('.hero', root), start: '30% top', end: 'bottom top', scrub: true } });
    if (fine) {
      var vis = $('.hero-visual', root), arts = $$('.arch-art', root);
      var qs = arts.map(function (a, i) { return [g.quickTo(a, 'x', { duration: .9, ease: 'power3' }), g.quickTo(a, 'y', { duration: .9, ease: 'power3' }), 10 + i * 8]; });
      var hero = $('.hero', root);
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        qs.forEach(function (q) { q[0](nx * q[2] * 2); q[1](ny * q[2]); });
      });
    }

    /* marquee reacts to scroll velocity */
    var track = $('.mq-track', root);
    if (track && track.getAnimations) {
      var an = track.getAnimations()[0];
      if (an) {
        var st = { r: 1 };
        ST.create({
          onUpdate: function (self) {
            var v = self.getVelocity() / 260;
            var target = (self.direction < 0 ? -1 : 1) * (1 + Math.min(Math.abs(v), 9));
            g.to(st, { r: target, duration: .35, overwrite: true, onUpdate: function () { an.playbackRate = st.r; } });
            g.to(st, { r: self.direction < 0 ? -1 : 1, duration: 1.4, delay: .35, onUpdate: function () { an.playbackRate = st.r; } });
          }
        });
      }
    }

    /* category tiles: art tilts toward the pointer */
    $$('.cat', root).forEach(function (c) {
      g.fromTo($('.cat-art', c), { yPercent: 8 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* pinned horizontal lookbook (desktop) */
    mm = g.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var pin = $('.lb-pin', root), tr = $('.lb-track', root);
      if (!pin || !tr) return;
      var dist = function () { return Math.max(0, tr.scrollWidth - window.innerWidth + 80); };
      g.to(tr, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });

    /* spotlight + sale band parallax */
    var spv = $('.spot-visual', root);
    if (spv) g.fromTo($('.spot-art', spv), { yPercent: 5 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: spv, start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.sale-band .sa', root).forEach(function (a, i) {
      g.fromTo(a, { yPercent: 6 + i * 3 }, { yPercent: -8 - i * 4, ease: 'none', scrollTrigger: { trigger: '.sale-band', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* story visual parallax */
    var sv = $('.story-visual', root);
    if (sv) {
      g.to($('.sv-a', sv), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: sv, start: 'top bottom', end: 'bottom top', scrub: true } });
      g.to($('.sv-b', sv), { yPercent: -22, ease: 'none', scrollTrigger: { trigger: sv, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  function pdp(root) {
    g.from($$('.gal-img', root), { opacity: 0, y: 40, duration: 1, stagger: .12, ease: 'power3.out', delay: .1 });
    g.from($$('.pdp-info .eyebrow, .pdp-title, .pdp-price, .pdp-blurb, .pdp-opt, .pdp-buy', root), { opacity: 0, y: 24, duration: .8, stagger: .07, ease: 'power3.out', delay: .15 });
  }

  /* re-run card entrance when a filtered grid is swapped in place */
  function grid(el) {
    if (!on || !el) return;
    var cards = $$('.card', el);
    g.fromTo(cards.slice(0, 16), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .6, stagger: .035, ease: 'power3.out', clearProps: 'opacity,transform' });
    ST.refresh();
  }

  /* quick crossfade when an illustration is swapped (colour change) */
  function swap(el) {
    if (!on || !el) return;
    g.fromTo(el, { opacity: 0, scale: .96, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: .55, ease: 'power3.out', clearProps: 'opacity,transform' });
  }

  /* ---------------- magnetic buttons ---------------- */
  function magnetic(root) {
    if (!on || !fine) return;
    $$('[data-magnetic]', root).forEach(function (el) {
      var xt = g.quickTo(el, 'x', { duration: .5, ease: 'elastic.out(1,.6)' }), yt = g.quickTo(el, 'y', { duration: .5, ease: 'elastic.out(1,.6)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xt((e.clientX - r.left - r.width / 2) * .22); yt((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('pointerleave', function () { xt(0); yt(0); });
    });
  }

  /* ---------------- cart feedback ---------------- */
  function bump() {
    var b = $('[data-act="cart-open"] .count');
    if (b && g) g.fromTo(b, { scale: 1.9 }, { scale: 1, duration: .6, ease: 'back.out(3)' });
  }
  function fly(src, p, ci) {
    var tgt = $('[data-act="cart-open"]');
    if (!on || !src || !tgt) return bump();
    var r = src.getBoundingClientRect(), t = tgt.getBoundingClientRect(), s = Math.min(150, Math.max(90, r.width * .5));
    var el = document.createElement('div');
    el.className = 'fly'; el.style.cssText = 'width:' + s + 'px;height:' + s * 1.25 + 'px;--tint:' + D.TINTS[p.tint];
    el.innerHTML = D.art(p, ci, 'front');
    document.body.appendChild(el);
    var x0 = r.left + r.width / 2 - s / 2, y0 = r.top + r.height / 2 - s * .625;
    var x1 = t.left + t.width / 2 - s / 2, y1 = t.top + t.height / 2 - s * .625;
    g.fromTo(el, { x: x0, y: y0, scale: 1, opacity: 1, rotate: 0 }, {
      keyframes: { x: [x0, (x0 + x1) / 2, x1], y: [y0, Math.min(y0, y1) - 90, y1], easeEach: 'power2.inOut' },
      scale: .12, opacity: .5, rotate: 18, duration: .9, ease: 'power2.in',
      onComplete: function () { el.remove(); bump(); }
    });
  }

  function init() {
    initChrome();
    initCursor();
    introReady = loader();
  }

  window.Anim = { init: init, view: view, kill: killView, grid: grid, fly: fly, bump: bump, swap: swap, on: on, reduced: reduced };
})();
