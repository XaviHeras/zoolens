(function () {
'use strict';
var P = {"dog":{"id":"dog","acuityLossFactor":3.75,"saturation":1,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881],"motion":{"threshold":0.03,"gain":10,"decay":0.88,"stillBrightness":0.85,"stillSaturation":0.75,"stillBlurScale":2}},"cat":{"id":"cat","acuityLossFactor":6,"saturation":0.85,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881],"night":{"shadowGamma":1.9,"rodMix":0.8,"rodTint":[0.75,0.95,1],"grain":0.05}},"bee":{"id":"bee","acuityLossFactor":40,"saturation":1,"exposureStops":0,"colorMatrix":[0.35,0.65,0,0,0.15,0.85,-0.3,-0.3,1.6],"mosaic":{"facetDegrees":1.8,"seam":0.5,"bulge":0.3,"vignette":0.35,"jitter":0.05}},"protanopia":{"id":"protanopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.152286,1.052583,-0.204868,0.114503,0.786281,0.099216,-0.003882,-0.048116,1.051998]},"deuteranopia":{"id":"deuteranopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.367322,0.860646,-0.227968,0.280085,0.672501,0.047413,-0.01182,0.04294,0.968881]},"tritanopia":{"id":"tritanopia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[1.255528,-0.076749,-0.178779,-0.078411,0.930809,0.147602,0.004733,0.691367,0.3039]},"achromatopsia":{"id":"achromatopsia","acuityLossFactor":1,"saturation":1,"exposureStops":0,"colorMatrix":[0.2126,0.7152,0.0722,0.2126,0.7152,0.0722,0.2126,0.7152,0.0722]},"baby":{"id":"baby","acuityLossFactor":3.5,"saturation":1,"exposureStops":0,"colorMatrix":[1,0,0,0,1,0,0,0,1],"haze":{"amount":0,"veil":[0.25,0.25,0.25]},"stages":{"defaultMonth":0,"keyframes":[{"month":0,"acuityLossFactor":25,"saturation":0.1,"redSaturation":0.1,"haze":0.45},{"month":1,"acuityLossFactor":21,"saturation":0.1,"redSaturation":0.15,"haze":0.4},{"month":2,"acuityLossFactor":15,"saturation":0.15,"redSaturation":0.45,"haze":0.32},{"month":3,"acuityLossFactor":11,"saturation":0.3,"redSaturation":0.7,"haze":0.25},{"month":4,"acuityLossFactor":8.5,"saturation":0.7,"redSaturation":0.9,"haze":0.18},{"month":6,"acuityLossFactor":6,"saturation":0.95,"redSaturation":1,"haze":0.1},{"month":9,"acuityLossFactor":4.5,"saturation":1,"redSaturation":1,"haze":0.04},{"month":12,"acuityLossFactor":3.5,"saturation":1,"redSaturation":1,"haze":0}]}}};
var SPEC_FOV = 38, LUM = [0.2126, 0.7152, 0.0722];
var doc = document, ZL = window.ZL, C = ZL.C, T = C.t, RM = ZL.RM;
function $(s, r) { return (r || doc).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function mul3(a, b) { var o = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { var s = 0; for (var k = 0; k < 3; k++) s += a[r * 3 + k] * b[k * 3 + c]; o.push(s); } return o; }
function satM(s) { var m = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) m.push((1 - s) * LUM[c] + (r === c ? s : 0)); return m; }
function resolve(id) {
var mm = /^baby(\d+)$/.exec(id), p = JSON.parse(JSON.stringify(P[mm ? 'baby' : id]));
if (p.stages) {
var ks = p.stages.keyframes, m = mm ? Number(mm[1]) : p.stages.defaultMonth, a = ks[0], b = ks[ks.length - 1];
m = Math.max(ks[0].month, Math.min(b.month, m));
for (var j = 1; j < ks.length; j++) if (m <= ks[j].month) { a = ks[j - 1]; b = ks[j]; break; }
var f = b.month > a.month ? (m - a.month) / (b.month - a.month) : 0;
var L = function (k) { return a[k] + f * (b[k] - a[k]); };
p.acuityLossFactor = L('acuityLossFactor');
var s = [L('redSaturation'), L('saturation'), L('saturation')], sm = [];
for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) sm.push((1 - s[r]) * LUM[c] + (r === c ? s[r] : 0));
p.colorMatrix = mul3(sm, p.colorMatrix);
if (p.haze) p.haze.amount = L('haze');
}
return p;
}
function sigmaFrac(p, fov) { return p.acuityLossFactor <= 1 ? 0 : ((p.acuityLossFactor - 1) / 60) / fov * (1 / (2 * Math.sqrt(2 * Math.log(2)))) * 3.5; }
function combined(p) { var g = Math.pow(2, p.exposureStops || 0); return mul3(satM(p.saturation), p.colorMatrix).map(function (v) { return v * g; }); }
var VS = '#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
var HEAD = '#version 300 es\nprecision highp float;in vec2 uv;out vec4 o;' +
'vec3 s2l(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}' +
'vec3 l2s(vec3 v){v=clamp(v,0.,1.);return mix(v*12.92,1.055*pow(v,vec3(1./2.4))-.055,step(.0031308,v));}';
var FS = {
copy: HEAD + 'uniform sampler2D t;void main(){o=vec4(texture(t,uv).rgb,1.);}',
blur: HEAD + 'uniform sampler2D t;uniform vec2 d;uniform float sg;uniform int rad;void main(){vec3 a=vec3(0.);float ws=0.;' +
'for(int i=-rad;i<=rad;i++){float w=exp(-float(i*i)/(2.*sg*sg));a+=w*s2l(texture(t,uv+d*float(i)).rgb);ws+=w;}o=vec4(l2s(a/ws),1.);}',
color: HEAD + 'uniform sampler2D A,B,K;uniform mat3 M,S;uniform int still,mask,night;uniform float haze,grain,seed;uniform vec3 veil,tint,rod;uniform vec2 ng;' +
'float h(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233))+seed)*43758.5453);}' +
'vec3 sl(vec3 d,float s){vec3 D=mix(((16.*d-12.)*d+4.)*d,sqrt(d),step(.25,d));return s<=.5?d-(1.-2.*s)*d*(1.-d):d+(2.*s-1.)*(D-d);}' +
'void main(){vec3 n=M*s2l(texture(A,uv).rgb);n=(1.-haze)*tint*n+haze*veil;' +
'if(still>0){vec3 s=S*(M*s2l(texture(B,uv).rgb));n=mask>0?mix(s,n,texture(K,uv).r):s;}' +
'vec3 c=l2s(n);if(night>0){c=pow(clamp(c,0.,1.),vec3(1./ng.x));float L=dot(vec3(.2126,.7152,.0722),c),w=ng.y*(1.-L)*(1.-L),r=.05*c.r+.55*c.g+.4*c.b;c=(1.-w)*c+w*r*rod;' +
'if(grain>0.){float a=grain*2.,s=.5-a/2.+a*h(floor(gl_FragCoord.xy));c=sl(clamp(c,0.,1.),s);}}o=vec4(clamp(c,0.,1.),1.);}',
mosaic: HEAD + 'uniform sampler2D t;uniform vec2 sz;uniform float R;uniform vec4 mp;' +
'float h21(vec2 q){vec2 p=fract(q*vec2(123.34,456.21));float d=p.x*(p.x+45.32)+p.y*(p.y+45.32);p+=d;return fract(p.x*p.y);}' +
'vec3 sm(vec2 s){return texture(t,vec2(s.x,1.-s.y)).rgb;}' +
'void main(){float S3=1.7320508,X=gl_FragCoord.x,Y=sz.y-gl_FragCoord.y,w=sz.x,hh=sz.y;' +
'float qf=(S3/3.*X-Y/3.)/R,rf=(2./3.*Y)/R,sf=-qf-rf,rq=floor(qf+.5),rr=floor(rf+.5),rs=floor(sf+.5);' +
'float dq=abs(rq-qf),dr=abs(rr-rf),ds=abs(rs-sf);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;' +
'float cx=R*S3*(rq+rr*.5),cy=R*1.5*rr,lx=X-cx,ly=Y-cy,dn=max(abs(lx)/(S3*.5*R),(abs(ly)+abs(lx)/S3)/R);' +
'float as=w/hh,r2=(as*.5)*(as*.5)+.25,k=mp.x*2.,ccx=cx/w-.5,ccy=cy/hh-.5,cax=ccx*as,f=(1.+k*(cax*cax+ccy*ccy))/(1.+k*r2);' +
'vec2 c=vec2(.5+ccx*f,.5+ccy*f);vec3 a=sm(c);for(int i=0;i<6;i++){float an=float(i)*1.0471976;a+=sm(c+vec2(cos(an)*.5*R/w,sin(an)*.5*R/hh));}a/=7.;' +
'float j=1.+(h21(vec2(rq,rr))-.5)*2.*mp.w;vec2 pc=vec2((X/w-.5)*as,Y/hh-.5);' +
'float m=(1.+.06*(1.-dn*dn))*(1.-mp.y*smoothstep(.72,.98,dn))*j*(1.-mp.z*smoothstep(.45,1.,length(pc)/sqrt(r2)));o=vec4(clamp(a*m,0.,1.),1.);}',
};
function GL(canvas) {
var g = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false, powerPreference: 'low-power' });
if (!g) throw new Error('no webgl2');
var e = this; e.g = g; e.canvas = canvas; e.prog = {}; e.tex = {}; e.fb = g.createFramebuffer();
function sh(type, src) { var s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; }
var vs = sh(g.VERTEX_SHADER, VS);
Object.keys(FS).forEach(function (k) {
var p = g.createProgram(); g.attachShader(p, vs); g.attachShader(p, sh(g.FRAGMENT_SHADER, FS[k])); g.bindAttribLocation(p, 0, 'p'); g.linkProgram(p);
if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p));
e.prog[k] = { p: p, u: {} };
});
var b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
}
GL.prototype.u = function (name, k) { var pr = this.prog[name]; if (!(k in pr.u)) pr.u[k] = this.g.getUniformLocation(pr.p, k); return pr.u[k]; };
GL.prototype.t = function (name, w, h, mip) {
var g = this.g, t = this.tex[name];
if (!t || t.w !== w || t.h !== h) {
if (t) g.deleteTexture(t.t);
var x = g.createTexture(); g.bindTexture(g.TEXTURE_2D, x);
g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, mip ? g.LINEAR_MIPMAP_LINEAR : g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
t = this.tex[name] = { t: x, w: w, h: h };
}
return t;
};
GL.prototype.pass = function (name, out, ins, set) {
var g = this.g, pr = this.prog[name]; g.useProgram(pr.p);
if (out) { g.bindFramebuffer(g.FRAMEBUFFER, this.fb); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, out.t, 0); g.viewport(0, 0, out.w, out.h); }
else { g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, this.canvas.width, this.canvas.height); }
var self = this;
Object.keys(ins).forEach(function (k, i) { g.activeTexture(g.TEXTURE0 + i); g.bindTexture(g.TEXTURE_2D, ins[k].t); g.uniform1i(self.u(name, k), i); });
if (set) set(function (k) { return self.u(name, k); });
g.drawArrays(g.TRIANGLES, 0, 3);
};
GL.prototype.blur = function (src, w, h, sigma, key) {
if (!(sigma > 0.35)) return src;
var k = Math.min(1, 4 / sigma), bw = Math.max(2, Math.round(w * k)), bh = Math.max(2, Math.round(h * k)), s = sigma * bw / w, g = this.g;
var a = src;
if (bw !== w) { a = this.t(key + 'd', bw, bh); this.pass('copy', a, { t: src }); }
var t1 = this.t(key + 'h', bw, bh), t2 = this.t(key + 'v', bw, bh), rad = Math.ceil(3 * s);
this.pass('blur', t1, { t: a }, function (u) { g.uniform2f(u('d'), 1 / bw, 0); g.uniform1f(u('sg'), s); g.uniform1i(u('rad'), rad); });
this.pass('blur', t2, { t: t1 }, function (u) { g.uniform2f(u('d'), 0, 1 / bh); g.uniform1f(u('sg'), s); g.uniform1i(u('rad'), rad); });
return t2;
};
GL.prototype.render = function (source, w, h, id, o) {
var g = this.g, p = resolve(id), cv = this.canvas;
if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
var nw = source.videoWidth || source.width, nh = source.videoHeight || source.height;
var up = this.t('up', nw, nh, true);
g.bindTexture(g.TEXTURE_2D, up.t); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, source); g.generateMipmap(g.TEXTURE_2D);
var src = up;
if (nw !== w || nh !== h) { src = this.t('src', w, h); this.pass('copy', src, { t: up }); }
var sigma = sigmaFrac(p, o.fov) * w, A = this.blur(src, w, h, sigma, 'a'), B = A, mo = p.motion, still = 0, mask = 0;
if (mo) { still = 1; var s2 = Math.max(sigma, 1) * mo.stillBlurScale; B = this.blur(src, w, h, Math.sqrt(sigma * sigma + s2 * s2), 'b'); }
if (mo && o.mask) {
mask = 1; var K = this.t('mask', o.mask.w, o.mask.h);
g.bindTexture(g.TEXTURE_2D, K.t); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, o.mask.w, o.mask.h, 0, g.RGBA, g.UNSIGNED_BYTE, o.mask.data); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
}
var M = combined(p), S = mo ? satM(mo.stillSaturation).map(function (v) { return v * mo.stillBrightness; }) : [1, 0, 0, 0, 1, 0, 0, 0, 1];
var out = p.mosaic ? this.t('col', w, h) : null, n = p.night, hz = p.haze;
var ins = { A: A, B: B }; ins.K = mask ? this.tex.mask : A;
this.pass('color', out, ins, function (u) {
g.uniformMatrix3fv(u('M'), true, M); g.uniformMatrix3fv(u('S'), true, S);
g.uniform1i(u('still'), still); g.uniform1i(u('mask'), mask); g.uniform1i(u('night'), n ? 1 : 0);
g.uniform1f(u('haze'), hz ? hz.amount || 0 : 0); g.uniform3fv(u('veil'), hz ? hz.veil : [0, 0, 0]); g.uniform3fv(u('tint'), hz && hz.tint ? hz.tint : [1, 1, 1]);
g.uniform3fv(u('rod'), n ? n.rodTint : [1, 1, 1]); g.uniform2f(u('ng'), n ? n.shadowGamma : 1, n ? n.rodMix : 0);
g.uniform1f(u('grain'), n ? n.grain : 0); g.uniform1f(u('seed'), (o.seed || 7) % 97);
});
if (p.mosaic) {
var m = p.mosaic, R = Math.max(m.facetDegrees / o.fov * w / Math.sqrt(3), 2);
this.pass('mosaic', null, { t: out }, function (u) { g.uniform2f(u('sz'), w, h); g.uniform1f(u('R'), R); g.uniform4f(u('mp'), m.bulge, m.seam, m.vignette, m.jitter); });
}
return cv;
};
var engine = null, cpuLoad = null;
function cpu() {
if (!cpuLoad) cpuLoad = new Promise(function (res, rej) {
var s = doc.createElement('script'); s.src = C.assets + 'demo-cpu.js'; s.onload = function () { res(window.ZLCPU); }; s.onerror = rej; doc.head.appendChild(s);
});
return cpuLoad;
}
function getEngine() {
if (engine) return Promise.resolve(engine);
try {
var cv = doc.createElement('canvas'); engine = new GL(cv); engine.kind = 'gl';
cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); engine = null; cpu().then(function (Z) { engine = Z; demos().forEach(function (d) { if (d.mode === 'photo') rerender(d); }); }); });
return Promise.resolve(engine);
} catch (_) { return cpu().then(function (Z) { engine = Z; return Z; }); }
}
function demos() { return ZL.demos; }
function renderTo(src, w, h, id, o) {
return getEngine().then(function (E) {
var c = doc.createElement('canvas'); c.width = w; c.height = h;
var r = E.render(src, w, h, id, o); c.getContext('2d').drawImage(r, 0, 0); return c;
});
}
function wrap(el, cls, mirror) { var d = doc.createElement('div'); d.className = 'lyr ' + cls; if (mirror) el.classList.add('mirror'); d.appendChild(el); return d; }
function lab(d) { return d.cur().vis; }
function exifFov(buf, w, h) {
try {
var v = new DataView(buf), o = 2; if (v.getUint16(0) !== 0xFFD8) return 0;
while (o < v.byteLength - 4) {
var mk = v.getUint16(o), len = v.getUint16(o + 2);
if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
var t = o + 10, le = v.getUint16(t) === 0x4949, U16 = function (x) { return v.getUint16(x, le); }, U32 = function (x) { return v.getUint32(x, le); };
var ifd = function (at, tag) { var n = U16(at); for (var i = 0; i < n; i++) { var e = at + 2 + i * 12; if (U16(e) === tag) return e; } return 0; };
var ex = ifd(t + U32(t + 4), 0x8769); if (!ex) return 0;
var fe = ifd(t + U32(ex + 8), 0xA405); if (!fe) return 0;
var f = U16(fe + 8); if (!f) return 0;
return 2 * Math.atan((w >= h ? 18 : 12) / f) * 180 / Math.PI;
}
o += 2 + len;
}
} catch (_) {}
return 0;
}
function decode(file) {
if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return img(file); });
return img(file);
}
function img(file) {
return new Promise(function (res, rej) { var u = URL.createObjectURL(file), i = new Image(); i.onload = function () { res(i); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); }; i.onerror = function () { URL.revokeObjectURL(u); rej(); }; i.src = u; });
}
function photo(d, file) {
stopCam(d);
var heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
if (file.type && !/^image\//.test(file.type) && !heic) { d.say(T.badFile); return; }
d.say(T.working);
Promise.all([decode(file), file.slice(0, 131072).arrayBuffer ? file.slice(0, 131072).arrayBuffer() : Promise.resolve(null)]).then(function (r) {
var im = r[0], iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight; if (!iw || !ih) throw 0;
var k = Math.min(1, (engine && engine.kind !== 'gl' ? 1200 : 1600) / Math.max(iw, ih)), w = Math.round(iw * k), h = Math.round(ih * k);
var plain = doc.createElement('canvas'); plain.width = w; plain.height = h;
var x = plain.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h); if (im.close) im.close();
d.src = plain; d.fov = (r[1] && exifFov(r[1], iw, ih)) || SPEC_FOV; d.mirror = false;
return show(d, true);
}).catch(function () { d.say(heic ? T.heic : T.badFile); });
}
function show(d, first) {
var s = d.src;
return getEngine().then(function () {
if (engine.kind !== 'gl') { var k = Math.min(1, 1200 / Math.max(s.width, s.height)); if (k < 1) { var c = doc.createElement('canvas'); c.width = Math.round(s.width * k); c.height = Math.round(s.height * k); c.getContext('2d').drawImage(s, 0, 0, c.width, c.height); d.src = s = c; } }
return renderTo(s, s.width, s.height, d.animalId(), { fov: d.fov, seed: 3 });
}).then(function (out) {
d.mode = 'photo';
var p = null;
if (first) { var pc = doc.createElement('canvas'); pc.width = s.width; pc.height = s.height; pc.getContext('2d').drawImage(s, 0, 0); pc.setAttribute('role', 'img'); pc.setAttribute('aria-label', T.yourPhoto); p = wrap(pc, 'plain', d.mirror); }
out.setAttribute('aria-hidden', 'true');
d.split.el.setAttribute('data-scene', 'own');
return d.split.swap(p, wrap(out, 'animal', d.mirror), first ? 200 : 280, first).then(function () {
d.result(false);
if (first) d.say(after(d));
});
}).catch(function () { d.say(T.badFile); });
}
function after(d) { return T.stays + ' ' + (d.eye === 'dog' ? T.dogStill + ' ' : '') + T.blurNote + (C.signup === 'none' ? ' ' + T.likeItNone : ' <a href="#signup" data-golist>' + T.likeIt + '</a>'); }
function rerender(d) { if (d.mode === 'photo') return show(d, false); }
function tracker(spec) {
var prev = null, mask = null;
return function (px, w, h) {
var n = w * h, l = new Float32Array(n), i, j;
for (i = 0, j = 0; i < n; i++, j += 4) l[i] = LUM[0] * lin(px[j]) + LUM[1] * lin(px[j + 1]) + LUM[2] * lin(px[j + 2]);
l = box(l, w, h);
var m = new Float32Array(n);
for (i = 0; i < n; i++) { var df = prev ? Math.abs(l[i] - prev[i]) : 0, v = Math.min(1, Math.max(0, (df - spec.threshold) * spec.gain)); m[i] = Math.max(v, mask ? mask[i] * spec.decay : 0); }
prev = l; mask = m;
var sm = box(box(m, w, h), w, h), out = new Uint8Array(n * 4);
for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { j = ((h - 1 - y) * w + x) * 4; out[j] = sm[y * w + x] * 255; out[j + 3] = 255; }
return { data: out, f: sm, w: w, h: h };
};
}
var LIN = new Float32Array(256); for (var q = 0; q < 256; q++) { var cq = q / 255; LIN[q] = cq <= 0.04045 ? cq / 12.92 : Math.pow((cq + 0.055) / 1.055, 2.4); }
function lin(v) { return LIN[v]; }
function box(a, w, h) { var o = new Float32Array(a.length), x, y; for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var s = 0, n = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) { s += a[Y * w + X]; n++; } } o[y * w + x] = s / n; } return o; }
function camera(d, req, facing) {
stopCam(d); d.say('');
req.then(function (stream) {
d.stream = stream; d.facing = facing;
var v = doc.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-label', T.yourCam); v.srcObject = stream;
return v.play().then(function () { return getEngine(); }).then(function (E) {
var gl = E.kind === 'gl', vw = v.videoWidth || 640, vh = v.videoHeight || 480, k = Math.min(1, (gl ? 960 : 400) / Math.max(vw, vh)), w = Math.round(vw * k), h = Math.round(vh * k);
var mirror = facing === 'user', out = doc.createElement('canvas'); out.width = w; out.height = h; out.setAttribute('aria-hidden', 'true');
var octx = out.getContext('2d');
var small = doc.createElement('canvas'), qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2); small.width = qw; small.height = qh;
var sctx = small.getContext('2d', { willReadFrequently: true }), track = tracker(P.dog.motion);
var frameSrc = v;
if (!gl) { frameSrc = doc.createElement('canvas'); frameSrc.width = w; frameSrc.height = h; }
d.mode = 'camera'; d.video = v; d.camOut = out; d.mirror = mirror; d.fov = SPEC_FOV;
var seed = 1, last = 0;
function frame(t) {
if (d.stream !== stream) return;
d.raf = requestAnimationFrame(frame);
if (!gl && t - last < 90) return; last = t;
if (v.readyState < 2) return;
var mask = null;
if (d.eye === 'dog') { sctx.drawImage(v, 0, 0, qw, qh); mask = track(sctx.getImageData(0, 0, qw, qh).data, qw, qh); }
if (!gl) frameSrc.getContext('2d').drawImage(v, 0, 0, w, h);
var r = engine.render(frameSrc, w, h, d.animalId(), { fov: d.fov, mask: mask, seed: seed++ });
octx.drawImage(r, 0, 0);
}
frame(0);
d.split.el.setAttribute('data-scene', 'own');
return d.split.swap(wrap(v, 'plain', mirror), wrap(out, 'animal', mirror), 200, true).then(function () {
d.result(true); d.say(T.camOn); watch(d); countCams(d);
});
});
}).catch(function (err) {
var n = err && err.name;
d.say(n === 'NotAllowedError' || n === 'SecurityError' ? T.camBlocked : T.noCam);
});
}
function countCams(d) {
var fl = $('[data-act=flip]', d.el); if (!fl || !navigator.mediaDevices.enumerateDevices) return;
navigator.mediaDevices.enumerateDevices().then(function (ds) { fl.hidden = ds.filter(function (x) { return x.kind === 'videoinput'; }).length < 2; });
}
function watch(d) {
if (d.io) return;
var timer = 0;
d.io = new IntersectionObserver(function (es) {
var vis = es[0].isIntersecting; clearTimeout(timer);
if (!vis && d.mode === 'camera') timer = setTimeout(function () { pause(d); }, 3000);
});
d.io.observe(d.split.el);
function hide() { if (d.mode === 'camera') pause(d); }
addEventListener('pagehide', hide); doc.addEventListener('visibilitychange', function () { if (doc.hidden) hide(); });
}
function pause(d) {
stopCam(d); d.paused = true;
d.say(T.camPaused + ' <button type="button" class="linkbtn" data-restart>' + T.camRestart + '</button>');
var b = $('[data-restart]', d.note); b.addEventListener('click', function () { d.paused = false; d.camera(b); });
}
function stopCam(d) {
if (d.stream) { d.stream.getTracks().forEach(function (t) { t.stop(); }); d.stream = null; }
cancelAnimationFrame(d.raf);
}
function stopcam(d) {
if (d.mode !== 'camera') return;
var v = d.video, w = d.camOut.width, h = d.camOut.height, s = doc.createElement('canvas'); s.width = w; s.height = h;
s.getContext('2d').drawImage(v, 0, 0, w, h);
stopCam(d); d.src = s; d.mode = 'photo';
var pc = doc.createElement('canvas'); pc.width = w; pc.height = h; pc.getContext('2d').drawImage(s, 0, 0); pc.setAttribute('role', 'img'); pc.setAttribute('aria-label', T.yourPhoto);
var oc = doc.createElement('canvas'); oc.width = w; oc.height = h; oc.getContext('2d').drawImage(d.camOut, 0, 0); oc.setAttribute('aria-hidden', 'true');
d.split.swap(wrap(pc, 'plain', d.mirror), wrap(oc, 'animal', d.mirror), 0).then(function () { d.result(false); d.say(after(d)); var b = $('[data-act=save]', d.el); if (b) b.focus(); });
}
function flip(d, b) { d.el.setAttribute('data-facing', d.facing === 'user' ? 'environment' : 'user'); d.camera(b); }
function srcOf(lyr) { var e = lyr && lyr.querySelector('img,canvas,video'); return e; }
function natural(e) { return e.tagName === 'IMG' ? [e.naturalWidth, e.naturalHeight] : e.tagName === 'VIDEO' ? [e.videoWidth, e.videoHeight] : [e.width, e.height]; }
function rr(x, X, Y, W, H, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, r); else x.rect(X, Y, W, H); x.fill(); }
function compose(d) {
var ls = d.split.el, pl = srcOf($$('.lyr.plain', ls).pop()), an = srcOf($$('.lyr.animal', ls).pop());
if (!pl || !an) return Promise.reject();
var sbs = ls.classList.contains('sbs');
var n = natural(an), k = Math.min(1, (sbs ? 800 : 1600) / Math.max(n[0], n[1])), iw = Math.round(n[0] * k), h = Math.round(n[1] * k), w = sbs ? iw * 2 : iw, xf, cut;
if (sbs) { xf = 0.5; cut = iw; } else {
var box = ls.getBoundingClientRect(), disp = Math.max(box.width, box.height * w / h), off = (disp - box.width) / 2; xf = (off + d.split.x / 100 * box.width) / disp; cut = Math.round(xf * w);
}
var bw = sbs ? iw : w, F = 'ui-rounded,"SF Pro Rounded",system-ui,sans-serif';
var ts = Math.max(bw * 0.05, 14), ln = Math.max(bw * 0.03, 11), px = ts * 0.55, py = ts * 0.38, gap = ts * 0.12, MH = ts * 1.2 + gap + ln * 1.2 + py * 2;
var top = sbs ? Math.round(MH + ts) : 0;
var c = doc.createElement('canvas'); c.width = w; c.height = h + top; var x = c.getContext('2d'), mir = !!d.mirror && d.mode !== 'sample';
if (sbs) {
x.fillStyle = '#151244'; x.fillRect(0, 0, w, top);
[[pl, 0], [an, iw]].forEach(function (p) { x.save(); if (mir) { x.translate(p[1] + iw, top); x.scale(-1, 1); x.drawImage(p[0], 0, 0, iw, h); } else x.drawImage(p[0], p[1], top, iw, h); x.restore(); });
} else {
x.save(); if (mir) { x.translate(w, 0); x.scale(-1, 1); } x.drawImage(an, 0, 0, w, h); x.restore();
x.save(); x.beginPath(); x.rect(0, 0, cut, h); x.clip(); if (mir) { x.translate(w, 0); x.scale(-1, 1); } x.drawImage(pl, 0, 0, w, h); x.restore();
}
var lw = Math.max(2, Math.round(w / 400));
x.fillStyle = 'rgba(21,18,68,.3)'; x.fillRect(cut - lw / 2 - 1, top, lw + 2, h); x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(cut - lw / 2, top, lw, h);
var ls2 = Math.round(bw * 0.032), pad = ls2 * 0.6, by = top + h - ls2 * 2.6;
function pill(text, X, right) { x.font = '700 ' + ls2 + 'px ' + F; var tw = x.measureText(text).width, W = tw + pad * 2, H = ls2 * 1.7; if (right) X -= W; x.fillStyle = 'rgba(21,18,68,.75)'; rr(x, X, by, W, H, H / 2); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(text, X + pad, by + H / 2); }
if (xf > 0.08) pill(T.yourEyes, ls2 * 0.8, false);
if (xf < 0.92) pill(d.cur().name, w - ls2 * 0.8, true);
x.textBaseline = 'top'; x.font = '700 ' + ts + 'px ' + F; var tw = x.measureText(lab(d)).width;
x.font = '500 ' + ln + 'px ' + F; var lw2 = x.measureText(T.markLine).width;
var W = Math.max(tw, lw2) + px * 2, H = MH, X = bw * 0.045, Y = sbs ? (top - MH) / 2 : h * 0.09;
x.fillStyle = 'rgba(0,0,0,.3)'; rr(x, X, Y, W, H, ts * 0.5);
x.fillStyle = '#fff'; x.font = '700 ' + ts + 'px ' + F; x.fillText(lab(d), X + px, Y + py);
x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '700 ' + ln + 'px ' + F; x.fillText('Zoolens', X + px, Y + py + ts * 1.2 + gap);
var zw = x.measureText('Zoolens').width; x.font = '500 ' + ln + 'px ' + F; x.fillText(T.markLine.replace('Zoolens', ''), X + px + zw, Y + py + ts * 1.2 + gap);
return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(); }, 'image/jpeg', 0.88); });
}
function save(d) {
compose(d).then(function (b) {
var u = URL.createObjectURL(b), a = doc.createElement('a'); a.href = u; a.download = d.cur().file; doc.body.appendChild(a); a.click(); a.remove();
setTimeout(function () { URL.revokeObjectURL(u); }, 4000); d.say(T.done);
}).catch(function () {});
}
function share(d) {
compose(d).then(function (b) {
var f = new File([b], d.cur().file, { type: 'image/jpeg' });
var url = ($('link[rel=canonical]') || {}).href || location.href;
if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], text: T.shareText, url: url }).catch(function () {});
save(d);
});
}
function stop(d) { stopCam(d); d.mode = 'sample'; }
doc.addEventListener('click', function (e) {
var a = e.target.closest('[data-golist]'); if (!a) return;
var f = $('#signup'); if (!f) return; e.preventDefault();
f.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' });
var i = $('input[type=email]', f); if (i) setTimeout(function () { i.focus({ preventScroll: true }); }, RM.matches ? 0 : 450);
});
window.ZLDemo = { photo: photo, camera: camera, rerender: rerender, save: save, share: share, flip: flip, stopcam: stopcam, stop: stop, resolve: resolve, sigmaFrac: sigmaFrac, GL: GL };
})();