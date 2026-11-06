/* Renato — page renderers (return HTML strings) */
(function () {
  'use strict';
  var T = window.I18N, t = T.t, D = window.Data, S = window.Store, U = window.UI, CFG = window.RENATO;
  var esc = U.esc, icon = U.icon, money = U.money;

  function tint(p) { return D.TINTS[p.tint]; }
  function blurbKey(p) { return T.has('blurb.' + p.slug) ? 'blurb.' + p.slug : 'blurb.' + p.type; }   // a product may have its own description
  function typeName(p) { return t('type.' + p.type); }

  /* split a headline into masked words; *x* marks emphasis */
  function splitWords(str) {
    var parts = String(str).split(/(\*[^*]+\*)/).filter(Boolean), out = '', i = 0;
    parts.forEach(function (seg) {
      var em = seg.charAt(0) === '*';
      var txt = em ? seg.slice(1, -1) : seg;
      txt.split(/\s+/).filter(Boolean).forEach(function (w) {
        out += '<span class="w' + (em ? ' em' : '') + '"><span class="wi" style="--i:' + (i++) + '">' + esc(w) + '</span></span> ';
      });
    });
    return out.trim();
  }

  /* ---------- product card ---------- */
  function priceHTML(p) {
    return '<span class="price' + (p.old ? ' price-sale' : '') + '">' + money(p.price) + (p.old ? ' <s>' + money(p.old) + '</s>' : '') + '</span>';
  }
  function swatch(p, i, active, act) {
    var c = p.colors[i], hex = D.colorHex(c);
    return '<button type="button" class="sw' + (c.pat ? ' sw-pat' : '') + '" data-act="' + (act || 'swatch') + '" data-slug="' + p.slug + '" data-ci="' + i + '" aria-pressed="' + (i === active) + '" aria-label="' + t('col.' + c.k) + '" title="' + t('col.' + c.k) + '" style="--c:' + hex + (c.accent ? ';--a:' + c.accent : '') + '"></button>';
  }
  function card(p) {
    var out = D.soldOut(p), disc = D.discount(p), last = D.lastN(p), b = '';
    if (disc) b += '<span class="badge badge-sale">−' + disc + '%</span>';
    if (p.tags.indexOf('new') >= 0 && !disc) b += '<span class="badge">' + t('badge.new') + '</span>';
    if (last) b += '<span class="badge badge-dark">' + t('badge.last', { n: last }) + '</span>';
    if (out) b += '<span class="badge badge-dark">' + t('badge.out') + '</span>';
    var wish = S.isWish(p.slug);
    var sizes = p.sizes.map(function (s) {
      var dis = p.oos.indexOf(s) >= 0;
      return '<button type="button" class="chip" data-act="quick-add" data-slug="' + p.slug + '" data-size="' + s + '"' + (dis ? ' disabled' : '') + '>' + (s === 'ONE' ? t('p.onesize') : s) + '</button>';
    }).join('');
    var label = p.name + ' — ' + typeName(p);
    return '<article class="card' + (out ? ' is-out' : '') + '" data-slug="' + p.slug + '" data-ci="0">' +
      '<div class="card-media" style="--tint:' + tint(p) + '">' +
      '<a class="card-link" href="#/p/' + p.slug + '" aria-label="' + esc(label) + '" data-cursor="view"></a>' +
      '<div class="card-art a1" role="img" aria-label="' + esc(label) + '">' + D.art(p, 0, 'front') + '</div>' +
      '<div class="card-art a2" data-lazy="back" aria-hidden="true"></div>' +
      '<div class="badges">' + b + '</div>' +
      '<button type="button" class="wish' + (wish ? ' on' : '') + '" data-act="wish" data-slug="' + p.slug + '" aria-pressed="' + wish + '" aria-label="' + t(wish ? 'p.wish.rm' : 'p.wish') + '">' + icon('heart') + '</button>' +
      (out ? '' : '<div class="quick"><p>' + t('card.pick') + '</p><div class="quick-sizes">' + sizes + '</div></div>' +
        '<button type="button" class="q-plus" data-act="quick-toggle" aria-label="' + t('card.quick') + '">' + icon('plus') + '</button>') +
      '</div>' +
      '<div class="card-body"><div class="card-row"><h3 class="card-name"><a href="#/p/' + p.slug + '">' + esc(p.name) + '</a></h3>' + priceHTML(p) + '</div>' +
      '<div class="card-row"><span class="card-type">' + typeName(p) + '</span>' +
      (p.colors.length > 1 ? '<div class="swatches" role="group" aria-label="' + t('p.color') + '">' + p.colors.map(function (c, i) { return swatch(p, i, 0); }).join('') + '</div>' : '') +
      '</div></div></article>';
  }
  function grid(list, cls) {
    return '<div class="grid' + (cls ? ' ' + cls : '') + '" data-stagger>' + list.map(card).join('') + '</div>';
  }

  /* ---------- HOME ---------- */
  function arch(n, p, color, tintKey) {
    var ci = D.colorIndex(p, color);
    return '<a class="arch arch-' + n + '" href="#/p/' + p.slug + '" style="--tint:' + D.TINTS[tintKey] + '" data-cursor="view" aria-label="' + esc(p.name + ' — ' + typeName(p)) + '">' +
      '<span class="arch-art">' + D.art(p, ci, 'front') + '</span>' +
      '<span class="chip-tag"><b>' + esc(p.name) + '</b> ' + money(p.price) + '</span></a>';
  }
  function arrivalsList(tab) {
    var list;
    if (tab === 'best') list = D.filterCat('best');
    else if (tab === 'sale') list = D.filterCat('sale');
    else list = D.filterCat('new');
    list = list.slice().sort(function (a, b) { return b.added - a.added; });
    return list.slice(0, 8);
  }
  function catTile(key, p, color, tintKey) {
    var n = D.filterCat(key).length, ci = D.colorIndex(p, color);
    return '<a class="cat cat-' + key + '" href="#/shop/' + key + '" style="--tint:' + D.TINTS[tintKey] + '" data-cursor="view">' +
      '<span class="cat-art" aria-hidden="true">' + D.art(p, ci, 'front') + '</span>' +
      '<span class="cat-text"><span class="cat-n">' + t('ui.items', { n: n }) + '</span><span class="cat-t">' + t('grp.' + key) + '</span></span>' +
      '<span class="cat-go" aria-hidden="true">' + icon('arrowUR') + '</span></a>';
  }
  function look(l, idx) {
    var items = l.items.map(function (s) { return D.bySlug[s]; });
    var comp = items.map(function (p, i) {
      return '<span class="lk-art lk-' + (i + 1) + '">' + D.art(p, 0, 'front') + '</span>';
    }).join('');
    var list = items.map(function (p) {
      return '<li><a href="#/p/' + p.slug + '"><span class="lk-th">' + U.thumb(p, 0) + '</span><span class="lk-nm"><b>' + esc(p.name) + '</b><i>' + typeName(p) + '</i></span><span class="lk-pr">' + money(p.price) + '</span></a></li>';
    }).join('');
    return '<article class="look" data-look>' +
      '<div class="look-visual" style="--tint:' + D.TINTS[l.tint] + '"><span class="look-no">0' + (idx + 1) + '</span>' + comp + '</div>' +
      '<div class="look-info"><p class="eyebrow">' + t('look.items') + '</p><h3 class="display-s">' + t('look.' + l.id) + '</h3><ul class="look-list">' + list + '</ul></div></article>';
  }

  /* big "in focus" block: live colour / size picker for one product */
  function spotlight(p) {
    var sizes = p.sizes.map(function (s) {
      var dis = p.oos.indexOf(s) >= 0;
      return '<button type="button" class="pill pill-sq" data-act="spot-size" data-size="' + s + '"' + (dis ? ' disabled aria-disabled="true"' : '') + ' aria-pressed="false">' + (s === 'ONE' ? t('p.onesize') : s) + '</button>';
    }).join('');
    return '<section class="sec wrap spot" aria-labelledby="spot-t" data-slug="' + p.slug + '" data-ci="0">' +
      '<div class="spot-visual" style="--tint:' + tint(p) + '" data-reveal-img><span class="spot-mark" aria-hidden="true">' + esc(CFG.season) + '</span>' +
      '<a class="spot-art" href="#/p/' + p.slug + '" data-cursor="view" aria-label="' + esc(p.name + ' — ' + typeName(p)) + '">' + D.art(p, 0, 'front') + '</a></div>' +
      '<div class="spot-info"><p class="eyebrow" data-reveal>' + t('spot.eyebrow') + '</p>' +
      '<h2 id="spot-t" class="display" data-reveal>' + esc(p.name) + '<span class="spot-type">' + typeName(p) + '</span></h2>' +
      '<p class="pdp-price" data-reveal>' + priceHTML(p) + '</p>' +
      '<p class="lead" data-reveal>' + t(blurbKey(p)) + '</p>' +
      '<div class="pdp-opt" data-reveal><p class="opt-label">' + t('p.color') + ': <b id="spot-color-name">' + t('col.' + p.colors[0].k) + '</b></p>' +
      '<div class="swatches swatches-lg" role="group" aria-label="' + t('p.color') + '">' + p.colors.map(function (c, i) { return swatch(p, i, 0, 'spot-color'); }).join('') + '</div></div>' +
      '<div class="pdp-opt" data-reveal><p class="opt-label">' + t('p.size') + ': <b id="spot-size-name">—</b></p>' +
      '<div class="pills" role="group" aria-label="' + t('p.size') + '" id="spot-sizes">' + sizes + '</div><p class="field-err" id="spot-err" role="alert"></p></div>' +
      '<div class="spot-buy" data-reveal><button type="button" class="btn btn-primary btn-lg" data-act="spot-add" data-magnetic>' + t('p.add') + icon('bag') + '</button>' +
      '<a class="btn btn-ghost btn-lg" href="#/p/' + p.slug + '">' + t('spot.cta') + icon('arrow') + '</a></div></div></section>';
  }

  function saleBand() {
    var items = D.filterCat('sale').slice(0, 3);
    var art = items.map(function (p, i) {
      return '<span class="sa sa-' + (i + 1) + '" style="--tint:' + tint(p) + '">' + D.art(p, 0, 'front') + '</span>';
    }).join('');
    return '<section class="wrap sale-sec"><a class="sale-band" href="#/shop/sale" data-cursor="view" data-reveal>' +
      '<span class="sale-copy"><span class="eyebrow">' + t('sale.eyebrow') + '</span><span class="display">' + t('sale.title', { n: D.maxDiscount() }) + '</span>' +
      '<span class="sale-text">' + t('sale.text') + '</span><span class="btn btn-light">' + t('sale.cta') + icon('arrow') + '</span></span>' +
      '<span class="sale-art" aria-hidden="true">' + art + '</span></a></section>';
  }

  var MATS = [
    { k: 1, c: '#2F4058', pat: 'knit', href: '#/shop/knit' },
    { k: 2, c: '#3E5675', pat: 'twill', href: '#/shop/all?type=jeans' },
    { k: 3, c: '#CDBB9B', pat: 'weave', href: '#/shop/all?type=shirt' },
    { k: 4, c: '#E4DCCB', pat: 'rib', href: '#/shop/shirts' }
  ];
  function matCard(m) {
    var variant = window.Art.lum(m.c) < .45 ? 'l' : 'd';
    var pid = 'p-' + m.pat + '-' + variant;
    return '<li><a class="mat" href="' + m.href + '"><span class="mat-sw" aria-hidden="true"><svg viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice" focusable="false">' +
      '<rect width="360" height="270" fill="' + m.c + '"/><rect width="360" height="270" fill="url(#' + pid + ')" opacity=".2"/>' +
      '<rect width="360" height="270" fill="url(#g-shade)"/><rect width="360" height="270" fill="url(#g-vol)" opacity=".8"/></svg></span>' +
      '<span class="mat-t">' + t('mat.' + m.k + '.t') + '</span><span class="mat-d">' + t('mat.' + m.k + '.d') + '</span>' +
      '<span class="mat-go">' + t('mat.shop') + icon('arrow') + '</span></a></li>';
  }

  function home() {
    var B = D.bySlug;
    var mq = ['mq.1', 'mq.2', 'mq.3', 'mq.4', 'mq.5'].map(function (k) { return '<span class="mq-item">' + esc(t(k, { amt: money(CFG.freeShippingFrom) })) + '</span><span class="mq-sep" aria-hidden="true">' + icon('spark') + '</span>'; }).join('');
    var feats = [['truck', 1], ['ret', 2], ['wallet', 3], ['ruler', 4]].map(function (f) {
      return '<li class="feat">' + icon(f[0]) + '<h3>' + t('feat.' + f[1] + '.t') + '</h3><p>' + t('feat.' + f[1] + '.d') + '</p></li>';
    }).join('');
    var vals = [1, 2, 3].map(function (i) { return '<li><b>0' + i + '</b><div><h3>' + t('val.' + i + '.t') + '</h3><p>' + t('val.' + i + '.d') + '</p></div></li>'; }).join('');
    var perks = [t('mq.1', { amt: money(CFG.freeShippingFrom) }), t('mq.3'), t('feat.3.t')].map(function (x) { return '<li>' + icon('check') + esc(x) + '</li>'; }).join('');
    return '' +
      '<section class="hero" aria-labelledby="hero-title"><div class="wrap"><div class="hero-panel">' +
      '<svg class="hero-rings" viewBox="0 0 800 800" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor"><circle cx="400" cy="400" r="120"/><circle cx="400" cy="400" r="210"/><circle cx="400" cy="400" r="300"/><circle cx="400" cy="400" r="390"/></g></svg>' +
      '<div class="hero-grid"><div class="hero-copy"><p class="eyebrow hero-eye"><span class="dot"></span>' + t('hero.eyebrow') + '</p>' +
      '<h1 id="hero-title" class="hero-title">' + splitWords(t('hero.title')) + '</h1>' +
      '<p class="hero-sub">' + t('hero.sub') + '</p>' +
      '<div class="hero-cta"><a class="btn btn-light" data-magnetic href="#/shop/new">' + t('hero.cta1') + icon('arrow') + '</a><a class="btn btn-outline-light" data-magnetic href="#/shop/sale">' + t('hero.cta2') + '</a></div>' +
      '<ul class="hero-perks">' + perks + '</ul></div>' +
      '<div class="hero-visual" aria-label="' + t('nav.featured') + '">' +
      arch(1, B.carlo, 'camel', 'slate') + arch(2, B.paolo, 'navy', 'oat') + arch(3, B.matteo, 'grey', 'clay') +
      '<div class="spin" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="spinpath" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><text><textPath href="#spinpath" startOffset="0">RENATO · ' + esc(CFG.season) + ' · MENSWEAR · YEREVAN · </textPath></text></svg><span>' + icon('arrowUR') + '</span></div></div>' +
      '</div><div class="hero-scroll" aria-hidden="true"><span>' + t('hero.scroll') + '</span><i></i></div></div></div></section>' +

      '<section class="marquee" aria-hidden="true"><div class="mq-track"><div class="mq-row">' + mq + mq + '</div><div class="mq-row">' + mq + mq + '</div></div></section>' +

      '<section class="sec wrap cats" aria-labelledby="cats-t"><header class="sec-head" data-reveal><p class="eyebrow">' + t('cats.eyebrow') + '</p><h2 id="cats-t" class="display">' + t('cats.title') + '</h2></header>' +
      '<div class="cats-grid" data-stagger>' + catTile('outer', B.carlo, 'camel', 'slate') + catTile('knit', B.enzo, 'charcoal', 'clay') + catTile('shirts', B.fabio, 'navy', 'sage') + catTile('bottoms', B.tommaso, 'indigo', 'oat') + catTile('accessories', B.vito, 'brown', 'sand') + '</div></section>' +

      spotlight(B.lorenzo) +

      '<section class="sec wrap arrivals" aria-labelledby="arr-t"><header class="sec-head sec-head-row" data-reveal><div><p class="eyebrow">' + t('arr.eyebrow') + '</p><h2 id="arr-t" class="display">' + t('arr.title') + '</h2></div>' +
      '<div class="tabs" role="tablist">' + ['new', 'best', 'sale'].map(function (k, i) {
        return '<button type="button" role="tab" id="tab-' + k + '" aria-selected="' + (i === 0) + '" data-act="tab" data-v="' + k + '">' + t('tab.' + k) + '</button>';
      }).join('') + '</div></header>' +
      '<div id="arr-grid" role="tabpanel" aria-labelledby="tab-new">' + grid(arrivalsList('new')) + '</div>' +
      '<p class="center"><a class="btn btn-ghost" data-magnetic href="#/shop/all">' + t('ui.viewall') + icon('arrow') + '</a></p></section>' +

      saleBand() +

      '<section class="lookbook" aria-labelledby="lb-t"><div class="lb-pin"><header class="lb-head wrap"><div><p class="eyebrow">' + t('look.eyebrow') + '</p><h2 id="lb-t" class="display">' + t('look.title') + '</h2></div>' +
      '<p class="lb-hint">' + t('look.drag') + icon('arrow') + '</p></header>' +
      '<div class="lb-track" tabindex="0" role="region" aria-label="' + t('look.eyebrow') + '">' + D.LOOKS.map(look).join('') + '</div></div></section>' +

      '<section class="sec wrap mats" aria-labelledby="mat-t"><header class="sec-head" data-reveal><p class="eyebrow">' + t('mat.eyebrow') + '</p><h2 id="mat-t" class="display">' + t('mat.title') + '</h2><p class="lead">' + t('mat.lead') + '</p></header>' +
      '<ul class="mats-grid" data-stagger>' + MATS.map(matCard).join('') + '</ul></section>' +

      '<section class="sec wrap story" aria-labelledby="st-t"><div class="story-visual" data-reveal-img style="--tint:' + D.TINTS.stone + '"><span class="sv-a">' + D.art(B.carlo, 0, 'front') + '</span><span class="sv-b">' + D.art(B.olivo, 0, 'front') + '</span></div>' +
      '<div class="story-copy"><p class="eyebrow" data-reveal>' + t('story.eyebrow') + '</p><h2 id="st-t" class="display" data-reveal>' + t('story.title') + '</h2><p class="lead" data-reveal>' + t('story.text') + '</p>' +
      '<ol class="values" data-stagger>' + vals + '</ol><a class="btn btn-ghost" data-magnetic data-reveal href="#/page/about">' + t('story.cta') + icon('arrow') + '</a></div></section>' +

      '<section class="sec wrap"><ul class="feats" data-stagger>' + feats + '</ul></section>';
  }

  /* ---------- SHOP ---------- */
  var SHOP_CATS = ['all', 'new', 'best', 'sale', 'clothing'].concat(D.GROUP_KEYS);
  function parseQuery(qs) {
    var o = {};
    (qs || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = decodeURIComponent(kv.slice(0, i < 0 ? kv.length : i)), v = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
      o[k] = v;
    });
    return o;
  }
  function filtersFromQuery(q) {
    var arr = function (v) { return v ? v.split(',').filter(Boolean) : []; };
    return { type: arr(q.type), size: arr(q.size), color: arr(q.color), min: q.min || '', max: q.max || '', sale: q.sale === '1', sort: q.sort || 'featured', q: q.q || '' };
  }
  function filtersToQuery(f) {
    var p = [];
    if (f.q) p.push('q=' + encodeURIComponent(f.q));
    if (f.type.length) p.push('type=' + f.type.join(','));
    if (f.size.length) p.push('size=' + f.size.join(','));
    if (f.color.length) p.push('color=' + f.color.join(','));
    if (f.min) p.push('min=' + f.min);
    if (f.max) p.push('max=' + f.max);
    if (f.sale) p.push('sale=1');
    if (f.sort && f.sort !== 'featured') p.push('sort=' + f.sort);
    return p.join('&');
  }
  function applyFilters(base, f, skip) {
    var list = base.filter(function (p) {
      if (skip !== 'type' && f.type.length && f.type.indexOf(p.type) < 0) return false;
      if (skip !== 'size' && f.size.length && !f.size.some(function (s) { return p.sizes.indexOf(s) >= 0 && p.oos.indexOf(s) < 0; })) return false;
      if (skip !== 'color' && f.color.length && !p.colors.some(function (c) { return f.color.indexOf(c.k) >= 0; })) return false;
      if (f.min && p.price < +f.min) return false;
      if (f.max && p.price > +f.max) return false;
      if (f.sale && !p.old) return false;
      if (f.q && U.searchProducts(f.q).indexOf(p) < 0) return false;
      return true;
    });
    var s = f.sort;
    list.sort(function (a, b) {
      if (s === 'new') return b.added - a.added;
      if (s === 'asc') return a.price - b.price;
      if (s === 'desc') return b.price - a.price;
      if (s === 'disc') return D.discount(b) - D.discount(a) || a.order - b.order;
      return a.order - b.order;
    });
    return list;
  }
  function filterPanel(base, f) {
    var types = [], sizes = [], colors = [];
    base.forEach(function (p) {
      if (types.indexOf(p.type) < 0) types.push(p.type);
      p.sizes.forEach(function (s) { if (sizes.indexOf(s) < 0) sizes.push(s); });
      p.colors.forEach(function (c) { if (colors.indexOf(c.k) < 0) colors.push(c.k); });
    });
    var order = ['S', 'M', 'L', 'XL', 'XXL', '46', '48', '50', '52', '54', '30', '31', '32', '33', '34', '36', '85', '90', '95', '100', '105', '39-42', '43-46', 'ONE'];
    sizes.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    var allTypes = [];
    D.GROUPS.forEach(function (g) { g.types.forEach(function (ty) { if (types.indexOf(ty) >= 0) allTypes.push(ty); }); });
    var typeBtns = allTypes.map(function (ty) {
      return '<button type="button" class="pill" data-act="f-toggle" data-k="type" data-v="' + ty + '" aria-pressed="' + (f.type.indexOf(ty) >= 0) + '">' + t('type.' + ty) + '</button>';
    }).join('');
    var sizeBtns = sizes.map(function (s) {
      return '<button type="button" class="pill pill-sq" data-act="f-toggle" data-k="size" data-v="' + s + '" aria-pressed="' + (f.size.indexOf(s) >= 0) + '">' + (s === 'ONE' ? t('p.onesize') : s) + '</button>';
    }).join('');
    var colBtns = colors.map(function (k) {
      var hex = D.COLORS[k];
      return '<button type="button" class="sw sw-lg' + (k === 'stripe' ? ' sw-pat' : '') + '" data-act="f-toggle" data-k="color" data-v="' + k + '" aria-pressed="' + (f.color.indexOf(k) >= 0) + '" aria-label="' + t('col.' + k) + '" title="' + t('col.' + k) + '" style="--c:' + hex + ';--a:#27364D"></button>';
    }).join('');
    var maxP = Math.max.apply(null, base.map(function (p) { return p.price; }));
    return '<div class="f-group"><h3>' + t('f.type') + '</h3><div class="pills">' + typeBtns + '</div></div>' +
      '<div class="f-group"><h3>' + t('f.size') + '</h3><div class="pills">' + sizeBtns + '</div></div>' +
      '<div class="f-group"><h3>' + t('f.color') + '</h3><div class="swatches swatches-lg">' + colBtns + '</div></div>' +
      '<div class="f-group"><h3>' + t('f.price') + '</h3><div class="f-price"><label><span>' + t('f.min') + '</span><input type="number" inputmode="numeric" min="0" step="1000" data-f="min" value="' + esc(f.min) + '" placeholder="0"></label><i>—</i>' +
      '<label><span>' + t('f.max') + '</span><input type="number" inputmode="numeric" min="0" step="1000" data-f="max" value="' + esc(f.max) + '" placeholder="' + maxP + '"></label></div></div>' +
      '<div class="f-group"><label class="check"><input type="checkbox" data-f="sale"' + (f.sale ? ' checked' : '') + '><span class="box">' + icon('check') + '</span><span>' + t('f.sale') + '</span></label></div>';
  }
  function activeChips(f) {
    var chips = [];
    f.type.forEach(function (v) { chips.push(['type', v, t('type.' + v)]); });
    f.size.forEach(function (v) { chips.push(['size', v, v === 'ONE' ? t('p.onesize') : v]); });
    f.color.forEach(function (v) { chips.push(['color', v, t('col.' + v)]); });
    if (f.min) chips.push(['min', '', t('f.min') + ' ' + money(+f.min)]);
    if (f.max) chips.push(['max', '', t('f.max') + ' ' + money(+f.max)]);
    if (f.sale) chips.push(['sale', '', t('f.sale')]);
    var h = chips.map(function (c) { return '<button type="button" class="chip-x" data-act="f-remove" data-k="' + c[0] + '" data-v="' + esc(c[1]) + '">' + esc(c[2]) + icon('close') + '</button>'; }).join('');
    if (chips.length) h += '<button type="button" class="link-btn" data-act="f-clear">' + t('f.clear') + '</button>';
    return h;
  }
  function shopTitle(cat, f) {
    if (f.q) return t('shop.search', { q: f.q });
    if (D.GROUP_KEYS.indexOf(cat) >= 0) return t('grp.' + cat);
    return t('shop.' + cat);
  }
  function shop(cat, query) {
    if (SHOP_CATS.indexOf(cat) < 0) cat = 'all';
    var base = D.filterCat(cat);
    var f = filtersFromQuery(query);
    var list = applyFilters(base, f);
    var nF = f.type.length + f.size.length + f.color.length + (f.min ? 1 : 0) + (f.max ? 1 : 0) + (f.sale ? 1 : 0);
    var sortOpts = ['featured', 'new', 'asc', 'desc', 'disc'].map(function (k) { return '<option value="' + k + '"' + (f.sort === k ? ' selected' : '') + '>' + t('sort.' + k) + '</option>'; }).join('');
    var sub = f.q ? t('ui.items', { n: list.length }) : t('shop.sub.' + cat);
    return '<section class="page-head wrap"><nav class="crumbs" aria-label="breadcrumb"><a href="#/">' + t('ui.home') + '</a><span>/</span><span aria-current="page">' + esc(shopTitle(cat, f)) + '</span></nav>' +
      '<h1 class="display page-title" data-reveal>' + esc(shopTitle(cat, f)) + '</h1><p class="page-sub" data-reveal>' + esc(sub) + '</p></section>' +
      '<section class="shop wrap" data-cat="' + cat + '"><div class="shop-bar"><button type="button" class="btn btn-ghost btn-sm filter-btn" data-act="filters-open">' + icon('sliders') + t('f.filters') + (nF ? ' (' + nF + ')' : '') + '</button>' +
      '<p class="shop-total" id="shop-count" role="status">' + t('ui.items', { n: list.length }) + '</p>' +
      '<label class="sort"><span>' + t('f.sort') + '</span><select data-f="sort">' + sortOpts + '</select></label></div>' +
      '<div class="shop-layout"><aside class="filters" id="filters" aria-labelledby="filters-h"><h2 class="sr" id="filters-h">' + t('f.filters') + '</h2><div class="filters-head"><p class="head-like" aria-hidden="true">' + t('f.filters') + '</p><button type="button" class="icon-btn" data-act="filters-close" aria-label="' + t('ui.close') + '">' + icon('close') + '</button></div>' +
      '<div class="filters-body" id="filters-body">' + filterPanel(base, f) + '</div><div class="filters-foot"><button type="button" class="btn btn-primary btn-block" data-act="filters-close" id="filters-show">' + t('f.show', { n: list.length }) + '</button></div></aside>' +
      '<div class="shop-main"><h2 class="sr">' + t('shop.list') + '</h2><div class="chips-x" id="chips-x">' + activeChips(f) + '</div><div id="shop-grid">' + shopGrid(list) + '</div></div></div></section>';
  }
  function shopGrid(list) {
    if (!list.length) return '<div class="empty"><span class="ce-ic">' + icon('search') + '</span><h2>' + t('shop.empty') + '</h2><p>' + t('shop.empty.d') + '</p><button type="button" class="btn btn-ghost" data-act="f-clear">' + t('f.clear') + '</button></div>';
    return grid(list, 'grid-shop');
  }

  /* ---------- PRODUCT ---------- */
  function pdpImages(p, ci) {
    var views = ['front', 'back', 'detail'];
    var h = '', i;
    for (i = 0; i < 3; i++) {
      // photos may show close-ups instead of a back view: p.photoViews names what each photo is
      var cap = t('p.view.' + (D.hasPhotos(p) && p.photoViews ? p.photoViews[i] : i));
      h += '<figure class="gal-img' + (i === 0 ? ' gal-wide' : '') + '" style="--tint:' + tint(p) + '" data-zoom aria-label="' + esc(p.name + ' — ' + cap) + '">' + D.art(p, ci, views[i]) + '<figcaption>' + cap + '</figcaption></figure>';
    }
    // colour story (illustrations only): every colourway side by side
    if (!D.hasPhotos(p)) {
      var story = p.colors.slice(0, 3).map(function (c, k) { return '<span class="cs cs-' + k + '">' + D.art(p, k, 'front') + '</span>'; }).join('');
      h += '<figure class="gal-img gal-story" style="--tint:' + D.TINTS[p.tint === 'sand' ? 'stone' : 'sand'] + '" aria-label="' + esc(p.name + ' — ' + t('p.view.3')) + '">' + story + '<figcaption>' + t('p.view.3') + '</figcaption></figure>';
    }
    return h;
  }
  function related(p) {
    var pool = D.products.filter(function (x) { return x.slug !== p.slug; });
    var same = pool.filter(function (x) { return x.group === p.group; });
    same.sort(function (a, b) { return (b.type === p.type) - (a.type === p.type) || a.order - b.order; });
    return same.slice(0, 4);
  }
  function completeLook(p) {
    var look = D.LOOKS.filter(function (l) { return l.items.indexOf(p.slug) >= 0; })[0];
    if (look) return look.items.filter(function (s) { return s !== p.slug; }).map(function (s) { return D.bySlug[s]; }).slice(0, 4);
    var pool = p.group === 'accessories'
      ? D.products.filter(function (x) { return x.group === 'outer' || x.group === 'knit' || x.group === 'shirts'; })
      : D.products.filter(function (x) { return x.group === 'accessories' && x.slug !== p.slug; });
    return pool.slice(0, 3);
  }
  function product(slug) {
    var p = D.bySlug[slug];
    if (!p) return notFound(t('p.notfound'));
    S.seen(p.slug);
    var out = D.soldOut(p), disc = D.discount(p);
    var catKey = p.group;
    var sizes = p.sizes.map(function (s) {
      var dis = p.oos.indexOf(s) >= 0;
      return '<button type="button" class="pill pill-sq' + (s === 'ONE' ? ' pill-wide' : '') + '" data-act="pdp-size" data-size="' + s + '"' + (dis ? ' disabled aria-disabled="true"' : '') + ' aria-pressed="false">' + (s === 'ONE' ? t('p.onesize') : s) + '</button>';
    }).join('');
    var wish = S.isWish(p.slug);
    var rel = related(p), look = completeLook(p);
    var rec = S.state.recent.filter(function (s) { return s !== p.slug && D.bySlug[s]; }).slice(0, 4).map(function (s) { return D.bySlug[s]; });
    var lastN = D.lastN(p);
    return '<article class="pdp wrap" data-slug="' + p.slug + '" data-ci="0">' +
      '<nav class="crumbs" aria-label="breadcrumb"><a href="#/">' + t('ui.home') + '</a><span>/</span><a href="#/shop/' + catKey + '">' + t('grp.' + catKey) + '</a><span>/</span><span aria-current="page">' + esc(p.name) + '</span></nav>' +
      '<div class="pdp-grid"><div class="gallery" id="gallery" role="region" tabindex="0" aria-label="' + esc(p.name) + '">' + pdpImages(p, 0) + '<p class="gal-count" aria-hidden="true"><span id="gal-n">1</span>/' + (D.hasPhotos(p) ? 3 : 4) + '</p></div>' +
      '<div class="pdp-info"><div class="pdp-sticky-in">' +
      '<p class="eyebrow">' + typeName(p) + (p.tags.indexOf('new') >= 0 ? ' · ' + t('badge.new') : '') + '</p>' +
      '<h1 class="display pdp-title">' + esc(p.name) + '</h1>' +
      '<p class="pdp-price" id="pdp-price">' + priceHTML(p) + (disc ? '<span class="badge badge-sale">−' + disc + '%</span>' : '') + '</p>' +
      '<p class="pdp-blurb">' + t(blurbKey(p)) + '</p>' +
      '<div class="pdp-opt"><p class="opt-label">' + t('p.color') + ': <b id="color-name">' + t('col.' + p.colors[0].k) + '</b></p>' +
      '<div class="swatches swatches-lg" role="group" aria-label="' + t('p.color') + '">' + p.colors.map(function (c, i) { return swatch(p, i, 0, 'pdp-color'); }).join('') + '</div></div>' +
      '<div class="pdp-opt"><div class="opt-label opt-row"><span>' + t('p.size') + ': <b id="size-name">—</b></span><a class="link-btn" href="#/page/size">' + icon('ruler') + t('p.guide') + '</a></div>' +
      '<div class="pills" role="group" aria-label="' + t('p.size') + '" id="sizes">' + sizes + '</div><p class="field-err" id="size-err" role="alert"></p></div>' +
      (lastN ? '<p class="stock-warn">' + t('badge.last', { n: lastN }) + '</p>' : '') +
      '<div class="pdp-buy"><button type="button" class="btn btn-primary btn-lg btn-block" data-act="pdp-add" data-magnetic' + (out ? ' disabled' : '') + ' id="pdp-add">' + (out ? t('p.out') : t('p.add') + icon('bag')) + '</button>' +
      '<button type="button" class="btn-sq wish-lg' + (wish ? ' on' : '') + '" data-act="wish" data-slug="' + p.slug + '" aria-pressed="' + wish + '" aria-label="' + t(wish ? 'p.wish.rm' : 'p.wish') + '">' + icon('heart') + '</button></div>' +
      '<ul class="pdp-perks"><li>' + icon('truck') + t('feat.1.d') + '</li><li>' + icon('ret') + t('feat.2.d') + '</li></ul>' +
      '<div class="acc-list">' +
      '<details open><summary>' + t('p.desc') + icon('chevron') + '</summary><div class="acc-body"><p>' + t(blurbKey(p)) + '</p><dl class="specs"><div><dt>' + t('p.fit') + '</dt><dd>' + t('fit.' + p.fit) + '</dd></div><div><dt>' + t('p.sku') + '</dt><dd>' + p.sku + '</dd></div></dl></div></details>' +
      '<details><summary>' + t('p.fabric') + icon('chevron') + '</summary><div class="acc-body"><p>' + t('fab.' + p.fabric) + '</p><p>' + t('care.' + p.care) + '</p></div></details>' +
      '<details><summary>' + t('p.ship') + icon('chevron') + '</summary><div class="acc-body"><p>' + t('p.ship.t', { amt: money(CFG.freeShippingFrom) }) + '</p></div></details></div>' +
      (CFG.draftNotes ? '<p class="ph-note">' + t('p.placeholder') + '</p>' : '') +
      '</div></div></div>' +
      (look.length ? '<section class="sec pdp-more"><header class="sec-head" data-reveal><h2 class="display-s">' + t('p.look') + '</h2></header>' + grid(look) + '</section>' : '') +
      '<section class="sec pdp-more"><header class="sec-head" data-reveal><h2 class="display-s">' + t('p.like') + '</h2></header>' + grid(rel) + '</section>' +
      (rec.length ? '<section class="sec pdp-more"><header class="sec-head" data-reveal><h2 class="display-s">' + t('p.recent') + '</h2></header>' + grid(rec) + '</section>' : '') +
      '</article>' +
      '<div class="pdp-bar" id="pdp-bar" aria-hidden="true"><div><b>' + esc(p.name) + '</b><span>' + money(p.price) + '</span></div><button type="button" class="btn btn-primary" data-act="pdp-add-bar" tabindex="-1">' + (out ? t('p.out') : t('p.add')) + '</button></div>';
  }

  /* ---------- WISHLIST ---------- */
  function wishlist() {
    var list = S.state.wish.map(function (s) { return D.bySlug[s]; }).filter(Boolean);
    return '<section class="page-head wrap"><h1 class="display page-title" data-reveal>' + t('w.title') + '</h1><p class="page-sub">' + (list.length ? t('ui.items', { n: list.length }) : '') + '</p></section>' +
      '<section class="wrap sec-tight">' + (list.length ? '<h2 class="sr">' + t('shop.list') + '</h2>' + grid(list) : '<div class="empty"><span class="ce-ic">' + icon('heart') + '</span><h2>' + t('w.empty') + '</h2><p>' + t('w.empty.d') + '</p><a class="btn btn-primary" href="#/shop/all">' + t('cart.keep') + '</a></div>') + '</section>';
  }

  /* ---------- CHECKOUT ---------- */
  function summaryHTML(method) {
    var lines = S.lines();
    var ship = S.shipping(method);
    var rows = lines.map(function (l) {
      var sz = l.size === 'ONE' ? t('p.onesize') : l.size;
      return '<li><span class="so-th">' + U.thumb(l.p, l.ci) + '<i>' + l.qty + '</i></span><span class="so-nm"><b>' + esc(l.p.name) + '</b><em>' + typeName(l.p) + ' · ' + t('col.' + l.colorKey) + ' · ' + sz + '</em></span><span class="so-pr">' + money(l.total) + '</span></li>';
    }).join('');
    return '<ul class="sum-lines">' + rows + '</ul>' +
      '<form class="promo" data-form="promo" novalidate><label class="sr" for="promo-in">' + t('co.promo') + '</label><input id="promo-in" name="code" type="text" autocomplete="off" placeholder="' + esc(t('co.promo')) + '" value="' + esc(S.state.promo ? S.state.promo.code : '') + '"><button class="btn btn-ghost btn-sm" type="submit">' + t('co.apply') + '</button></form>' +
      '<p class="promo-msg" role="status" id="promo-msg">' + (S.state.promo ? esc(t('co.promo.ok', { pct: S.state.promo.pct })) : '') + '</p>' +
      '<dl class="sum-tot"><div><dt>' + t('cart.sub') + '</dt><dd>' + money(S.subtotal()) + '</dd></div>' +
      (S.discount() ? '<div class="disc"><dt>' + t('co.discount') + '</dt><dd>−' + money(S.discount()) + '</dd></div>' : '') +
      '<div><dt>' + t('co.shipping') + '</dt><dd>' + (ship ? money(ship) : t('ui.free')) + '</dd></div>' +
      '<div class="grand"><dt>' + t('co.total') + '</dt><dd>' + money(S.total(method)) + '</dd></div></dl>';
  }
  function radio(name, val, label, desc, checked, extra) {
    return '<label class="opt"><input type="radio" name="' + name + '" value="' + val + '"' + (checked ? ' checked' : '') + '><span class="opt-box"><span class="opt-t">' + label + '</span>' + (desc ? '<span class="opt-d">' + desc + '</span>' : '') + (extra ? '<span class="opt-x">' + extra + '</span>' : '') + '</span></label>';
  }
  function checkout() {
    if (!S.lines().length) {
      return '<section class="page-head wrap"><h1 class="display page-title">' + t('co.title') + '</h1></section><section class="wrap sec-tight"><div class="empty"><span class="ce-ic">' + icon('bag') + '</span><h2>' + t('co.empty') + '</h2><a class="btn btn-primary" href="#/shop/all">' + t('cart.keep') + '</a></div></section>';
    }
    var fee = function (m) { var v = S.shipping(m); return v ? money(v) : t('ui.free'); };
    function fld(id, label, attrs, req) {
      return '<div class="fld"><label for="' + id + '">' + label + (req ? ' <abbr title="*">*</abbr>' : '') + '</label><input id="' + id + '" name="' + id + '" ' + attrs + '><p class="field-err" id="' + id + '-err" role="alert"></p></div>';
    }
    return '<section class="page-head wrap"><h1 class="display page-title" data-reveal>' + t('co.title') + '</h1></section>' +
      '<section class="wrap sec-tight co"><form class="co-form" data-form="checkout" novalidate>' +
      '<fieldset><legend>1. ' + t('co.contact') + '</legend>' + fld('name', t('co.name'), 'type="text" autocomplete="name" required', true) +
      '<div class="two">' + fld('phone', t('co.phone'), 'type="tel" inputmode="tel" autocomplete="tel" placeholder="+374 ..." required', true) + fld('email', t('co.email'), 'type="email" inputmode="email" autocomplete="email"') + '</div></fieldset>' +
      '<fieldset><legend>2. ' + t('co.delivery') + '</legend><div class="opts">' +
      radio('delivery', 'courier', t('co.d.courier'), t('co.d.courier.d'), true, '<span data-fee="courier">' + fee('courier') + '</span>') +
      radio('delivery', 'regions', t('co.d.regions'), t('co.d.regions.d'), false, '<span data-fee="regions">' + fee('regions') + '</span>') +
      radio('delivery', 'pickup', t('co.d.pickup'), t('co.d.pickup.d'), false, '<span>' + t('ui.free') + '</span>') + '</div>' +
      '<div id="addr-box"><div class="two">' + fld('city', t('co.city'), 'type="text" autocomplete="address-level2" value="' + (T.getLang() === 'hy' ? 'Երևան' : T.getLang() === 'ru' ? 'Ереван' : 'Yerevan') + '"', true) + '<div></div></div>' +
      fld('address', t('co.address'), 'type="text" autocomplete="street-address"', true) + '</div>' +
      '<div class="fld"><label for="comment">' + t('co.comment') + '</label><textarea id="comment" name="comment" rows="3"></textarea></div></fieldset>' +
      '<fieldset><legend>3. ' + t('co.payment') + '</legend><div class="opts">' +
      radio('payment', 'cod', t('co.p.cod'), '', true) + radio('payment', 'card', t('co.p.card'), '', false) + radio('payment', 'link', t('co.p.link'), '', false) + '</div></fieldset>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit" data-magnetic>' + t('co.place') + icon('arrow') + '</button><p class="co-secure">' + t('co.secure') + '</p></form>' +
      '<aside class="summary" aria-label="' + t('co.summary') + '"><h2 class="display-s">' + t('co.summary') + '</h2><div id="summary">' + summaryHTML('courier') + '</div></aside></section>';
  }
  function sendLinks(o) {
    var text = S.orderText(o);
    var enc = encodeURIComponent(text);
    return {
      wa: 'https://wa.me/' + CFG.whatsapp + '?text=' + enc,
      tg: 'https://t.me/' + CFG.telegram,
      mail: 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Renato — ' + o.ref) + '&body=' + enc,
      text: text
    };
  }
  function done(ref) {
    var o = S.getOrder(ref);
    if (!o) return notFound(t('nf.text'));
    var L = sendLinks(o);
    return '<section class="wrap done"><div class="done-card"><span class="done-ic">' + icon('check') + '</span>' +
      '<p class="eyebrow">' + t('done.ref') + '</p><h1 class="display done-ref">' + esc(o.ref) + '</h1>' +
      '<p class="lead">' + (o.sent ? t('done.received') : t('done.text')) + '</p>' +
      '<div class="done-btns"><a class="btn btn-primary" data-act="order-sent" data-ref="' + o.ref + '" href="' + L.wa + '" target="_blank" rel="noopener">' + icon('send') + t('done.wa') + '</a>' +
      '<a class="btn btn-ghost" data-act="order-tg" data-ref="' + o.ref + '" href="' + L.tg + '" target="_blank" rel="noopener">' + icon('send') + t('done.tg') + '</a>' +
      '<a class="btn btn-ghost" data-act="order-sent" data-ref="' + o.ref + '" href="' + L.mail + '">' + icon('mail') + t('done.mail') + '</a>' +
      '<button type="button" class="btn btn-ghost" data-act="order-copy" data-ref="' + o.ref + '">' + icon('copy') + t('done.copy') + '</button></div>' +
      '<pre class="order-text" tabindex="0">' + esc(L.text) + '</pre>' +
      '<p class="center"><a class="link-btn" href="#/">' + t('done.home') + '</a></p></div></section>';
  }

  /* ---------- INFO PAGES ---------- */
  /* ⚠ generic values: check them against your real patterns */
  var SIZES = [['S · 46', '88–92', '74–78', '92–96'], ['M · 48', '92–96', '78–82', '96–100'], ['L · 50', '96–102', '82–88', '100–106'], ['XL · 52', '102–108', '88–94', '106–112'], ['XXL · 54', '108–114', '94–100', '112–118']];
  function sizeTable() {
    return '<div class="tbl-wrap"><table class="tbl"><caption>' + t('size.men') + '</caption><thead><tr><th scope="col">' + t('size.size') + '</th><th scope="col">' + t('size.chest') + '</th><th scope="col">' + t('size.waist') + '</th><th scope="col">' + t('size.hips') + '</th></tr></thead><tbody>' +
      SIZES.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function block(h, p) { return '<div class="info-block" data-reveal><h2>' + h + '</h2><p>' + p + '</p></div>'; }
  function infoShell(title, lead, inner, draft) {
    return '<section class="page-head wrap"><nav class="crumbs" aria-label="breadcrumb"><a href="#/">' + t('ui.home') + '</a><span>/</span><span aria-current="page">' + esc(title) + '</span></nav>' +
      '<h1 class="display page-title" data-reveal>' + esc(title) + '</h1>' + (lead ? '<p class="page-sub" data-reveal>' + lead + '</p>' : '') + '</section>' +
      '<section class="wrap sec-tight info">' + (draft && CFG.draftNotes ? '<p class="draft-note">' + t('page.draft') + '</p>' : '') + inner + '</section>';
  }
  function info(name) {
    var fee = money(CFG.shipping.courier), feeR = money(CFG.shipping.regions), amt = money(CFG.freeShippingFrom);
    var tel = CFG.phone.replace(/[^+\d]/g, '');
    if (name === 'about') {
      return infoShell(t('pg.about'), t('about.lead'),
        '<div class="about-grid"><div>' + block(t('about.h1'), t('about.p1')) + block(t('about.h2'), t('about.p2') + '<br><br>' + esc(T.pick(CFG.address)) + '<br>' + esc(T.pick(CFG.hours))) + '</div>' +
        '<ol class="values values-lg">' + [1, 2, 3].map(function (i) { return '<li data-reveal><b>0' + i + '</b><div><h3>' + t('val.' + i + '.t') + '</h3><p>' + t('val.' + i + '.d') + '</p></div></li>'; }).join('') + '</ol></div>', true);
    }
    if (name === 'size') {
      return infoShell(t('pg.size'), t('size.lead'),
        '<div class="size-grid"><div>' + sizeTable() + '</div>' +
        '<form class="finder" data-form="finder" novalidate><h2 class="display-s">' + t('size.finder') + '</h2><p class="muted">' + t('size.finder.d') + '</p>' +
        '<div class="two"><div class="fld"><label for="fh">' + t('size.height') + '</label><input id="fh" name="h" type="number" inputmode="numeric" min="130" max="220" placeholder="170"></div>' +
        '<div class="fld"><label for="fw">' + t('size.weight') + '</label><input id="fw" name="w" type="number" inputmode="numeric" min="35" max="180" placeholder="62"></div></div>' +
        '<p class="finder-out" id="finder-out" role="status" aria-live="polite"></p><p class="muted small">' + t('size.hint') + '</p></form></div>', true);
    }
    if (name === 'delivery') {
      return infoShell(t('pg.delivery'), '', '<div class="info-cols">' + block(t('del.h1'), t('del.p1', { fee: fee, amt: amt })) + block(t('del.h2'), t('del.p2', { fee: feeR })) + block(t('del.h3'), t('del.p3')) + block(t('del.h4'), t('del.p4')) + '</div>', true);
    }
    if (name === 'returns') {
      return infoShell(t('pg.returns'), '', '<div class="info-cols">' + block(t('ret.h1'), t('ret.p1')) + block(t('ret.h2'), t('ret.p2')) + block(t('ret.h3'), t('ret.p3')) + '</div>', true);
    }
    if (name === 'privacy') {
      return infoShell(t('pg.privacy'), '', '<div class="info-cols">' + block(t('priv.h1'), t('priv.p1')) + block(t('priv.h2'), t('priv.p2')) + '</div>', true);
    }
    if (name === 'terms') {
      return infoShell(t('pg.terms'), '', '<div class="info-cols">' + block(t('terms.h1'), t('terms.p1')) + block(t('terms.h2'), t('terms.p2')) + '</div>', true);
    }
    if (name === 'contact') {
      var addr = T.pick(CFG.address);
      return infoShell(t('pg.contact'), t('ct.lead'),
        '<div class="contact-grid"><ul class="ct-list">' +
        '<li>' + icon('phone') + '<div><span>' + t('ct.phone') + '</span><a href="tel:' + tel + '">' + esc(CFG.phone) + '</a></div></li>' +
        '<li>' + icon('mail') + '<div><span>' + t('ct.email') + '</span><a href="mailto:' + CFG.email + '">' + esc(CFG.email) + '</a></div></li>' +
        '<li>' + icon('pin') + '<div><span>' + t('ct.address') + '</span><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr) + '" target="_blank" rel="noopener">' + esc(addr) + '</a></div></li>' +
        '<li>' + icon('clock') + '<div><span>' + t('ct.hours') + '</span><b>' + esc(T.pick(CFG.hours)) + '</b></div></li></ul>' +
        '<form class="ct-form" data-form="contact" novalidate><h2 class="display-s">' + t('ct.write') + '</h2><div class="fld"><label for="ct-name">' + t('co.name') + '</label><input id="ct-name" name="name" type="text" autocomplete="name"></div>' +
        '<div class="fld"><label for="ct-msg">' + t('ct.msg') + '</label><textarea id="ct-msg" name="msg" rows="5" required></textarea><p class="field-err" id="ct-msg-err" role="alert"></p></div>' +
        '<button class="btn btn-primary" type="submit">' + icon('send') + t('ct.send') + '</button></form></div>', true);
    }
    return notFound();
  }

  function notFound(text) {
    return '<section class="wrap nf"><p class="eyebrow">404</p><h1 class="display">' + t('nf.title') + '</h1><p class="lead">' + (text || t('nf.text')) + '</p><a class="btn btn-primary" href="#/">' + t('done.home') + icon('arrow') + '</a></section>';
  }

  window.Pages = {
    home: home, shop: shop, shopGrid: shopGrid, product: product, wishlist: wishlist, checkout: checkout, done: done, info: info, notFound: notFound,
    card: card, grid: grid, arrivalsList: arrivalsList, pdpImages: pdpImages, summaryHTML: summaryHTML, sendLinks: sendLinks,
    parseQuery: parseQuery, filtersFromQuery: filtersFromQuery, filtersToQuery: filtersToQuery, applyFilters: applyFilters, filterPanel: filterPanel, activeChips: activeChips, shopTitle: shopTitle, SHOP_CATS: SHOP_CATS
  };
})();
