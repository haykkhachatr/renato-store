/* Renato — shared UI: header, mega menu, mobile menu, cart drawer, search, footer, toasts */
(function () {
  'use strict';
  var T = window.I18N, t = T.t, D = window.Data, S = window.Store, CFG = window.RENATO;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ICON = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.500A5.500 5.500 0 0 0 16.500 3c-1.800 0-3 .5-4.500 2-1.500-1.500-2.700-2-4.500-2A5.500 5.500 0 0 0 2 8.500c0 2.300 1.500 4 3 5.500l7 7Z"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    menu: '<path d="M4 8h16M4 16h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    truck: '<path d="M3 6.500h11v9.500H3zM14 9.500h4l3 3.200V16h-7z"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/>',
    ret: '<path d="M4 12a8 8 0 1 0 2.500-5.800L4 8.500"/><path d="M4 4v4.500h4.500"/>',
    wallet: '<path d="M4 7.500A2.500 2.500 0 0 1 6.500 5H18v3"/><path d="M4 7.500V17a2 2 0 0 0 2 2h13V8H6.500A2.500 2.500 0 0 1 4 7.500Z"/><circle cx="16" cy="13.500" r="1"/>',
    ruler: '<path d="m4 16 12-12 4 4L8 20z"/><path d="m8 12 2 2M11 9l2 2M14 6l2 2"/>',
    send: '<path d="m21 3-9.500 18-2.300-7.700L1.500 11 21 3Z"/><path d="m21 3-11.800 10.300"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    pin: '<path d="M12 21s7-5.500 7-11a7 7 0 1 0-14 0c0 5.500 7 11 7 11Z"/><circle cx="12" cy="10" r="2.500"/>',
    clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
    share: '<path d="M12 15V4m0 0L8 8m4-4 4 4"/><path d="M5 13v6h14v-6"/>',
    up: '<path d="M12 19V5m0 0-6 6m6-6 6 6"/>',
    spark: '<path d="M12 3c.6 4.800 3.200 7.400 8 8-4.800.6-7.400 3.200-8 8-.6-4.800-3.200-7.400-8-8 4.800-.6 7.400-3.200 8-8Z"/>'
  };
  function icon(n, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  /* The wordmark path uses a negative-y viewBox. The outer <svg> must use a 0-based box with the same
     width/height, otherwise <use> places the symbol outside the visible area. */
  function wmBox() { var p = window.LOGO.vb.split(' '); return '0 0 ' + p[2] + ' ' + p[3]; }
  function wm(cls) {
    return '<svg class="wm ' + (cls || '') + '" viewBox="' + wmBox() + '" aria-hidden="true" focusable="false"><use href="#wm"/></svg>';
  }
  function mountSymbols() {
    if ($('#wm-sym')) return;
    var d = document.createElement('div');
    d.id = 'wm-sym'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0"><symbol id="wm" viewBox="' + window.LOGO.vb + '"><path fill="currentColor" d="' + window.LOGO.d + '"/></symbol></svg>';
    document.body.insertBefore(d, document.body.firstChild);
    var ld = $('.ld-wm');                       // loader mark exists before the symbol does: rebuild it
    if (ld) { ld.setAttribute('viewBox', wmBox()); ld.innerHTML = '<use href="#wm"/>'; }
  }
  function thumb(p, ci, view) {
    return '<span class="thumb" style="--tint:' + D.TINTS[p.tint] + '">' + D.art(p, ci || 0, view || 'front') + '</span>';
  }
  function money(n) { return T.money(n); }
  function typeName(p) { return t('type.' + p.type); }

  /* ---------------- announcement ---------------- */
  function renderAnnounce() {
    var msgs = [t('ann.1', { amt: money(CFG.freeShippingFrom) }), t('ann.2'), t('ann.3')];
    $('#announce').innerHTML = '<div class="ann-track" aria-live="off">' + msgs.map(function (m, i) {
      return '<p class="ann-msg' + (i === 0 ? ' on' : '') + '">' + esc(m) + '</p>';
    }).join('') + '</div>';
  }

  /* ---------------- header + mega menu ---------------- */
  /* kind: 'clothing' (all garment groups) or 'accessories' */
  function megaHTML(kind) {
    var groups = D.GROUPS.filter(function (g) { return kind === 'accessories' ? g.key === 'accessories' : g.key !== 'accessories'; });
    var items = D.filterCat(kind);
    var cols = groups.map(function (g) {
      var types = g.types.filter(function (ty) { return items.some(function (p) { return p.type === ty; }); });
      if (!types.length) return '';
      return '<div class="mega-col"><h3><a href="#/shop/' + g.key + '">' + t('grp.' + g.key) + '</a></h3><ul>' + types.map(function (ty) {
        return '<li><a href="#/shop/all?type=' + ty + '">' + t('type.' + ty) + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');
    var hl = '<div class="mega-col"><h3>' + t('nav.featured') + '</h3><ul>' +
      '<li><a href="#/shop/' + kind + '">' + t('nav.all') + '</a></li>' +
      '<li><a href="#/shop/new">' + t('nav.new') + '</a></li>' +
      '<li><a href="#/shop/best">' + t('nav.best') + '</a></li>' +
      '<li><a href="#/shop/sale" class="sale-link">' + t('nav.sale') + '</a></li></ul></div>';
    var f = items.filter(function (p) { return p.tags.indexOf('new') >= 0; })[0] || items[0];
    var feat = f ? '<a class="mega-feature" href="#/p/' + f.slug + '"><span class="mf-art" style="--tint:' + D.TINTS[f.tint] + '">' + D.art(f, 0, 'front') + '</span>' +
      '<span class="mf-name">' + esc(f.name) + '</span><span class="mf-type">' + typeName(f) + ' · ' + money(f.price) + '</span></a>' : '';
    return '<div class="mega" role="group" aria-label="' + t('nav.' + kind) + '"><div class="mega-in wrap"><div class="mega-cols">' + cols + hl + '</div>' + feat + '</div></div>';
  }
  function renderHeader() {
    var lang = T.getLang();
    var langs = T.LANGS.map(function (l) {
      return '<button type="button" data-act="lang" data-v="' + l + '" aria-pressed="' + (l === lang) + '" aria-label="' + T.dict[l]['lang.' + l] + '">' + l.toUpperCase() + '</button>';
    }).join('');
    $('#header').innerHTML =
      '<div class="hdr-in">' +
      '<button type="button" class="icon-btn hdr-burger" data-act="menu-open" aria-label="' + t('ui.openmenu') + '" aria-haspopup="dialog">' + icon('menu') + '</button>' +
      '<a class="logo" href="#/" aria-label="Renato — ' + t('ui.home') + '">' + wm('') + '</a>' +
      '<nav class="nav" aria-label="' + t('ui.menu') + '"><ul>' +
      '<li><a class="nav-link" href="#/shop/new">' + t('nav.new') + '</a></li>' +
      '<li class="has-mega"><a class="nav-link" href="#/shop/clothing">' + t('nav.clothing') + '</a>' + megaHTML('clothing') + '</li>' +
      '<li class="has-mega"><a class="nav-link" href="#/shop/accessories">' + t('nav.accessories') + '</a>' + megaHTML('accessories') + '</li>' +
      '<li><a class="nav-link nav-sale" href="#/shop/sale">' + t('nav.sale') + '</a></li>' +
      '<li><a class="nav-link" href="#/page/about">' + t('nav.about') + '</a></li>' +
      '</ul></nav>' +
      '<div class="hdr-actions">' +
      '<button type="button" class="icon-btn" data-act="search-open" aria-label="' + t('ui.search') + '">' + icon('search') + '</button>' +
      '<div class="lang" role="group" aria-label="' + t('ui.lang') + '">' + langs + '</div>' +
      '<a class="icon-btn hdr-wish" href="#/wishlist" aria-label="' + t('ui.wishlist') + '">' + icon('heart') + '<span class="count" data-wish-count></span></a>' +
      '<button type="button" class="icon-btn" data-act="cart-open" aria-label="' + t('ui.cart') + '" aria-haspopup="dialog">' + icon('bag') + '<span class="count" data-cart-count></span></button>' +
      '</div></div>';
  }

  /* ---------------- mobile menu ---------------- */
  function renderMenu() {
    var lang = T.getLang();
    function sub(kind) {
      var items = D.filterCat(kind), links = '';
      D.GROUPS.forEach(function (g) {
        if ((kind === 'accessories') !== (g.key === 'accessories')) return;
        links += '<a href="#/shop/' + g.key + '" class="m-grp">' + t('grp.' + g.key) + '</a>';
        g.types.forEach(function (ty) {
          if (items.some(function (p) { return p.type === ty; })) links += '<a href="#/shop/all?type=' + ty + '">' + t('type.' + ty) + '</a>';
        });
      });
      return '<a href="#/shop/' + kind + '" class="m-all">' + t('nav.all') + '</a>' + links;
    }
    function acc(kind) {
      return '<details class="m-acc"><summary><span>' + t('nav.' + kind) + '</span>' + icon('chevron') + '</summary><div class="m-sub">' + sub(kind) + '</div></details>';
    }
    $('#menu').innerHTML =
      '<div class="menu-head"><a class="logo" href="#/" aria-label="Renato">' + wm('') + '</a>' +
      '<button type="button" class="icon-btn" data-act="menu-close" aria-label="' + t('ui.close') + '">' + icon('close') + '</button></div>' +
      '<nav class="menu-body" aria-label="' + t('ui.menu') + '">' +
      '<a class="m-link" href="#/shop/new">' + t('nav.new') + '</a>' + acc('clothing') + acc('accessories') +
      '<a class="m-link m-sale" href="#/shop/sale">' + t('nav.sale') + '</a>' +
      '<a class="m-link" href="#/wishlist">' + t('ui.wishlist') + '</a>' +
      '<a class="m-link" href="#/page/about">' + t('nav.about') + '</a></nav>' +
      '<div class="menu-foot"><div class="lang lang-lg" role="group" aria-label="' + t('ui.lang') + '">' +
      T.LANGS.map(function (l) { return '<button type="button" data-act="lang" data-v="' + l + '" aria-pressed="' + (l === lang) + '">' + T.dict[l]['lang.' + l] + '</button>'; }).join('') +
      '</div><p class="menu-contact"><a href="tel:' + CFG.phone.replace(/[^+\d]/g, '') + '">' + esc(CFG.phone) + '</a> · <a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a></p></div>';
  }

  /* ---------------- cart drawer ---------------- */
  function renderCart() {
    var lines = S.lines();
    var n = S.count();
    var free = CFG.freeShippingFrom, sub = S.subtotal() - S.discount();
    var pct = Math.min(100, Math.round(sub / free * 100));
    var shipMsg = !lines.length ? '' : (S.toFree() > 0 ? t('cart.ship.more', { amt: money(S.toFree()) }) : t('cart.ship.done'));
    var body;
    if (!lines.length) {
      body = '<div class="cart-empty"><span class="ce-ic">' + icon('bag') + '</span><h3>' + t('cart.empty') + '</h3><p>' + t('cart.empty.d') + '</p>' +
        '<a class="btn btn-primary" href="#/shop/all" data-act="cart-close">' + t('cart.keep') + '</a></div>';
    } else {
      body = '<ul class="cart-lines">' + lines.map(function (l) {
        var sz = l.size === 'ONE' ? t('p.onesize') : l.size;
        return '<li class="cart-line" data-key="' + esc(l.key) + '">' +
          '<a class="cl-thumb" href="#/p/' + l.p.slug + '" data-act="cart-close">' + thumb(l.p, l.ci) + '</a>' +
          '<div class="cl-info"><a class="cl-name" href="#/p/' + l.p.slug + '" data-act="cart-close">' + esc(l.p.name) + '</a>' +
          '<p class="cl-meta">' + typeName(l.p) + ' · ' + t('col.' + l.colorKey) + ' · ' + sz + '</p>' +
          '<div class="stepper" role="group" aria-label="' + t('cart.qty') + '">' +
          '<button type="button" data-act="qty" data-key="' + esc(l.key) + '" data-d="-1" aria-label="' + t('cart.dec') + '">' + icon('minus') + '</button>' +
          '<span aria-live="polite">' + l.qty + '</span>' +
          '<button type="button" data-act="qty" data-key="' + esc(l.key) + '" data-d="1" aria-label="' + t('cart.inc') + '">' + icon('plus') + '</button></div></div>' +
          '<div class="cl-side"><p class="cl-price">' + money(l.total) + '</p>' +
          '<button type="button" class="link-btn" data-act="remove" data-key="' + esc(l.key) + '">' + t('cart.remove') + '</button></div></li>';
      }).join('') + '</ul>';
    }
    $('#cart').innerHTML =
      '<div class="drawer-head"><h2 id="cart-title">' + t('cart.title') + (n ? ' <span class="muted">(' + n + ')</span>' : '') + '</h2>' +
      '<button type="button" class="icon-btn" data-act="cart-close" aria-label="' + t('ui.close') + '">' + icon('close') + '</button></div>' +
      (lines.length ? '<div class="ship-bar"><p>' + icon('truck') + '<span>' + shipMsg + '</span></p><div class="bar"><i style="width:' + pct + '%"></i></div></div>' : '') +
      '<div class="drawer-body">' + body + '</div>' +
      (lines.length ? '<div class="drawer-foot"><div class="row"><span>' + t('cart.sub') + '</span><strong>' + money(S.subtotal()) + '</strong></div>' +
        '<p class="note">' + t('cart.note') + '</p>' +
        '<a class="btn btn-primary btn-block" href="#/checkout" data-act="cart-close">' + t('cart.checkout') + icon('arrow') + '</a></div>' : '');
  }

  /* ---------------- search overlay ---------------- */
  var SUGG = ['coat', 'blazer', 'hoodie', 'jeans', 'sweater', 'black'];
  function renderSearch() {
    $('#search').innerHTML =
      '<div class="search-in wrap"><form class="search-form" role="search" data-form="search">' +
      icon('search') + '<input id="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t('s.placeholder')) + '" aria-label="' + t('ui.search') + '">' +
      '<button type="button" class="icon-btn" data-act="search-close" aria-label="' + t('ui.close') + '">' + icon('close') + '</button></form>' +
      '<div class="search-sugg"><span>' + t('s.sugg') + '</span>' + SUGG.map(function (s) {
        var label = D.COLORS[s] ? t('col.' + s) : t('type.' + s);
        return '<button type="button" data-act="search-term" data-v="' + s + '" data-label="' + esc(label) + '">' + esc(label) + '</button>';
      }).join('') + '</div><div id="search-out" class="search-out"></div></div>';
  }
  function searchHaystack(p) {
    var parts = [p.name, p.slug, p.type, t('type.' + p.type), p.group, t('grp.' + p.group)];
    p.colors.forEach(function (c) { parts.push(c.k, t('col.' + c.k)); });
    ['hy', 'en', 'ru'].forEach(function (l) { parts.push(T.dict[l]['type.' + p.type]); p.colors.forEach(function (c) { parts.push(T.dict[l]['col.' + c.k]); }); });
    return parts.join(' ').toLowerCase();
  }
  function searchProducts(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    var words = q.split(/\s+/);
    return D.products.filter(function (p) {
      var h = searchHaystack(p);
      return words.every(function (w) { return h.indexOf(w) >= 0; });
    });
  }
  function updateSearch(q) {
    var out = $('#search-out');
    if (!out) return;
    q = String(q || '').trim();
    if (!q) { out.innerHTML = ''; return; }
    var res = searchProducts(q);
    if (!res.length) { out.innerHTML = '<p class="search-none">' + esc(t('s.none', { q: q })) + '</p>'; return; }
    out.innerHTML = '<ul class="search-res">' + res.slice(0, 6).map(function (p) {
      return '<li><a href="#/p/' + p.slug + '" data-act="search-close">' + thumb(p, 0) +
        '<span class="sr-name">' + esc(p.name) + '</span><span class="sr-meta">' + typeName(p) + ' · ' + money(p.price) + '</span></a></li>';
    }).join('') + '</ul>' + '<a class="btn btn-ghost" href="#/shop/all?q=' + encodeURIComponent(q) + '" data-act="search-close">' + t('s.all') + ' (' + res.length + ')' + icon('arrow') + '</a>';
  }

  /* ---------------- footer ---------------- */
  function renderFooter() {
    var A = function (h, label) { return '<li><a href="' + h + '">' + label + '</a></li>'; };
    var tel = CFG.phone.replace(/[^+\d]/g, '');
    $('#footer').innerHTML =
      '<section class="newsletter" aria-labelledby="nl-title"><div class="wrap nl-in">' +
      '<div class="nl-copy" data-reveal><h2 id="nl-title" class="display">' + t('nl.title') + '</h2><p>' + t('nl.text', { pct: CFG.promos[Object.keys(CFG.promos)[0]] || 10 }) + '</p></div>' +
      '<form class="nl-form" data-form="newsletter" novalidate data-reveal><div class="nl-row"><label class="sr" for="nl-email">' + t('nl.email') + '</label>' +
      '<input id="nl-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="' + esc(t('nl.email')) + '" required>' +
      '<button class="btn btn-light" type="submit">' + t('nl.btn') + icon('arrow') + '</button></div>' +
      '<p class="nl-msg" role="status" aria-live="polite"></p><p class="nl-note">' + t('nl.note') + '</p></form></div></section>' +
      '<div class="foot wrap"><div class="foot-grid">' +
      '<div class="foot-brand">' + wm('foot-wm-s') + '<p>' + T.pick(CFG.address) + '</p><p>' + T.pick(CFG.hours) + '</p></div>' +
      '<div><h3>' + t('ft.shop') + '</h3><ul>' + A('#/shop/new', t('nav.new')) + A('#/shop/outer', t('grp.outer')) + A('#/shop/knit', t('grp.knit')) + A('#/shop/shirts', t('grp.shirts')) + A('#/shop/bottoms', t('grp.bottoms')) + A('#/shop/accessories', t('grp.accessories')) + A('#/shop/sale', t('nav.sale')) + '</ul></div>' +
      '<div><h3>' + t('ft.help') + '</h3><ul>' + A('#/page/size', t('pg.size')) + A('#/page/delivery', t('pg.delivery')) + A('#/page/returns', t('pg.returns')) + A('#/page/contact', t('pg.contact')) + '</ul></div>' +
      '<div><h3>' + t('ft.contact') + '</h3><ul>' +
      '<li><a href="tel:' + tel + '">' + esc(CFG.phone) + '</a></li><li><a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a></li>' +
      '<li><a href="' + CFG.instagram + '" target="_blank" rel="noopener">Instagram</a></li><li><a href="' + CFG.facebook + '" target="_blank" rel="noopener">Facebook</a></li><li><a href="' + CFG.tiktok + '" target="_blank" rel="noopener">TikTok</a></li></ul></div>' +
      '</div>' +
      '<div class="foot-big" aria-hidden="true">' + wm('foot-wm') + '</div>' +
      '<div class="foot-base"><p>© ' + new Date().getFullYear() + ' Renato. ' + t('ft.rights') + '</p>' +
      '<ul class="foot-legal">' + A('#/page/privacy', t('pg.privacy')) + A('#/page/terms', t('pg.terms')) + '</ul>' +
      '<div class="pay" aria-label="' + t('ft.pay') + '"><span>' + t('pay.cod') + '</span><span>' + t('pay.card') + '</span><span>' + t('pay.link') + '</span></div>' +
      '<button type="button" class="to-top" data-act="top">' + t('ui.top') + icon('up') + '</button></div></div>';
  }

  /* ---------------- counters, toasts, scroll lock ---------------- */
  function updateCounts() {
    var c = S.count(), w = S.state.wish.length;
    $$('[data-cart-count]').forEach(function (el) { el.textContent = c || ''; el.classList.toggle('has', c > 0); });
    $$('[data-wish-count]').forEach(function (el) { el.textContent = w || ''; el.classList.toggle('has', w > 0); });
    var cb = $('[data-act="cart-open"]'); if (cb) cb.setAttribute('aria-label', t('ui.cartn', { n: c }));
  }
  var toastTimer;
  function toast(msg, ic) {
    var box = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (ic ? icon(ic) : '') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 400); }, 2600);
  }
  var lockCount = 0;
  function lock(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.documentElement.classList.toggle('lock', lockCount > 0);
  }

  /* ---------------- overlays (drawer / menu / search) ---------------- */
  var openEl = null, lastFocus = null;
  function focusables(root) {
    return $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])', root).filter(function (e) { return e.offsetParent !== null || e === document.activeElement; });
  }
  function openOverlay(id, focusSel) {
    var el = $('#' + id);
    if (!el || el.classList.contains('open')) return;
    if (openEl) closeOverlay(true);
    lastFocus = document.activeElement;
    el.classList.add('open'); el.removeAttribute('inert'); el.setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('on');
    lock(true); openEl = el;
    var f = focusSel ? $(focusSel, el) : focusables(el)[0];
    if (f) f.focus({ preventScroll: true });                                   // immediately, so fast typing is not lost
    setTimeout(function () { if (f && document.activeElement !== f) f.focus({ preventScroll: true }); }, 80);
  }
  function closeOverlay(silent) {
    if (!openEl) return;
    openEl.classList.remove('open'); openEl.setAttribute('inert', ''); openEl.setAttribute('aria-hidden', 'true');
    $('#scrim').classList.remove('on');
    lock(false);
    var f = lastFocus; openEl = null;
    if (!silent && f && f.focus) f.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) {
    if (!openEl) return;
    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
    if (e.key === 'Tab') {
      var f = focusables(openEl);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function renderChrome() {
    mountSymbols();
    renderAnnounce(); renderHeader(); renderMenu(); renderCart(); renderSearch(); renderFooter(); updateCounts();
  }

  window.UI = {
    $: $, $$: $$, icon: icon, esc: esc, wm: wm, thumb: thumb, money: money, typeName: typeName,
    renderChrome: renderChrome, renderCart: renderCart, renderHeader: renderHeader, renderMenu: renderMenu, renderFooter: renderFooter, renderAnnounce: renderAnnounce, renderSearch: renderSearch,
    updateCounts: updateCounts, toast: toast, lock: lock,
    openCart: function () { renderCart(); openOverlay('cart'); },
    closeOverlay: closeOverlay, openMenu: function () { openOverlay('menu'); },
    openSearch: function () { openOverlay('search', '#search-input'); },
    isOpen: function () { return !!openEl; },
    openOverlay: openOverlay,
    searchProducts: searchProducts, updateSearch: updateSearch
  };
})();
