/* Pierre CRM — front estático. Datos y escrituras: API n8n (workflow "Pierre CRM API") sobre Supabase. */
(() => {
'use strict';
const API = 'https://n8n.consultorarz.com/webhook/pierre-crm-api';
const TZ = 'America/Argentina/Jujuy';
const POLL_MS = 60000;

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('es-AR');
const num = (n) => nf.format(Number(n) || 0);
const store = {
  get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin storage */ } },
};
const fmtParts = (d, o) => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, ...o }).format(d);
const dayKey = (d) => fmtParts(d, { year: 'numeric', month: '2-digit', day: '2-digit' });
const hhmm = (d) => fmtParts(d, { hour: '2-digit', minute: '2-digit', hour12: false });
function rel(iso) {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date(), min = (now - d) / 60000;
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${Math.floor(min)} min`;
  const dk = dayKey(d), today = dayKey(now), yest = dayKey(new Date(now - 864e5));
  if (dk === today) return `hoy ${hhmm(d)}`;
  if (dk === yest) return `ayer ${hhmm(d)}`;
  if (min < 7 * 1440) return `${fmtParts(d, { weekday: 'short' }).replace('.', '')} ${hhmm(d)}`;
  return fmtParts(d, { day: 'numeric', month: 'short' }).replace('.', '');
}
const longDate = (iso) => { const d = new Date(iso); return `${fmtParts(d, { day: 'numeric', month: 'long', year: 'numeric' })}, ${hhmm(d)}`; };
function dayLabel(iso) {
  const d = new Date(iso), now = new Date();
  if (dayKey(d) === dayKey(now)) return 'Hoy';
  if (dayKey(d) === dayKey(new Date(now - 864e5))) return 'Ayer';
  return fmtParts(d, { weekday: 'long', day: 'numeric', month: 'long' });
}
function phoneFmt(t) {
  t = String(t || '');
  if (/^549\d{10}$/.test(t)) { const r = t.slice(3); return `+54 9 ${r.slice(0, 3)} ${r.slice(3, 6)}-${r.slice(6)}`; }
  return t ? `+${t}` : '';
}
const initials = (r) => {
  const n = (r.nombre || '').replace(/[^\p{L}\s]/gu, '').trim();
  if (n) { const p = n.split(/\s+/); return (p[0][0] + (p[1]?.[0] || '')).toUpperCase(); }
  return '#';
};
const hue = (t) => 1 + (Number(String(t).slice(-3)) % 6);
const ATEN = { no_atendido: 'No atendido', seguimiento: 'En seguimiento', atendido: 'Atendido' };
const ATEN_CLS = { no_atendido: 'no', seguimiento: 'seg', atendido: 'ok' };

/* iconos: un solo trazo (1.8) y un solo set */
const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  hand: '<path d="M4 12h12M12 6l6 6-6 6"/><path d="M20 5v14"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.4-1.2.3-2.4 1.7-2.4H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 7 3 3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-5-8 9"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z"/>',
  out: '<path d="M14 4h6v6M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  left: '<path d="m15 5-7 7 7 7"/>', right: '<path d="m9 5 7 7-7 7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const ico = (n, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

/* ---------- API ---------- */
async function api(action, payload = {}, tries = 2) {
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 25000);
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action, token: S.token_s, ...payload }), signal: ac.signal });
      if (r.status === 401) { lock(); const e = new Error('sesion'); e.auth = true; throw e; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (j && j.error) throw new Error(j.error);
      setLive(true);
      return j;
    } catch (e) {
      if (e.auth) throw e;
      if (i === tries - 1) { setLive(false); throw e; }
      await new Promise((res) => setTimeout(res, 700));
    } finally { clearTimeout(to); }
  }
}
function setLive(ok) { $('#live').classList.toggle('off', !ok); $('#liveTxt').textContent = ok ? 'En vivo' : 'Sin conexión'; }

/* ---------- meses (hora de Jujuy) ---------- */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function mesActual() { const d = new Date(Date.now() - 3 * 36e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
const mesNombre = (m) => { const [y, n] = m.split('-'); return `${MESES[n - 1]} ${y}`; };
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const enPeriodo = () => (S.mes ? `en ${mesNombre(S.mes)}` : 'en total');
const periodoCorto = () => (S.mes ? cap(mesNombre(S.mes)) : 'Total');
/* todos los meses desde el primero con datos hasta hoy, en orden */
function listaMeses() {
  const hoy = mesActual(), primero = (S.meses && S.meses[0] && S.meses[0].mes) || '2026-04', out = [];
  let [y, m] = primero.split('-').map(Number);
  for (let i = 0; i < 240; i++) { const k = `${y}-${String(m).padStart(2, '0')}`; out.push(k); if (k >= hoy) break; m++; if (m > 12) { m = 1; y++; } }
  return out;
}
function periodBar() {
  const meses = listaMeses(), variosAnios = new Set(meses.map((m) => m.slice(0, 4))).size > 1;
  const cnt = (m) => { const x = S.meses && S.meses.find((r) => r.mes === m); return x ? Number(x.contactos) : 0; };
  const chip = (k, l, n) => `<button class="mchip" type="button" data-mes="${k}" aria-pressed="${S.mes === k}">${esc(l)}${n !== null ? `<b>${num(n)}</b>` : ''}</button>`;
  return `<div class="mesbar" role="group" aria-label="Elegir mes">${meses.map((m) => { const [y, n] = m.split('-'); return chip(m, cap(MESES[n - 1]) + (variosAnios ? ' ' + y : ''), S.meses ? cnt(m) : null); }).join('')}${chip('', 'Total', null)}</div>`;
}

/* ---------- estado ---------- */
const S = {
  view: 'resumen',
  op: store.get('pierre_op'),
  list: { q: '', filtro: 'todos', curso: '', orden: 'recientes', page: 0, size: 50 },
  mes: store.get('pierre_mes', null) ?? mesActual(), meses: null,
  rows: new Map(), badges: { pagos: 0, derivs: 0 },
  charts: [], token: 0, openTel: null, token_s: store.get('pierre_tk'),
};
const cacheRows = (rows) => rows.forEach((r) => S.rows.set(r.telefono, { ...(S.rows.get(r.telefono) || {}), ...r }));

/* ---------- tema ---------- */
function applyTheme(t) {
  if (t) { document.documentElement.dataset.theme = t; store.set('pierre_theme', t); }
  const dark = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  $$('#themeBtn,#themeBtnM').forEach((b) => { b.innerHTML = ico(dark ? 'sun' : 'moon', 19); b.title = dark ? 'Pasar a tema claro' : 'Pasar a tema oscuro'; });
  if (S.charts.length) render();
}
const curTheme = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/* ---------- navegación ---------- */
const VIEWS = {
  resumen: { t: 'Resumen', s: 'Qué está pasando con las consultas', i: 'grid' },
  contactos: { t: 'Contactos', s: 'Todas las personas que escribieron al agente', i: 'inbox' },
  pagos: { t: 'Comprobantes', s: 'Quienes enviaron un comprobante de pago', i: 'card' },
  derivaciones: { t: 'Derivados', s: 'Consultas que el agente pasó a una persona del equipo', i: 'hand' },
  cursos: { t: 'Cursos', s: 'Qué cursos consulta la gente', i: 'book' },
  marca: { t: 'Manual de marca', s: 'Identidad visual de Pierre Centro Profesional', i: 'palette' },
};
function buildNav() {
  const links = Object.entries(VIEWS).map(([k, v]) => `<a href="#/${k}" data-v="${k}">${ico(v.i, 20)}<span>${esc(v.t)}</span><em class="badge" data-b="${k}" hidden></em></a>`).join('');
  $('#nav').innerHTML = links;
  const mob = ['resumen', 'contactos', 'pagos', 'derivaciones', 'cursos'];
  $('#tabbar').innerHTML = mob.map((k) => `<a href="#/${k}" data-v="${k}">${ico(VIEWS[k].i, 22)}<span>${esc({ pagos: 'Pagos', derivaciones: 'Derivados' }[k] || VIEWS[k].t)}</span><em class="badge" data-b="${k}" hidden></em></a>`).join('');
}
function paintNav() {
  $$('#nav a,#tabbar a').forEach((a) => { if (a.dataset.v === S.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const b = { pagos: S.badges.pagos, derivaciones: S.badges.derivs };
  $$('[data-b]').forEach((e) => { const n = b[e.dataset.b] || 0; e.hidden = !n; e.textContent = n > 99 ? '99+' : n; e.title = n ? `${n} sin atender este mes` : ''; });
}
function paintOp() {
  const n = S.op;
  $('#opBtn').innerHTML = `<span class="av">${esc(n ? n[0].toUpperCase() : '?')}</span><span><small>Atendiendo</small><b>${esc(n || 'Poné tu nombre')}</b></span>`;
  $('#opBtnM').textContent = n ? n[0].toUpperCase() : '?';
  $('#opBtnM').setAttribute('aria-label', n ? `Atendiendo: ${n}` : 'Poné tu nombre');
}

/* operador: popover chico, no modal */
const pop = () => $('#opPop');
function askOp(focus = true) {
  return new Promise((resolve) => {
    const p = pop(); p.hidden = false; $('#opInput').value = S.op;
    if (focus) $('#opInput').focus();
    const done = (v) => { p.hidden = true; $('#opForm').onsubmit = null; $('#opCancel').onclick = null; resolve(v); };
    $('#opForm').onsubmit = (e) => { e.preventDefault(); const v = $('#opInput').value.trim().slice(0, 40); if (!v) return; S.op = v; store.set('pierre_op', v); paintOp(); done(v); };
    $('#opCancel').onclick = () => done(null);
  });
}
const ensureOp = async () => S.op || askOp();

/* ---------- toast / banner ---------- */
let toastT;
function toast(msg, err = false) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', err); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), err ? 4500 : 2400); }
function banner(msg, retry) { const b = $('#banner'); if (!msg) { b.hidden = true; return; } b.hidden = false; b.innerHTML = `<span>${esc(msg)}</span>${retry ? '<button class="btn sm" id="bnRetry">Reintentar</button>' : ''}`; if (retry) $('#bnRetry').onclick = retry; }

/* ---------- piezas ---------- */
const avatar = (r, cls = '') => `<span class="av c${hue(r.telefono)} ${r.nombre ? '' : 'empty-n'} ${cls}" aria-hidden="true">${r.nombre ? esc(initials(r)) : ico('user', 18)}</span>`;
const nameHtml = (r) => r.nombre ? `<b>${esc(r.nombre)}</b>` : '<b class="nn">Sin nombre</b>';
const stBadge = (r) => `<span class="pill ${ATEN_CLS[r.atencion || 'no_atendido']}">${ATEN[r.atencion || 'no_atendido']}</span>`;
const cursoPill = (r) => r.curso ? `<span class="pill" title="${r.curso_detectado ? 'Detectado por lo que escribió; el agente aún no lo confirmó' : 'Curso confirmado por el agente'}">${esc(r.curso)}${r.curso_detectado ? '<sup>aprox.</sup>' : ''}</span>` : '<span class="muted">—</span>';
function stCell(r) {
  const a = r.atencion || 'no_atendido';
  const by = a !== 'no_atendido' && r.atendido_por ? `<small>${esc(r.atendido_por)} · ${rel(r.atendido_at)}</small>` : '';
  const quick = a === 'atendido' ? '' : `<button class="mark" data-mark="${esc(r.telefono)}" type="button">Marcar atendido</button>`;
  return `<div class="stline"><span class="pill ${ATEN_CLS[a]}">${ATEN[a]}</span>${by}</div><div class="act col-x">${quick}</div>`;
}
function rowMain(r) {
  const a = r.atencion || 'no_atendido';
  const quick = a === 'atendido' ? '' : `<button class="mark" data-mark="${esc(r.telefono)}" type="button">Marcar atendido</button>`;
  const lastIcon = r.ultimo_tipo === 'image' ? ico('image', 15) : r.ultimo_tipo === 'audio' ? ico('mic', 15) : r.ultimo_tipo === 'document' ? ico('file', 15) : '';
  const lastTxt = r.ultimo_tipo === 'image' ? 'Envió una imagen' : r.ultimo_tipo === 'document' ? 'Envió un documento' : (r.ultimo_msg || '—');
  return `<div class="lrow" role="button" tabindex="0" data-open="${esc(r.telefono)}" aria-label="Abrir ${esc(r.nombre || phoneFmt(r.telefono))}">
    <div class="who">${avatar(r)}<div class="t">${nameHtml(r)}<small>${esc(phoneFmt(r.telefono))}</small></div></div>
    <div class="last"><p>${lastIcon ? `<span class="inl">${lastIcon}</span>` : ''}${esc(lastTxt)}</p><small>${num(r.msgs)} mensajes · ${rel(r.ultimo)}</small></div>
    <div class="tags">${cursoPill(r)}${r.derivado ? '<span class="pill gold">Derivado</span>' : ''}${r.estado === 'comprobante_recibido' ? '<span class="pill gold">Comprobante</span>' : ''}</div>
    <div class="stline"><span class="pill ${ATEN_CLS[a]}">${ATEN[a]}</span>${a !== 'no_atendido' && r.atendido_por ? `<small>${esc(r.atendido_por)} · ${rel(r.atendido_at)}</small>` : ''}</div>
    <div class="act">${quick}</div></div>`;
}
const rowPay = (r) => `<div class="lrow pay" role="button" tabindex="0" data-open="${esc(r.telefono)}">
    <div class="who">${avatar(r)}<div class="t">${nameHtml(r)}<small>${esc(phoneFmt(r.telefono))}</small></div></div>
    <div class="last col-x">${cursoPill(r)}</div>
    <div class="last"><p>${r.ultimo_monto ? esc(r.ultimo_monto) : '<span class="muted">Monto no detectado</span>'}</p><small>${esc(r.concepto_pago || 'Sin concepto')}</small></div>
    <div class="last"><p>${rel(r.ultimo_comprobante_fecha)}</p><small>${r.ultimo_comprobante_fecha ? esc(hhmm(new Date(r.ultimo_comprobante_fecha)) + ' h') : ''}</small></div>
    <div class="act">${r.ultimo_comprobante_link ? `<a class="btn sm" href="${esc(r.ultimo_comprobante_link)}" target="_blank" rel="noopener" data-stop>${ico('out', 15)}Ver imagen</a>` : '<span class="muted">Sin imagen</span>'}</div>
    <div class="stline"><span class="pill ${ATEN_CLS[r.atencion || 'no_atendido']}">${ATEN[r.atencion || 'no_atendido']}</span></div></div>`;
const rowDer = (r) => `<div class="lrow der" role="button" tabindex="0" data-open="${esc(r.telefono)}">
    <div class="who">${avatar(r)}<div class="t">${nameHtml(r)}<small>${esc(phoneFmt(r.telefono))}</small></div></div>
    <div class="last"><p class="motivo">${esc(r.motivo || 'Sin motivo registrado')}</p></div>
    <div class="last"><p>${rel(r.created_at)}</p><small>${esc(hhmm(new Date(r.created_at)) + ' h')}</small></div>
    <div class="stline"><span class="pill ${ATEN_CLS[r.atencion || 'no_atendido']}">${ATEN[r.atencion || 'no_atendido']}</span></div></div>`;

const skel = (n = 6) => `<div class="card list">${Array.from({ length: n }, () => '<div class="lrow"><div class="skeleton" style="height:40px;grid-column:1/-1"></div></div>').join('')}</div>`;
const empty = (t, d) => `<div class="empty"><b>${esc(t)}</b>${esc(d || '')}</div>`;
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function killCharts() { S.charts.forEach((c) => c.destroy()); S.charts = []; }

/* ---------- RESUMEN ---------- */

async function viewResumen(tk, silent) {
  const v = $('#view');
  if (!silent) v.innerHTML = `<div class="skeleton" style="height:120px"></div><div class="skeleton" style="height:300px;margin-top:14px"></div>`;
  const mes = S.mes;
  const [lst, st, der, pay] = await Promise.all([
    api('list', { mes, size: 1 }), api('stats', { mes }),
    api('list', { filtro: 'derivado', mes, size: 200 }), api('list', { filtro: 'comprobante', mes, size: 200 }),
  ]);
  if (tk !== S.token) return;
  S.meses = st.meses;
  const c = lst.counts;
  cacheRows(der.rows); cacheRows(pay.rows);
  const pendDer = der.rows.filter((r) => r.atencion !== 'atendido').sort((x, y) => new Date(y.ult_deriv || 0) - new Date(x.ult_deriv || 0)), pendPay = pay.rows.filter((r) => r.atencion !== 'atendido').sort((x, y) => new Date(y.ultimo_comprobante_fecha || 0) - new Date(x.ultimo_comprobante_fecha || 0));
  const queue = (rows, vacio, ver) => rows.length ? `<div class="mini-list">${rows.slice(0, 6).map((r) => `<button class="mini" type="button" data-open="${esc(r.telefono)}">${avatar(r)}<span class="tx"><span class="nm">${r.nombre ? esc(r.nombre) : '<i class="muted">Sin nombre</i>'}</span><small>${esc(ver(r))}</small></span><span class="muted sm-t">${rel(ver.t ? ver.t(r) : r.ultimo)}</span></button>`).join('')}</div>` : empty(vacio);
  const verDer = (r) => r.motivo || r.ultimo_msg || 'Sin motivo'; verDer.t = (r) => r.ult_deriv || r.ultimo;
  const verPay = (r) => r.curso ? `Comprobante · ${r.curso}` : 'Comprobante de pago'; verPay.t = (r) => r.ultimo_comprobante_fecha || r.ultimo;
  const strip = [['Contactos', c.todos, 'todos', ''], ['Sin atender', c.no_atendido, 'no_atendido', 'no'], ['En seguimiento', c.seguimiento, 'seguimiento', ''], ['Atendidos', c.atendido, 'atendido', 'ok'], ['Con comprobante', c.comprobante, 'comprobante', ''], ['Derivados', c.derivado, 'derivado', '']];
  const total = c.todos || 1;
  const seg = [['no_atendido', c.no_atendido], ['seguimiento', c.seguimiento], ['atendido', c.atendido]];
  const maxC = Math.max(1, ...lst.cursos.map((x) => Number(x.n)));
  v.innerHTML = `
  ${periodBar()}<p class="muted per-note" id="resNote">${num(c.todos)} contactos con actividad ${enPeriodo()}.</p>
  <section class="queue" aria-label="Para atender ahora">
    <div class="card"><div class="card-h"><h2>Derivados que esperan al equipo</h2><span>${num(pendDer.length)} sin atender</span></div><div class="card-b">${queue(pendDer, 'No hay derivaciones pendientes.', verDer)}</div>
      <div class="card-f"><a href="#/derivaciones">Ver todos los derivados</a></div></div>
    <div class="card"><div class="card-h"><h2>Comprobantes sin revisar</h2><span>${num(pendPay.length)} sin atender</span></div><div class="card-b">${queue(pendPay, 'No hay comprobantes pendientes.', verPay)}</div>
      <div class="card-f"><a href="#/pagos">Ver todos los comprobantes</a></div></div>
  </section>
  <section class="strip card" aria-label="Totales del período">${strip.map(([l, n, f, k]) => `<a href="#/contactos" data-filtro="${f}" class="${k}"><b>${num(n)}</b><span>${l}</span></a>`).join('')}</section>
  <div class="card seg-card"><div class="card-h"><h2>Estado de atención</h2><span>${esc(periodoCorto())}</span></div><div class="card-b">
    <div class="stack" role="img" aria-label="No atendidos ${c.no_atendido}, en seguimiento ${c.seguimiento}, atendidos ${c.atendido}">${seg.map(([k, n]) => n ? `<i class="s-${ATEN_CLS[k]}" style="flex:${n}" title="${ATEN[k]}: ${num(n)}"></i>` : '').join('')}</div>
    <div class="legend">${seg.map(([k, n]) => `<span><i class="s-${ATEN_CLS[k]}"></i>${ATEN[k]} <b>${num(n)}</b> (${Math.round((n / total) * 100)}%)</span>`).join('')}</div></div></div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>${mes ? 'Mensajes por día' : 'Mensajes por mes'}</h2><span>${esc(periodoCorto())} · ${num(st.mensajes_periodo)} mensajes</span></div><div class="card-b"><div class="chart-box"><canvas id="chDia" role="img" aria-label="Mensajes y contactos ${mes ? 'por día' : 'por mes'}"></canvas></div>
      <div class="legend"><span><i style="background:var(--chart-1)"></i>Mensajes</span><span><i style="background:var(--chart-2)"></i>Contactos distintos</span></div></div></div>
    <div class="card"><div class="card-h"><h2>Cursos más consultados</h2><span>${esc(periodoCorto())}</span></div><div class="card-b">
      ${lst.cursos.length ? `<div class="bars">${lst.cursos.slice(0, 8).map((x) => `<a class="bar-row" href="#/contactos" data-curso="${esc(x.curso)}"><span>${esc(x.curso)}</span><span class="bar-track"><span class="bar-fill" style="width:${(x.n / maxC) * 100}%"></span></span><b>${num(x.n)}</b></a>`).join('')}</div>` : empty('Sin consultas en el período')}</div></div>
  </div>
  <div class="card" style="margin-top:14px"><div class="card-h"><h2>A qué hora escriben</h2><span>${esc(periodoCorto())}, hora de Jujuy · para organizar los turnos del equipo</span></div><div class="card-b"><div class="chart-box sm"><canvas id="chHora" role="img" aria-label="Mensajes por hora del día"></canvas></div></div></div>`;
  drawCharts(st, mes);
}
/* todos los días del mes (hasta hoy si es el mes en curso), para que los días sin mensajes se vean en 0 */
function diasDelMes(mes) {
  const [y, m] = mes.split('-').map(Number), ult = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const hasta = mes === mesActual() ? Number(new Date(Date.now() - 3 * 36e5).toISOString().slice(8, 10)) : ult;
  return Array.from({ length: hasta }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);
}
function drawCharts(st, mes) {
  if (typeof Chart === 'undefined') return;
  killCharts();
  const c1 = cssVar('--chart-1'), c2 = cssVar('--chart-2'), ink = cssVar('--ink-3'), grid = cssVar('--line-2');
  Chart.defaults.font.family = 'Outfit, system-ui, sans-serif'; Chart.defaults.color = ink;
  const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 500 }, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#241530', titleColor: '#fff', bodyColor: '#eadcf2', padding: 10, cornerRadius: 8 } },
    scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 14 } }, y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { precision: 0 } } } };
  const d = mes
    ? diasDelMes(mes).map((dia) => ({ ...(st.diario.find((x) => x.dia === dia) || { mensajes: 0, contactos: 0 }), l: String(Number(dia.slice(8))) }))
    : st.meses.map((x) => ({ ...x, l: cap(MESES[Number(x.mes.slice(5)) - 1].slice(0, 3)) + (new Set(st.meses.map((m) => m.mes.slice(0, 4))).size > 1 ? ' ' + x.mes.slice(2, 4) : '') }));
  if ($('#chDia')) S.charts.push(new Chart($('#chDia'), { type: 'bar', data: { labels: d.map((x) => x.l), datasets: [
    { label: 'Mensajes', data: d.map((x) => x.mensajes), backgroundColor: c1, borderRadius: 4, maxBarThickness: 18, order: 2 },
    { type: 'line', label: 'Contactos', data: d.map((x) => x.contactos), borderColor: c2, backgroundColor: c2, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: .3, order: 1 }] }, options: base }));
  const horas = Array.from({ length: 24 }, (_, h) => Number((st.horas.find((x) => x.hora === h) || {}).n || 0));
  if ($('#chHora')) S.charts.push(new Chart($('#chHora'), { type: 'bar', data: { labels: horas.map((_, h) => `${h}h`), datasets: [{ label: 'Mensajes', data: horas, backgroundColor: c1, borderRadius: 4 }] }, options: { ...base, scales: { ...base.scales, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false, callback: (v, i) => (i % 3 === 0 ? `${i}h` : '') } } } } }));
}

/* ---------- CONTACTOS ---------- */
const FILTROS = [['todos', 'Todos'], ['no_atendido', 'No atendidos'], ['seguimiento', 'En seguimiento'], ['atendido', 'Atendidos'], ['comprobante', 'Con comprobante'], ['derivado', 'Derivados']];
let searchT;
async function viewContactos(tk, silent) {
  const v = $('#view'), L = S.list;
  if (!silent || !$('#listBox')) {
    v.innerHTML = `${periodBar()}<div class="toolbar">
      <div class="search">${ico('search', 18)}<input id="q" type="search" placeholder="Buscar por nombre o teléfono" value="${esc(L.q)}" aria-label="Buscar contacto" autocomplete="off"></div>
      <select class="sel" id="fCurso" aria-label="Curso"><option value="">Todos los cursos</option></select>
      <select class="sel" id="fOrden" aria-label="Orden"><option value="recientes" ${L.orden === 'recientes' ? 'selected' : ''}>Más recientes primero</option><option value="antiguos" ${L.orden === 'antiguos' ? 'selected' : ''}>Más antiguos primero</option></select></div>
      <div class="chips" id="chips" role="group" aria-label="Filtrar por estado"></div><div id="listBox">${skel()}</div>`;
    $('#q').oninput = (e) => { clearTimeout(searchT); searchT = setTimeout(() => { L.q = e.target.value.trim(); L.page = 0; render(true); }, 300); };
    $('#fCurso').onchange = (e) => { L.curso = e.target.value; L.page = 0; render(true); };
    $('#fOrden').onchange = (e) => { L.orden = e.target.value; L.page = 0; render(true); };
  }
  const d = await api('list', { q: L.q, filtro: L.filtro, curso: L.curso, mes: S.mes, orden: L.orden, page: L.page, size: L.size });
  if (tk !== S.token) return;
  cacheRows(d.rows);
  $('#fCurso').innerHTML = `<option value="">Todos los cursos</option>${d.cursos.map((c) => `<option value="${esc(c.curso)}" ${c.curso === L.curso ? 'selected' : ''}>${esc(c.curso)} (${num(c.n)})</option>`).join('')}`;
  $('#chips').innerHTML = FILTROS.map(([k, l]) => `<button class="fchip ${k === 'no_atendido' ? 'warn' : ''}" type="button" data-f="${k}" aria-pressed="${L.filtro === k}">${l}<b>${num(d.counts[k])}</b></button>`).join('');
  $$('#chips .fchip').forEach((b) => b.onclick = () => { L.filtro = b.dataset.f; L.page = 0; render(true); });
  const from = d.total ? L.page * L.size + 1 : 0, to = Math.min(d.total, (L.page + 1) * L.size);
  const hay = L.q || L.curso || L.filtro !== 'todos';
  $('#listBox').innerHTML = d.rows.length
    ? `<div class="card list" role="list"><div class="lhead" aria-hidden="true"><span>Contacto</span><span>Última conversación</span><span>Curso y marcas</span><span>Atención</span><span></span></div>${d.rows.map(rowMain).join('')}</div>
       <div class="pager"><span>Mostrando ${num(from)}–${num(to)} de ${num(d.total)}</span><span class="sp"></span><button class="btn sm" id="pPrev" ${L.page ? '' : 'disabled'}>${ico('left', 15)}Anteriores</button><button class="btn sm" id="pNext" ${to >= d.total ? 'disabled' : ''}>Siguientes${ico('right', 15)}</button></div>`
    : `<div class="card">${empty(hay ? 'Ningún contacto coincide' : 'Todavía no hay contactos', hay ? 'Probá con otro nombre, quitá filtros o elegí otro mes (o Total).' : 'Cuando alguien escriba al agente, aparece acá.')}</div>`;
  if ($('#pPrev')) { $('#pPrev').onclick = () => { L.page--; render(true); scrollTo({ top: 0 }); }; $('#pNext').onclick = () => { L.page++; render(true); scrollTo({ top: 0 }); }; }
}

/* ---------- PAGOS ---------- */
async function viewPagos(tk, silent) {
  const v = $('#view'); if (!silent) v.innerHTML = skel(5);
  const d = await api('list', { filtro: 'comprobante', mes: S.mes, size: 200, orden: 'recientes' });
  if (tk !== S.token) return;
  cacheRows(d.rows);
  const rows = d.rows.slice().sort((a, b) => new Date(b.ultimo_comprobante_fecha || 0) - new Date(a.ultimo_comprobante_fecha || 0));
  const pend = rows.filter((r) => r.atencion !== 'atendido').length;
  if (S.mes === mesActual()) badges(null, rows);
  v.innerHTML = `${periodBar()}<p class="lead-p"><b>${num(pend)}</b> de ${num(d.total)} comprobantes recibidos ${enPeriodo()} todavía no fueron revisados por el equipo. Abrí cada contacto para ver la conversación y marcarlo como atendido.</p>
    <div class="card list"><div class="lhead pay" aria-hidden="true"><span>Contacto</span><span>Curso</span><span>Monto y concepto</span><span>Recibido</span><span></span><span>Atención</span></div>${rows.map(rowPay).join('') || empty('No hay comprobantes ' + enPeriodo())}</div>`;
}

/* ---------- DERIVADOS ---------- */
async function viewDerivs(tk, silent) {
  const v = $('#view'); if (!silent) v.innerHTML = skel(5);
  const rows = await api('derivs', { mes: S.mes });
  if (tk !== S.token) return;
  rows.forEach((r) => S.rows.set(r.telefono, { ...(S.rows.get(r.telefono) || {}), telefono: r.telefono, nombre: r.nombre || S.rows.get(r.telefono)?.nombre, atencion: r.atencion }));
  const pend = rows.filter((r) => r.atencion !== 'atendido').length;
  if (S.mes === mesActual()) badges(rows, null);
  v.innerHTML = `${periodBar()}<p class="lead-p"><b>${num(pend)}</b> de las ${num(rows.length)} derivaciones ${enPeriodo()} siguen sin atender. El agente las genera cuando alguien pide hablar con una persona, anotarse en una lista de espera o consulta algo que no puede resolver.</p>
    <div class="card list"><div class="lhead der" aria-hidden="true"><span>Contacto</span><span>Motivo</span><span>Derivado</span><span>Atención</span></div>${rows.map(rowDer).join('') || empty('No hay derivaciones ' + enPeriodo())}</div>`;
}

/* ---------- CURSOS ---------- */
async function viewCursos(tk, silent) {
  const v = $('#view'); if (!silent) v.innerHTML = skel(5);
  const d = await api('list', { mes: S.mes, size: 1 });
  if (tk !== S.token) return;
  const max = Math.max(1, ...d.cursos.map((c) => Number(c.n)));
  v.innerHTML = `${periodBar()}<p class="muted per-note">Un contacto cuenta en el curso que el agente confirmó o, si no hay, en el que se detecta por sus mensajes (aprox.).</p>
    <div class="card"><div class="card-b rank">${d.cursos.length ? d.cursos.map((c, i) => `<a class="rank-row" href="#/contactos" data-curso="${esc(c.curso)}"><span class="rk">${i + 1}</span><span class="nm">${esc(c.curso)}</span><span class="bar-track"><span class="bar-fill ${i === 0 ? 'gold' : ''}" style="width:${(c.n / max) * 100}%"></span></span><b>${num(c.n)}</b><span class="muted go">ver contactos</span></a>`).join('') : empty('Sin consultas ' + enPeriodo())}</div></div>`;
}

/* ---------- MARCA ---------- */
function viewMarca() {
  const sw = (n, hex, use, fg = '#fff') => `<div class="sw"><div class="c" style="background:${hex};color:${fg}">${n}</div><div class="i"><b>${hex.toUpperCase()}</b><span class="muted">${use}</span></div></div>`;
  $('#view').innerHTML = `<div class="manual">
  <section class="m-hero"><div><h2>Pierre, centro profesional</h2><p>Este manual resume cómo se ve y cómo suena Pierre dentro del CRM. Sale del manual de marca original (logos y degradado dorado) y fija las reglas para usarlo en pantallas.</p></div><img src="assets/logo-vertical-blanco.png" alt="Logo vertical de Pierre en blanco"></section>

  <section class="card m-sec"><h3>Logotipo</h3><p>Un pin de ubicación con la «P» y el nombre en letra cursiva. Hay dos versiones de uso y una variante en blanco para fondos morados.</p>
    <div class="logos">
      <div class="logo-tile"><div class="stage"><img src="assets/logo-vertical.png" alt="Logo vertical"></div><div><b>Vertical</b><p>Portadas, perfiles, piezas cuadradas.</p></div></div>
      <div class="logo-tile"><div class="stage"><img src="assets/logo-horizontal.png" alt="Logo horizontal"></div><div><b>Horizontal</b><p>Encabezados, firmas, barras de menú.</p></div></div>
      <div class="logo-tile dark"><div class="stage"><img src="assets/logo-horizontal-blanco.png" alt="Logo horizontal en blanco"></div><div><b>En blanco</b><p>Solo sobre el morado de marca o fondos oscuros.</p></div></div>
      <div class="logo-tile gold"><div class="stage"><img src="assets/pin.png" alt="Pin de Pierre" style="max-height:104px"></div><div><b>Pin</b><p>Íconos, favicon y espacios muy chicos. Nunca sin la «P».</p></div></div>
    </div></section>

  <section class="card m-sec"><h3>Espacio de respeto</h3><p>Alrededor del logo queda libre, como mínimo, el alto de la «P» del pin. Ningún texto, borde o imagen entra en esa zona.</p>
    <div class="clear-space"><div><img src="assets/logo-horizontal.png" alt="Logo con zona de respeto"></div></div></section>

  <section class="card m-sec"><h3>Color</h3><p>El morado es la marca y se usa en grande: menús, botones principales, títulos. El dorado es una firma: líneas finas, destacados y el número uno de un ranking. No se usa para texto chico sobre blanco porque no alcanza el contraste.</p>
    <div class="swatches">${sw('Morado Pierre', '#662486', 'Marca · contraste 9,7:1 sobre blanco')}${sw('Morado profundo', '#3b154e', 'Degradados y fondo oscuro')}${sw('Morado claro', '#eae0ee', 'Fondos suaves, marcas', '#3b154e')}${sw('Dorado medio', '#d5a969', 'Línea de firma', '#3b2a06')}${sw('Dorado luz', '#facd88', 'Brillo del degradado', '#3b2a06')}${sw('Dorado texto', '#7a5a1c', 'Texto dorado · 6,4:1', '#fff')}</div>
    <div class="scale" aria-label="Escala de morados">${[['50', '#f6f2f8', '#3b154e'], ['100', '#eae0ee', '#3b154e'], ['200', '#d1bddb', '#3b154e'], ['300', '#b292c2', '#241530'], ['400', '#9161a8', '#fff'], ['600', '#662486', '#fff'], ['700', '#501c69', '#fff'], ['800', '#3b154e', '#fff'], ['900', '#270e33', '#fff']].map(([n, h, f]) => `<div style="background:${h};color:${f}">${n}</div>`).join('')}</div>
    <h3 style="margin-top:22px">Degradado dorado</h3><p>Tomado del archivo original «Degradado dorado»: tres tonos que van del bronce al champán y vuelven.</p>
    <div class="gold-bar"><span>#B1874A</span><span>#FACD88</span><span>#C79B5C</span></div></section>

  <section class="card m-sec"><h3>Tipografía</h3><p>El nombre usa una cursiva gruesa; en el CRM esa voz queda reservada para títulos de marca. Todo lo demás va en una sola familia legible.</p>
    <div class="type-row"><div><b>Lobster Two Bold Italic</b><br><small>Solo títulos de marca</small></div><div style="font-family:'Lobster Two',cursive;font-style:italic;font-weight:700;font-size:38px;line-height:1.1;color:var(--link)">Pierre Centro Profesional</div></div>
    <div class="type-row"><div><b>Outfit 600</b><br><small>Títulos de pantalla y de tarjeta</small></div><div style="font-weight:600;font-size:24px">Contactos que esperan una respuesta</div></div>
    <div class="type-row"><div><b>Outfit 400 · 15 px</b><br><small>Texto, tablas, formularios</small></div><div style="max-width:60ch">Hola, quiero información del curso de depilación y el precio. Los textos se escriben en oración, sin mayúsculas sostenidas.</div></div></section>

  <section class="card m-sec"><h3>Estados de atención</h3><p>Los tres estados del CRM tienen color fijo en todas las pantallas. Siempre llevan el nombre escrito: el color nunca es el único aviso.</p>
    <div class="states"><span class="pill no">No atendido</span><span class="pill seg">En seguimiento</span><span class="pill ok">Atendido</span><span class="pill gold">Derivado</span><span class="pill">Curso</span></div></section>

  <section class="card m-sec"><h3>Cómo usarlo</h3><p></p>
    <div class="do-dont"><div class="dd yes"><h4>${ico('check')} Sí</h4><ul><li>Logo en morado sobre blanco o crema, o en blanco sobre el morado de marca.</li><li>Dorado en líneas finas, no más de un acento dorado por pantalla.</li><li>Fondos lisos que dejen respirar al logo.</li></ul></div>
    <div class="dd no"><h4>${ico('x')} No</h4><ul><li>Estirar, girar, sombrear ni recolorear el logo.</li><li>Poner el logo morado sobre fondos morados, ni sobre fotos con mucho ruido.</li><li>Texto dorado chico sobre blanco.</li></ul></div></div></section>

  <section class="card m-sec"><h3>Cómo habla</h3><p>Cercana y concreta, como una recepcionista que conoce el instituto. Habla de vos, nombra el curso y el siguiente paso, y no promete lo que el equipo todavía no confirmó. En el CRM los botones dicen qué hacen: «Marcar atendido», «Guardar nota».</p></section>
  </div>`;
}

/* ---------- DRAWER ---------- */
const D = { tab: 'chat', data: null, tel: null, opener: null };
function openDrawer(tel, opener) {
  D.tel = tel; D.tab = 'chat'; D.data = null; D.opener = opener || document.activeElement; S.openTel = tel;
  const dr = $('#drawer'); dr.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); $('#scrim').hidden = false; requestAnimationFrame(() => $('#scrim').classList.add('on'));
  $('.app').inert = true; $('#tabbar').inert = true; document.body.style.overflow = 'hidden';
  paintDrawer();
  api('detail', { telefono: tel }).then((d) => { if (D.tel !== tel) return; D.data = d; if (d.contacto) { S.rows.set(tel, { ...(S.rows.get(tel) || {}), ...d.contacto }); } paintDrawer(true); })
    .catch(() => { if (D.tel === tel) $('#dBody').innerHTML = empty('No se pudo cargar la conversación', 'Revisá la conexión y volvé a abrir el contacto.'); });
  setTimeout(() => $('#dClose')?.focus(), 60);
}
function closeDrawer() {
  const dr = $('#drawer'); dr.classList.remove('on'); dr.setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on');
  setTimeout(() => { $('#scrim').hidden = true; }, 200);
  $('.app').inert = false; $('#tabbar').inert = false; document.body.style.overflow = '';
  D.tel = null; S.openTel = null; D.opener?.focus?.(); render(true);
}
function bubbles(msgs, total) {
  let last = '', out = total > msgs.length ? `<div class="dsep">Mostrando los últimos ${msgs.length} de ${num(total)} mensajes</div>` : '';
  for (const m of msgs) {
    const k = dayKey(new Date(m.created_at));
    if (k !== last) { last = k; out += `<div class="dsep">${esc(dayLabel(m.created_at))}</div>`; }
    const t = hhmm(new Date(m.created_at));
    if (m.tipo_mensaje === 'image') out += `<div class="msg u"><span class="attach">${ico('image', 16)}Imagen${m.categoria_imagen === 'COMPROBANTE_PAGO' ? ' · comprobante de pago' : ''}</span><small>${t}</small></div>`;
    else if (m.tipo_mensaje === 'document') out += `<div class="msg u"><span class="attach">${ico('file', 16)}Documento enviado</span><small>${t}</small></div>`;
    else if (m.mensaje_usuario) out += `<div class="msg u">${m.tipo_mensaje === 'audio' ? `<span class="attach">${ico('mic', 15)}Audio, transcripto</span><br>` : ''}${esc(m.mensaje_usuario)}<small>${t}</small></div>`;
    if (m.respuesta_ai) out += `<div class="msg a"><div class="who-l">Agente</div>${esc(m.respuesta_ai)}<small>${t}</small></div>`;
  }
  return out || empty('Sin mensajes');
}
function paintDrawer(loaded, force) {
  const r = S.rows.get(D.tel) || { telefono: D.tel }, a = r.atencion || 'no_atendido';
  const dr = $('#drawer'), keepTab = D.tab;
  const editing = $('#nameIn') && document.activeElement === $('#nameIn');
  if (editing && !force) return;
  const notas = D.data?.notas || [];
  dr.innerHTML = `<div class="dh"><div class="dh-top">${avatar(r)}
    <div class="dh-name"><div class="nm" id="nameBox"><h2 class="${r.nombre ? '' : 'nn'}">${esc(r.nombre || 'Sin nombre')}</h2><button class="mini-btn" id="nameEdit" type="button" aria-label="Editar nombre" title="Editar nombre">${ico('pencil', 16)}</button></div>
      <div class="ph"><span>${esc(phoneFmt(r.telefono))}</span><button class="mini-btn" id="copyTel" type="button" aria-label="Copiar teléfono" title="Copiar teléfono">${ico('copy', 16)}</button><a href="https://wa.me/${esc(r.telefono)}" target="_blank" rel="noopener">Abrir en WhatsApp</a></div></div>
    <button class="x" id="dClose" type="button" aria-label="Cerrar">${ico('x', 18)}</button></div>
    <div class="seg-ctl" role="group" aria-label="Estado de atención">${Object.entries(ATEN).map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${a === k}"><i></i>${l}</button>`).join('')}</div>
    <div class="by" aria-live="polite">${a !== 'no_atendido' && r.atendido_por ? `${a === 'atendido' ? 'Atendido' : 'En seguimiento'} por <b>${esc(r.atendido_por)}</b> · ${esc(rel(r.atendido_at))}` : 'Nadie lo tomó todavía.'}</div></div>
    <div class="dtabs" role="tablist"><button role="tab" data-t="chat" aria-selected="${keepTab === 'chat'}">Conversación</button><button role="tab" data-t="notas" aria-selected="${keepTab === 'notas'}">Notas<span class="cnt">${notas.length}</span></button><button role="tab" data-t="datos" aria-selected="${keepTab === 'datos'}">Datos</button></div>
    <div class="dbody" id="dBody" role="tabpanel"></div>`;
  paintTab(); bindDrawer();
  if (loaded && keepTab === 'chat') { const b = $('#dBody'); b.scrollTop = b.scrollHeight; }
}
function paintTab() {
  const b = $('#dBody'), d = D.data, r = S.rows.get(D.tel) || {};
  if (!d) { b.innerHTML = '<div class="skeleton" style="height:70px"></div><div class="skeleton" style="height:70px;margin-top:10px;width:70%"></div><div class="skeleton" style="height:70px;margin-top:10px;margin-left:auto;width:80%"></div>'; return; }
  if (D.tab === 'chat') b.innerHTML = `<div class="chat">${bubbles(d.mensajes, d.contacto?.msgs || d.mensajes.length)}</div>`;
  else if (D.tab === 'notas') {
    b.innerHTML = `<form class="notes-form" id="noteForm"><label class="sr" for="noteIn">Nueva nota</label><textarea id="noteIn" maxlength="2000" placeholder="Qué se habló o qué falta hacer con esta persona"></textarea><button class="btn primary" type="submit">Guardar nota</button></form>
      <div id="noteList">${d.notas.length ? d.notas.map(noteHtml).join('') : empty('Todavía no hay notas', 'Anotá acuerdos, dudas o el próximo paso para que lo vea todo el equipo.')}</div>`;
    $('#noteForm').onsubmit = saveNote;
  } else {
    const c = d.contacto || r;
    const f = [['Teléfono', phoneFmt(c.telefono)], ['Primer mensaje', c.primero ? longDate(c.primero) : '—'], ['Último mensaje', c.ultimo ? longDate(c.ultimo) : '—'], ['Mensajes', num(c.msgs)], ['Curso', c.curso ? c.curso + (c.curso_detectado ? ' (aprox., detectado por sus mensajes)' : '') : '—'], ['Etapa del agente', ({ nuevo: 'Nuevo', lead: 'Interesado', comprobante_recibido: 'Envió comprobante' })[c.estado] || '—'], ['Comprobante', c.ultimo_comprobante_fecha ? longDate(c.ultimo_comprobante_fecha) + (c.ultimo_monto ? ' · ' + c.ultimo_monto : '') : '—']];
    const ders = d.derivaciones || [];
    b.innerHTML = `<dl class="facts">${f.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}${c.ultimo_comprobante_link ? `<dt>Imagen</dt><dd><a href="${esc(c.ultimo_comprobante_link)}" target="_blank" rel="noopener">Abrir comprobante</a></dd>` : ''}</dl>
      ${ders.length ? `<h3 class="sub-h">Derivaciones al equipo</h3>${ders.map((x) => `<div class="note"><span>${esc(x.motivo || 'Sin motivo')}</span><small>${esc(longDate(x.created_at))}</small></div>`).join('')}` : ''}`;
  }
}
const noteHtml = (n) => `<div class="note"><span>${esc(n.texto)}</span><small>${esc(n.autor || 'Sin nombre')} · ${esc(longDate(n.created_at))}</small></div>`;
function bindDrawer() {
  $('#dClose').onclick = closeDrawer;
  $$('.dtabs button').forEach((b) => b.onclick = () => { D.tab = b.dataset.t; $$('.dtabs button').forEach((x) => x.setAttribute('aria-selected', x === b)); paintTab(); if (D.tab === 'chat') { const bd = $('#dBody'); bd.scrollTop = bd.scrollHeight; } });
  $$('.seg-ctl button').forEach((b) => b.onclick = () => setAtencion(D.tel, b.dataset.v));
  $('#copyTel').onclick = async () => { try { await navigator.clipboard.writeText('+' + D.tel); toast('Teléfono copiado'); } catch { toast('No se pudo copiar', true); } };
  $('#nameEdit').onclick = editName;
  $('#nameBox h2').ondblclick = editName;
}
function editName() {
  const r = S.rows.get(D.tel) || {}, box = $('#nameBox');
  box.innerHTML = `<input id="nameIn" type="text" maxlength="80" value="${esc(r.nombre || '')}" placeholder="Nombre de la persona" aria-label="Nombre">`;
  const inp = $('#nameIn'); inp.focus(); inp.select();
  let done = false;
  const finish = async (save) => {
    if (done) return; done = true;
    const v = inp.value.trim();
    if (save && v !== (r.nombre || '')) {
      try { const res = await api('save', { telefono: D.tel, nombre: v }); S.rows.set(D.tel, { ...S.rows.get(D.tel), nombre: res.nombre || v }); toast('Nombre guardado'); if (!v) openDrawer(D.tel, D.opener); }
      catch { toast('No se pudo guardar el nombre. Probá de nuevo.', true); }
    }
    paintDrawer(false, true);
  };
  inp.onkeydown = (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') { e.stopPropagation(); finish(false); } };
  inp.onblur = () => finish(true);
}
async function saveNote(e) {
  e.preventDefault();
  const t = $('#noteIn').value.trim(); if (!t) return;
  const por = await ensureOp(); if (!por) { toast('Poné tu nombre para firmar la nota', true); return; }
  const btn = e.submitter; btn.disabled = true;
  try {
    const n = await api('note', { telefono: D.tel, texto: t, por });
    D.data.notas.unshift(n); toast('Nota guardada'); paintDrawer(); D.tab = 'notas'; $$('.dtabs button').forEach((x) => x.setAttribute('aria-selected', x.dataset.t === 'notas')); paintTab();
  } catch { toast('No se pudo guardar la nota. Tu texto sigue acá.', true); btn.disabled = false; }
}
async function setAtencion(tel, val) {
  const r = S.rows.get(tel) || { telefono: tel }; const prev = { ...r };
  if (val !== 'no_atendido') { const por = await ensureOp(); if (!por) { toast('Poné tu nombre para registrar quién atiende', true); return; } }
  S.rows.set(tel, { ...r, atencion: val, atendido_por: val === 'no_atendido' ? null : S.op, atendido_at: val === 'no_atendido' ? null : new Date().toISOString() });
  refreshRows(tel); if (D.tel === tel) paintDrawer();
  try { await api('save', { telefono: tel, atencion: val, por: S.op }); toast(val === 'atendido' ? 'Marcado como atendido' : val === 'seguimiento' ? 'Marcado en seguimiento' : 'Marcado como no atendido'); softCounts(); }
  catch { S.rows.set(tel, prev); refreshRows(tel); if (D.tel === tel) paintDrawer(); toast('No se pudo guardar el cambio. Probá de nuevo.', true); }
}
function refreshRows(tel) {
  const r = S.rows.get(tel); if (!r) return;
  $$(`[data-open="${CSS.escape(tel)}"]`).forEach((el) => {
    if (el.classList.contains('lrow')) {
      const tpl = el.classList.contains('pay') ? rowPay : el.classList.contains('der') ? rowDer : rowMain;
      const keep = { ...r }; const wrap = document.createElement('div'); wrap.innerHTML = tpl(keep).trim(); el.replaceWith(wrap.firstElementChild);
    }
  });
}
const softCounts = () => { clearTimeout(softCounts.t); softCounts.t = setTimeout(() => { if (S.view === 'contactos') render(true); else if (S.view === 'resumen') render(true); }, 900); };

/* ---------- render / router ---------- */
async function render(silent = false) {
  const tk = ++S.token, info = VIEWS[S.view];
  $('#pageTitle').textContent = info.t; $('#pageSub').textContent = info.s; document.title = `${info.t} · Pierre CRM`;
  paintNav(); killCharts();
  $('#refreshBtn').classList.add('spin'); banner('');
  const run = { resumen: viewResumen, contactos: viewContactos, pagos: viewPagos, derivaciones: viewDerivs, cursos: viewCursos, marca: async () => viewMarca() }[S.view];
  try { await run(tk, silent); if (!silent) { const m = $('.mchip[aria-pressed="true"]'), bar = $('.mesbar'); if (m && bar) bar.scrollLeft = m.offsetLeft - bar.offsetLeft - (bar.clientWidth - m.offsetWidth) / 2; } }
  catch (e) { if (tk === S.token) { banner('No se pudieron traer los datos. Revisá la conexión.', () => render()); if (!silent) $('#view').innerHTML = ''; } }
  finally { if (tk === S.token) $('#refreshBtn').classList.remove('spin'); }
}
function route() {
  const k = (location.hash.replace(/^#\/?/, '') || 'resumen').split('?')[0];
  S.view = VIEWS[k] ? k : 'resumen';
  if (S.view === 'contactos') { const q = new URLSearchParams(location.hash.split('?')[1] || ''); if (q.has('f')) { S.list.filtro = q.get('f'); S.list.page = 0; } }
  render(); scrollTo({ top: 0 });
}

document.addEventListener('click', (e) => {
  const mk = e.target.closest('[data-mark]');
  if (mk) { e.stopPropagation(); setAtencion(mk.dataset.mark, 'atendido'); return; }
  if (e.target.closest('[data-stop]')) { e.stopPropagation(); return; }
  const f = e.target.closest('[data-filtro]'); if (f) { S.list.filtro = f.dataset.filtro; S.list.curso = ''; S.list.page = 0; S.list.q = ''; }
  const cu = e.target.closest('[data-curso]'); if (cu) { S.list.curso = cu.dataset.curso; S.list.filtro = 'todos'; S.list.q = ''; S.list.page = 0; }
  const ms = e.target.closest('[data-mes]'); if (ms) { S.mes = ms.dataset.mes; store.set('pierre_mes', S.mes); S.list.page = 0; render(); return; }
  const op = e.target.closest('[data-open]'); if (op && !e.target.closest('a,button.mark')) openDrawer(op.dataset.open, op);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!pop().hidden) { $('#opCancel').click(); return; } if (D.tel) closeDrawer(); }
  const row = e.target.closest?.('.lrow[data-open]');
  if (row && (e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); openDrawer(row.dataset.open, row); }
});
$('#scrim').onclick = closeDrawer;
$('#refreshBtn').onclick = () => render(true);
$$('#themeBtn,#themeBtnM').forEach((b) => b.onclick = () => applyTheme(curTheme() === 'dark' ? 'light' : 'dark'));
$$('#opBtn,#opBtnM').forEach((b) => b.onclick = () => askOp());
addEventListener('hashchange', route);
setInterval(() => { if (S.token_s && !document.hidden && !D.tel && pop().hidden && S.view !== 'marca') render(true); }, POLL_MS);


/* ---------- ingreso ---------- */
function lock(msg) {
  S.token_s = ''; store.set('pierre_tk', '');
  if (D.tel) closeDrawer();
  const it = $('#intro'); it.hidden = false; it.classList.remove('leaving'); document.body.classList.add('locked');
  if (!lock.mounted && window.PierreWorld) { PierreWorld.mount($('#world')); lock.mounted = true; } else if (window.PierreWorld) PierreWorld.start();
  $('#lgErr').textContent = msg || '';
  setTimeout(() => $('#lgUser').focus(), 50);
}
function unlock(first) {
  const it = $('#intro');
  document.body.classList.remove('locked');
  if (it.hidden) { route(); return; }
  it.classList.add('leaving'); route();
  setTimeout(() => { it.hidden = true; it.classList.remove('leaving'); window.PierreWorld && PierreWorld.stop(); }, first ? 0 : 950);
}
$('#lgShow').onclick = () => { const p = $('#lgPass'), show = p.type === 'password'; p.type = show ? 'text' : 'password'; $('#lgShow').textContent = show ? 'Ocultar' : 'Mostrar'; $('#lgShow').setAttribute('aria-pressed', show); $('#lgShow').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); };
$('#loginForm').onsubmit = async (e) => {
  e.preventDefault();
  const u = $('#lgUser').value.trim(), p = $('#lgPass').value, err = $('#lgErr');
  $('#lgUser').removeAttribute('aria-invalid'); $('#lgPass').removeAttribute('aria-invalid');
  if (!u || !p) { err.textContent = !u ? 'Escribí tu usuario.' : 'Escribí tu contraseña.'; (!u ? $('#lgUser') : $('#lgPass')).setAttribute('aria-invalid', 'true'); (!u ? $('#lgUser') : $('#lgPass')).focus(); return; }
  const btn = $('#lgBtn'); btn.disabled = true; btn.textContent = 'Entrando…'; err.textContent = '';
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'login', usuario: u, clave: p }) });
    const j = await r.json();
    if (!j.token) { err.textContent = 'El usuario o la contraseña no coinciden. Revisalos y probá de nuevo.'; $('#lgPass').setAttribute('aria-invalid', 'true'); $('#lgPass').select(); return; }
    S.token_s = j.token; store.set('pierre_tk', j.token); $('#lgPass').value = '';
    unlock(false);
  } catch { err.textContent = 'No hay conexión con el servidor. Revisá internet y probá de nuevo.'; }
  finally { btn.disabled = false; btn.textContent = 'Entrar'; }
};
$('#logoutBtn').onclick = () => lock();

/* ---------- arranque ---------- */
document.documentElement.dataset.theme = store.get('pierre_theme') || '';
if (!document.documentElement.dataset.theme) delete document.documentElement.dataset.theme;
buildNav(); paintOp(); applyTheme();
if (S.token_s) unlock(true); else lock();
/* globitos de las pestañas: lo de ESTE mes que sigue sin atender */
function badges(ders, pays) {
  if (ders) S.badges.derivs = ders.filter((x) => x.atencion !== 'atendido').length;
  if (pays) S.badges.pagos = pays.filter((x) => x.atencion !== 'atendido').length; paintNav();
}
// badges de las pestañas operativas aunque no se hayan abierto
if (S.token_s) Promise.all([api('derivs', { mes: mesActual() }), api('list', { filtro: 'comprobante', mes: mesActual(), size: 200 })]).then(([d, p]) => {
  badges(d, p.rows);
}).catch(() => {});
})();
