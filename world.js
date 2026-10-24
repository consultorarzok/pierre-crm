/* Mundo Pierre: planeta morado que gira, el pin de la marca parado arriba y los cursos en órbita. */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const R = 120;

// íconos de los cursos, dibujados a mano en una grilla de 48 (trazo blanco, acentos dorados)
const G = 'class="ac"', F = 'class="ac f"';
const COURSES = [
  ['Peluquería', `<circle cx="15" cy="35" r="5.5"/><circle cx="33" cy="35" r="5.5"/><path d="M19 31 34 8M29 31 14 8"/><circle cx="24" cy="23.2" r="1.6" ${G}/>`],
  ['Secado y peinado', `<path d="M30 14H15a8 8 0 0 0 0 16h15z"/><path d="M30 15.5h7.5v13H30"/><path d="M18 30l-2.5 11.5h6.5L24.5 30"/><circle cx="15" cy="22" r="3" ${G}/><path d="M41 18h4M41 22h5M41 26h4"/>`],
  ['Peluquería canina', `<path d="M16 18c0-6.5 3.6-10 8-10s8 3.5 8 10v7.5c0 7-3.6 11.5-8 11.5s-8-4.5-8-11.5z"/><path d="M16.5 15C11 12.5 6 16 6 23c0 4.5 2.2 8 4.8 9.6l5.2-6.4"/><path d="M31.5 15c5.5-2.5 10.5 1 10.5 8 0 4.5-2.2 8-4.8 9.6L32 26.2"/><circle cx="20.4" cy="21.8" r="1.8" ${G}/><circle cx="27.6" cy="21.8" r="1.8" ${G}/><path d="M20.8 27.8h6.4l-3.2 3.4z" ${F}/><path d="M24 31.2v2.4M20.3 33.2c1.3 1.5 2.6 1.5 3.7.4 1.1 1.1 2.4 1.1 3.7-.4"/><path d="M22.3 34.6c.2 3 3.2 3 3.4 0" ${F}/>`],
  ['Barbería', `<rect x="16" y="5" width="16" height="5" rx="2.5"/><rect x="16" y="38" width="16" height="5" rx="2.5"/><path d="M18.5 10v28M29.5 10v28"/><path d="M18.5 17 29.5 11M18.5 25l11-6M18.5 33l11-6M18.5 38l11-3.5" ${G}/>`],
  ['Bartender', `<path d="M9 10h30L24 27z"/><path d="M24 27v12M16.5 40h15"/><path d="M13.5 14.5h21" ${G}/><circle cx="30" cy="15" r="2.6" ${G}/><path d="M34.5 6.5 28.5 16"/>`],
  ['Manicura', `<path d="M20.5 5.5h7l1.3 13.5h-9.6z"/><rect x="18.5" y="19" width="11" height="5" rx="1"/><path d="M15 24h18v13.5a4.5 4.5 0 0 1-4.5 4.5h-9a4.5 4.5 0 0 1-4.5-4.5z"/><path d="M17.5 31h13v6a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5z" ${F}/>`],
  ['Maquillaje', `<path d="M16.5 27h15v14h-15z"/><path d="M18.5 20.5h11V27h-11z"/><path d="M19.5 20.5V11l9-4.5v14z" ${F}/><path d="M16.5 33h15"/>`],
  ['Cejas y pestañas', `<path d="M6 27c5-7 11-10.5 18-10.5S37 20 42 27c-5 7-11 10.5-18 10.5S11 34 6 27z"/><circle cx="24" cy="27" r="5.5"/><circle cx="24" cy="27" r="2.2" ${G}/><path d="M13.5 19.5 11 15.5M18.5 17.2l-1.2-4.6M24 16.5v-4.8M29.5 17.2l1.2-4.6M34.5 19.5l2.5-4"/><path d="M12 9.5c5.5-3 18.5-3 24 0" ${G}/>`],
  ['Depilación', `<path d="M8 26h25"/><path d="M10 26h21v10a6 6 0 0 1-6 6h-9a6 6 0 0 1-6-6z"/><path d="M12.5 29.5h16" ${G}/><path d="M26 25.5 36.3 9.2a2.6 2.6 0 0 1 4.4 2.8L30.4 28.3"/><path d="M33 17.5c1.5 1 3 2.2 4 3.4" ${G}/>`],
  ['Reparación de celulares', `<rect x="9" y="5" width="20" height="35" rx="4"/><path d="M16.5 9.5h5"/><path d="M13 14h12v18H13z" opacity=".55"/><circle cx="19" cy="35.5" r="1.3" ${G}/><path d="M24.5 42.5 31 36" ${G}/><path d="M31 36l7.6-7.6a2.7 2.7 0 0 1 3.8 3.8L34.8 39.8z" ${F}/>`],
  ['Marketing digital', `<path d="M8 20.5v8h6l14 8.5v-25l-14 8.5z"/><path d="M14 28.5l2.5 10h4.5L18.5 29"/><path d="M33 19c2.2 2.6 2.2 8.4 0 11M37.5 15c4.4 5 4.4 14 0 19" ${G}/>`],
  ['Master class de helados', `<path d="M15 23h18L24 44z"/><path d="M18.5 27.5l9 9M22.5 24.5l7.5 7.5M25.5 24.5 18 32" opacity=".7"/><path d="M14.5 23a9.5 9.5 0 0 1 19 0"/><circle cx="24" cy="12.5" r="6"/><circle cx="27.5" cy="5.5" r="2.2" ${G}/>`],
];

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function build(box) {
  box.innerHTML = `
    <svg class="pw-back" viewBox="-260 -260 520 520" aria-hidden="true">
      <defs>
        <radialGradient id="pwSphere" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#a873c9"/><stop offset=".38" stop-color="#7a3a9b"/><stop offset=".72" stop-color="#4e1a66"/><stop offset="1" stop-color="#22092e"/></radialGradient>
        <radialGradient id="pwShade" cx="72%" cy="74%" r="70%"><stop offset=".45" stop-color="#12041a" stop-opacity="0"/><stop offset="1" stop-color="#12041a" stop-opacity=".55"/></radialGradient>
        <linearGradient id="pwGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b1874a"/><stop offset=".5" stop-color="#facd88"/><stop offset="1" stop-color="#c79b5c"/></linearGradient>
        <linearGradient id="pwRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#facd88" stop-opacity=".9"/><stop offset=".55" stop-color="#facd88" stop-opacity="0"/></linearGradient>
        <clipPath id="pwClip"><circle r="${R}"/></clipPath>
      </defs>
      <g class="pw-stars"></g>
      <g class="pw-orbit-back"></g>
    </svg>
    <svg class="pw-globe" viewBox="-260 -260 520 520" aria-hidden="true">
      <ellipse class="pw-floor" cx="0" cy="${R + 26}" rx="${R * .82}" ry="12"/>
      <g transform="rotate(-16)">
        <circle r="${R}" fill="url(#pwSphere)"/>
        <g clip-path="url(#pwClip)"><g class="pw-par"></g><g class="pw-mer"></g><g class="pw-dots"></g></g>
        <circle r="${R}" fill="url(#pwShade)"/>
        <circle r="${R - 1}" fill="none" stroke="url(#pwRim)" stroke-width="2.5"/>
      </g>
      <image class="pw-pin" href="assets/pin-blanco.png" x="-34" y="${-R - 92}" width="68" height="98"/>
    </svg>
    <svg class="pw-front" viewBox="-260 -260 520 520" aria-hidden="true"><g class="pw-orbit-front"></g></svg>
    <ul class="pw-items"></ul>`;

  const stars = box.querySelector('.pw-stars');
  for (let s = 0; s < 34; s++) {
    const a = rnd() * Math.PI * 2, d = 150 + rnd() * 105;
    const c = el('circle', { cx: (Math.cos(a) * d).toFixed(1), cy: (Math.sin(a) * d).toFixed(1), r: (0.7 + rnd() * 1.6).toFixed(1), class: rnd() > .55 ? 'g' : '' }, stars);
    c.style.animationDelay = (-rnd() * 4).toFixed(2) + 's';
  }
  // paralelos fijos (el eje del planeta está inclinado)
  const par = box.querySelector('.pw-par');
  [-60, -35, -12, 12, 35, 60].forEach((lat) => { const r = lat * Math.PI / 180; const y = -R * Math.sin(r), w = R * Math.cos(r); el('path', { d: `M ${-w} ${y.toFixed(1)} Q 0 ${(y + w * .16).toFixed(1)} ${w} ${y.toFixed(1)}` }, par); });
  // puntos dorados sobre la superficie: la gente que pasó por Pierre
  const dots = [];
  for (let i = 0; i < 46; i++) dots.push({ lat: (rnd() * 140 - 70) * Math.PI / 180, lon: rnd() * Math.PI * 2, r: 1.4 + rnd() * 2.2, e: null });
  const gd = box.querySelector('.pw-dots'); dots.forEach((d) => { d.e = el('circle', { r: d.r }, gd); });
  const mer = box.querySelector('.pw-mer'); const merEls = Array.from({ length: 9 }, () => el('path', {}, mer));

  // órbitas cruzadas, 4 cursos por anillo
  const ORB = [{ rx: 232, ry: 64, tilt: -14, speed: .00014 }, { rx: 222, ry: 74, tilt: 38, speed: -.00011 }, { rx: 212, ry: 60, tilt: -64, speed: .00009 }];
  const ob = box.querySelector('.pw-orbit-back'), of = box.querySelector('.pw-orbit-front');
  ORB.forEach((o) => {
    el('ellipse', { rx: o.rx, ry: o.ry, transform: `rotate(${o.tilt})` }, ob);
    el('path', { d: `M ${o.rx} 0 A ${o.rx} ${o.ry} 0 0 1 ${-o.rx} 0`, transform: `rotate(${o.tilt})` }, of);
  });
  const ul = box.querySelector('.pw-items');
  const items = COURSES.map(([name, svg], k) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="pw-med"><svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svg}</g></svg></span><span class="pw-lab">${name}</span>`;
    ul.appendChild(li);
    const orb = k % 3;
    return { li, o: ORB[orb], phase: Math.floor(k / 3) * Math.PI / 2 + orb * .8 };
  });
  box.setAttribute('aria-label', 'El mundo de Pierre: un planeta morado con el pin de la marca, rodeado por sus cursos: ' + COURSES.map((c) => c[0]).join(', ') + '.');

  function place(t) {
    const W = box.clientWidth / 520;
    // meridianos: medio óvalo del lado visible
    merEls.forEach((m, i) => {
      const phi = i * Math.PI / merEls.length * 2 + t * .00022;
      const s = Math.sin(phi), c = Math.cos(phi);
      if (c <= 0) { m.setAttribute('d', ''); return; }
      const rx = Math.abs(s) * R;
      m.setAttribute('d', `M 0 ${-R} A ${rx.toFixed(1)} ${R} 0 0 ${s > 0 ? 1 : 0} 0 ${R}`);
      m.setAttribute('opacity', (.25 + .75 * c).toFixed(2));
    });
    dots.forEach((d) => {
      const lon = d.lon + t * .00022, c = Math.cos(lon);
      if (c <= 0.05) { d.e.setAttribute('opacity', 0); return; }
      d.e.setAttribute('cx', (R * Math.cos(d.lat) * Math.sin(lon)).toFixed(1));
      d.e.setAttribute('cy', (-R * Math.sin(d.lat)).toFixed(1));
      d.e.setAttribute('opacity', Math.min(1, c * 1.4).toFixed(2));
    });
    items.forEach((it) => {
      const o = it.o, th = it.phase + t * o.speed;
      const x0 = o.rx * Math.cos(th), y0 = o.ry * Math.sin(th), tr = o.tilt * Math.PI / 180;
      const x = x0 * Math.cos(tr) - y0 * Math.sin(tr), y = x0 * Math.sin(tr) + y0 * Math.cos(tr);
      const depth = Math.sin(th);
      const sc = .7 + .3 * (depth + 1) / 2;
      it.li.style.transform = `translate(-50%,-50%) translate(${(x * W).toFixed(1)}px,${(y * W).toFixed(1)}px) scale(${sc.toFixed(3)})`;
      it.li.style.zIndex = depth > 0 ? 5 : (depth > -.35 && Math.abs(x) > R + 30 ? 2 : 1);
      it.li.style.opacity = depth > 0 ? 1 : (.3 + .45 * (1 + depth)).toFixed(2);
      it.li.classList.toggle('front', depth > .55);
    });
  }
  return place;
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let place = null, running = false, t0 = null, tNow = 3000, box = null;
function frame(now) { if (!running) return; if (t0 === null) t0 = now - tNow; tNow = now - t0; place(tNow); requestAnimationFrame(frame); }
function update() { const on = box && !box.closest('[hidden]') && !reduced && !document.hidden; if (on && !running) { running = true; t0 = null; requestAnimationFrame(frame); } if (!on) running = false; }
window.PierreWorld = {
  mount(el) { box = el; place = build(el); place(tNow); update(); addEventListener('resize', () => place && place(tNow)); document.addEventListener('visibilitychange', update); },
  stop() { running = false; },
  start() { update(); },
};
})();
