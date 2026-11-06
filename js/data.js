/* Renato — catalogue (menswear only, no footwear).
   ⚠ PLACEHOLDER: product names, prices, fabrics and stock are demo data.
   To add / edit a product just edit the list below (see README). */
(function () {
  'use strict';

  var COLORS = {
    white: '#F3EFE8', cream: '#EADFCB', ecru: '#E7DCC6', black: '#25221F', charcoal: '#3B3835', stone: '#B7AC9E',
    sand: '#CDBB9B', camel: '#B48A5E', olive: '#5E6B45', sage: '#8DA07E', forest: '#2F4536', khaki: '#A39A72',
    rust: '#B9542F', burgundy: '#6F2A32', navy: '#27364D', indigo: '#3E5675', wash: '#8FA8C2', sky: '#C9DAE8',
    natural: '#E6DCC6', grey: '#7D7A75', taupe: '#A58E84', tobacco: '#6B4A35', brown: '#5A3A22', cognac: '#9A5B2C',
    stripe: '#F3EFE8', checkgreen: '#3F5A45', checkrust: '#9B4B2D', blush: '#E8C6BA'
  };
  /* backdrop tints for product cards */
  var TINTS = {
    sand: '#E3D6C0', sage: '#CBD3C0', clay: '#DFCBBB', slate: '#C8D1D8', stone: '#DDD7CC', oat: '#E6DDC5'
  };

  var SZ = {
    m: ['S', 'M', 'L', 'XL', 'XXL'],
    suit: ['46', '48', '50', '52', '54'],
    mj: ['30', '31', '32', '33', '34', '36'],
    belt: ['85', '90', '95', '100', '105'],
    sock: ['39-42', '43-46'],
    one: ['ONE']
  };

  /* c(): colour shorthand  ->  {k:'camel'}  or with options (pattern / accent) */
  function c(k, o) { var r = { k: k }; if (o) for (var i in o) r[i] = o[i]; return r; }

  /* tags: new | best | sale | last   (a product is "sold out" when every size is in oos) */
  var P = [
    /* ---- outerwear ---- */
    /* Lorenzo uses REAL photos (assets/products). photoViews = what each photo shows (captions in the gallery). */
    { slug: 'lorenzo', name: 'Lorenzo', type: 'jacket', price: 98900,
      colors: [c('burgundy', { hex: '#5B2B33' }), c('charcoal', { hex: '#48484B' }), c('taupe', { hex: '#A58E84' })],
      sizes: SZ.m, oos: ['S'], fabric: 'quilted', fit: 'regular', care: 'dry', tags: ['new', 'best'], tint: 'stone',
      photoViews: ['front', 'collar', 'pocket'],
      photos: {
        burgundy: ['assets/products/lorenzo-burgundy-1.jpg', 'assets/products/lorenzo-burgundy-2.jpg', 'assets/products/lorenzo-burgundy-3.jpg'],
        charcoal: ['assets/products/lorenzo-grey-1.jpg', 'assets/products/lorenzo-grey-2.jpg', 'assets/products/lorenzo-grey-3.jpg'],
        taupe: ['assets/products/lorenzo-taupe-1.jpg', 'assets/products/lorenzo-taupe-2.jpg', 'assets/products/lorenzo-taupe-3.jpg']
      } },
    /* Valerio / Adriano / Emilio / Sergio use REAL photos too (cut from the owner's lifestyle shots, see README §5). */
    { slug: 'valerio', name: 'Valerio', type: 'vest', price: 44900,
      colors: [c('black'), c('navy')], sizes: SZ.m, oos: ['S', 'XXL'], fabric: 'nylon', fit: 'regular', care: 'm30', tags: ['new', 'best'], tint: 'stone',
      photoViews: ['front', 'collar', 'pocket'],
      photos: {
        black: ['assets/products/valerio-black-1.jpg', 'assets/products/valerio-black-2.jpg', 'assets/products/valerio-black-3.jpg'],
        navy: ['assets/products/valerio-navy-1.jpg', 'assets/products/valerio-navy-2.jpg', 'assets/products/valerio-navy-3.jpg']
      } },
    { slug: 'carlo', name: 'Carlo', type: 'coat', price: 94900, colors: [c('charcoal'), c('camel'), c('navy')], sizes: SZ.suit, oos: ['46'], fabric: 'woolblend', fit: 'regular', care: 'dry', tags: ['new', 'best'], tint: 'slate' },
    { slug: 'matteo', name: 'Matteo', type: 'blazer', price: 72900, colors: [c('navy'), c('grey'), c('tobacco')], sizes: SZ.suit, oos: ['46', '54'], fabric: 'woolblend', fit: 'regular', care: 'dry', tags: ['new'], tint: 'sand' },
    { slug: 'dino', name: 'Dino', type: 'blazer', price: 64900, old: 79900, colors: [c('sand'), c('navy')], sizes: SZ.suit, oos: ['54'], fabric: 'linen', fit: 'relaxed', care: 'dry', tags: ['sale'], tint: 'slate' },
    { slug: 'marco', name: 'Marco', type: 'jacket', price: 58900, colors: [c('forest'), c('navy'), c('sand')], sizes: SZ.m, oos: ['S'], fabric: 'twill', fit: 'regular', care: 'm30', tags: ['new'], tint: 'sand' },
    { slug: 'silvio', name: 'Silvio', type: 'jacket', price: 49900, colors: [c('olive'), c('black'), c('khaki')], sizes: SZ.m, oos: [], fabric: 'nylon', fit: 'relaxed', care: 'm30', tags: ['best'], tint: 'stone' },

    /* ---- knitwear & hoodies ---- */
    { slug: 'adriano', name: 'Adriano', type: 'cardigan', price: 42900,
      colors: [c('navy'), c('charcoal')], sizes: SZ.m, oos: ['XXL'], fabric: 'cotton', fit: 'regular', care: 'hand', tags: ['new', 'best'], tint: 'stone',
      photoViews: ['front', 'collar', 'detail'],
      photos: {
        navy: ['assets/products/adriano-navy-1.jpg', 'assets/products/adriano-navy-2.jpg', 'assets/products/adriano-navy-3.jpg'],
        charcoal: ['assets/products/adriano-charcoal-1.jpg', 'assets/products/adriano-charcoal-2.jpg', 'assets/products/adriano-charcoal-3.jpg']
      } },
    { slug: 'stefano', name: 'Stefano', type: 'turtleneck', price: 27900,
      colors: [c('black')], sizes: SZ.m, oos: [], fabric: 'merino', fit: 'regular', care: 'hand', tags: ['new'], tint: 'stone',
      photoViews: ['front', 'collar', 'detail'],
      photos: { black: ['assets/products/stefano-black-1.jpg', 'assets/products/stefano-black-2.jpg', 'assets/products/stefano-black-3.jpg'] } },
    { slug: 'paolo', name: 'Paolo', type: 'sweater', price: 34900, colors: [c('navy'), c('ecru'), c('forest')], sizes: SZ.m, oos: ['XXL'], fabric: 'merino', fit: 'regular', care: 'hand', tags: ['new'], tint: 'slate' },
    { slug: 'ivo', name: 'Ivo', type: 'sweater', price: 29900, colors: [c('charcoal'), c('burgundy'), c('sand')], sizes: SZ.m, oos: [], fabric: 'merino', fit: 'relaxed', care: 'hand', tags: ['best'], tint: 'sage' },
    { slug: 'renzo', name: 'Renzo', type: 'cardigan', price: 38900, colors: [c('tobacco'), c('charcoal'), c('forest')], sizes: SZ.m, oos: ['S'], fabric: 'merino', fit: 'regular', care: 'hand', tags: ['new'], tint: 'oat' },
    { slug: 'enzo', name: 'Enzo', type: 'hoodie', price: 29900, colors: [c('charcoal'), c('stone'), c('forest')], sizes: SZ.m, oos: [], fabric: 'fleece', fit: 'oversized', care: 'm30', tags: ['best'], tint: 'clay' },
    { slug: 'leone', name: 'Leone', type: 'hoodie', price: 24900, old: 31100, colors: [c('black'), c('ecru')], sizes: SZ.m, oos: ['S', 'M'], fabric: 'fleece', fit: 'regular', care: 'm30', tags: ['sale', 'last'], tint: 'sage' },

    /* ---- shirts, polos & tees ---- */
    { slug: 'gino', name: 'Gino', type: 'shirt', price: 19900, colors: [c('sky'), c('white'), c('stripe', { pat: 'stripe', accent: '#27364D' })], sizes: SZ.m, oos: [], fabric: 'oxford', fit: 'regular', care: 'm30', tags: [], tint: 'clay' },
    { slug: 'aldo', name: 'Aldo', type: 'shirt', price: 21900, colors: [c('white'), c('sand'), c('sage')], sizes: SZ.m, oos: ['S'], fabric: 'linen', fit: 'relaxed', care: 'm30', tags: [], tint: 'slate' },
    { slug: 'bruno', name: 'Bruno', type: 'shirt', price: 22900, colors: [c('checkgreen', { pat: 'check' }), c('checkrust', { pat: 'check' })], sizes: SZ.m, oos: [], fabric: 'flannel', fit: 'regular', care: 'm30', tags: ['new'], tint: 'oat' },
    { slug: 'fabio', name: 'Fabio', type: 'polo', price: 15900, colors: [c('white'), c('navy'), c('olive')], sizes: SZ.m, oos: [], fabric: 'pique', fit: 'regular', care: 'm30', tags: ['new'], tint: 'sage' },
    { slug: 'emilio', name: 'Emilio', type: 'tee', price: 13900,
      colors: [c('white'), c('black')], sizes: SZ.m, oos: [], fabric: 'organic', fit: 'regular', care: 'm30', tags: ['new', 'best'], tint: 'stone',
      photoViews: ['front', 'collar', 'detail'],
      photos: {
        white: ['assets/products/emilio-white-1.jpg', 'assets/products/emilio-white-2.jpg', 'assets/products/emilio-white-3.jpg'],
        black: ['assets/products/emilio-black-1.jpg', 'assets/products/emilio-black-2.jpg', 'assets/products/emilio-black-3.jpg']
      } },
    { slug: 'luca', name: 'Luca', type: 'tee', price: 10900, colors: [c('white'), c('black'), c('olive'), c('stone')], sizes: SZ.m, oos: [], fabric: 'organic', fit: 'regular', care: 'm30', tags: ['best'], tint: 'clay' },
    { slug: 'nico', name: 'Nico', type: 'longsleeve', price: 14900, colors: [c('black'), c('cream'), c('rust')], sizes: SZ.m, oos: [], fabric: 'cotton', fit: 'regular', care: 'm30', tags: [], tint: 'sage' },

    /* ---- trousers, denim & shorts ---- */
    { slug: 'rocco', name: 'Rocco', type: 'trousers', price: 26900, colors: [c('sand'), c('olive'), c('navy')], sizes: SZ.m, oos: ['XXL'], fabric: 'twill', fit: 'straight', care: 'm30', tags: [], tint: 'slate', art: { cut: 'trousers' } },
    { slug: 'sergio', name: 'Sergio', type: 'trousers', price: 28900, colors: [c('charcoal'), c('camel'), c('cream')], sizes: SZ.m, oos: [], fabric: 'woolblend', fit: 'wide', care: 'dry', tags: ['best'], tint: 'sage', art: { cut: 'wide' } },
    { slug: 'tommaso', name: 'Tommaso', type: 'jeans', price: 26900, colors: [c('indigo'), c('black'), c('wash')], sizes: SZ.mj, oos: ['30'], fabric: 'denim', fit: 'straight', care: 'm30', tags: [], tint: 'oat' },
    { slug: 'dario', name: 'Dario', type: 'jeans', price: 27900, old: 34900, colors: [c('indigo'), c('wash')], sizes: SZ.mj, oos: ['30', '36'], fabric: 'denim', fit: 'wide', care: 'm30', tags: ['sale'], tint: 'sand', art: { cut: 'loose' } },
    { slug: 'sandro', name: 'Sandro', type: 'shorts', price: 15900, old: 26500, colors: [c('sand'), c('sage'), c('navy')], sizes: SZ.m, oos: ['S', 'M'], fabric: 'linen', fit: 'relaxed', care: 'm30', tags: ['sale', 'last'], tint: 'clay' },

    /* ---- accessories (no footwear) ---- */
    { slug: 'remo', name: 'Remo', type: 'scarf', price: 12900, colors: [c('camel'), c('grey'), c('rust')], sizes: SZ.one, oos: [], fabric: 'wool', fit: 'one', care: 'hand', tags: ['new'], tint: 'slate' },
    { slug: 'gianni', name: 'Gianni', type: 'beanie', price: 7900, colors: [c('rust'), c('black'), c('cream')], sizes: SZ.one, oos: [], fabric: 'woolacr', fit: 'one', care: 'hand', tags: ['new'], tint: 'slate' },
    { slug: 'rio', name: 'Rio', type: 'cap', price: 6900, colors: [c('forest'), c('sand'), c('black')], sizes: SZ.one, oos: ['ONE'], fabric: 'cotton', fit: 'one', care: 'm30', tags: [], tint: 'sand' },
    { slug: 'olivo', name: 'Olivo', type: 'tote', price: 8900, colors: [c('natural'), c('black')], sizes: SZ.one, oos: [], fabric: 'canvas', fit: 'one', care: 'm30', tags: ['best'], tint: 'clay' },
    { slug: 'vito', name: 'Vito', type: 'belt', price: 11900, colors: [c('brown'), c('black'), c('cognac')], sizes: SZ.belt, oos: ['85'], fabric: 'leather', fit: 'one', care: 'dry', tags: ['best'], tint: 'oat' },
    { slug: 'elio', name: 'Elio', type: 'socks', price: 4900, colors: [c('navy'), c('grey'), c('black')], sizes: SZ.sock, oos: [], fabric: 'socks', fit: 'one', care: 'm30', tags: ['new'], tint: 'sand' }
  ];

  /* product groups = navigation + category tiles */
  var GROUPS = [
    { key: 'outer', types: ['coat', 'blazer', 'jacket', 'vest'] },
    { key: 'knit', types: ['sweater', 'turtleneck', 'cardigan', 'hoodie'] },
    { key: 'shirts', types: ['shirt', 'polo', 'longsleeve', 'tee'] },
    { key: 'bottoms', types: ['trousers', 'jeans', 'shorts'] },
    { key: 'accessories', types: ['scarf', 'beanie', 'cap', 'tote', 'belt', 'socks'] }
  ];
  var groupOfType = {};
  GROUPS.forEach(function (g) { g.types.forEach(function (ty) { groupOfType[ty] = g.key; }); });

  P.forEach(function (p, i) {
    p.id = i + 1;
    p.order = i;                       // featured order
    p.added = P.length - i;            // newer = higher (used by "newest")
    p.sku = 'RN-' + String(1000 + p.id * 7);
    p.group = groupOfType[p.type];
    p.art = p.art || {};
  });

  /* collage slots: [hero piece, 2nd big piece, small top-right, small bottom-left] */
  var LOOKS = [
    { id: 1, tint: 'slate', items: ['carlo', 'sergio', 'remo', 'paolo'] },
    { id: 2, tint: 'sand', items: ['enzo', 'tommaso', 'rio', 'olivo'] },
    { id: 3, tint: 'clay', items: ['matteo', 'rocco', 'vito'] }
  ];

  var bySlug = {};
  P.forEach(function (p) { bySlug[p.slug] = p; });

  function discount(p) { return p.old ? Math.round((1 - p.price / p.old) * 100) : 0; }
  function maxDiscount() { return P.reduce(function (m, p) { return Math.max(m, discount(p)); }, 0); }
  function available(p) { return p.sizes.filter(function (s) { return p.oos.indexOf(s) < 0; }); }
  function soldOut(p) { return available(p).length === 0; }
  function lastN(p) { var a = available(p).length; return p.tags.indexOf('last') >= 0 && a > 0 && a <= 3 ? a : 0; }
  function colorHex(col) { return col.hex || COLORS[col.k] || '#999'; }
  function colorIndex(p, key) {
    for (var i = 0; i < p.colors.length; i++) if (p.colors[i].k === key) return i;
    return 0;
  }

  /* Real photos (optional): p.photos = { camel: ['assets/products/carlo-camel-1.jpg', '...-2.jpg', '...-3.jpg'] }
     index 0 = front, 1 = back, 2 = detail. When a colour has photos they replace the illustration everywhere
     (cards, product page, cart, search). If fewer than 3 photos exist the last one is reused. */
  function photoList(p, ci) {
    var col = p.colors[ci] || p.colors[0];
    var l = p.photos && p.photos[col.k];
    return l && l.length ? l : null;
  }
  function hasPhotos(p) { return !!(p.photos && Object.keys(p.photos).length); }
  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* Picture for a product: view = front | back | detail */
  function art(p, ci, view) {
    view = view || 'front';
    var ph = photoList(p, ci);
    if (ph) {
      var i = view === 'front' ? 0 : view === 'back' ? 1 : 2;
      return '<img class="art-img" src="' + attr(ph[Math.min(i, ph.length - 1)]) + '" alt="" loading="lazy" decoding="async">';
    }
    var col = p.colors[ci] || p.colors[0];
    var o = { c: colorHex(col), view: view };
    for (var k in p.art) o[k] = p.art[k];
    if (col.pat) { o.pat = col.pat; }
    if (col.accent) o.accent = col.accent;
    return window.Art.render(p.type, o);
  }

  var GROUP_KEYS = GROUPS.map(function (g) { return g.key; });
  function filterCat(cat) {
    if (cat === 'new') return P.filter(function (p) { return p.tags.indexOf('new') >= 0; });
    if (cat === 'best') return P.filter(function (p) { return p.tags.indexOf('best') >= 0; });
    if (cat === 'sale') return P.filter(function (p) { return !!p.old; });
    if (cat === 'clothing') return P.filter(function (p) { return p.group !== 'accessories'; });
    if (GROUP_KEYS.indexOf(cat) >= 0) return P.filter(function (p) { return p.group === cat; });
    return P.slice();
  }

  window.Data = {
    products: P, bySlug: bySlug, COLORS: COLORS, TINTS: TINTS, GROUPS: GROUPS, GROUP_KEYS: GROUP_KEYS, LOOKS: LOOKS,
    discount: discount, maxDiscount: maxDiscount, available: available, soldOut: soldOut, lastN: lastN, colorHex: colorHex, colorIndex: colorIndex,
    art: art, hasPhotos: hasPhotos, filterCat: filterCat
  };
})();
