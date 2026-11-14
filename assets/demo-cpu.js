(function (G) {
var P = {"dog":{"id":"dog","acuityLossFactor":3.75,"saturation":1,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881],"motion":{"threshold":0.03,"gain":10,"decay":0.88,"stillBrightness":0.85,"stillSaturation":0.75,"stillBlurScale":2}},"cat":{"id":"cat","acuityLossFactor":6,"saturation":0.85,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881],"night":{"shadowGamma":1.9,"rodMix":0.8,"rodTint":[0.75,0.95,1],"grain":0.05}},"bee":{"id":"bee","acuityLossFactor":40,"saturation":1,"exposureStops":0,"colorMatrix":[0.35,0.65,0,0,0.15,0.85,-0.3,-0.3,1.6],"mosaic":{"facetDegrees":1.8,"seam":0.5,"bulge":0.3,"vignette":0.35,"jitter":0.05}},"protanopia":{"id":"protanopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.152286,1.052583,-0.204868,0.114503,0.786281,0.099216,-0.003882,-0.048116,1.051998]},"deuteranopia":{"id":"deuteranopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881]},"tritanopia":{"id":"tritanopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[1.255528,-0.076749,-0.178779,-0.078411,0.930809,0.147602,0.004733,0.691367,0.3039]},"achromatopsia":{"id":"achromatopsia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.2126,0.7152,0.0722,0.2126,0.7152,0.0722,0.2126,0.7152,0.0722]},"baby":{"id":"baby","acuityLossFactor":3.5,"saturation":1,"exposureStops":0,"colorMatrix":[1,0,0,0,1,0,0,0,1],"haze":{"amount":0,"veil":[0.25,0.25,0.25]},"stages":{"defaultMonth":0,"keyframes":[{"month":0,"acuityLossFactor":25,"saturation":0.1,"redSaturation":0.1,"haze":0.45},{"month":1,"acuityLossFactor":21,"saturation":0.1,"redSaturation":0.15,"haze":0.4},{"month":2,"acuityLossFactor":15,"saturation":0.15,"redSaturation":0.45,"haze":0.32},{"month":3,"acuityLossFactor":11,"saturation":0.3,"redSaturation":0.7,"haze":0.25},{"month":4,"acuityLossFactor":8.5,"saturation":0.7,"redSaturation":0.9,"haze":0.18},{"month":6,"acuityLossFactor":6,"saturation":0.95,"redSaturation":1,"haze":0.1},{"month":9,"acuityLossFactor":4.5,"saturation":1,"redSaturation":1,"haze":0.04},{"month":12,"acuityLossFactor":3.5,"saturation":1,"redSaturation":1,"haze":0}]}}};
var LUM = [0.2126, 0.7152, 0.0722];
var S2L = new Float32Array(256);
for (var i = 0; i < 256; i++) { var c = i / 255; S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function l2s(v) { v = v < 0 ? 0 : v > 1 ? 1 : v; return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }
var L2S_N = 8192, L2S = new Float32Array(L2S_N + 1);
for (i = 0; i <= L2S_N; i++) L2S[i] = l2s(i / L2S_N);
function fl2s(v) { return v <= 0 ? 0 : v >= 1 ? 1 : L2S[(v * L2S_N + 0.5) | 0]; }
function s2l(c) { c = c < 0 ? 0 : c > 1 ? 1 : c; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function smoothstep(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
function mul3(a, b) { var o = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { var s = 0; for (var k = 0; k < 3; k++) s += a[r * 3 + k] * b[k * 3 + c]; o.push(s); } return o; }
function satM(s) { var m = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) m.push((1 - s) * LUM[c] + (r === c ? s : 0)); return m; }
function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
function resolve(id, month) {
var p = JSON.parse(JSON.stringify(P[id]));
if (p.stages) {
var ks = p.stages.keyframes, m = month == null ? p.stages.defaultMonth : month;
m = Math.max(ks[0].month, Math.min(ks[ks.length - 1].month, m));
var a = ks[0], b = ks[ks.length - 1];
for (var j = 1; j < ks.length; j++) if (m <= ks[j].month) { a = ks[j - 1]; b = ks[j]; break; }
var f = b.month > a.month ? (m - a.month) / (b.month - a.month) : 0;
var lerp = function (k) { return a[k] + f * (b[k] - a[k]); };
p.acuityLossFactor = lerp('acuityLossFactor');
var s = [lerp('redSaturation'), lerp('saturation'), lerp('saturation')], sm = [];
for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) sm.push((1 - s[r]) * LUM[c] + (r === c ? s[r] : 0));
p.colorMatrix = mul3(sm, p.colorMatrix);
if (p.haze) p.haze.amount = lerp('haze');
}
return p;
}
function sigmaFraction(p, fov) {
if (p.acuityLossFactor <= 1) return 0;
return ((p.acuityLossFactor - 1) / 60) / fov * (1 / (2 * Math.sqrt(2 * Math.log(2)))) * 3.5;
}
function combined(p) { var g = Math.pow(2, p.exposureStops || 0); return mul3(satM(p.saturation), p.colorMatrix).map(function (v) { return v * g; }); }
function boxes(sigma) {
var wI = Math.sqrt(12 * sigma * sigma / 3 + 1), wl = Math.floor(wI); if (wl % 2 === 0) wl--;
var m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4)), o = [];
for (var k = 0; k < 3; k++) o.push(k < m ? wl : wl + 2); return o;
}
function boxH(s, d, w, h, r) {
var ia = 1 / (r + r + 1);
for (var y = 0; y < h; y++) {
var o = y * w, acc = 0, k;
for (k = -r - 1; k < r; k++) acc += s[o + (k < 0 ? 0 : k >= w ? w - 1 : k)];
for (var x = 0; x < w; x++) {
var a = x + r, b = x - r - 1;
acc += s[o + (a >= w ? w - 1 : a)] - s[o + (b < 0 ? 0 : b)];
d[o + x] = acc * ia;
}
}
}
function boxV(s, d, w, h, r) {
var ia = 1 / (r + r + 1);
for (var x = 0; x < w; x++) {
var acc = 0, k;
for (k = -r - 1; k < r; k++) acc += s[(k < 0 ? 0 : k >= h ? h - 1 : k) * w + x];
for (var y = 0; y < h; y++) {
var a = y + r, b = y - r - 1;
acc += s[(a >= h ? h - 1 : a) * w + x] - s[(b < 0 ? 0 : b) * w + x];
d[y * w + x] = acc * ia;
}
}
}
function gauss(ch, w, h, sigma) {
if (!(sigma > 0.35)) return ch;
var bx = boxes(sigma), t = new Float32Array(ch.length), a = Float32Array.from(ch);
for (var i = 0; i < 3; i++) { var r = (bx[i] - 1) / 2; boxH(a, t, w, h, r); boxV(t, a, w, h, r); }
return a;
}
function blur3(c, w, h, s) { return [gauss(c[0], w, h, s), gauss(c[1], w, h, s), gauss(c[2], w, h, s)]; }
function applyM(m, c, n) {
var R = c[0], Gc = c[1], B = c[2], o0 = new Float32Array(n), o1 = new Float32Array(n), o2 = new Float32Array(n);
for (var i = 0; i < n; i++) { var r = R[i], g = Gc[i], b = B[i]; o0[i] = m[0] * r + m[1] * g + m[2] * b; o1[i] = m[3] * r + m[4] * g + m[5] * b; o2[i] = m[6] * r + m[7] * g + m[8] * b; }
return [o0, o1, o2];
}
function hsv2rgb(h, s, v) {
var c = v * s, x = c * (1 - Math.abs(((h * 6) % 2) - 1)), m = v - c, r, g, b;
switch (Math.floor(h * 6) % 6) { case 0: r = c; g = x; b = 0; break; case 1: r = x; g = c; b = 0; break; case 2: r = 0; g = c; b = x; break; case 3: r = 0; g = x; b = c; break; case 4: r = x; g = 0; b = c; break; default: r = c; g = 0; b = x; }
return [r + m, g + m, b + m];
}
function quantize(q, r, g, b) {
r = clamp01(r); g = clamp01(g); b = clamp01(b);
var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
if (d > 0) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
var s = mx === 0 ? 0 : d / mx, st = q.valueLevels - 1, v = Math.round(mx * st) / st;
if (s < q.minSaturation) return [v, v, v];
var band = Math.min(Math.floor(h * q.hueBands), q.hueBands - 1);
return hsv2rgb((band + 0.5) / q.hueBands, q.saturationFloor, v);
}
function night(n, r, g, b) {
var k = 1 / n.shadowGamma; r = Math.pow(clamp01(r), k); g = Math.pow(clamp01(g), k); b = Math.pow(clamp01(b), k);
var l = LUM[0] * r + LUM[1] * g + LUM[2] * b, w = n.rodMix * (1 - l) * (1 - l), rod = 0.05 * r + 0.55 * g + 0.40 * b;
return [(1 - w) * r + w * rod * n.rodTint[0], (1 - w) * g + w * rod * n.rodTint[1], (1 - w) * b + w * rod * n.rodTint[2]];
}
function simulate(p, M, r, g, b) {
var lr = s2l(r), lg = s2l(g), lb = s2l(b);
var o = [fl2s(M[0] * lr + M[1] * lg + M[2] * lb), fl2s(M[3] * lr + M[4] * lg + M[5] * lb), fl2s(M[6] * lr + M[7] * lg + M[8] * lb)];
if (p.electric) {
var e = p.electric, al = clamp01(e.heatWeights[0] * r + e.heatWeights[1] * g + e.heatWeights[2] * b + e.heatBias);
var gl = e.strength * smoothstep(e.threshold, 1, al);
o = [(1 - gl) * o[0] + gl * e.color[0], (1 - gl) * o[1] + gl * e.color[1], (1 - gl) * o[2] + gl * e.color[2]];
}
if (p.night) o = night(p.night, o[0], o[1], o[2]);
if (p.quantize) o = quantize(p.quantize, o[0], o[1], o[2]);
return o;
}
function noiseField(w, h, cell, rand, blurCells) {
var gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
for (var i = 0; i < g.length; i++) g[i] = rand();
if (blurCells) g = gauss(g, gw, gh, blurCells);
var out = new Float32Array(w * h);
for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
var fx = x / cell, fy = y / cell, x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
var a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], c = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
out[y * w + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}
return out;
}
function softLight(d, s) { if (s <= 0.5) return d - (1 - 2 * s) * d * (1 - d); var D = d <= 0.25 ? ((16 * d - 12) * d + 4) * d : Math.sqrt(d); return d + (2 * s - 1) * (D - d); }
function hash21(x, y) {
var px = (x * 123.34) % 1, py = (y * 456.21) % 1; if (px < 0) px += 1; if (py < 0) py += 1;
var dd = px * (px + 45.32) + py * (py + 45.32); px += dd; py += dd; var v = (px * py) % 1; return v < 0 ? v + 1 : v;
}
function mosaic(c, w, h, cellFrac, m) {
var R = Math.max(cellFrac * w / Math.sqrt(3), 2), SQ3 = 1.7320508, aspect = w / h, r2max = (aspect * 0.5) * (aspect * 0.5) + 0.25, k = m.bulge * 2;
var o = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];
function sample(ch, sx, sy) {
var x = sx * w - 0.5, y = sy * h - 0.5; x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y));
var x0 = x | 0, y0 = y | 0, x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1), tx = x - x0, ty = y - y0;
return (ch[y0 * w + x0] * (1 - tx) + ch[y0 * w + x1] * tx) * (1 - ty) + (ch[y1 * w + x0] * (1 - tx) + ch[y1 * w + x1] * tx) * ty;
}
var cache = {};
for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) {
var X = px + 0.5, Y = py + 0.5;
var qf = (SQ3 / 3 * X - Y / 3) / R, rf = (2 / 3 * Y) / R, sf = -qf - rf;
var rq = Math.round(qf), rr = Math.round(rf), rs = Math.round(sf);
var dq = Math.abs(rq - qf), dr = Math.abs(rr - rf), ds = Math.abs(rs - sf);
if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
var cx = R * SQ3 * (rq + rr * 0.5), cy = R * 1.5 * rr, lx = X - cx, ly = Y - cy;
var dn = Math.max(Math.abs(lx) / (SQ3 * 0.5 * R), (Math.abs(ly) + Math.abs(lx) / SQ3) / R);
var key = rq + ',' + rr, col = cache[key];
if (!col) {
var ccx = cx / w - 0.5, ccy = cy / h - 0.5, cax = ccx * aspect, f = (1 + k * (cax * cax + ccy * ccy)) / (1 + k * r2max);
var sx = 0.5 + ccx * f, sy = 0.5 + ccy * f, acc = [0, 0, 0];
for (var t = -1; t < 6; t++) {
var ox = 0, oy = 0; if (t >= 0) { var an = t * 1.0471976; ox = Math.cos(an) * 0.5 * R / w; oy = Math.sin(an) * 0.5 * R / h; }
for (var q = 0; q < 3; q++) acc[q] += sample(c[q], sx + ox, sy + oy);
}
col = cache[key] = [acc[0] / 7, acc[1] / 7, acc[2] / 7, 1 + (hash21(rq, rr) - 0.5) * 2 * m.jitter];
}
var pcx = (X / w - 0.5) * aspect, pcy = Y / h - 0.5;
var mul = (1 + 0.06 * (1 - dn * dn)) * (1 - m.seam * smoothstep(0.72, 0.98, dn)) * col[3] * (1 - m.vignette * smoothstep(0.45, 1, Math.sqrt(pcx * pcx + pcy * pcy) / Math.sqrt(r2max)));
var i = py * w + px; o[0][i] = clamp01(col[0] * mul); o[1][i] = clamp01(col[1] * mul); o[2][i] = clamp01(col[2] * mul);
}
return o;
}
function render(rgba, w, h, id, opts) {
opts = opts || {};
var p = resolve(id, opts.month), fov = opts.fov || 38, n = w * h, rand = rng(opts.seed || 7);
var lin = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
for (var i = 0, j = 0; i < n; i++, j += 4) { lin[0][i] = S2L[rgba[j]]; lin[1][i] = S2L[rgba[j + 1]]; lin[2][i] = S2L[rgba[j + 2]]; }
var sigma = sigmaFraction(p, fov) * w;
var c = blur3(lin, w, h, sigma), srgb;
var M = combined(p);
if (p.night || p.quantize || p.electric) {
srgb = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
for (i = 0; i < n; i++) { var o = simulate(p, M, fl2s(c[0][i]), fl2s(c[1][i]), fl2s(c[2][i])); srgb[0][i] = o[0]; srgb[1][i] = o[1]; srgb[2][i] = o[2]; }
if (p.electric && p.electric.flicker > 0) {
var e = p.electric, plain = applyM(M, c, n), nz = noiseField(w, h, Math.max(e.flickerScale * w, 2), rand, 0.6);
for (i = 0; i < n; i++) { var mk = 1 - e.flicker * nz[i]; for (var q = 0; q < 3; q++) srgb[q][i] = mk * srgb[q][i] + (1 - mk) * fl2s(plain[q][i]); }
}
if (p.night && p.night.grain > 0) {
var a = p.night.grain * 2, gn = noiseField(w, h, Math.max(w / 720, 1), rand, 0);
for (i = 0; i < n; i++) { var s = 0.5 - a / 2 + a * gn[i]; for (q = 0; q < 3; q++) srgb[q][i] = softLight(clamp01(srgb[q][i]), s); }
}
} else {
var L = applyM(M, c, n);
if (p.haze) { var hz = p.haze, am = hz.amount || 0, tn = hz.tint || [1, 1, 1]; for (q = 0; q < 3; q++) for (i = 0; i < n; i++) L[q][i] = (1 - am) * tn[q] * L[q][i] + am * hz.veil[q]; }
if (p.motion) {
var mo = p.motion, st = blur3(L, w, h, Math.max(sigma, 1) * mo.stillBlurScale);
var sm = satM(mo.stillSaturation).map(function (v) { return v * mo.stillBrightness; });
st = applyM(sm, st, n);
if (opts.stillScene !== false || !opts.motionMask) L = st;
else { var mm = opts.motionMask; for (q = 0; q < 3; q++) for (i = 0; i < n; i++) L[q][i] = st[q][i] + (L[q][i] - st[q][i]) * mm[i]; }
}
srgb = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
for (q = 0; q < 3; q++) for (i = 0; i < n; i++) srgb[q][i] = fl2s(L[q][i]);
}
if (p.mosaic) srgb = mosaic(srgb, w, h, p.mosaic.facetDegrees / fov, p.mosaic);
var out = new Uint8ClampedArray(n * 4);
for (i = 0, j = 0; i < n; i++, j += 4) { out[j] = srgb[0][i] * 255 + 0.5; out[j + 1] = srgb[1][i] * 255 + 0.5; out[j + 2] = srgb[2][i] * 255 + 0.5; out[j + 3] = 255; }
return out;
}
function motionTracker(spec) {
var prev = null, mask = null;
return function (rgba, w, h) {
var qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2), l = new Float32Array(qw * qh);
for (var y = 0; y < qh; y++) for (var x = 0; x < qw; x++) { var j = ((y * 4) * w + x * 4) * 4; l[y * qw + x] = LUM[0] * S2L[rgba[j]] + LUM[1] * S2L[rgba[j + 1]] + LUM[2] * S2L[rgba[j + 2]]; }
l = gauss(l, qw, qh, 1);
var m = new Float32Array(qw * qh);
for (var i = 0; i < m.length; i++) { var d = prev && prev.length === l.length ? Math.abs(l[i] - prev[i]) : 0; var v = clamp01((d - spec.threshold) * spec.gain); m[i] = Math.max(v, mask && mask.length === m.length ? mask[i] * spec.decay : 0); }
prev = l; mask = m;
var sm = gauss(m, qw, qh, 1.5), full = new Float32Array(w * h);
for (y = 0; y < h; y++) for (x = 0; x < w; x++) full[y * w + x] = sm[Math.min(qh - 1, (y >> 2)) * qw + Math.min(qw - 1, x >> 2)];
return full;
};
}
G.ZV = { render: render, resolve: resolve, sigmaFraction: sigmaFraction, motionTracker: motionTracker, profiles: P };
})(typeof window !== 'undefined' ? window : globalThis);
(function () {
var Z = window.ZV, c = null;
window.ZLCPU = {
kind: 'cpu',
render: function (src, w, h, id, o) {
c = c || document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h);
var d = x.getImageData(0, 0, w, h), mm = /^baby(\d+)$/.exec(id), mask = null;
if (o.mask) {
var m = o.mask, f = new Float32Array(w * h);
for (var y = 0; y < h; y++) for (var X = 0; X < w; X++) f[y * w + X] = m.f[Math.min(m.h - 1, (y * m.h / h) | 0) * m.w + Math.min(m.w - 1, (X * m.w / w) | 0)];
mask = f;
}
d.data.set(Z.render(d.data, w, h, mm ? 'baby' : id, { fov: o.fov, month: mm ? Number(mm[1]) : null, stillScene: !mask, motionMask: mask, seed: o.seed || 7 }));
x.putImageData(d, 0, 0); return c;
},
};
})();