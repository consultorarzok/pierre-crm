/** Crea/actualiza el workflow "Pierre CRM API" en n8n (webhook único POST text/plain con {action,...}). */
const fs = require('fs');
const API = 'https://n8n.consultorarz.com/api/v1';
const KEY = JSON.parse(fs.readFileSync('/root/.claude.json', 'utf8')).projects['/root'].mcpServers['n8n-mcp'].env.N8N_API_KEY;
const h = { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json' };
const CRED = { postgres: { id: '9DJNCWmV7V4NRKz2', name: 'Supabase Pierre' } };
const PATH = 'pierre-crm-api';

const parse = `
const raw = $input.first().json.body;
let b = {};
try { b = typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch (e) { b = {}; }
const s = (v, n = 500) => String(v == null ? '' : v).trim().slice(0, n);
const tel = s(b.telefono, 30).replace(/\\D/g, '');
const ATEN = ['no_atendido', 'seguimiento', 'atendido'];
const FIL = ['todos', 'no_atendido', 'seguimiento', 'atendido', 'comprobante', 'derivado', 'con_curso'];
const size = Math.min(Math.max(parseInt(b.size) || 50, 1), 200);
const dias = Math.min(Math.max(parseInt(b.dias) || 0, 0), 3650);
const page = Math.max(parseInt(b.page) || 0, 0);
return [{ json: {
  action: s(b.action, 20),
  p: {
    q: s(b.q, 80), filtro: FIL.includes(b.filtro) ? b.filtro : 'todos', curso: s(b.curso, 60),
    orden: b.orden === 'antiguos' ? 'antiguos' : 'recientes', limit: size, offset: page * size, dias,
    telefono: tel, nombre: s(b.nombre, 80), atencion: ATEN.includes(b.atencion) ? b.atencion : 'no_atendido',
    por: s(b.por, 60), hasNombre: b.nombre !== undefined, hasAtencion: ATEN.includes(b.atencion), texto: s(b.texto, 2000)
  } } }];`;

const SQL = {
  list: `WITH a AS (SELECT * FROM pierre_crm_v WHERE $7::int = 0 OR ultimo >= now() - ($7::int * interval '1 day')),
f AS (SELECT * FROM a WHERE ($1 = '' OR telefono ILIKE '%' || $1 || '%' OR nombre ILIKE '%' || $1 || '%')
  AND ($2 = 'todos' OR ($2 = 'no_atendido' AND atencion = 'no_atendido') OR ($2 = 'seguimiento' AND atencion = 'seguimiento') OR ($2 = 'atendido' AND atencion = 'atendido') OR ($2 = 'comprobante' AND estado = 'comprobante_recibido') OR ($2 = 'derivado' AND derivado) OR ($2 = 'con_curso' AND curso IS NOT NULL))
  AND ($3 = '' OR curso = $3))
SELECT json_build_object(
 'total', (SELECT count(*) FROM f),
 'counts', (SELECT json_build_object('todos', count(*), 'no_atendido', count(*) FILTER (WHERE atencion = 'no_atendido'), 'seguimiento', count(*) FILTER (WHERE atencion = 'seguimiento'), 'atendido', count(*) FILTER (WHERE atencion = 'atendido'), 'comprobante', count(*) FILTER (WHERE estado = 'comprobante_recibido'), 'derivado', count(*) FILTER (WHERE derivado), 'con_curso', count(*) FILTER (WHERE curso IS NOT NULL)) FROM a),
 'cursos', (SELECT COALESCE(json_agg(c), '[]'::json) FROM (SELECT curso, count(*) AS n FROM a WHERE curso IS NOT NULL GROUP BY 1 ORDER BY 2 DESC) c),
 'rows', (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
   SELECT f.telefono, f.nombre, f.atencion, f.atendido_por, f.atendido_at, f.estado, f.ultimo_monto, f.concepto_pago, f.ultimo_comprobante_link, f.ultimo_comprobante_fecha, f.curso, f.curso_detectado, f.msgs, f.primero, f.ultimo, f.derivado, f.motivo,
     (SELECT left(CASE WHEN x.tipo_mensaje IN ('text', 'audio') THEN COALESCE(NULLIF(x.mensaje_usuario, ''), '[' || x.tipo_mensaje || ']') ELSE '[' || x.tipo_mensaje || ']' END, 110) FROM pierre_conversaciones x WHERE x.telefono = f.telefono ORDER BY x.id DESC LIMIT 1) AS ultimo_msg,
     (SELECT x.tipo_mensaje FROM pierre_conversaciones x WHERE x.telefono = f.telefono ORDER BY x.id DESC LIMIT 1) AS ultimo_tipo
   FROM f ORDER BY CASE WHEN $4 = 'antiguos' THEN f.ultimo END ASC, CASE WHEN $4 <> 'antiguos' THEN f.ultimo END DESC LIMIT $5 OFFSET $6) t)
) AS data`,
  detail: `SELECT json_build_object(
 'contacto', (SELECT row_to_json(v) FROM pierre_crm_v v WHERE v.telefono = $1),
 'mensajes', (SELECT COALESCE(json_agg(m ORDER BY m.id), '[]'::json) FROM (SELECT id, tipo_mensaje, CASE WHEN tipo_mensaje IN ('text', 'audio') THEN mensaje_usuario END AS mensaje_usuario, respuesta_ai, NULLIF(categoria_imagen, '') AS categoria_imagen, created_at FROM pierre_conversaciones WHERE telefono = $1 ORDER BY id DESC LIMIT 400) m),
 'notas', (SELECT COALESCE(json_agg(n ORDER BY n.id DESC), '[]'::json) FROM pierre_crm_notas n WHERE n.telefono = $1),
 'derivaciones', (SELECT COALESCE(json_agg(x), '[]'::json) FROM (SELECT motivo, created_at FROM pierre_derivaciones WHERE telefono = $1 ORDER BY created_at DESC LIMIT 10) x)
) AS data`,
  save: `WITH r AS (
 INSERT INTO pierre_crm_contactos AS o (telefono, nombre, atencion, atendido_por, atendido_at, updated_at)
 VALUES ($1, CASE WHEN $5::boolean THEN NULLIF($2, '') END, CASE WHEN $6::boolean THEN $3 ELSE 'no_atendido' END,
   CASE WHEN $6::boolean AND $3 <> 'no_atendido' THEN NULLIF($4, '') END, CASE WHEN $6::boolean AND $3 <> 'no_atendido' THEN now() END, now())
 ON CONFLICT (telefono) DO UPDATE SET
   nombre = CASE WHEN $5::boolean THEN NULLIF($2, '') ELSE o.nombre END,
   atencion = CASE WHEN $6::boolean THEN $3 ELSE o.atencion END,
   atendido_por = CASE WHEN NOT $6::boolean THEN o.atendido_por WHEN $3 = 'no_atendido' THEN NULL ELSE COALESCE(NULLIF($4, ''), o.atendido_por) END,
   atendido_at = CASE WHEN NOT $6::boolean THEN o.atendido_at WHEN $3 = 'no_atendido' THEN NULL WHEN o.atencion IS DISTINCT FROM $3 THEN now() ELSE o.atendido_at END,
   updated_at = now()
 RETURNING o.telefono, o.nombre, o.atencion, o.atendido_por, o.atendido_at)
SELECT row_to_json(r) AS data FROM r`,
  note: `WITH r AS (INSERT INTO pierre_crm_notas (telefono, autor, texto) VALUES ($1, NULLIF($2, ''), $3) RETURNING id, telefono, autor, texto, created_at) SELECT row_to_json(r) AS data FROM r`,
  derivs: `SELECT COALESCE(json_agg(t), '[]'::json) AS data FROM (
 SELECT d.id, d.telefono, COALESCE(NULLIF(k.nombre, ''), NULLIF(NULLIF(d.nombre, 'Sin nombre'), '')) AS nombre, d.motivo, d.origen, d.created_at, COALESCE(k.atencion, 'no_atendido') AS atencion
 FROM pierre_derivaciones d LEFT JOIN pierre_crm_contactos k ON k.telefono = d.telefono ORDER BY d.created_at DESC LIMIT 300) t`,
  stats: `WITH a AS (SELECT * FROM pierre_crm_v)
SELECT json_build_object(
 'total', (SELECT count(*) FROM a),
 'no_atendido', (SELECT count(*) FROM a WHERE atencion = 'no_atendido'),
 'seguimiento', (SELECT count(*) FROM a WHERE atencion = 'seguimiento'),
 'atendido', (SELECT count(*) FROM a WHERE atencion = 'atendido'),
 'comprobantes', (SELECT count(*) FROM a WHERE estado = 'comprobante_recibido'),
 'derivados', (SELECT count(*) FROM a WHERE derivado),
 'nuevos_7d', (SELECT count(*) FROM a WHERE primero >= now() - interval '7 days'),
 'activos_7d', (SELECT count(*) FROM a WHERE ultimo >= now() - interval '7 days'),
 'mensajes_total', (SELECT count(*) FROM pierre_conversaciones),
 'mensajes_7d', (SELECT count(*) FROM pierre_conversaciones WHERE created_at >= now() - interval '7 days'),
 'diario', (SELECT COALESCE(json_agg(d ORDER BY d.dia), '[]'::json) FROM (SELECT (created_at AT TIME ZONE 'America/Argentina/Jujuy')::date AS dia, count(*) AS mensajes, count(DISTINCT telefono) AS contactos FROM pierre_conversaciones WHERE created_at >= now() - interval '45 days' GROUP BY 1) d),
 'horas', (SELECT COALESCE(json_agg(x ORDER BY x.hora), '[]'::json) FROM (SELECT extract(hour FROM created_at AT TIME ZONE 'America/Argentina/Jujuy')::int AS hora, count(*) AS n FROM pierre_conversaciones WHERE created_at >= now() - interval '30 days' GROUP BY 1) x),
 'cursos', (SELECT COALESCE(json_agg(c), '[]'::json) FROM (SELECT curso, count(*) AS n FROM a WHERE curso IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 12) c),
 'tipos', (SELECT COALESCE(json_agg(t), '[]'::json) FROM (SELECT tipo_mensaje AS tipo, count(*) AS n FROM pierre_conversaciones GROUP BY 1 ORDER BY 2 DESC) t)
) AS data`,
};
const REPL = {
  list: '={{ [$json.p.q, $json.p.filtro, $json.p.curso, $json.p.orden, $json.p.limit, $json.p.offset, $json.p.dias] }}',
  detail: '={{ [$json.p.telefono] }}',
  save: '={{ [$json.p.telefono, $json.p.nombre, $json.p.atencion, $json.p.por, $json.p.hasNombre, $json.p.hasAtencion] }}',
  note: '={{ [$json.p.telefono, $json.p.por, $json.p.texto] }}',
};
const actions = Object.keys(SQL);
const nodes = [
  { id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 300], webhookId: PATH,
    parameters: { httpMethod: 'POST', path: PATH, responseMode: 'responseNode', options: { allowedOrigins: '*' } } },
  { id: 'pa', name: 'Parsear', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 300], parameters: { jsCode: parse } },
  { id: 'sw', name: 'Accion', type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [440, 300],
    parameters: { rules: { values: actions.map((a) => ({ renameOutput: true, outputKey: a,
      conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, combinator: 'and',
        conditions: [{ id: a, leftValue: '={{ $json.action }}', rightValue: a, operator: { type: 'string', operation: 'equals' } }] } })) },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'desconocida' } } },
  { id: 'rs', name: 'Responder', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [1000, 300],
    parameters: { respondWith: 'json', responseBody: '={{ $json.data !== undefined ? $json.data : { error: "sin datos" } }}',
      options: { responseHeaders: { entries: [{ name: 'Access-Control-Allow-Origin', value: '*' }] } } } },
  { id: 're', name: 'Responder error', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [1000, 600],
    parameters: { respondWith: 'json', responseBody: '={{ { error: "accion desconocida" } }}', options: { responseCode: 400, responseHeaders: { entries: [{ name: 'Access-Control-Allow-Origin', value: '*' }] } } } },
];
const connections = { Webhook: { main: [[{ node: 'Parsear', type: 'main', index: 0 }]] }, Parsear: { main: [[{ node: 'Accion', type: 'main', index: 0 }]] }, Accion: { main: [] } };
actions.forEach((a, i) => {
  const name = 'SQL ' + a;
  const options = REPL[a] ? { queryReplacement: REPL[a] } : {};
  nodes.push({ id: 'q' + a, name, type: 'n8n-nodes-base.postgres', typeVersion: 2.6, position: [720, 60 + i * 90], alwaysOutputData: true, onError: 'continueRegularOutput',
    parameters: { resource: 'database', operation: 'executeQuery', query: SQL[a], options }, credentials: CRED });
  connections.Accion.main[i] = [{ node: name, type: 'main', index: 0 }];
  connections[name] = { main: [[{ node: 'Responder', type: 'main', index: 0 }]] };
});
connections.Accion.main[actions.length] = [{ node: 'Responder error', type: 'main', index: 0 }];

(async () => {
  const wf = { name: 'Pierre CRM API', nodes, connections, settings: { executionOrder: 'v1' } };
  const list = await (await fetch(`${API}/workflows?limit=250`, { headers: h })).json();
  const ex = list.data.find((w) => w.name === 'Pierre CRM API');
  let id;
  if (ex) { id = ex.id; const r = await fetch(`${API}/workflows/${id}`, { method: 'PUT', headers: h, body: JSON.stringify(wf) }); if (!r.ok) throw new Error(await r.text()); }
  else { const r = await fetch(`${API}/workflows`, { method: 'POST', headers: h, body: JSON.stringify(wf) }); const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); id = j.id; }
  await fetch(`${API}/workflows/${id}/deactivate`, { method: 'POST', headers: h });
  const a = await fetch(`${API}/workflows/${id}/activate`, { method: 'POST', headers: h });
  console.log('workflow', id, ex ? 'actualizado' : 'creado', 'activate:', a.status);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
