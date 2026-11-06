/* Renato — cart, wishlist, promo, orders. State lives in localStorage (no backend). */
(function () {
  'use strict';
  var CFG = window.RENATO, D = window.Data, T = window.I18N;
  var KEY = 'renato.state.v1';
  var listeners = {};
  var S = { cart: [], wish: [], promo: null, orders: [], recent: [] };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        ['cart', 'wish', 'orders', 'recent'].forEach(function (k) { if (Array.isArray(o[k])) S[k] = o[k]; });
        S.promo = o.promo || null;
      }
    } catch (e) {}
    // drop lines whose product no longer exists
    S.cart = S.cart.filter(function (l) { return D.bySlug[l.slug]; });
    S.wish = S.wish.filter(function (s) { return D.bySlug[s]; });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, a) { (listeners[evt] || []).forEach(function (f) { f(a); }); }

  function lineKey(slug, color, size) { return slug + '|' + color + '|' + size; }

  /* ---------- cart ---------- */
  function add(slug, color, size, qty) {
    qty = qty || 1;
    var key = lineKey(slug, color, size);
    var line = S.cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty = Math.min(10, line.qty + qty);
    else { line = { key: key, slug: slug, color: color, size: size, qty: qty }; S.cart.push(line); }
    save(); emit('cart', { added: key });
    return line;
  }
  function setQty(key, qty) {
    var line = S.cart.filter(function (l) { return l.key === key; })[0];
    if (!line) return;
    if (qty <= 0) return remove(key);
    line.qty = Math.min(10, qty);
    save(); emit('cart', {});
  }
  function remove(key) {
    S.cart = S.cart.filter(function (l) { return l.key !== key; });
    save(); emit('cart', {});
  }
  function clear() { S.cart = []; save(); emit('cart', {}); }
  function count() { return S.cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function lines() {
    return S.cart.map(function (l) {
      var p = D.bySlug[l.slug];
      var ci = Math.max(0, p.colors.map(function (c) { return c.k; }).indexOf(l.color));
      return { key: l.key, p: p, ci: ci, colorKey: l.color, size: l.size, qty: l.qty, total: p.price * l.qty };
    });
  }
  function subtotal() { return S.cart.reduce(function (n, l) { return n + D.bySlug[l.slug].price * l.qty; }, 0); }

  /* ---------- promo / shipping / totals ---------- */
  function applyPromo(code) {
    code = String(code || '').trim().toUpperCase();
    if (CFG.promos[code]) { S.promo = { code: code, pct: CFG.promos[code] }; save(); emit('cart', {}); return S.promo; }
    return null;
  }
  function clearPromo() { S.promo = null; save(); emit('cart', {}); }
  function discount() { return S.promo ? Math.round(subtotal() * S.promo.pct / 100) : 0; }
  function shipping(method) {
    var sub = subtotal() - discount();
    if (!S.cart.length || method === 'pickup') return 0;
    if (method === 'courier') return sub >= CFG.freeShippingFrom ? 0 : CFG.shipping.courier;
    if (method === 'regions') return sub >= CFG.freeShippingFrom ? 0 : CFG.shipping.regions;
    return 0;
  }
  function total(method) { return subtotal() - discount() + shipping(method); }
  function toFree() { return Math.max(0, CFG.freeShippingFrom - (subtotal() - discount())); }

  /* ---------- wishlist ---------- */
  function isWish(slug) { return S.wish.indexOf(slug) >= 0; }
  function toggleWish(slug) {
    var i = S.wish.indexOf(slug);
    if (i >= 0) S.wish.splice(i, 1); else S.wish.unshift(slug);
    save(); emit('wish', { slug: slug, on: i < 0 });
    return i < 0;
  }

  /* ---------- recently viewed ---------- */
  function seen(slug) {
    S.recent = [slug].concat(S.recent.filter(function (s) { return s !== slug; })).slice(0, 8);
    save();
  }

  /* ---------- orders ---------- */
  function newRef() {
    var d = new Date();
    var ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var abc = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', r = '';
    for (var i = 0; i < 4; i++) r += abc[Math.floor(Math.random() * abc.length)];
    return 'RN-' + ymd + '-' + r;
  }
  function createOrder(form) {
    var method = form.delivery;
    var order = {
      ref: newRef(), at: new Date().toISOString(), lang: T.getLang(),
      customer: { name: form.name, phone: form.phone, email: form.email || '' },
      delivery: { method: method, city: form.city || '', address: form.address || '' },
      payment: form.payment, comment: form.comment || '',
      promo: S.promo ? S.promo.code : '',
      items: lines().map(function (l) {
        return { sku: l.p.sku, name: l.p.name, type: l.p.type, color: l.colorKey, size: l.size, qty: l.qty, price: l.p.price };
      }),
      subtotal: subtotal(), discount: discount(), shipping: shipping(method), total: total(method), sent: false
    };
    S.orders.unshift(order);
    S.orders = S.orders.slice(0, 20);
    S.cart = []; S.promo = null;
    save(); emit('cart', {});
    return order;
  }
  function getOrder(ref) { return S.orders.filter(function (o) { return o.ref === ref; })[0]; }
  function markSent(ref) { var o = getOrder(ref); if (o) { o.sent = true; save(); } }

  function orderText(o) {
    var t = T.t, m = T.money;
    var typeName = function (x) { return t('type.' + x); };
    var out = [];
    out.push('Renato — ' + t('done.msg.h', { ref: o.ref }));
    out.push('');
    out.push(t('co.name') + ': ' + o.customer.name);
    out.push(t('co.phone') + ': ' + o.customer.phone);
    if (o.customer.email) out.push('Email: ' + o.customer.email);
    var dm = { courier: t('co.d.courier'), regions: t('co.d.regions'), pickup: t('co.d.pickup') }[o.delivery.method];
    out.push(t('co.delivery') + ': ' + dm);
    if (o.delivery.method !== 'pickup') out.push(t('co.address') + ': ' + [o.delivery.city, o.delivery.address].filter(Boolean).join(', '));
    var pm = { cod: t('co.p.cod'), card: t('co.p.card'), link: t('co.p.link') }[o.payment];
    out.push(t('co.payment') + ': ' + pm);
    out.push('');
    o.items.forEach(function (it, i) {
      out.push((i + 1) + '. ' + it.name + ' (' + typeName(it.type) + ') — ' + t('col.' + it.color) + ' / ' + (it.size === 'ONE' ? t('p.onesize') : it.size) + ' × ' + it.qty + ' — ' + m(it.price * it.qty) + '  [' + it.sku + ']');
    });
    out.push('');
    out.push(t('cart.sub') + ': ' + m(o.subtotal));
    if (o.discount) out.push(t('co.discount') + ': −' + m(o.discount) + (o.promo ? ' (' + o.promo + ')' : ''));
    out.push(t('co.shipping') + ': ' + (o.shipping ? m(o.shipping) : t('ui.free')));
    out.push(t('co.total') + ': ' + m(o.total));
    if (o.comment) { out.push(''); out.push(t('co.comment') + ': ' + o.comment); }
    return out.join('\n');
  }

  /* optional POST to a user-supplied endpoint; never blocks the UI */
  function postJSON(url, payload) {
    if (!url) return Promise.resolve(false);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.ok || r.type === 'opaque'; })
      .catch(function () { return false; });
  }

  /* ---------- newsletter ---------- */
  function subscribe(email) {
    try {
      var list = JSON.parse(localStorage.getItem('renato.subs') || '[]');
      if (list.indexOf(email) < 0) list.push(email);
      localStorage.setItem('renato.subs', JSON.stringify(list));
    } catch (e) {}
    return postJSON(CFG.newsletterEndpoint, { type: 'subscribe', email: email, at: new Date().toISOString() });
  }

  load();
  window.Store = {
    state: S, on: on, emit: emit,
    add: add, setQty: setQty, remove: remove, clear: clear, count: count, lines: lines, subtotal: subtotal,
    applyPromo: applyPromo, clearPromo: clearPromo, discount: discount, shipping: shipping, total: total, toFree: toFree,
    isWish: isWish, toggleWish: toggleWish, seen: seen,
    createOrder: createOrder, getOrder: getOrder, markSent: markSent, orderText: orderText, postJSON: postJSON, subscribe: subscribe
  };
})();
