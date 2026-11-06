/* Renato — procedural garment illustrations (SVG).
   Stand-in for product photography: every garment is drawn from parameters,
   so colours, back view and detail crops come for free.
   Replace with real photos any time: see README ("Ապրանքների նկարներ"). */
(function (global) {
  'use strict';
  var CX = 200, W = 400;
  var UID = 0;

  /* ---------- colour helpers ---------- */
  function h2r(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function r2h(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }
  function mix(a, b, t) {
    var A = h2r(a), B = h2r(b);
    return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  function dark(h, t) { return mix(h, '#000000', t); }
  function light(h, t) { return mix(h, '#ffffff', t); }
  function lum(h) { var c = h2r(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function r1(n) { return Math.round(n * 10) / 10; }

  /* ---------- path helpers ---------- */
  // cmds: right half, from a point on the centre line down to another point on it.
  function fullPath(cmds) {
    var d = 'M' + r1(cmds[0][1]) + ' ' + r1(cmds[0][2]);
    var pts = [[cmds[0][1], cmds[0][2]]];
    var i, c;
    for (i = 1; i < cmds.length; i++) {
      c = cmds[i];
      d += ' ' + c[0] + c.slice(1).map(r1).join(' ');
      pts.push([c[c.length - 2], c[c.length - 1]]);
    }
    for (i = cmds.length - 1; i >= 1; i--) {
      c = cmds[i];
      var p = pts[i - 1];
      if (c[0] === 'L') d += ' L' + r1(W - p[0]) + ' ' + r1(p[1]);
      else if (c[0] === 'C') d += ' C' + r1(W - c[3]) + ' ' + r1(c[4]) + ' ' + r1(W - c[1]) + ' ' + r1(c[2]) + ' ' + r1(W - p[0]) + ' ' + r1(p[1]);
      else if (c[0] === 'Q') d += ' Q' + r1(W - c[1]) + ' ' + r1(c[2]) + ' ' + r1(W - p[0]) + ' ' + r1(p[1]);
    }
    return d + ' Z';
  }
  function rightPath(cmds) {
    var d = 'M' + r1(cmds[0][1]) + ' ' + r1(cmds[0][2]);
    for (var i = 1; i < cmds.length; i++) d += ' ' + cmds[i][0] + cmds[i].slice(1).map(r1).join(' ');
    return d;
  }
  var MIR = ' transform="translate(400 0) scale(-1 1)"';
  function sym(d, attrs) { return '<path d="' + d + '" ' + attrs + '/><path d="' + d + '" ' + attrs + MIR + '/>'; }

  /* ---------- global defs (gradients + fabric patterns) ---------- */
  function defs() {
    function pat(id, w, h, inner, extra) {
      return '<pattern id="' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse"' + (extra || '') + '>' + inner + '</pattern>';
    }
    var out = '';
    ['d', 'l'].forEach(function (k) {
      var f = k === 'd' ? '#000' : '#fff';
      out += pat('p-rib-' + k, 5, 10, '<rect width="2" height="10" fill="' + f + '"/>');
      out += pat('p-twill-' + k, 6, 6, '<rect width="6" height="1.5" fill="' + f + '"/>', ' patternTransform="rotate(-38)"');
      out += pat('p-knit-' + k, 7, 9, '<path d="M0.5 0.5L3.5 6.5L6.5 0.5" fill="none" stroke="' + f + '" stroke-width="1.5"/>');
      out += pat('p-stripe-' + k, 11, 10, '<rect width="1.4" height="10" fill="' + f + '"/>');
      out += pat('p-check-' + k, 26, 26, '<rect width="26" height="5" fill="' + f + '"/><rect width="5" height="26" fill="' + f + '"/>');
      out += pat('p-weave-' + k, 4, 4, '<rect width="2" height="2" fill="' + f + '"/><rect x="2" y="2" width="2" height="2" fill="' + f + '"/>');
    });
    return '<defs>' +
      '<linearGradient id="g-shade" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>' +
      /* cylindrical volume: edges fall off, centre catches light */
      '<linearGradient id="g-vol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".18" stop-color="#000" stop-opacity=".03"/>' +
      '<stop offset=".5" stop-color="#fff" stop-opacity=".11"/><stop offset=".82" stop-color="#000" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>' +
      '<linearGradient id="g-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>' +
      '<radialGradient id="g-ground"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      out + '</defs>';
  }
  function mountDefs() {
    if (typeof document === 'undefined' || document.getElementById('art-defs')) return;
    var s = document.createElement('div');
    s.id = 'art-defs';
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<svg width="0" height="0" focusable="false">' + defs() + '</svg>';
    document.body.insertBefore(s, document.body.firstChild);
  }

  /* ---------- shared layers ---------- */
  function texId(tex, c) {
    if (!tex) return null;
    return 'p-' + tex + '-' + (lum(c) < 0.32 ? 'l' : 'd');
  }
  var TEX_OP = { rib: .16, twill: .13, knit: .17, stripe: .2, check: .16, weave: .1 };

  function base(d, c, tex, accent) {
    var id = 'k' + (++UID);
    var t = texId(tex, c);
    var out = '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
      '<path d="' + d + '" fill="#000" opacity=".1" transform="translate(7 11)"/>' +
      '<path d="' + d + '" fill="' + c + '"/>';
    if (t) out += '<path d="' + d + '" fill="url(#' + t + ')" opacity="' + (lum(c) < 0.32 ? TEX_OP[tex] * 0.9 : TEX_OP[tex]) + '"/>';
    out += '<path d="' + d + '" fill="url(#g-shade)"/><path d="' + d + '" fill="url(#g-vol)"/><path d="' + d + '" fill="url(#g-fall)"/>';
    return { id: id, svg: out, edge: '<path d="' + d + '" fill="none" stroke="' + dark(c, .34) + '" stroke-width="1.3" opacity=".5"/>' };
  }
  function ground(cx, cy, rx, ry) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#g-ground)"/>';
  }
  function seam(d, c, o) {
    return '<path d="' + d + '" fill="none" stroke="' + dark(c, .3) + '" stroke-width="1.5" stroke-linecap="round" opacity="' + (o || .5) + '"/>';
  }
  function stitch(d, c, o) {
    return '<path d="' + d + '" fill="none" stroke="' + (lum(c) < .32 ? light(c, .45) : dark(c, .32)) + '" stroke-width="1.3" stroke-dasharray="4 3.4" stroke-linecap="round" opacity="' + (o || .55) + '"/>';
  }
  function fold(d, c, o, w) {
    return '<path d="' + d + '" fill="none" stroke="' + dark(c, .4) + '" stroke-width="' + (w || 6) + '" stroke-linecap="round" opacity="' + (o || .07) + '"/>';
  }
  function hi(d, c, o, w) {
    return '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="' + (w || 7) + '" stroke-linecap="round" opacity="' + (o || .12) + '"/>';
  }
  function btn(x, y, c, rr) {
    var cc = lum(c) < .35 ? light(c, .5) : dark(c, .22);
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (rr || 3.6) + '" fill="' + cc + '" stroke="' + dark(cc, .3) + '" stroke-width=".8"/>' +
      '<circle cx="' + (x - .6) + '" cy="' + (y - .6) + '" r="' + ((rr || 3.6) * .28) + '" fill="#fff" opacity=".4"/>';
  }
  function logoText(x, y, size, col, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-family="Playfair Display,Georgia,serif" font-style="italic" font-weight="600" font-size="' + size + '" fill="' + col + '" text-anchor="' + (anchor || 'middle') + '">Renato</text>';
  }

  /* ---------- TOPS ---------- */
  var TOP = {
    tee: { sw: 106, sy: 80, nw: 38, nd: 86, bw: 94, hw: 98, hem: 448, slv: 'short', sa: 30, sl: 92, sW: 46, neck: 'crew' },
    longsleeve: { sw: 106, sy: 80, nw: 38, nd: 86, bw: 94, hw: 98, hem: 448, slv: 'long', sa: 11, sl: 316, sW: 36, neck: 'crew' },
    sweater: { sw: 110, sy: 84, nw: 40, nd: 84, bw: 98, hw: 100, hem: 444, slv: 'long', sa: 12, sl: 306, sW: 42, neck: 'crew', rib: 1, ribH: 34, cuffH: 30 },
    hoodie: { sw: 118, sy: 96, nw: 44, nd: 116, bw: 104, hw: 108, hem: 450, slv: 'long', sa: 12, sl: 290, sW: 46, neck: 'hood', rib: 1, ribH: 34, cuffH: 30 },
    shirt: { sw: 106, sy: 82, nw: 34, nd: 74, bw: 94, hw: 98, hem: 454, slv: 'long', sa: 10, sl: 312, sW: 34, neck: 'collar', cuffH: 26, tail: 16 },
    jacket: { sw: 114, sy: 86, nw: 40, nd: 76, bw: 100, hw: 100, hem: 428, slv: 'long', sa: 15, sl: 296, sW: 42, neck: 'stand', rib: 1, ribH: 36, cuffH: 32 },
    coat: { sw: 114, sy: 70, nw: 34, nd: 90, bw: 100, hw: 116, hem: 486, slv: 'long', sa: 9, sl: 332, sW: 42, neck: 'lapel', cuffH: 0 },
    blazer: { sw: 112, sy: 72, nw: 34, nd: 94, bw: 100, hw: 108, hem: 444, slv: 'long', sa: 10, sl: 320, sW: 40, neck: 'lapel', cuffH: 0 },
    cardigan: { sw: 110, sy: 84, nw: 44, nd: 142, bw: 98, hw: 100, hem: 444, slv: 'long', sa: 12, sl: 306, sW: 42, neck: 'vee', rib: 1, ribH: 34, cuffH: 30 },
    polo: { sw: 106, sy: 80, nw: 34, nd: 96, bw: 94, hw: 98, hem: 440, slv: 'short', sa: 28, sl: 98, sW: 46, neck: 'polo', cuffH: 20, cuffRib: 1 }
  };
  var STRAIGHT_NECK = { collar: 1, lapel: 1, vee: 1, polo: 1 };

  function top(type, c, o) {
    var P = TOP[type];
    var back = o.view === 'back';
    var accent = o.accent || (lum(c) < .4 ? light(c, .55) : dark(c, .45));
    var ny = P.sy - 28;
    var tip = [CX + P.sw, P.sy];
    var armY = P.sy + (P.slv === 'short' ? 72 : 86);
    var arm = [CX + P.bw, armY];
    var a = P.sa * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a);
    var outer = [tip[0] + dx * P.sl, tip[1] + dy * P.sl];
    var inner = [outer[0] - dy * P.sW, outer[1] + dx * P.sW];
    var tail = P.tail || 0;
    var nd = back ? ny + 14 : P.nd;

    /* sleeves bow slightly outward so they read as fabric, not as straight tubes */
    var bow = P.slv === 'long' ? 8 : 4, ox = Math.cos(a), oy = -Math.sin(a);
    var mo = [(tip[0] + outer[0]) / 2 + ox * bow, (tip[1] + outer[1]) / 2 + oy * bow];
    var mi = [(inner[0] + arm[0]) / 2 + ox * bow * .8, (inner[1] + arm[1]) / 2 + oy * bow * .8];

    var cmds = [['M', CX, nd]];
    if (STRAIGHT_NECK[P.neck]) cmds.push(['L', CX + P.nw, ny]);
    else cmds.push(['C', CX + P.nw * .55, nd, CX + P.nw, ny + (nd - ny) * .32, CX + P.nw, ny]);
    cmds.push(['L', tip[0], tip[1]]);
    cmds.push(['Q', mo[0], mo[1], outer[0], outer[1]]);
    cmds.push(['L', inner[0], inner[1]]);
    cmds.push(['Q', mi[0], mi[1], arm[0], arm[1]]);
    cmds.push(['Q', CX + P.bw + 3, (arm[1] + P.hem) / 2, CX + P.hw, P.hem - tail]);
    cmds.push(['Q', CX + P.hw * .5, P.hem + (tail ? tail * .55 : 4), CX, P.hem]);
    var d = fullPath(cmds);

    var tex = o.tex || ((type === 'sweater' || type === 'cardigan') ? 'knit' : (type === 'shirt' && o.pat) ? o.pat : (type === 'polo' ? 'weave' : null));
    var B = base(d, c, tex, accent);
    var s = '';
    s += ground(CX, P.hem + 12, 126, 15);

    // hood shell sits behind the body
    if (P.neck === 'hood') {
      if (!back) {
        s += '<path d="M' + (CX - 68) + ' ' + (ny + 12) + ' C' + (CX - 96) + ' ' + (ny - 44) + ' ' + (CX - 50) + ' 2 ' + CX + ' 2 C' + (CX + 50) + ' 2 ' + (CX + 96) + ' ' + (ny - 44) + ' ' + (CX + 68) + ' ' + (ny + 12) + ' Z" fill="' + dark(c, .06) + '"/>';
        s += '<path d="M' + (CX - 68) + ' ' + (ny + 12) + ' C' + (CX - 96) + ' ' + (ny - 44) + ' ' + (CX - 50) + ' 2 ' + CX + ' 2 C' + (CX + 50) + ' 2 ' + (CX + 96) + ' ' + (ny - 44) + ' ' + (CX + 68) + ' ' + (ny + 12) + ' Z" fill="url(#g-shade)"/>';
        s += '<ellipse cx="' + CX + '" cy="' + (ny + 2) + '" rx="42" ry="46" fill="' + dark(c, .55) + '"/>';
        s += '<ellipse cx="' + CX + '" cy="' + (ny + 2) + '" rx="42" ry="46" fill="none" stroke="' + light(c, .12) + '" stroke-width="5" opacity=".9"/>';
      } else {
        s += '<path d="M' + (CX - 66) + ' ' + (ny + 8) + ' C' + (CX - 94) + ' ' + (ny - 40) + ' ' + (CX - 50) + ' 4 ' + CX + ' 4 C' + (CX + 50) + ' 4 ' + (CX + 94) + ' ' + (ny - 40) + ' ' + (CX + 66) + ' ' + (ny + 8) + ' Z" fill="' + dark(c, .08) + '"/>';
      }
    }
    s += B.svg;

    var cp = ' clip-path="url(#' + B.id + ')"';
    // ribbing at hem + cuffs
    if (P.rib) {
      var hy = P.hem - P.ribH;
      s += '<g' + cp + '><rect x="0" y="' + hy + '" width="400" height="' + (P.ribH + 20) + '" fill="' + dark(c, .07) + '"/>' +
        '<rect x="0" y="' + hy + '" width="400" height="' + (P.ribH + 20) + '" fill="url(#' + texId('rib', c) + ')" opacity="' + (lum(c) < .32 ? .2 : .2) + '"/>' +
        '<path d="M0 ' + hy + ' H400" stroke="' + dark(c, .35) + '" stroke-width="1.4" opacity=".4"/></g>';
    }
    if (P.cuffH) {
      var ux = dx, uy = dy;
      [1, -1].forEach(function (sg) {
        var o1 = [outer[0], outer[1]], i1 = [inner[0], inner[1]];
        var o2 = [o1[0] - ux * P.cuffH, o1[1] - uy * P.cuffH], i2 = [i1[0] - ux * P.cuffH, i1[1] - uy * P.cuffH];
        var pd = 'M' + r1(o1[0]) + ' ' + r1(o1[1]) + ' L' + r1(i1[0]) + ' ' + r1(i1[1]) + ' L' + r1(i2[0]) + ' ' + r1(i2[1]) + ' L' + r1(o2[0]) + ' ' + r1(o2[1]) + ' Z';
        var tr = sg === 1 ? '' : MIR;
        if (P.rib || P.cuffRib) {
          s += '<g' + tr + '><path d="' + pd + '" fill="' + dark(c, .07) + '"/><path d="' + pd + '" fill="url(#' + texId('rib', c) + ')" opacity=".22"/>' +
            '<path d="M' + r1(o2[0]) + ' ' + r1(o2[1]) + ' L' + r1(i2[0]) + ' ' + r1(i2[1]) + '" stroke="' + dark(c, .35) + '" stroke-width="1.4" opacity=".4"/></g>';
        } else {
          s += '<g' + tr + '><path d="M' + r1(o2[0]) + ' ' + r1(o2[1]) + ' L' + r1(i2[0]) + ' ' + r1(i2[1]) + '" stroke="' + dark(c, .3) + '" stroke-width="1.5" opacity=".45"/>' +
            '<path d="M' + r1(o1[0] - ux * 5) + ' ' + r1(o1[1] - uy * 5) + ' L' + r1(i1[0] - ux * 5) + ' ' + r1(i1[1] - uy * 5) + '" stroke="' + dark(c, .3) + '" stroke-width="1.2" stroke-dasharray="4 3" opacity=".5"/></g>';
        }
      });
    }
    // armhole seams + shoulder
    var armSeam = 'M' + tip[0] + ' ' + tip[1] + ' Q' + (tip[0] - 14) + ' ' + (tip[1] + (arm[1] - tip[1]) * .62) + ' ' + arm[0] + ' ' + arm[1];
    s += sym(armSeam, 'fill="none" stroke="' + dark(c, .3) + '" stroke-width="1.5" opacity=".5"');
    // short sleeve + tee hem stitching
    if (!P.rib && !P.cuffRib && P.slv === 'short') {
      s += stitch('M' + (outer[0] - dx * 8) + ' ' + (outer[1] - dy * 8) + ' L' + (inner[0] - dx * 8) + ' ' + (inner[1] - dy * 8), c);
      s += '<path d="M' + (W - outer[0] + dx * 8) + ' ' + (outer[1] - dy * 8) + ' L' + (W - inner[0] + dx * 8) + ' ' + (inner[1] - dy * 8) + '" fill="none" stroke="' + dark(c, .32) + '" stroke-width="1.3" stroke-dasharray="4 3.4" opacity=".55"/>';
    }
    if (!P.rib) s += stitch('M' + (CX - P.hw + 4) + ' ' + (P.hem - 10 - tail) + ' Q' + CX + ' ' + (P.hem - 3 + tail * .3) + ' ' + (CX + P.hw - 4) + ' ' + (P.hem - 10 - tail), c, .45);

    // neckline
    var nk = '';
    if (P.neck === 'crew') {
      var bk = 'M' + (CX - P.nw) + ' ' + ny + ' Q' + CX + ' ' + (ny - 22) + ' ' + (CX + P.nw) + ' ' + ny + ' C' + (CX + P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX + P.nw * .55) + ' ' + nd + ' ' + CX + ' ' + nd + ' C' + (CX - P.nw * .55) + ' ' + nd + ' ' + (CX - P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX - P.nw) + ' ' + ny + ' Z';
      nk += '<path d="' + bk + '" fill="' + dark(c, .5) + '" opacity=".92"/>';
      var rb = 'M' + (CX - P.nw) + ' ' + ny + ' C' + (CX - P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX - P.nw * .55) + ' ' + nd + ' ' + CX + ' ' + nd + ' C' + (CX + P.nw * .55) + ' ' + nd + ' ' + (CX + P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX + P.nw) + ' ' + ny;
      nk += '<path d="' + rb + '" fill="none" stroke="' + dark(c, .1) + '" stroke-width="' + (type === 'sweater' ? 13 : 8) + '" stroke-linecap="round"/>';
      nk += '<path d="' + rb + '" fill="none" stroke="url(#' + texId('rib', c) + ')" stroke-width="' + (type === 'sweater' ? 13 : 8) + '" opacity=".35"/>';
      nk += '<path d="' + rb + '" fill="none" stroke="' + dark(c, .35) + '" stroke-width="1.2" opacity=".45" transform="translate(0 4)"/>';
      if (type === 'sweater') nk += '<path d="' + rb + '" fill="none" stroke="#fff" stroke-width="2" opacity=".18" transform="translate(0 -4)"/>';
    }
    if (P.neck === 'hood' && !back) {
      var u = 'M' + (CX - P.nw) + ' ' + ny + ' C' + (CX - P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX - P.nw * .55) + ' ' + nd + ' ' + CX + ' ' + nd + ' C' + (CX + P.nw * .55) + ' ' + nd + ' ' + (CX + P.nw) + ' ' + (ny + (nd - ny) * .32) + ' ' + (CX + P.nw) + ' ' + ny;
      nk += '<path d="' + u + '" fill="none" stroke="' + light(c, .06) + '" stroke-width="5" stroke-linecap="round"/>';
      nk += '<path d="' + u + '" fill="none" stroke="' + dark(c, .3) + '" stroke-width="1.2" opacity=".5" transform="translate(0 4)"/>';
    }
    if (P.neck === 'hood' && back) {
      var hp = 'M' + (CX - 60) + ' ' + (ny + 12) + ' C' + (CX - 78) + ' ' + (ny + 72) + ' ' + (CX - 58) + ' ' + (ny + 128) + ' ' + CX + ' ' + (ny + 132) + ' C' + (CX + 58) + ' ' + (ny + 128) + ' ' + (CX + 78) + ' ' + (ny + 72) + ' ' + (CX + 60) + ' ' + (ny + 12) + ' Q' + CX + ' ' + (ny + 36) + ' ' + (CX - 60) + ' ' + (ny + 12) + ' Z';
      nk += '<path d="' + hp + '" fill="' + c + '"/><path d="' + hp + '" fill="url(#g-shade)"/>';
      nk += '<path d="M' + (CX - 60) + ' ' + (ny + 12) + ' C' + (CX - 78) + ' ' + (ny + 72) + ' ' + (CX - 58) + ' ' + (ny + 128) + ' ' + CX + ' ' + (ny + 132) + ' C' + (CX + 58) + ' ' + (ny + 128) + ' ' + (CX + 78) + ' ' + (ny + 72) + ' ' + (CX + 60) + ' ' + (ny + 12) + '" fill="none" stroke="' + dark(c, .35) + '" stroke-width="1.4" opacity=".5"/>';
      nk += seam('M' + CX + ' ' + (ny + 24) + ' V' + (ny + 130), c);
    }
    if (P.neck === 'vee') {
      // V-neck: back of the neck visible behind, ribbed edge following the V
      nk += '<path d="M' + (CX - P.nw) + ' ' + ny + ' Q' + CX + ' ' + (ny - 22) + ' ' + (CX + P.nw) + ' ' + ny + ' L' + CX + ' ' + nd + ' Z" fill="' + dark(c, .5) + '" opacity=".92"/>';
      var vv = 'M' + (CX - P.nw) + ' ' + ny + ' L' + CX + ' ' + nd + ' L' + (CX + P.nw) + ' ' + ny;
      nk += '<path d="' + vv + '" fill="none" stroke="' + dark(c, .1) + '" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>';
      nk += '<path d="' + vv + '" fill="none" stroke="url(#' + texId('rib', c) + ')" stroke-width="12" stroke-linejoin="round" opacity=".32"/>';
    }
    if (P.neck === 'polo') {
      nk += '<path d="M' + (CX - P.nw) + ' ' + ny + ' Q' + CX + ' ' + (ny - 24) + ' ' + (CX + P.nw) + ' ' + ny + ' L' + (CX + 12) + ' ' + (ny + 24) + ' L' + (CX - 12) + ' ' + (ny + 24) + ' Z" fill="' + dark(c, .48) + '" opacity=".9"/>';
    }
    s += nk;

    /* ---- type specific details ---- */
    var det = '';
    if (type === 'polo') {
      var pcol = light(c, lum(c) < .5 ? .08 : .14);
      if (!back) {
        var pf = 'M' + (CX + 2) + ' ' + (ny + 6) + ' L' + (CX + 36) + ' ' + (ny - 12) + ' L' + (CX + 54) + ' ' + (ny + 26) + ' L' + (CX + 16) + ' ' + (ny + 44) + ' Z';
        det += sym(pf, 'fill="' + pcol + '" stroke="' + dark(c, .3) + '" stroke-width="1.3"');
        det += sym(pf, 'fill="url(#g-shade)" opacity=".55"');
        det += '<rect x="' + (CX - 11) + '" y="' + (ny + 20) + '" width="22" height="' + 70 + '" fill="' + dark(c, .06) + '" stroke="' + dark(c, .3) + '" stroke-width="1.2" opacity=".95"/>';
        det += btn(CX, ny + 44, c, 3.4) + btn(CX, ny + 68, c, 3.4);
        det += '<path d="M' + (CX + 58) + ' 150 h20" stroke="' + accent + '" stroke-width="4.5" stroke-linecap="round" opacity=".9"/>';
        det += '<path d="M' + (CX - P.hw + 2) + ' ' + (P.hem - 38) + ' v38 M' + (CX + P.hw - 2) + ' ' + (P.hem - 38) + ' v38" stroke="' + dark(c, .3) + '" stroke-width="1.2" opacity=".35"/>';
      } else {
        det += '<path d="M' + (CX - 38) + ' ' + (ny + 2) + ' Q' + CX + ' ' + (ny - 24) + ' ' + (CX + 38) + ' ' + (ny + 2) + ' L' + (CX + 40) + ' ' + (ny + 16) + ' Q' + CX + ' ' + (ny - 6) + ' ' + (CX - 40) + ' ' + (ny + 16) + ' Z" fill="' + pcol + '" stroke="' + dark(c, .3) + '" stroke-width="1.3"/>';
      }
    }
    if (type === 'cardigan' && !back) {
      var band = 'M' + (CX - 14) + ' ' + (nd + 2) + ' H' + (CX + 14) + ' V' + (P.hem - P.ribH) + ' H' + (CX - 14) + ' Z';
      det += '<path d="' + band + '" fill="' + dark(c, .09) + '"/><path d="' + band + '" fill="url(#' + texId('rib', c) + ')" opacity=".26"/>';
      det += '<path d="M' + (CX - 14) + ' ' + (nd + 2) + ' V' + (P.hem - P.ribH) + ' M' + (CX + 14) + ' ' + (nd + 2) + ' V' + (P.hem - P.ribH) + '" stroke="' + dark(c, .38) + '" stroke-width="1.3" opacity=".5"/>';
      for (var cy2 = nd + 28; cy2 < P.hem - P.ribH - 12; cy2 += 50) det += btn(CX, cy2, c, 4.6);
      det += '<path d="M' + (CX - 80) + ' 318 h46 v50 h-46 Z" fill="' + dark(c, .04) + '" stroke="' + dark(c, .32) + '" stroke-width="1.3" opacity=".8"/>';
      det += '<path d="M' + (CX + 34) + ' 318 h46 v50 h-46 Z" fill="' + dark(c, .04) + '" stroke="' + dark(c, .32) + '" stroke-width="1.3" opacity=".8"/>';
    }
    if (type === 'cardigan' && back) det += seam('M' + CX + ' ' + (ny + 12) + ' V' + (P.hem - P.ribH), c, .3);
    if (type === 'blazer') {
      var bl = lum(c) < .4 ? light(c, .07) : dark(c, .07);
      if (!back) {
        var lapB = 'M' + (CX + 2) + ' ' + (ny + 8) + ' L' + (CX + 33) + ' ' + (ny - 12) + ' L' + (CX + 46) + ' ' + (ny + 14) + ' L' + (CX + 74) + ' ' + (ny + 34) + ' L' + (CX + 38) + ' ' + (ny + 118) + ' L' + (CX + 4) + ' ' + (ny + 104) + ' Z';
        det += sym(lapB, 'fill="' + bl + '" stroke="' + dark(c, .36) + '" stroke-width="1.4"');
        det += sym(lapB, 'fill="url(#g-shade)" opacity=".55"');
        det += seam('M' + (CX + 46) + ' ' + (ny + 14) + ' L' + (CX + 60) + ' ' + (ny + 32), c, .5);
        det += '<path d="M' + CX + ' ' + (ny + 100) + ' V' + (P.hem - 30) + '" stroke="' + dark(c, .4) + '" stroke-width="1.6" opacity=".55"/>';
        det += sym('M' + (CX + 6) + ' ' + (ny + 150) + ' Q' + (CX + 12) + ' ' + (P.hem - 90) + ' ' + (CX + 40) + ' ' + (P.hem), 'fill="none" stroke="' + dark(c, .36) + '" stroke-width="1.5" opacity=".6"');
        det += btn(CX + 10, ny + 126, c, 4.6) + btn(CX + 10, ny + 168, c, 4.6);
        det += sym('M' + (CX + 52) + ' 176 h34 v6 h-34 Z', 'fill="none" stroke="' + dark(c, .4) + '" stroke-width="1.3" opacity=".7"');
        det += '<path d="M' + (CX + 58) + ' 176 l5 -13 l5 13 l5 -10 l4 10 Z" fill="' + (o.accent || '#F1EBDD') + '" stroke="' + dark(c, .25) + '" stroke-width=".8" opacity=".95"/>';
        det += sym('M' + (CX + 30) + ' 330 h52 v10 h-52 Z', 'fill="' + dark(c, .05) + '" stroke="' + dark(c, .4) + '" stroke-width="1.3" opacity=".9"');
        det += sym('M' + (CX + 30) + ' 340 h52', 'fill="none" stroke="' + dark(c, .5) + '" stroke-width="2" opacity=".35"');
        [1, -1].forEach(function (sg) {
          [16, 30].forEach(function (k) {
            var bx = outer[0] - dx * k - dy * 10, by = outer[1] - dy * k + dx * 10;
            det += btn(sg === 1 ? bx : W - bx, by, c, 3);
          });
        });
      } else {
        det += '<path d="M' + (CX - 36) + ' ' + (ny + 4) + ' Q' + CX + ' ' + (ny - 22) + ' ' + (CX + 36) + ' ' + (ny + 4) + ' L' + (CX + 46) + ' ' + (ny + 26) + ' Q' + CX + ' ' + (ny + 4) + ' ' + (CX - 46) + ' ' + (ny + 26) + ' Z" fill="' + bl + '" stroke="' + dark(c, .34) + '" stroke-width="1.3"/>';
        det += seam('M' + CX + ' ' + (ny + 26) + ' V' + P.hem, c, .5);
        det += '<path d="M' + CX + ' ' + (P.hem - 110) + ' V' + P.hem + '" stroke="' + dark(c, .4) + '" stroke-width="1.3" opacity=".4"/>';
      }
    }
    if (type === 'tee' && !back && o.logo !== false) det += logoText(CX + 50, 142, 15, accent);
    if (type === 'tee' && back) det += '<rect x="' + (CX - 20) + '" y="' + (ny + 10) + '" width="40" height="14" rx="2" fill="' + accent + '" opacity=".7"/>';

    if (type === 'hoodie') {
      if (!back) {
        var dsL = 'M' + (CX - 14) + ' ' + (nd - 6) + ' C' + (CX - 20) + ' ' + (nd + 40) + ' ' + (CX - 10) + ' ' + (nd + 70) + ' ' + (CX - 16) + ' ' + (nd + 104);
        var cord = light(c, .62);
        det += '<path d="M' + (CX + 14) + ' ' + (nd - 6) + ' C' + (CX + 20) + ' ' + (nd + 40) + ' ' + (CX + 10) + ' ' + (nd + 70) + ' ' + (CX + 16) + ' ' + (nd + 104) + '" fill="none" stroke="' + cord + '" stroke-width="3.4" stroke-linecap="round"/>';
        det += '<path d="' + dsL + '" fill="none" stroke="' + cord + '" stroke-width="3.4" stroke-linecap="round"/>';
        det += '<rect x="' + (CX - 19.5) + '" y="' + (nd + 100) + '" width="7" height="14" rx="3" fill="' + dark(cord, .35) + '"/>';
        det += '<rect x="' + (CX + 12.5) + '" y="' + (nd + 100) + '" width="7" height="14" rx="3" fill="' + dark(cord, .35) + '"/>';
        var kp = 'M' + (CX - 72) + ' 304 L' + (CX + 72) + ' 304 L' + (CX + 90) + ' 392 L' + (CX - 90) + ' 392 Z';
        det += '<path d="' + kp + '" fill="' + dark(c, .05) + '" stroke="' + dark(c, .32) + '" stroke-width="1.4" opacity=".95"/>';
        det += '<path d="' + kp + '" fill="url(#g-shade)" opacity=".6"/>';
        det += '<path d="M' + (CX - 72) + ' 304 L' + (CX - 52) + ' 340 M' + (CX + 72) + ' 304 L' + (CX + 52) + ' 340" stroke="' + dark(c, .35) + '" stroke-width="1.3" opacity=".4"/>';
        det += stitch('M' + (CX - 70) + ' 312 L' + (CX + 70) + ' 312', c, .4);
        det += logoText(CX + 62, 196, 14, accent, 'middle').replace('<text', '<text opacity=".85"');
      }
    }
    if (type === 'sweater') {
      if (o.band !== false) {
        det += '<g' + cp + '><rect x="0" y="206" width="400" height="9" fill="' + accent + '" opacity=".9"/><rect x="0" y="222" width="400" height="4" fill="' + accent + '" opacity=".7"/></g>';
        if (back) det = '';
      }
    }
    if (type === 'shirt') {
      var col = light(c, lum(c) < .5 ? .1 : .2);
      var stand = dark(c, .04);
      if (!back) {
        // collar flaps
        var fl = 'M' + (CX + 2) + ' ' + (ny + 8) + ' L' + (CX + 38) + ' ' + (ny - 14) + ' L' + (CX + 58) + ' ' + (ny + 40) + ' L' + (CX + 14) + ' ' + (ny + 52) + ' Z';
        det += '<path d="' + fl + '" fill="' + col + '" stroke="' + dark(c, .3) + '" stroke-width="1.3" opacity=".98"/>';
        det += '<path d="' + fl + '" fill="url(#g-shade)" opacity=".5"/>';
        det += '<path d="M' + (W - (CX + 2)) + ' ' + (ny + 8) + ' L' + (W - (CX + 38)) + ' ' + (ny - 14) + ' L' + (W - (CX + 58)) + ' ' + (ny + 40) + ' L' + (W - (CX + 14)) + ' ' + (ny + 52) + ' Z" fill="' + col + '" stroke="' + dark(c, .3) + '" stroke-width="1.3"/>';
        det += '<path d="M' + (W - (CX + 2)) + ' ' + (ny + 8) + ' L' + (W - (CX + 38)) + ' ' + (ny - 14) + ' L' + (W - (CX + 58)) + ' ' + (ny + 40) + ' L' + (W - (CX + 14)) + ' ' + (ny + 52) + ' Z" fill="url(#g-shade)" opacity=".5"/>';
        // placket + buttons
        det += seam('M' + CX + ' ' + (ny + 52) + ' V' + P.hem, c, .5);
        det += '<path d="M' + (CX + 11) + ' ' + (ny + 56) + ' V' + P.hem + '" stroke="' + dark(c, .3) + '" stroke-width="1.2" opacity=".32"/>';
        for (var by = ny + 74; by < P.hem - 14; by += 44) det += btn(CX, by, c);
        // chest pocket
        det += '<path d="M' + (CX + 40) + ' 160 H' + (CX + 78) + ' V' + 204 + ' L' + (CX + 59) + ' 214 L' + (CX + 40) + ' 204 Z" fill="none" stroke="' + dark(c, .32) + '" stroke-width="1.4" opacity=".6"/>';
        det += stitch('M' + (CX + 43) + ' 166 H' + (CX + 75), c, .4);
        // cuffs buttons
        det += btn(outer[0] - dx * 14 - dy * 8, outer[1] - dy * 14 + dx * 8, c, 3);
        det += btn(W - (outer[0] - dx * 14 - dy * 8), outer[1] - dy * 14 + dx * 8, c, 3);
      } else {
        det += '<path d="M' + (CX - 36) + ' ' + (ny + 2) + ' Q' + CX + ' ' + (ny - 22) + ' ' + (CX + 36) + ' ' + (ny + 2) + ' L' + (CX + 40) + ' ' + (ny + 18) + ' Q' + CX + ' ' + (ny - 6) + ' ' + (CX - 40) + ' ' + (ny + 18) + ' Z" fill="' + col + '" stroke="' + dark(c, .3) + '" stroke-width="1.3"/>';
        det += seam('M' + (CX - 34) + ' ' + (ny + 40) + ' Q' + CX + ' ' + (ny + 62) + ' ' + (CX + 34) + ' ' + (ny + 40), c, .5);
        det += '<path d="M' + CX + ' ' + (ny + 48) + ' v22" stroke="' + dark(c, .3) + '" stroke-width="1.3" opacity=".5"/>';
      }
    }
    if (type === 'jacket') {
      var cl = dark(c, .09);
      // stand collar (rib)
      det += '<path d="M' + (CX - 44) + ' ' + (ny + 6) + ' C' + (CX - 40) + ' ' + (ny - 20) + ' ' + (CX - 18) + ' ' + (ny - 24) + ' ' + (CX - 3) + ' ' + (ny - 20) + ' L' + (CX - 3) + ' ' + (ny + 46) + ' C' + (CX - 24) + ' ' + (ny + 40) + ' ' + (CX - 38) + ' ' + (ny + 28) + ' ' + (CX - 44) + ' ' + (ny + 6) + ' Z" fill="' + cl + '"/>';
      det += '<path d="M' + (CX + 44) + ' ' + (ny + 6) + ' C' + (CX + 40) + ' ' + (ny - 20) + ' ' + (CX + 18) + ' ' + (ny - 24) + ' ' + (CX + 3) + ' ' + (ny - 20) + ' L' + (CX + 3) + ' ' + (ny + 46) + ' C' + (CX + 24) + ' ' + (ny + 40) + ' ' + (CX + 38) + ' ' + (ny + 28) + ' ' + (CX + 44) + ' ' + (ny + 6) + ' Z" fill="' + cl + '"/>';
      det += '<path d="M' + (CX - 44) + ' ' + (ny + 6) + ' C' + (CX - 40) + ' ' + (ny - 20) + ' ' + (CX - 18) + ' ' + (ny - 24) + ' ' + (CX - 3) + ' ' + (ny - 20) + ' L' + (CX - 3) + ' ' + (ny + 46) + ' C' + (CX - 24) + ' ' + (ny + 40) + ' ' + (CX - 38) + ' ' + (ny + 28) + ' ' + (CX - 44) + ' ' + (ny + 6) + ' Z" fill="url(#' + texId('rib', c) + ')" opacity=".2"/>';
      det += '<path d="M' + (CX + 44) + ' ' + (ny + 6) + ' C' + (CX + 40) + ' ' + (ny - 20) + ' ' + (CX + 18) + ' ' + (ny - 24) + ' ' + (CX + 3) + ' ' + (ny - 20) + ' L' + (CX + 3) + ' ' + (ny + 46) + ' C' + (CX + 24) + ' ' + (ny + 40) + ' ' + (CX + 38) + ' ' + (ny + 28) + ' ' + (CX + 44) + ' ' + (ny + 6) + ' Z" fill="url(#' + texId('rib', c) + ')" opacity=".2"/>';
      if (!back) {
        det += '<path d="M' + CX + ' ' + (ny - 20) + ' V' + (P.hem - P.ribH) + '" stroke="' + dark(c, .45) + '" stroke-width="2.2" opacity=".6"/>';
        det += '<path d="M' + CX + ' ' + (ny - 20) + ' V' + (P.hem - P.ribH) + '" stroke="' + light(c, .5) + '" stroke-width="1.2" stroke-dasharray="1.6 1.6" opacity=".7"/>';
        det += '<rect x="' + (CX - 4) + '" y="' + (ny + 38) + '" width="8" height="16" rx="3" fill="' + light(c, .5) + '" stroke="' + dark(c, .4) + '" stroke-width=".8"/>';
        det += sym('M' + (CX + 26) + ' 250 L' + (CX + 70) + ' 262', 'fill="none" stroke="' + dark(c, .5) + '" stroke-width="3" stroke-linecap="round" opacity=".5"');
        det += '<path d="M' + (CX + 70) + ' 150 h26" stroke="' + accent + '" stroke-width="5" stroke-linecap="round" opacity=".85"/>';
      } else {
        det += seam('M' + CX + ' ' + (ny + 40) + ' V' + (P.hem - P.ribH), c, .45);
      }
    }
    if (type === 'coat') {
      var lp = lum(c) < .4 ? light(c, .06) : dark(c, .06);
      if (!back) {
        var lap = 'M' + (CX + 3) + ' ' + (ny + 8) + ' L' + (CX + 32) + ' ' + (ny - 8) + ' L' + (CX + 42) + ' ' + (ny + 20) + ' L' + (CX + 62) + ' ' + (ny + 36) + ' L' + (CX + 36) + ' ' + (ny + 78) + ' L' + (CX + 4) + ' ' + (ny + 70) + ' Z';
        det += sym(lap, 'fill="' + lp + '" stroke="' + dark(c, .34) + '" stroke-width="1.4"');
        det += sym(lap, 'fill="url(#g-shade)" opacity=".55"');
        det += '<path d="M' + CX + ' ' + (ny + 72) + ' V' + P.hem + '" stroke="' + dark(c, .4) + '" stroke-width="1.6" opacity=".6"/>';
        det += '<path d="M' + (CX + 20) + ' ' + (ny + 78) + ' V' + P.hem + '" stroke="' + dark(c, .3) + '" stroke-width="1.2" opacity=".3"/>';
        for (var cy = ny + 104; cy < 400; cy += 76) det += btn(CX + 10, cy, c, 4.4);
        det += sym('M' + (CX + 36) + ' 318 h48 v7 h-48 Z', 'fill="' + dark(c, .08) + '" stroke="' + dark(c, .38) + '" stroke-width="1.3" opacity=".9"');
        det += seam('M' + (CX + 74) + ' 150 q10 40 8 90', c, .25);
      } else {
        det += '<path d="M' + (CX - 38) + ' ' + (ny + 4) + ' Q' + CX + ' ' + (ny - 24) + ' ' + (CX + 38) + ' ' + (ny + 4) + ' L' + (CX + 50) + ' ' + (ny + 28) + ' Q' + CX + ' ' + (ny + 4) + ' ' + (CX - 50) + ' ' + (ny + 28) + ' Z" fill="' + lp + '" stroke="' + dark(c, .34) + '" stroke-width="1.3"/>';
        det += seam('M' + CX + ' ' + (ny + 28) + ' V' + P.hem, c, .5);
        det += seam('M' + CX + ' 380 V' + P.hem, c, .0);
        det += '<path d="M' + (CX - 14) + ' ' + (P.hem - 90) + ' V' + P.hem + ' M' + (CX + 14) + ' ' + (P.hem - 90) + ' V' + P.hem + '" stroke="' + dark(c, .35) + '" stroke-width="1.2" opacity=".4"/>';
      }
    }
    // soft folds + highlights (shared)
    var fo = '';
    fo += fold('M' + (CX - 70) + ' ' + (P.hem - 120) + ' Q' + (CX - 20) + ' ' + (P.hem - 100) + ' ' + (CX + 40) + ' ' + (P.hem - 132), c, .07, 10);
    fo += hi('M' + (CX - 78) + ' ' + (armY + 12) + ' Q' + (CX - 60) + ' ' + (armY + 70) + ' ' + (CX - 66) + ' ' + (armY + 130), c, .12, 9);
    if (P.slv === 'long') {
      fo += fold('M' + (outer[0] - 28) + ' ' + (outer[1] - 130) + ' q8 -20 -2 -48', c, .08, 8);
      fo += hi('M' + (W - outer[0] + 22) + ' ' + (outer[1] - 150) + ' q-6 40 -14 80', c, .11, 6);
    }
    // wrinkles: a few compressed folds near the cuffs and at the elbow bend, belly pull-lines
    if (P.slv === 'long' && P.sl > 250) {
      var wr = '';
      [(P.cuffH || 0) + 38, (P.cuffH || 0) + 62, (P.cuffH || 0) + 86].forEach(function (k, i) {
        var o1 = [outer[0] - dx * k, outer[1] - dy * k], i1 = [inner[0] - dx * k, inner[1] - dy * k];
        wr += 'M' + r1(o1[0]) + ' ' + r1(o1[1]) + ' Q' + r1((o1[0] + i1[0]) / 2 + 4 + i) + ' ' + r1((o1[1] + i1[1]) / 2 - 3) + ' ' + r1(i1[0]) + ' ' + r1(i1[1]) + ' ';
      });
      fo += sym(wr, 'fill="none" stroke="' + dark(c, .45) + '" stroke-width="1.6" stroke-linecap="round" opacity=".16"');
      var ek = P.sl * .5;
      fo += sym('M' + r1(tip[0] + dx * ek - dy * 4) + ' ' + r1(tip[1] + dy * ek + dx * 4) + ' l' + r1(-dy * (P.sW - 12)) + ' ' + r1(dx * (P.sW - 12)), 'fill="none" stroke="' + dark(c, .45) + '" stroke-width="2" stroke-linecap="round" opacity=".13"');
    }
    fo += fold('M' + (CX - 36) + ' ' + (armY + 90) + ' Q' + CX + ' ' + (armY + 110) + ' ' + (CX + 40) + ' ' + (armY + 84), c, .05, 7);
    s += '<g' + cp + '>' + fo + '</g>';
    s += det;
    s += B.edge;
    return s;
  }

  /* ---------- BOTTOMS ---------- */
  var BOT = {
    trousers: { ww: 76, wy: 44, hip: 92, hy: 150, ho: 90, hi: 12, hem: 476, cr: 236, band: 24 },
    wide: { ww: 76, wy: 44, hip: 94, hy: 150, ho: 116, hi: 8, hem: 478, cr: 236, band: 24 },
    jeans: { ww: 76, wy: 44, hip: 90, hy: 150, ho: 86, hi: 12, hem: 476, cr: 238, band: 22 },
    loose: { ww: 78, wy: 44, hip: 100, hy: 150, ho: 104, hi: 10, hem: 478, cr: 238, band: 22 },
    shorts: { ww: 78, wy: 70, hip: 96, hy: 160, ho: 106, hi: 10, hem: 330, cr: 262, band: 24 }
  };
  function bottom(type, c, o) {
    var P = BOT[type === 'trousers' ? (o.cut || 'trousers') : type === 'jeans' ? (o.cut === 'loose' ? 'loose' : 'jeans') : 'shorts'];
    var back = o.view === 'back';
    var accent = o.accent || (type === 'jeans' ? '#C98A3C' : (lum(c) < .4 ? light(c, .5) : dark(c, .4)));
    var cmds = [['M', CX, P.wy], ['L', CX + P.ww, P.wy],
      ['C', CX + P.ww + 4, P.wy + 40, CX + P.hip, P.hy - 44, CX + P.hip, P.hy],
      ['C', CX + P.hip + 2, (P.hy + P.hem) / 2, CX + P.ho + 2, P.hem - 60, CX + P.ho, P.hem],
      ['L', CX + P.hi, P.hem],
      ['L', CX + 9, P.cr + 6], ['Q', CX + 4, P.cr + 2, CX, P.cr]];
    var d = fullPath(cmds);
    var tex = type === 'jeans' ? 'twill' : (o.tex || (type === 'trousers' ? 'weave' : null));
    var B = base(d, c, tex, accent);
    var s = ground(CX, P.hem + 8, 130, 13) + B.svg;
    var cp = ' clip-path="url(#' + B.id + ')"';
    // waistband
    s += '<g' + cp + '><rect x="0" y="' + (P.wy - 2) + '" width="400" height="' + (P.band + 2) + '" fill="' + dark(c, .07) + '"/>' +
      '<path d="M0 ' + (P.wy + P.band) + ' H400" stroke="' + dark(c, .38) + '" stroke-width="1.4" opacity=".45"/></g>';
    s += stitch('M' + (CX - P.ww) + ' ' + (P.wy + 5) + ' H' + (CX + P.ww), c, .4);
    // hem shadow lines
    s += stitch('M' + (CX + P.hi + 3) + ' ' + (P.hem - 12) + ' H' + (CX + P.ho - 3), c, .4);
    s += '<path d="M' + (CX - P.hi - 3) + ' ' + (P.hem - 12) + ' H' + (CX - P.ho + 3) + '" fill="none" stroke="' + (lum(c) < .32 ? light(c, .45) : dark(c, .32)) + '" stroke-width="1.3" stroke-dasharray="4 3.4" opacity=".4"/>';
    // belt loops
    [-48, -20, 20, 48].forEach(function (x) {
      s += '<rect x="' + (CX + x - 3.5) + '" y="' + (P.wy - 4) + '" width="7" height="' + (P.band + 8) + '" rx="2" fill="' + dark(c, .12) + '" opacity=".85"/>';
    });
    if (!back) {
      // fly + button
      s += seam('M' + CX + ' ' + (P.wy + P.band) + ' V' + (P.wy + P.band + 54) + ' q0 24 20 30', c, .55);
      s += seam('M' + (CX + 7) + ' ' + (P.wy + P.band) + ' V' + (P.wy + P.band + 50), c, .25);
      s += btn(CX, P.wy + P.band / 2 + 1, c, 4.4);
      // pockets
      var pk = 'M' + (CX + P.ww - 4) + ' ' + (P.wy + P.band) + ' Q' + (CX + P.ww - 30) + ' ' + (P.wy + 74) + ' ' + (CX + P.hip - 2) + ' ' + (P.hy + 8);
      s += sym(pk, 'fill="none" stroke="' + (type === 'jeans' ? accent : dark(c, .36)) + '" stroke-width="' + (type === 'jeans' ? 1.8 : 1.5) + '" ' + (type === 'jeans' ? 'stroke-dasharray="4 3"' : '') + ' opacity=".7"');
      if (type === 'trousers') {
        s += sym('M' + (CX + 28) + ' ' + (P.wy + P.band + 2) + ' q-6 26 -2 52', 'fill="none" stroke="' + dark(c, .32) + '" stroke-width="1.4" opacity=".4"');
        s += sym('M' + (CX + 50) + ' ' + (P.wy + P.band + 2) + ' q-4 22 0 44', 'fill="none" stroke="' + dark(c, .32) + '" stroke-width="1.2" opacity=".28"');
      }
      if (type === 'jeans') {
        s += '<path d="M' + (CX + 40) + ' ' + (P.wy + P.band + 14) + ' h36 v30 q-18 14 -36 0 Z" fill="none" stroke="' + accent + '" stroke-width="1.6" stroke-dasharray="4 3" opacity=".65"/>';
        s += '<circle cx="' + (CX + 78) + '" cy="' + (P.hy - 38) + '" r="3.2" fill="' + accent + '" opacity=".9"/><circle cx="' + (CX - 78) + '" cy="' + (P.hy - 38) + '" r="3.2" fill="' + accent + '" opacity=".9"/>';
      }
      // crease
      s += sym('M' + (CX + (P.hi + P.ho) / 2) + ' ' + (P.hy + 40) + ' V' + (P.hem - 6), 'fill="none" stroke="' + dark(c, .4) + '" stroke-width="5" stroke-linecap="round" opacity=".05"');
      if (type === 'trousers' || type === 'jeans') s += sym('M' + (CX + (P.hi + P.ho) / 2) + ' ' + (P.hy + 40) + ' V' + (P.hem - 6), 'fill="none" stroke="' + light(c, .5) + '" stroke-width="1.5" opacity=".25"');
      // cargo pockets on shorts
      if (type === 'shorts') {
        s += sym('M' + (CX + P.hi + 12) + ' 232 h' + (P.ho - P.hi - 26) + ' v52 h-' + (P.ho - P.hi - 26) + ' Z', 'fill="none" stroke="' + dark(c, .32) + '" stroke-width="1.4" opacity=".6"');
        s += sym('M' + (CX + P.hi + 12) + ' 244 h' + (P.ho - P.hi - 26), 'fill="none" stroke="' + dark(c, .3) + '" stroke-width="1.2" stroke-dasharray="3 3" opacity=".5"');
      }
    } else {
      // back yoke + pockets
      s += seam('M' + (CX - P.ww + 4) + ' ' + (P.wy + P.band) + ' L' + CX + ' ' + (P.wy + P.band + 28) + ' L' + (CX + P.ww - 4) + ' ' + (P.wy + P.band), c, .5);
      s += seam('M' + CX + ' ' + (P.wy + P.band + 28) + ' V' + P.cr, c, .4);
      if (type === 'jeans' || type === 'shorts') {
        var bp = 'M' + (CX + 14) + ' ' + (P.hy - 34) + ' h50 v52 q-25 18 -50 0 Z';
        s += sym(bp, 'fill="' + dark(c, .04) + '" stroke="' + (type === 'jeans' ? accent : dark(c, .36)) + '" stroke-width="1.6" stroke-dasharray="' + (type === 'jeans' ? '4 3' : '0') + '" opacity=".8"');
        if (type === 'jeans') s += sym('M' + (CX + 20) + ' ' + (P.hy - 22) + ' q19 22 38 0', 'fill="none" stroke="' + accent + '" stroke-width="1.5" opacity=".75"');
      } else {
        s += sym('M' + (CX + 24) + ' ' + (P.hy - 34) + ' h40', 'fill="none" stroke="' + dark(c, .45) + '" stroke-width="3.2" stroke-linecap="round" opacity=".6"');
      }
    }
    var fo = fold('M' + (CX + 20) + ' ' + (P.hy + 80) + ' Q' + (CX + 40) + ' ' + (P.hy + 120) + ' ' + (CX + 34) + ' ' + (P.hy + 190), c, .07, 12) +
      hi('M' + (CX + 74) + ' ' + (P.hy + 30) + ' q8 60 4 130', c, .12, 8);
    s += '<g' + cp + '>' + fo + '</g>' + B.edge;
    if (type === 'shorts') s = '<g transform="translate(0 70)">' + s + '</g>';
    return s;
  }

  /* ---------- ACCESSORIES ---------- */
  function belt(c, o) {
    var brass = o.accent || '#C9A45C';
    var TR = 'translate(200 252) rotate(-30) scale(1.16) translate(-207 -250)';
    var s = ground(200, 400, 150, 10);
    var g = '<g transform="' + TR + '">';
    var strap = 'M72 232 H352 L388 250 L352 268 H72 Z';
    var B = base(strap, c, null);
    g += B.svg;
    g += '<g clip-path="url(#' + B.id + ')">' +
      '<rect x="60" y="232" width="340" height="5" fill="#000" opacity=".22"/><rect x="60" y="263" width="340" height="5" fill="#000" opacity=".2"/>' +
      '<rect x="60" y="238" width="340" height="3" fill="#fff" opacity=".12"/></g>';
    g += stitch('M78 241 H350', c, .55) + stitch('M78 259 H350', c, .55);
    [236, 260, 284, 308, 332].forEach(function (x) {
      g += '<circle cx="' + x + '" cy="250" r="4.4" fill="' + dark(c, .65) + '"/><circle cx="' + x + '" cy="249" r="4.4" fill="none" stroke="' + light(c, .25) + '" stroke-width=".8" opacity=".5"/>';
    });
    // keeper loop
    g += '<rect x="132" y="228" width="16" height="44" rx="3" fill="' + dark(c, .12) + '" stroke="' + dark(c, .4) + '" stroke-width="1"/>';
    // buckle: frame + prong
    g += '<rect x="26" y="212" width="68" height="76" rx="12" fill="none" stroke="#000" stroke-width="9" opacity=".18" transform="translate(3 4)"/>';
    g += '<rect x="26" y="212" width="68" height="76" rx="12" fill="none" stroke="' + brass + '" stroke-width="9"/>';
    g += '<rect x="26" y="212" width="68" height="76" rx="12" fill="none" stroke="#fff" stroke-width="2.4" opacity=".35" transform="translate(-1.5 -1.5)"/>';
    g += '<path d="M60 250 H108" stroke="' + brass + '" stroke-width="7" stroke-linecap="round"/><path d="M60 248 H108" stroke="#fff" stroke-width="1.6" opacity=".4"/>';
    g += '</g>';
    return s + g + B.edge.replace('<path', '<path transform="' + TR + '"');
  }

  function socks(c, o) {
    var accent = o.accent || (lum(c) < .45 ? light(c, .6) : dark(c, .45));
    var s = ground(210, 400, 150, 12);
    function sock(x, y, col, rot, stripe) {
      var d = 'M0 0 H84 V170 C84 204 112 212 144 222 C182 234 204 252 204 280 C204 310 176 320 146 320 H38 C12 320 0 302 0 272 Z';
      var B = base(d, col, 'rib');
      var out = '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' + B.svg;
      out += '<g clip-path="url(#' + B.id + ')">';
      out += '<rect x="-4" y="0" width="100" height="40" fill="' + dark(col, .08) + '"/><rect x="-4" y="0" width="100" height="40" fill="url(#' + texId('rib', col) + ')" opacity=".3"/>';
      out += '<path d="M-4 40 H100" stroke="' + dark(col, .4) + '" stroke-width="1.5" opacity=".45"/>';
      if (stripe) out += '<rect x="-4" y="52" width="100" height="9" fill="' + stripe + '" opacity=".95"/><rect x="-4" y="68" width="100" height="4" fill="' + stripe + '" opacity=".75"/>';
      // heel and toe patches
      out += '<path d="M84 170 C84 204 112 212 144 222 L132 262 C106 252 76 244 66 214 Z" fill="' + dark(col, .12) + '" opacity=".55"/>';
      out += '<path d="M168 238 C192 246 204 262 204 280 C204 310 176 320 146 320 H140 C150 296 150 262 168 238 Z" fill="' + dark(col, .12) + '" opacity=".55"/>';
      out += hi('M18 60 Q14 160 22 250', col, .16, 10) + fold('M70 70 Q74 150 66 210', col, .1, 8);
      out += '</g>' + B.edge + '</g>';
      return out;
    }
    s += sock(66, 58, dark(c, .1), -4, null);
    s += sock(138, 116, c, 5, accent);
    return s;
  }

  function beanie(c, o) {
    var accent = o.accent || light(c, .5);
    var d = 'M92 318 C86 186 134 104 200 104 C266 104 314 186 308 318 Z';
    var B = base(d, c, 'rib');
    var s = ground(200, 372, 126, 13) + B.svg;
    s += '<g clip-path="url(#' + B.id + ')">' + fold('M150 140 Q140 230 146 318', c, .08, 12) + hi('M246 130 q34 60 30 170', c, .14, 12) + '</g>';
    // cuff
    var cuff = 'M86 304 Q200 318 314 304 L318 372 Q200 392 82 372 Z';
    s += '<path d="' + cuff + '" fill="' + dark(c, .08) + '"/><path d="' + cuff + '" fill="url(#' + texId('rib', c) + ')" opacity=".26"/><path d="' + cuff + '" fill="url(#g-shade)" opacity=".7"/>';
    s += '<path d="' + cuff + '" fill="none" stroke="' + dark(c, .34) + '" stroke-width="1.4" opacity=".5"/>';
    s += '<rect x="' + (200 - 24) + '" y="338" width="48" height="16" rx="3" fill="' + accent + '" opacity=".92"/>';
    s += '<text x="200" y="350.4" font-family="Playfair Display,Georgia,serif" font-style="italic" font-weight="600" font-size="11" fill="' + (lum(accent) > .5 ? '#1a1612' : '#fff') + '" text-anchor="middle">Renato</text>';
    s += B.edge;
    return s;
  }

  function cap(c, o) {
    var accent = o.accent || light(c, .5);
    var s = ground(210, 372, 150, 13);
    var crown = 'M96 322 C92 224 142 146 214 146 C288 146 332 214 334 322 Z';
    var B = base(crown, c, 'weave');
    s += B.svg;
    s += '<g clip-path="url(#' + B.id + ')">' +
      '<path d="M214 146 C200 200 196 262 200 322" fill="none" stroke="' + dark(c, .4) + '" stroke-width="1.5" opacity=".4"/>' +
      '<path d="M214 146 C250 190 266 256 262 322" fill="none" stroke="' + dark(c, .4) + '" stroke-width="1.5" opacity=".4"/>' +
      '<path d="M214 146 C168 176 148 240 150 322" fill="none" stroke="' + dark(c, .4) + '" stroke-width="1.5" opacity=".4"/>' +
      hi('M250 168 q40 40 46 120', c, .14, 12) + '</g>';
    s += '<circle cx="214" cy="148" r="8" fill="' + dark(c, .12) + '" stroke="' + dark(c, .35) + '" stroke-width="1"/>';
    s += B.edge;
    var visor = 'M104 318 C80 312 36 322 14 350 C58 378 150 376 224 342 Z';
    s += '<path d="' + visor + '" fill="#000" opacity=".12" transform="translate(5 8)"/><path d="' + visor + '" fill="' + dark(c, .1) + '"/>' +
      '<path d="' + visor + '" fill="url(#g-shade)"/><path d="' + visor + '" fill="none" stroke="' + dark(c, .38) + '" stroke-width="1.4" opacity=".5"/>' +
      '<path d="M30 352 C80 368 150 364 210 340" fill="none" stroke="' + dark(c, .35) + '" stroke-width="1.3" stroke-dasharray="4 3.4" opacity=".55"/>';
    s += '<path d="M96 322 H334 V338 H110 Z" fill="' + dark(c, .12) + '" opacity=".6"/>';
    s += '<text x="236" y="262" font-family="Playfair Display,Georgia,serif" font-style="italic" font-weight="600" font-size="22" fill="' + accent + '" text-anchor="middle">R</text>';
    return s;
  }

  function scarf(c, o) {
    var accent = o.accent || (lum(c) < .4 ? light(c, .5) : dark(c, .4));
    var s = ground(200, 456, 100, 12);
    var body = 'M128 70 Q200 22 272 70 L276 424 L124 424 Z';
    var B = base(body, c, 'rib');
    s += B.svg;
    s += '<g clip-path="url(#' + B.id + ')">' +
      '<rect x="100" y="372" width="200" height="14" fill="' + accent + '" opacity=".85"/><rect x="100" y="394" width="200" height="6" fill="' + accent + '" opacity=".7"/>' +
      '<path d="M158 60 Q150 240 160 424" stroke="url(#g-sheen)" stroke-width="34" fill="none" opacity=".6"/>' +
      fold('M200 100 q10 120 -2 300', c, .08, 14) + '</g>';
    s += B.edge;
    var fr = '';
    for (var x = 128; x <= 272; x += 7.2) fr += '<path d="M' + x + ' 424 q' + (Math.sin(x) * 2) + ' 16 ' + (Math.cos(x) * 3) + ' 34" stroke="' + dark(c, .12) + '" stroke-width="3.4" stroke-linecap="round" fill="none"/>';
    s += fr;
    // second layer (draped end)
    var d2 = 'M236 150 L318 156 L330 346 L252 350 Z';
    s += '<path d="' + d2 + '" fill="#000" opacity=".1" transform="translate(5 8)"/><path d="' + d2 + '" fill="' + dark(c, .06) + '"/><path d="' + d2 + '" fill="url(#' + texId('rib', c) + ')" opacity=".18"/><path d="' + d2 + '" fill="url(#g-shade)"/>' +
      '<path d="M251 318 L329 314 V328 L250 332 Z" fill="' + accent + '" opacity=".85"/>';
    s += '<path d="' + d2 + '" fill="none" stroke="' + dark(c, .35) + '" stroke-width="1.3" opacity=".5"/>';
    return s;
  }

  function tote(c, o) {
    var accent = o.accent || (lum(c) < .4 ? light(c, .6) : dark(c, .5));
    var s = ground(200, 456, 132, 13);
    // handles
    s += '<path d="M138 190 C130 80 270 80 262 190" fill="none" stroke="' + dark(c, .1) + '" stroke-width="15" stroke-linecap="round"/>';
    s += '<path d="M138 190 C130 80 270 80 262 190" fill="none" stroke="url(#' + texId('weave', c) + ')" stroke-width="15" opacity=".25"/>';
    s += '<path d="M138 190 C130 92 270 92 262 190" fill="none" stroke="' + light(c, .22) + '" stroke-width="2.4" opacity=".5"/>';
    var body = 'M92 176 H308 L322 440 Q200 452 78 440 Z';
    var B = base(body, c, 'weave');
    s += B.svg;
    s += '<g clip-path="url(#' + B.id + ')">' +
      '<rect x="60" y="176" width="280" height="24" fill="' + dark(c, .14) + '" opacity=".55"/>' +
      fold('M108 220 q-6 100 -4 200', c, .08, 14) + hi('M286 220 q8 90 12 200', c, .12, 12) + '</g>';
    s += stitch('M96 206 H304', c, .5);
    s += logoText(200, 330, 44, accent);
    s += '<path d="M150 348 H250" stroke="' + accent + '" stroke-width="1.6" opacity=".6"/>';
    s += B.edge;
    return s;
  }

  /* ---------- public ---------- */
  var DETAIL = {
    tee: '110 22 180 225', longsleeve: '110 22 180 225', sweater: '110 22 180 225', hoodie: '104 10 192 240', shirt: '108 22 184 230',
    jacket: '108 22 184 230', coat: '106 14 188 235', trousers: '120 30 160 200', jeans: '120 30 160 200', shorts: '120 52 160 200',
    polo: '110 22 180 225', blazer: '106 14 188 235', cardigan: '108 22 184 230', belt: '0 215 210 262', socks: '60 200 260 325', beanie: '100 232 200 250', cap: '130 135 220 275', scarf: '100 300 200 250', tote: '95 215 210 262'
  };
  var VIEWBOX = '0 0 400 500';

  var ALIAS = { vest: 'jacket', turtleneck: 'sweater' };   // types that only exist as photos fall back to the closest drawing
  function render(type, opts) {
    type = ALIAS[type] || type;
    opts = opts || {};
    var c = opts.c || '#8a8a8a';
    var inner;
    if (TOP[type]) inner = top(type, c, opts);
    else if (type === 'trousers' || type === 'jeans' || type === 'shorts') inner = bottom(type, c, opts);
    else if (type === 'belt') inner = belt(c, opts);
    else if (type === 'socks') inner = socks(c, opts);
    else if (type === 'beanie') inner = '<g transform="translate(-34 -50) scale(1.17)">' + beanie(c, opts) + '</g>';
    else if (type === 'cap') inner = '<g transform="translate(-34 -52) scale(1.17)">' + cap(c, opts) + '</g>';
    else if (type === 'scarf') inner = '<g transform="translate(-18 -28) scale(1.09)">' + scarf(c, opts) + '</g>';
    else if (type === 'tote') inner = '<g transform="translate(-30 -52) scale(1.15)">' + tote(c, opts) + '</g>';
    else inner = '';
    var vb = opts.view === 'detail' ? (DETAIL[type] || VIEWBOX) : VIEWBOX;
    return '<svg class="art-svg" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  global.Art = { render: render, mountDefs: mountDefs, mix: mix, dark: dark, light: light, lum: lum };
})(window);
