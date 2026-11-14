(function () {
'use strict';
var doc = document, root = doc.documentElement;
var C = JSON.parse(doc.getElementById('zl').textContent), T = C.t;
var RM = matchMedia('(prefers-reduced-motion: reduce)'), DESK = matchMedia('(min-width: 960px)');
root.classList.add('live');
function $(s, r) { return (r || doc).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function hh() { var h = $('.hdr'); return h ? h.getBoundingClientRect().height : 0; }
function bez(x1, y1, x2, y2) {
function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; } function b(p1, p2) { return 3 * p2 - 6 * p1; } function c(p1) { return 3 * p1; }
function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
return function (x) { var t = x; for (var i = 0; i < 6; i++) { var s = slope(t, x1, x2); if (!s) break; t -= (at(t, x1, x2) - x) / s; } return at(Math.max(0, Math.min(1, t)), y1, y2); };
}
var SWEEP = bez(0.33, 1, 0.68, 1), OUT = bez(0, 0, 0.58, 1);
function layer(scene, eye, cls, alt) {
var d = doc.createElement('div'), b = C.img + scene + '-' + eye;
d.className = 'lyr ' + cls;
d.innerHTML = '<picture><source media="(min-width: 960px)" type="image/avif" srcset="' + b + '-p45.avif"><source media="(min-width: 960px)" type="image/webp" srcset="' + b + '-p45.webp"><source media="(min-width: 960px)" srcset="' + b + '-p45.jpg"><source type="image/avif" srcset="' + b + '-sq.avif"><source type="image/webp" srcset="' + b + '-sq.webp"><img src="' + b + '-sq.jpg" width="800" height="800" alt="" decoding="async"></picture>';
var img = $('img', d); if (alt) img.alt = alt;
return d;
}
function ready(el) { var i = $('img', el); return i && i.decode ? i.decode().catch(function () {}) : Promise.resolve(); }
function Split(el) {
var s = this; el._split = s; s.el = el; s.x = parseFloat(getComputedStyle(el).getPropertyValue('--x')) || 40; s.anim = 0; s.touched = false;
s.h = $('[data-handle]', el); s.labL = $('.lab-l', el); s.labR = $('.lab-r', el);
s.vt = el.getAttribute('data-vt') || '';
if (s.h) s.bind();
s.set(s.x);
}
function minW(lab) {
var m = 0;
Array.prototype.forEach.call(lab.childNodes, function (n) {
var r = null; if (n.nodeType === 3) { if (!n.textContent.trim()) return; var g = doc.createRange(); g.selectNodeContents(n); r = g.getBoundingClientRect(); } else if (n.getBoundingClientRect) r = n.getBoundingClientRect();
if (r) m = Math.max(m, r.width);
});
return m + 26;
}
Split.prototype.set = function (x) {
x = Math.max(0, Math.min(100, x)); var W = this.el.clientWidth;
if (this.labL && this.mL == null) this.mL = minW(this.labL);
if (this.labR && this.mR == null) this.mR = minW(this.labR);
this.x = x; this.el.style.setProperty('--x', x.toFixed(2));
var sbs = this.el.classList.contains('sbs');
if (this.labL) this.labL.classList.toggle('off', !sbs && (x < 8 || x / 100 * W - 20 < this.mL));
if (this.labR) this.labR.classList.toggle('off', !sbs && (x > 92 || (100 - x) / 100 * W - 20 < this.mR));
if (this.h) { this.h.setAttribute('aria-valuenow', Math.round(100 - x)); this.h.setAttribute('aria-valuetext', this.vt.replace('%d', Math.round(100 - x))); }
};
Split.prototype.to = function (x, ms, ease) {
var s = this; cancelAnimationFrame(s.anim);
if (RM.matches || !ms) { s.set(x); return Promise.resolve(); }
var from = s.x, t0 = performance.now();
return new Promise(function (res) {
function f(t) { var k = Math.min(1, (t - t0) / ms); s.set(from + (x - from) * (ease || OUT)(k)); if (k < 1) s.anim = requestAnimationFrame(f); else res(); }
s.anim = requestAnimationFrame(f);
});
};
Split.prototype.stop = function () { this.touched = true; cancelAnimationFrame(this.anim); };
Split.prototype.bind = function () {
var s = this, el = s.el, st = null, raf = 0, px = 0;
function xAt(cx) { var r = el.getBoundingClientRect(); return (cx - r.left) / r.width * 100; }
el.addEventListener('pointerdown', function (e) {
if (e.button > 0 || el.classList.contains('choosing') || el.classList.contains('sbs')) return;
if (e.target.closest('button,a,input,label,.chooser') && !e.target.closest('[data-handle]')) return;
s.stop(); st = { x: e.clientX, y: e.clientY, id: e.pointerId, drag: false };
if (e.target.closest('[data-handle]')) { st.drag = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} }
});
el.addEventListener('pointermove', function (e) {
if (!st || e.pointerId !== st.id) return;
var dx = e.clientX - st.x, dy = e.clientY - st.y;
if (!st.drag && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) { st.drag = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} }
if (st.drag) { px = e.clientX; e.preventDefault(); if (!raf) raf = requestAnimationFrame(function () { raf = 0; s.set(xAt(px)); }); }
});
function end(e) {
if (!st || e.pointerId !== st.id) return;
if (!st.drag && e.type === 'pointerup' && Math.abs(e.clientX - st.x) < 6 && Math.abs(e.clientY - st.y) < 6) s.to(xAt(e.clientX), 200);
st = null;
}
el.addEventListener('pointerup', end); el.addEventListener('pointercancel', function () { st = null; });
el.addEventListener('dragstart', function (e) { e.preventDefault(); });
s.h.addEventListener('keydown', function (e) {
var k = e.key, a = 100 - s.x;
if (k === 'ArrowRight' || k === 'ArrowUp') a += 5; else if (k === 'ArrowLeft' || k === 'ArrowDown') a -= 5;
else if (k === 'PageUp') a += 20; else if (k === 'PageDown') a -= 20; else if (k === 'Home') a = 0; else if (k === 'End') a = 100; else return;
e.preventDefault(); s.stop(); s.set(100 - a);
});
};
Split.prototype.sweep = function () {
var s = this, scrolled = false;
if (RM.matches || location.hash) { s.set(40); return; }
s.set(100);
function onScroll() { scrolled = true; }
addEventListener('scroll', onScroll, { passive: true, once: true });
Promise.all($$('img', s.el).map(function (i) { return i.decode ? i.decode().catch(function () {}) : 0; })).then(function () {
removeEventListener('scroll', onScroll);
if (scrolled || s.touched) { s.set(40); return; }
setTimeout(function () { if (!s.touched) s.to(40, 1200, SWEEP); }, 250);
});
};
Split.prototype.swap = function (plain, animal, ms, photo) {
var el = this.el, layers = $('[data-layers]', el), olds = $$('.lyr', layers), add = [];
if (animal) { var oa = $$('.lyr.animal', layers).pop(); layers.insertBefore(animal, oa ? oa.nextSibling : layers.firstChild); add.push(animal); }
if (plain) { layers.appendChild(plain); add.push(plain); }
var keep = plain ? [] : $$('.lyr.plain', layers);
var fade = RM.matches ? (photo ? 200 : 0) : ms;
add.forEach(function (l) { l.classList.add('in'); if (photo) l.classList.add('photo'); l.style.setProperty('--fade', fade + 'ms'); });
return Promise.all(add.map(ready)).then(function () {
return new Promise(function (res) {
requestAnimationFrame(function () {
add.forEach(function (l) { l.classList.add('fade'); l.classList.remove('in'); });
setTimeout(function () {
olds.forEach(function (o) { if (keep.indexOf(o) < 0 && (plain || o.classList.contains('animal'))) o.remove(); });
add.forEach(function (l) { l.classList.remove('fade', 'photo'); }); res();
}, fade + 30);
});
});
});
};
Split.prototype.label = function (html) { if (this.labR) { this.labR.innerHTML = html; this.mR = null; this.set(this.x); } };
var demoLoad = null;
function loadDemo() {
if (!demoLoad) demoLoad = new Promise(function (res, rej) {
var s = doc.createElement('script'); s.src = C.assets + 'demo.js'; s.async = true;
s.onload = function () { res(window.ZLDemo); }; s.onerror = function () { demoLoad = null; rej(); };
doc.head.appendChild(s);
});
return demoLoad;
}
var demos = [];
function Demo(el) {
var d = this; d.el = el; d.split = new Split($('[data-split]', el)); d.ids = el.getAttribute('data-eyes').split(',');
d.eye = d.ids[0]; d.scene = C.eyes[d.eye].scene; d.mode = 'sample'; d.month = Number(el.getAttribute('data-month') || 0);
d.cap = $('[data-cap]', el); d.note = $('[data-note]', el); d.chooser = $('.chooser', el); d.tryBar = $('[data-trybar]', el); d.resBar = $('[data-resbar]', el);
d.file = $('input[type=file]', el); d.T = T; d.C = C;
if (el.hasAttribute('data-sweep')) d.split.sweep();
var sh0 = canShare(); $$('[data-trybar] [data-keep]', el).forEach(function (b) { b.hidden = (b.getAttribute('data-act') === 'share') !== sh0; });
var chips = $$('[data-eye]', el);
chips.forEach(function (c, i) {
c.addEventListener('click', function () { d.pick(c.getAttribute('data-eye')); });
c.addEventListener('keydown', function (e) {
var j = i, k = e.key;
if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % chips.length; else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + chips.length) % chips.length; else return;
e.preventDefault(); chips[j].focus(); d.pick(chips[j].getAttribute('data-eye'));
});
});
$$('[data-scene-btn]', el).forEach(function (b) { b.addEventListener('click', function () { d.setScene(b.getAttribute('data-scene-btn')); }); });
$$('[data-view-btn]', el).forEach(function (b) { b.addEventListener('click', function () { d.setView(b.getAttribute('data-view-btn')); }); });
$$('[data-try]', doc).forEach(function (b) { if (b.closest('[data-demo]') === el || b.getAttribute('data-try') === el.id) b.addEventListener('click', function () { d.openChooser(true); }); });
$$('[data-close]', el).forEach(function (b) { b.addEventListener('click', function () { d.closeChooser(true); }); });
$$('[data-photo]', doc).forEach(function (b) { if (b.closest('[data-demo]') === el || b.getAttribute('data-photo') === el.id) b.addEventListener('click', function () { d.fixPremium(); d.file.click(); loadDemo(); }); });
$$('[data-cam]', doc).forEach(function (b) { if (b.closest('[data-demo]') === el || b.getAttribute('data-cam') === el.id) b.addEventListener('click', function () { d.camera(b); }); });
d.file.addEventListener('change', function () {
var f = d.file.files && d.file.files[0]; d.file.value = ''; if (!f) return;
d.say(T.working); d.closeChooser();
loadDemo().then(function (Z) { Z.photo(d, f); }, function () { d.say(T.badFile); });
});
$$('[data-act]', el).forEach(function (b) {
b.addEventListener('click', function () {
var a = b.getAttribute('data-act');
if (a === 'back') return d.back();
loadDemo().then(function (Z) { Z[a](d, b); });
});
});
var m = $('[data-month-input]', el);
if (m) {
var out = $('output', m.parentNode);
m.addEventListener('input', function () {
d.month = Number(m.value); out.textContent = T.months[d.month]; m.setAttribute('aria-valuetext', T.months[d.month]);
d.paintCap();
if (d.mode === 'sample') d.split.swap(null, layer(d.scene, 'baby' + d.month, 'animal'), 120);
else loadDemo().then(function (Z) { Z.rerender(d); });
});
}
d.paintCap();
}
Demo.prototype.cur = function () { return C.eyes[this.eye]; };
Demo.prototype.animalId = function () { return this.eye === 'baby' ? 'baby' + this.month : this.eye; };
Demo.prototype.say = function (html) { this.note.innerHTML = html || ''; };
Demo.prototype.paintCap = function () {
var e = this.cur(), c = e.cap;
if (this.eye === 'baby') c = c.replace('%s', T.months[this.month]);
if (this.cap) this.cap.innerHTML = c;
this.split.label(e.lab);
if (this.split.h) { this.split.h.setAttribute('aria-label', e.aria); this.split.vt = e.vt; this.split.set(this.split.x); }
};
Demo.prototype.paintChips = function () {
var d = this;
$$('[data-eye]', d.el).forEach(function (c) {
var id = c.getAttribute('data-eye'), on = id === d.eye;
c.setAttribute('aria-checked', on); c.tabIndex = on ? 0 : -1;
if (d.mode !== 'sample' && C.eyes[id].premium) c.setAttribute('aria-disabled', 'true'); else c.removeAttribute('aria-disabled');
});
};
Demo.prototype.pick = function (id) {
var d = this, e = C.eyes[id];
if (id === d.eye) return;
if (d.mode !== 'sample' && e.premium) { d.say(T.premiumNote); return; }
var scene = $('[data-scene-btn]', d.el) ? d.scene : e.scene;
d.split.stop(); var sceneChange = scene !== d.scene && d.mode === 'sample';
d.eye = id; d.paintChips(); d.paintCap();
if (d.mode !== 'sample') return loadDemo().then(function (Z) { Z.rerender(d); });
d.scene = scene; d.split.el.setAttribute('data-scene', d.scene);
if (sceneChange) return d.split.swap(layer(d.scene, 'human', 'plain', C.scenes[d.scene].alt), layer(d.scene, d.animalId(), 'animal'), 280);
return d.split.swap(null, layer(d.scene, d.animalId(), 'animal'), 280);
};
Demo.prototype.setScene = function (sc) {
var d = this; if (sc === d.scene || d.mode !== 'sample') return;
d.scene = sc; d.split.el.setAttribute('data-scene', sc);
$$('[data-scene-btn]', d.el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-scene-btn') === sc); });
d.split.swap(layer(sc, 'human', 'plain', C.scenes[sc].alt), layer(sc, d.animalId(), 'animal'), 280);
};
Demo.prototype.setView = function (v) {
var d = this, on = v === 'sbs', el = d.split.el;
if (on === el.classList.contains('sbs')) return;
$$('[data-view-btn]', d.el).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view-btn') === v); });
function apply() { el.classList.toggle('sbs', on); if (d.split.h) d.split.h.tabIndex = on ? -1 : 0; d.split.set(d.split.x); }
d.split.stop();
if (!RM.matches && doc.startViewTransition) doc.startViewTransition(apply); else apply();
};
Demo.prototype.fixPremium = function () {
if (this.cur().premium) { var first = this.ids.filter(function (i) { return !C.eyes[i].premium; })[0]; this.pick(first); this.say(T.premiumNote); return true; }
return false;
};
Demo.prototype.openChooser = function (focus) {
var d = this, ch = d.chooser; if (!ch) return;
loadDemo().catch(function () {});
var had = d.fixPremium();
if (!had && d.note.textContent && d.mode === 'sample') d.say('');
d.split.stop(); d.split.el.classList.add('choosing'); ch.hidden = false;
requestAnimationFrame(function () { requestAnimationFrame(function () { ch.classList.add('open'); }); });
if (focus) setTimeout(function () { var b = $('button.gold,.btn', ch); if (b) b.focus({ preventScroll: true }); }, 30);
};
Demo.prototype.closeChooser = function (focus) {
var d = this, ch = d.chooser; if (!ch || ch.hidden) return;
ch.classList.remove('open'); d.split.el.classList.remove('choosing');
setTimeout(function () { if (!ch.classList.contains('open')) ch.hidden = true; }, RM.matches ? 0 : 150);
if (focus) { var t = $('[data-try]', d.el); if (t && !d.tryBar.hidden) t.focus(); }
};
Demo.prototype.camera = function (btn) {
var d = this; d.fixPremium(); d.closeChooser();
if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { d.say(T.noCam); return; }
var facing = d.el.getAttribute('data-facing') || 'user';
if (d.stream) { d.stream.getTracks().forEach(function (t) { t.stop(); }); d.stream = null; }
var req = navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
loadDemo().then(function (Z) { Z.camera(d, req, facing); }, function () { req.then(function (s) { s.getTracks().forEach(function (t) { t.stop(); }); }); d.say(T.noCam); });
};
Demo.prototype.result = function (cam) {
var d = this; d.tryBar.hidden = true; d.resBar.hidden = false;
$$('[data-camonly]', d.resBar).forEach(function (b) { b.hidden = !cam; });
var sh = $('[data-act=share]', d.resBar); if (sh) sh.hidden = !canShare();
d.paintChips(); d.el.classList.add('own'); doc.dispatchEvent(new CustomEvent('zl:own', { detail: d }));
};
Demo.prototype.back = function () {
var d = this;
if (window.ZLDemo) window.ZLDemo.stop(d);
d.mode = 'sample'; d.resBar.hidden = true; d.tryBar.hidden = false; d.say(''); d.el.classList.remove('own');
var pressed = $('[data-scene-btn][aria-pressed=true]', d.el);
d.scene = pressed ? pressed.getAttribute('data-scene-btn') : d.cur().scene;
d.split.el.setAttribute('data-scene', d.scene); d.paintChips();
doc.dispatchEvent(new CustomEvent('zl:own', { detail: d }));
var t = $('[data-try]', d.el); if (t) t.focus({ preventScroll: true });
return d.split.swap(layer(d.scene, 'human', 'plain', C.scenes[d.scene].alt), layer(d.scene, d.animalId(), 'animal'), 200, true);
};
function canShare() {
try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'])], 'x.jpg', { type: 'image/jpeg' })] })) && !DESK.matches; } catch (_) { return false; }
}
$$('[data-demo]').forEach(function (el) { demos.push(new Demo(el)); });
if (doc.fonts) doc.fonts.ready.then(function () { $$('[data-split]').forEach(function (el) { var s = el._split; if (s) { s.mL = s.mR = null; s.set(s.x); } }); });
window.ZL = { demos: demos, layer: layer, Split: Split, C: C, RM: RM };
$$('[data-solo] [data-split]').forEach(function (el) { new Split(el); });
$$('[data-totry]').forEach(function (b) {
b.addEventListener('click', function () {
var d = demos[0]; if (!d) return;
d.el.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
setTimeout(function () { d.openChooser(true); }, RM.matches ? 0 : 500);
});
});
function pinner(box, opts) {
var io = null, w0 = 0, h0 = 0;
function fits() {
if (RM.matches || innerHeight < 560) return false;
if (opts.deskOnly && !DESK.matches) return false;
if (!DESK.matches && innerHeight < 700) return false;
box.classList.add('pinned');
var stage = $(opts.stage, box).getBoundingClientRect().height, room = innerHeight - hh() - (DESK.matches ? 48 : stage);
var ok = $$(opts.text, box).every(function (t) { return t.getBoundingClientRect().height <= room * (DESK.matches ? 1 : 0.85); });
if (!ok) box.classList.remove('pinned');
return ok;
}
function line() { var top = hh(), st = $(opts.stage, box).getBoundingClientRect().height; return DESK.matches ? innerHeight / 2 : top + st + 0.4 * (innerHeight - top - st); }
function setup() {
if (io) io.disconnect(); io = null;
if (!fits()) { opts.off && opts.off(); return; }
var y = Math.round(line());
io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) opts.on(e.target); }); }, { rootMargin: -y + 'px 0px ' + -(innerHeight - y - 1) + 'px 0px' });
$$(opts.items, box).forEach(function (c) { io.observe(c); });
}
function maybe() { if (Math.abs(innerWidth - w0) > 1 || Math.abs(innerHeight - h0) > 120) { w0 = innerWidth; h0 = innerHeight; setup(); } }
var t = 0; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(maybe, 150); });
RM.addEventListener && RM.addEventListener('change', setup);
(doc.fonts ? doc.fonts.ready : Promise.resolve()).then(function () { w0 = innerWidth; h0 = innerHeight; setup(); });
}
$$('[data-story]').forEach(function (box) {
var sp = new Split($('.stage-wrap [data-split]', box)), cur = $('.chapter', box);
pinner(box, {
stage: '.stage-wrap', text: '.chapter .core', items: '.chapter',
on: function (ch) {
if (ch === cur) return; var a = ch.getAttribute('data-scene'), b = cur.getAttribute('data-scene'), eye = ch.getAttribute('data-eye'); cur = ch;
sp.el.setAttribute('data-scene', a); sp.label(ch.getAttribute('data-lab'));
sp.swap(a !== b ? layer(a, 'human', 'plain') : null, layer(a, eye, 'animal'), 280);
},
});
});
$$('[data-topic]').forEach(function (box) {
var d = demos.filter(function (x) { return box.contains(x.el); })[0], sp = d && d.split.el, fx = '';
function paint() { if (!sp) return; var own = d.mode !== 'sample'; sp.classList.toggle('ring-on', fx === 'ring' && !own); sp.classList.toggle('zoom-on', fx === 'zoom' && !own); }
doc.addEventListener('zl:own', paint);
pinner(box, {
stage: '.stage-col', text: '.q .core', items: '.q', deskOnly: box.hasAttribute('data-desk-pin'),
on: function (q) { fx = q.getAttribute('data-fx') || ''; paint(); },
off: function () { fx = ''; paint(); },
});
});
$$('[data-signup]').forEach(function (box) {
var form = $('form', box), done = $('[data-done]', box), input = form && $('input[type=email]', form), err = $('[data-err]', box);
if (!form) return;
form.addEventListener('submit', function (e) {
var v = input.value.trim();
if (!v || !input.checkValidity()) { e.preventDefault(); err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
err.hidden = true; input.removeAttribute('aria-invalid');
if (C.signup === 'none') e.preventDefault(); // preview build: no provider yet, nothing is sent
$('[data-addr]', done).textContent = v;
var ms = RM.matches ? 0 : 200;
form.style.transition = 'opacity ' + ms + 'ms'; form.style.opacity = 0;
setTimeout(function () { form.hidden = true; form.style.opacity = ''; done.hidden = false; done.style.opacity = 0; done.style.transition = 'opacity ' + ms + 'ms'; requestAnimationFrame(function () { done.style.opacity = 1; }); done.focus(); }, ms);
});
input.addEventListener('input', function () { if (!err.hidden && input.checkValidity()) { err.hidden = true; input.removeAttribute('aria-invalid'); } });
$('[data-again]', box).addEventListener('click', function () { done.hidden = true; form.hidden = false; input.value = ''; input.focus(); });
});
var notify = $('[data-notify]'), forms = $$('[data-signup]');
if (notify && forms.length) {
notify.addEventListener('click', function (e) {
e.preventDefault();
var y = hh(), f = forms.filter(function (x) { return x.getBoundingClientRect().top > y; })[0] || forms[0];
f.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' });
var i = $('input[type=email]:not([hidden])', f) || $('.btn', f);
setTimeout(function () { if (i && i.offsetParent) i.focus({ preventScroll: true }); else { var dn = $('[data-done]', f); if (dn && !dn.hidden) dn.focus({ preventScroll: true }); } }, RM.matches ? 0 : 450);
});
var seen = new Set();
var io = new IntersectionObserver(function (es) {
es.forEach(function (e) { if (e.intersectionRatio >= 0.5) seen.add(e.target); else seen.delete(e.target); });
notify.classList.toggle('away', seen.size > 0);
if (seen.size) notify.setAttribute('tabindex', '-1'); else notify.removeAttribute('tabindex');
}, { threshold: [0, 0.5, 1] });
forms.forEach(function (f) { io.observe(f); });
}
var hdr = $('.hdr');
if (hdr && window.ResizeObserver) {
var fit = function () { hdr.classList.remove('tight'); var b = $('.brand', hdr), n = $('nav', hdr); if (b && n && n.offsetTop > b.offsetTop + 4) hdr.classList.add('tight'); hdr.classList.toggle('tall', hdr.offsetHeight > 96); };
new ResizeObserver(function () { requestAnimationFrame(fit); }).observe(hdr); fit();
}
window.STUDIO_PLAY = function (flow) {
var d = demos[0]; if (!d) return Promise.resolve();
if (flow === 'sweep') { scrollTo(0, 0); d.split.touched = false; d.split.set(100); return wait(300).then(function () { return d.split.to(40, 1200, SWEEP); }).then(function () { return wait(600); }); }
if (flow === 'chips') return d.ids.reduce(function (p, id) { return p.then(function () { d.pick(id); return wait(1100); }); }, Promise.resolve()).then(function () { return d.pick(d.ids[0]); });
if (flow === 'view') { scrollTo(0, 0); d.setScene('chart'); return wait(900).then(function () { d.setView('sbs'); return wait(1200); }).then(function () { d.setView('split'); return wait(1000); }); }
if (flow === 'mantis') { var ms = $('[data-solo] [data-split]'); if (!ms) return Promise.resolve(); ms.scrollIntoView({ block: 'center' }); var sp = ms._split; return wait(500).then(function () { return sp.to(80, 900, SWEEP); }).then(function () { return sp.to(20, 1200, SWEEP); }).then(function () { return sp.to(34, 700, SWEEP); }).then(function () { return wait(400); }); }
if (flow === 'try') { d.openChooser(); return wait(1200).then(function () { d.closeChooser(); return wait(400); }); }
return Promise.resolve();
};
})();