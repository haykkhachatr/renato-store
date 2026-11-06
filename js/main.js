/* Renato — router + behaviour. Works from file:// and any static host (hash routing). */
(function () {
  'use strict';
  var T = window.I18N, t = T.t, D = window.Data, S = window.Store, U = window.UI, P = window.Pages, A = window.Anim, CFG = window.RENATO;
  var $ = U.$, $$ = U.$$, esc = U.esc;
  var view = $('#view');
  var shopState = null, firstRender = true, ignoreHash = false, pdpIO = null;

  /* ---------------- routing ---------------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var path = qi < 0 ? h : h.slice(0, qi), qs = qi < 0 ? '' : h.slice(qi + 1);
    return { seg: path.split('/').filter(Boolean), query: P.parseQuery(qs), path: path };
  }
  function resolve(r) {
    var s = r.seg, a = s[0], p;
    if (!a) return { name: 'home', html: P.home(), title: 'Renato — ' + t('hero.eyebrow') };
    if (a === 'shop') {
      var cat = s[1] || 'all';
      if (P.SHOP_CATS.indexOf(cat) < 0) cat = 'all';
      var f = P.filtersFromQuery(r.query);
      shopState = { cat: cat, f: f };
      return { name: 'shop', html: P.shop(cat, r.query), title: P.shopTitle(cat, f) + ' — Renato' };
    }
    if (a === 'p') {
      p = D.bySlug[s[1]];
      return { name: p ? 'product' : '404', html: P.product(s[1]), title: (p ? p.name + ' · ' + t('type.' + p.type) : t('nf.title')) + ' — Renato' };
    }
    if (a === 'wishlist') return { name: 'wishlist', html: P.wishlist(), title: t('w.title') + ' — Renato' };
    if (a === 'checkout') return { name: 'checkout', html: P.checkout(), title: t('co.title') + ' — Renato' };
    if (a === 'done') return { name: 'done', html: P.done(s[1]), title: t('done.title') + ' — Renato' };
    if (a === 'page' && T.has('pg.' + s[1])) return { name: 'info', html: P.info(s[1]), title: t('pg.' + s[1]) + ' — Renato' };
    return { name: '404', html: P.notFound(), title: t('nf.title') + ' — Renato' };
  }
  function markNav(r) {
    var cur = '#' + r.path;
    $$('#header .nav-link, #menu a').forEach(function (a) {
      var h = a.getAttribute('href');
      var match = h === cur || (h && r.seg[0] === 'shop' && h.indexOf('#/shop/' + (r.seg[1] || 'all')) === 0 && h.indexOf('?') < 0);
      if (match) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function render(opts) {
    opts = opts || {};
    var r = parseHash(), res = resolve(r);
    var apply = function () {
      A.kill();
      if (pdpIO) { pdpIO.disconnect(); pdpIO = null; }
      view.innerHTML = res.html;
      document.title = res.title;
      document.body.dataset.route = res.name;
      markNav(r);
      if (!opts.keepScroll) window.scrollTo(0, 0);
      post(res);
      A.view(view, res.name, firstRender);
      firstRender = false;
      if (!opts.initial && !opts.keepScroll) view.focus({ preventScroll: true });
    };
    if (!opts.initial && !opts.noTransition && document.startViewTransition && !A.reduced) {
      var vt = document.startViewTransition(apply);      // an aborted transition (e.g. viewport resize) must not surface as an error
      if (vt && vt.ready) vt.ready.catch(function () {});
      if (vt && vt.finished) vt.finished.catch(function () {});
      if (vt && vt.updateCallbackDone) vt.updateCallbackDone.catch(function () {});
    } else apply();
  }
  function post(res) {
    if (res.name === 'product') initPdp();
  }

  function initPdp() {
    var add = $('#pdp-add'), bar = $('#pdp-bar');
    if (add && bar && 'IntersectionObserver' in window) {
      var btn = $('button', bar);
      pdpIO = new IntersectionObserver(function (es) {
        var e = es[0], show = !e.isIntersecting && e.boundingClientRect.top < 0;
        bar.classList.toggle('on', show);
        bar.setAttribute('aria-hidden', show ? 'false' : 'true');
        btn.tabIndex = show ? 0 : -1;
      });
      pdpIO.observe(add);
    }
    var gal = $('#gallery');
    if (gal) gal.addEventListener('scroll', function () {
      var i = Math.round(gal.scrollLeft / Math.max(1, gal.clientWidth));
      var n = $('#gal-n'); if (n) n.textContent = Math.min(4, i + 1);
    }, { passive: true });
  }

  /* ---------------- shop filtering ---------------- */
  function setHash(h) {
    try { history.replaceState(null, '', h); }
    catch (e) { ignoreHash = true; location.replace(h); }
  }
  function updateShop() {
    var sh = $('.shop');
    if (!sh || !shopState) return;
    var cat = shopState.cat, f = shopState.f;
    var list = P.applyFilters(D.filterCat(cat), f);
    $('#shop-grid').innerHTML = P.shopGrid(list);
    $('#shop-count').textContent = t('ui.items', { n: list.length });
    $('#chips-x').innerHTML = P.activeChips(f);
    $('#filters-show').textContent = t('f.show', { n: list.length });
    $$('[data-act="f-toggle"]').forEach(function (b) { b.setAttribute('aria-pressed', f[b.dataset.k].indexOf(b.dataset.v) >= 0); });
    ['min', 'max'].forEach(function (k) { var i = $('[data-f="' + k + '"]'); if (i && document.activeElement !== i) i.value = f[k]; });
    var sale = $('[data-f="sale"]'); if (sale) sale.checked = f.sale;
    var sort = $('[data-f="sort"]'); if (sort) sort.value = f.sort;
    var n = f.type.length + f.size.length + f.color.length + (f.min ? 1 : 0) + (f.max ? 1 : 0) + (f.sale ? 1 : 0);
    var fb = $('.filter-btn'); if (fb) fb.innerHTML = U.icon('sliders') + t('f.filters') + (n ? ' (' + n + ')' : '');
    var qs = P.filtersToQuery(f);
    setHash('#/shop/' + cat + (qs ? '?' + qs : ''));
    A.grid($('#shop-grid'));
  }

  /* ---------------- helpers ---------------- */
  function rerenderLang() {
    U.renderChrome();
    render({ keepScroll: true, noTransition: true });
  }
  function setErr(id, msg) {
    var e = $('#' + id + '-err'), i = $('#' + id);
    if (e) e.textContent = msg || '';
    if (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
  }
  function validPhone(v) { var d = String(v || '').replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function updateCartUI() {
    U.updateCounts();
    if ($('#cart').classList.contains('open')) U.renderCart();
  }
  S.on('cart', updateCartUI);
  S.on('wish', function () { U.updateCounts(); });

  function setCardColor(card, ci) {
    var p = D.bySlug[card.dataset.slug];
    card.dataset.ci = ci;
    $('.a1', card).innerHTML = D.art(p, ci, 'front');
    var a2 = $('.a2', card); a2.innerHTML = ''; a2.setAttribute('data-lazy', 'back');
    $$('.sw', card).forEach(function (b, i) { b.setAttribute('aria-pressed', i === ci); });
  }
  function syncWish(slug, on) {
    $$('[data-act="wish"][data-slug="' + slug + '"]').forEach(function (b) {
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', t(on ? 'p.wish.rm' : 'p.wish'));
    });
  }
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext !== false) return navigator.clipboard.writeText(txt).catch(function () { return legacyCopy(txt); });
    return Promise.resolve(legacyCopy(txt));
  }
  function legacyCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------------- clicks ---------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#/"]');
    if (link && U.isOpen() && !link.hasAttribute('data-act') && link.closest('#menu, #search, #cart')) U.closeOverlay(true);

    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act, card, slug, p, ci;
    switch (act) {
      case 'lang':
        if (el.dataset.v !== T.getLang()) { T.setLang(el.dataset.v); if (U.isOpen()) U.closeOverlay(true); rerenderLang(); }
        break;
      case 'cart-open': U.openCart(); break;
      case 'cart-close': U.closeOverlay(el.tagName === 'A'); break;
      case 'menu-open': U.openMenu(); break;
      case 'menu-close': U.closeOverlay(); break;
      case 'search-open': U.openSearch(); break;
      case 'search-close': U.closeOverlay(el.tagName === 'A'); break;
      case 'search-term': {
        var inp = $('#search-input'); inp.value = el.dataset.label; inp.focus(); U.updateSearch(inp.value);
        break;
      }
      case 'top': window.scrollTo({ top: 0, behavior: A.reduced ? 'auto' : 'smooth' }); break;

      case 'wish':
        e.preventDefault();
        var on = S.toggleWish(el.dataset.slug);
        syncWish(el.dataset.slug, on);
        U.toast(t(on ? 'toast.wish.add' : 'toast.wish.rm'), 'heart');
        if (document.body.dataset.route === 'wishlist') render({ keepScroll: true, noTransition: true });
        break;

      case 'swatch':
        card = el.closest('.card'); setCardColor(card, +el.dataset.ci);
        break;
      case 'quick-toggle':
        el.closest('.card-media').classList.toggle('quick-open');
        break;
      case 'quick-add':
        card = el.closest('.card'); p = D.bySlug[el.dataset.slug]; ci = +card.dataset.ci;
        S.add(p.slug, p.colors[ci].k, el.dataset.size, 1);
        A.fly($('.a1', card), p, ci);
        U.toast(t('p.added'), 'check');
        $('.card-media', card).classList.remove('quick-open');
        break;

      case 'qty': {
        var line = S.state.cart.filter(function (l) { return l.key === el.dataset.key; })[0];
        if (line) S.setQty(line.key, line.qty + (+el.dataset.d));
        var again = $('#cart [data-act="qty"][data-key="' + el.dataset.key + '"][data-d="' + el.dataset.d + '"]');
        if (again) again.focus();
        break;
      }
      case 'remove': S.remove(el.dataset.key); break;

      case 'tab': {
        $$('.tabs [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', b === el); });
        var box = $('#arr-grid'); box.setAttribute('aria-labelledby', 'tab-' + el.dataset.v);
        box.innerHTML = P.grid(P.arrivalsList(el.dataset.v));
        A.grid(box);
        break;
      }

      case 'f-toggle': {
        if (!shopState) break;
        var arr = shopState.f[el.dataset.k], i = arr.indexOf(el.dataset.v);
        if (i < 0) arr.push(el.dataset.v); else arr.splice(i, 1);
        updateShop();
        break;
      }
      case 'f-remove': {
        if (!shopState) break;
        var k = el.dataset.k, f = shopState.f;
        if (k === 'min' || k === 'max') f[k] = ''; else if (k === 'sale') f.sale = false;
        else f[k].splice(f[k].indexOf(el.dataset.v), 1);
        updateShop();
        break;
      }
      case 'f-clear':
        if (!shopState) break;
        shopState.f.type = []; shopState.f.size = []; shopState.f.color = []; shopState.f.min = ''; shopState.f.max = ''; shopState.f.sale = false;
        updateShop();
        break;
      case 'filters-open': U.openOverlay('filters'); break;
      case 'filters-close': if (U.isOpen()) U.closeOverlay(); break;

      case 'pdp-color': {
        var pdp = el.closest('.pdp'); p = D.bySlug[pdp.dataset.slug]; ci = +el.dataset.ci;
        pdp.dataset.ci = ci;
        $$('[data-act="pdp-color"]', pdp).forEach(function (b, i) { b.setAttribute('aria-pressed', i === ci); });
        $('#color-name').textContent = t('col.' + p.colors[ci].k);
        var gal = $('#gallery'), cnt = $('.gal-count', gal);
        gal.innerHTML = P.pdpImages(p, ci); gal.appendChild(cnt);
        break;
      }
      case 'pdp-size':
        if (el.disabled) break;
        $$('#sizes .pill').forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
        $('.pdp').dataset.size = el.dataset.size;
        $('#size-name').textContent = el.dataset.size === 'ONE' ? t('p.onesize') : el.dataset.size;
        setErr('size', '');
        break;
      case 'spot-color': {
        var sp = el.closest('.spot'); p = D.bySlug[sp.dataset.slug]; ci = +el.dataset.ci;
        sp.dataset.ci = ci;
        $$('[data-act="spot-color"]', sp).forEach(function (b, i) { b.setAttribute('aria-pressed', i === ci); });
        $('#spot-color-name').textContent = t('col.' + p.colors[ci].k);
        var sa = $('.spot-art', sp); sa.innerHTML = D.art(p, ci, 'front');
        if (A.swap) A.swap(sa);
        break;
      }
      case 'spot-size': {
        if (el.disabled) break;
        var sp2 = el.closest('.spot');
        $$('#spot-sizes .pill', sp2).forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
        sp2.dataset.size = el.dataset.size;
        $('#spot-size-name').textContent = el.dataset.size === 'ONE' ? t('p.onesize') : el.dataset.size;
        $('#spot-err').textContent = '';
        break;
      }
      case 'spot-add': {
        var sp3 = el.closest('.spot'); p = D.bySlug[sp3.dataset.slug]; ci = +sp3.dataset.ci;
        var sz = sp3.dataset.size;
        if (!sz && p.sizes.length === 1 && p.oos.indexOf(p.sizes[0]) < 0) sz = p.sizes[0];
        if (!sz) {
          $('#spot-err').textContent = t('p.choose');
          var sbx = $('#spot-sizes'); sbx.classList.remove('shake'); void sbx.offsetWidth; sbx.classList.add('shake');
          break;
        }
        S.add(p.slug, p.colors[ci].k, sz, 1);
        A.fly($('.spot-art', sp3), p, ci);
        setTimeout(function () { U.openCart(); }, A.on ? 700 : 0);
        break;
      }
      case 'pdp-add':
      case 'pdp-add-bar': {
        var pd = $('.pdp'); p = D.bySlug[pd.dataset.slug]; ci = +pd.dataset.ci;
        if (D.soldOut(p)) break;
        var size = pd.dataset.size;
        if (!size && p.sizes.length === 1 && p.oos.indexOf(p.sizes[0]) < 0) size = p.sizes[0];
        if (!size) {
          var er = $('#size-err'); er.textContent = t('p.choose');
          var sb = $('#sizes'); sb.classList.remove('shake'); void sb.offsetWidth; sb.classList.add('shake');
          if (act === 'pdp-add-bar') sb.scrollIntoView({ behavior: 'smooth', block: 'center' });
          U.toast(t('toast.pick'), 'ruler');
          break;
        }
        S.add(p.slug, p.colors[ci].k, size, 1);
        A.fly($('#gallery .gal-img'), p, ci);
        setTimeout(function () { U.openCart(); }, A.on ? 700 : 0);
        break;
      }

      case 'order-sent': S.markSent(el.dataset.ref); break;
      case 'order-tg': {
        var o = S.getOrder(el.dataset.ref);
        if (o) { copyText(S.orderText(o)); U.toast(t('done.copied') + ' — Telegram', 'copy'); S.markSent(o.ref); }
        break;
      }
      case 'order-copy': {
        var oo = S.getOrder(el.dataset.ref);
        if (oo) { copyText(S.orderText(oo)); U.toast(t('done.copied'), 'check'); }
        break;
      }
    }
  });

  /* lazy second garment view on card hover */
  function lazyBack(e) {
    var m = e.target.closest && e.target.closest('.card-media');
    if (!m) return;
    var a2 = $('.a2[data-lazy]', m);
    if (a2 && !a2.firstChild) {
      var card = m.closest('.card'), p = D.bySlug[card.dataset.slug];
      a2.innerHTML = D.art(p, +card.dataset.ci, p.cat === 'accessories' ? 'detail' : 'back');   // accessories have no real "back"
    }
  }
  document.addEventListener('pointerover', lazyBack);
  document.addEventListener('focusin', lazyBack);

  /* PDP zoom origin */
  document.addEventListener('pointermove', function (e) {
    var z = e.target.closest && e.target.closest('[data-zoom]');
    if (!z) return;
    var r = z.getBoundingClientRect();
    z.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
    z.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true });

  /* ---------------- inputs ---------------- */
  var debounce;
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'search-input') { U.updateSearch(el.value); return; }
    if (el.getAttribute && el.getAttribute('aria-invalid') === 'true' && el.id && el.value) setErr(el.id, '');
    var fin = el.closest && el.closest('[data-form="finder"]');
    if (fin) finderCalc(fin);
    if (el.matches && el.matches('[data-f="min"],[data-f="max"]') && shopState) {
      clearTimeout(debounce);
      debounce = setTimeout(function () { shopState.f[el.dataset.f] = el.value.replace(/\D/g, ''); updateShop(); }, 350);
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    var fin2 = el.closest && el.closest('[data-form="finder"]');
    if (fin2) { finderCalc(fin2); return; }
    if (el.matches && el.matches('[data-f="sort"]') && shopState) { shopState.f.sort = el.value; updateShop(); }
    else if (el.matches && el.matches('[data-f="sale"]') && shopState) { shopState.f.sale = el.checked; updateShop(); }
    else if (el.name === 'delivery') {
      var m = el.value;
      var box = $('#addr-box'); if (box) box.hidden = m === 'pickup';
      var sum = $('#summary'); if (sum) sum.innerHTML = P.summaryHTML(m);
    }
  });

  /* ---------------- forms ---------------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.dataset.form, fd = new FormData(form);
    if (kind === 'search') {
      var q = (fd.get('q') || $('#search-input').value || '').trim();
      if (!q) return;
      U.closeOverlay(true);
      location.hash = '#/shop/all?q=' + encodeURIComponent(q);
    }
    if (kind === 'newsletter') {
      var em = String(fd.get('email') || '').trim(), msg = $('.nl-msg', form);
      if (!validEmail(em)) { msg.textContent = t('nl.err'); msg.className = 'nl-msg bad'; $('#nl-email').setAttribute('aria-invalid', 'true'); return; }
      $('#nl-email').removeAttribute('aria-invalid');
      S.subscribe(em);
      var code = Object.keys(CFG.promos)[0];
      msg.className = 'nl-msg ok'; msg.innerHTML = esc(t('nl.ok')) + ' <b>' + esc(code) + '</b>';
      form.reset();
    }
    if (kind === 'promo') {
      var res = S.applyPromo(fd.get('code'));
      var pm = $('#promo-msg');
      if (res) { var method = (document.querySelector('input[name="delivery"]:checked') || {}).value || 'courier'; $('#summary').innerHTML = P.summaryHTML(method); $('#promo-msg').className = 'promo-msg ok'; }
      else { pm.textContent = t('co.promo.bad'); pm.className = 'promo-msg bad'; }
    }
    if (kind === 'checkout') checkoutSubmit(form, fd);
    if (kind === 'finder') finderCalc(form);
    if (kind === 'contact') {
      var text = String(fd.get('msg') || '').trim();
      if (!text) { setErr('ct-msg', t('co.req')); return; }
      setErr('ct-msg', '');
      var nm = String(fd.get('name') || '').trim();
      window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent((nm ? nm + ': ' : '') + text), '_blank', 'noopener');
    }
  });

  /* rough size estimate from height + weight; recalculated live while typing */
  function finderCalc(form) {
    var fd = new FormData(form), h = +fd.get('h'), w = +fd.get('w'), out = $('#finder-out');
    if (!h || !w || h < 140 || h > 220 || w < 45 || w > 180) { out.textContent = ''; return; }
    var sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    var cuts = [62, 74, 86, 98];
    var idx = 0; cuts.forEach(function (c) { if (w >= c) idx++; });
    if (h >= 188) idx++; else if (h <= 170) idx--;
    idx = Math.max(0, Math.min(sizes.length - 1, idx));
    out.innerHTML = esc(t('size.result')) + ' <b>' + sizes[idx] + '</b>';
  }

  function checkoutSubmit(form, fd) {
    var v = function (k) { return String(fd.get(k) || '').trim(); };
    var method = v('delivery') || 'courier', ok = true, first = null;
    function need(id, bad, msg) {
      if (bad) { setErr(id, msg || t('co.req')); ok = false; if (!first) first = $('#' + id); } else setErr(id, '');
    }
    need('name', !v('name'));
    need('phone', !v('phone') ? true : !validPhone(v('phone')), !v('phone') ? t('co.req') : t('co.phone.bad'));
    need('email', v('email') && !validEmail(v('email')), t('nl.err'));
    if (method !== 'pickup') { need('city', !v('city')); need('address', !v('address')); }
    if (!ok) { if (first) first.focus(); return; }
    if (!S.lines().length) { location.hash = '#/checkout'; return; }
    var order = S.createOrder({ name: v('name'), phone: v('phone'), email: v('email'), delivery: method, city: v('city'), address: v('address'), payment: v('payment') || 'cod', comment: v('comment') });
    S.postJSON(CFG.orderEndpoint, { type: 'order', order: order }).then(function (sent) {
      if (sent) { S.markSent(order.ref); if (location.hash === '#/done/' + order.ref) render({ keepScroll: true, noTransition: true }); }
    });
    location.hash = '#/done/' + order.ref;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    window.Art.mountDefs();
    U.renderChrome();
    A.init();
    window.addEventListener('hashchange', function () {
      if (ignoreHash) { ignoreHash = false; return; }
      if (U.isOpen()) U.closeOverlay(true);
      render();
    });
    render({ initial: true });
    if (document.fonts && document.fonts.ready && window.ScrollTrigger) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }
  boot();
})();
