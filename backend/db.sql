CREATE TABLE IF NOT EXISTS pierre_crm_contactos (
  telefono varchar(30) PRIMARY KEY,
  nombre text,
  atencion text NOT NULL DEFAULT 'no_atendido' CHECK (atencion IN ('no_atendido','seguimiento','atendido')),
  atendido_por text,
  atendido_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pierre_crm_notas (
  id bigserial PRIMARY KEY,
  telefono varchar(30) NOT NULL,
  autor text,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pierre_crm_notas_tel ON pierre_crm_notas (telefono, id DESC);
CREATE OR REPLACE VIEW pierre_crm_v AS
SELECT w.telefono, w.nombre, w.atencion, w.atendido_por, w.atendido_at, w.estado, w.comprobante_pendiente, w.ultimo_comprobante_link, w.ultimo_monto, w.concepto_pago, w.ultimo_comprobante_fecha,
  CASE
    WHEN w.curso_raw ~* 'canin' THEN 'Peluquería Canina'
    WHEN w.curso_raw ~* 'peluquer' THEN 'Peluquería Profesional'
    WHEN w.curso_raw ~* 'bartender|coctel|cóctel' THEN 'Bartender'
    WHEN w.curso_raw ~* 'barber' THEN 'Barbería'
    WHEN w.curso_raw ~* 'manicur' THEN 'Manicura'
    WHEN w.curso_raw ~* 'maquill' THEN 'Maquillaje'
    WHEN w.curso_raw ~* 'marketing' THEN 'Marketing Digital'
    WHEN w.curso_raw ~* 'ceja|pesta' THEN 'Cejas y Pestañas'
    WHEN w.curso_raw ~* 'depila' THEN 'Depilación'
    ELSE w.curso_raw END AS curso,
  w.curso_detectado, w.msgs, w.imgs, w.primero, w.ultimo, w.derivado, w.ult_deriv, w.motivo
FROM (
SELECT c.telefono,
  COALESCE(NULLIF(k.nombre,''), NULLIF(e.nombre_confirmado,''), d.nombre_der) AS nombre,
  COALESCE(k.atencion,'no_atendido') AS atencion,
  k.atendido_por, k.atendido_at,
  e.estado, COALESCE(e.comprobante_pendiente,false) AS comprobante_pendiente,
  e.ultimo_comprobante_link, NULLIF(e.ultimo_monto,'') AS ultimo_monto, e.concepto_pago, e.ultimo_comprobante_fecha,
  COALESCE(NULLIF(e.curso_interes,''), c.tema) AS curso_raw,
  (NULLIF(e.curso_interes,'') IS NULL AND c.tema IS NOT NULL) AS curso_detectado,
  c.msgs, c.imgs, c.primero, c.ultimo,
  (d.n IS NOT NULL) AS derivado, d.ult_deriv, d.motivo
FROM (
  SELECT telefono, count(*) AS msgs, count(*) FILTER (WHERE tipo_mensaje='image') AS imgs,
    min(created_at) AS primero, max(created_at) AS ultimo,
    CASE
      WHEN bool_or(mensaje_usuario ~* 'depila') THEN 'Depilación'
      WHEN bool_or(mensaje_usuario ~* 'bartender|barman|coctel|cóctel|tragos') THEN 'Bartender'
      WHEN bool_or(mensaje_usuario ~* 'barber') THEN 'Barbería'
      WHEN bool_or(mensaje_usuario ~* 'ceja|pesta') THEN 'Cejas y Pestañas'
      WHEN bool_or(mensaje_usuario ~* 'manicur|uñas|unas') THEN 'Manicura'
      WHEN bool_or(mensaje_usuario ~* 'canin|perro|mascota') THEN 'Peluquería Canina'
      WHEN bool_or(mensaje_usuario ~* 'peluquer') THEN 'Peluquería Profesional'
      WHEN bool_or(mensaje_usuario ~* 'maquill') THEN 'Maquillaje'
      WHEN bool_or(mensaje_usuario ~* 'marketing') THEN 'Marketing Digital'
      WHEN bool_or(mensaje_usuario ~* 'celular') THEN 'Reparación de Celulares'
      WHEN bool_or(mensaje_usuario ~* 'helado') THEN 'Master Class Helados'
    END AS tema
  FROM pierre_conversaciones GROUP BY telefono
) c
LEFT JOIN pierre_crm_contactos k ON k.telefono = c.telefono
LEFT JOIN pierre_estado_usuario e ON e.telefono = c.telefono
LEFT JOIN (
  SELECT telefono, count(*) AS n, max(created_at) AS ult_deriv,
    (array_agg(nombre ORDER BY created_at DESC) FILTER (WHERE nombre IS NOT NULL AND nombre <> '' AND nombre NOT ILIKE 'sin nombre'))[1] AS nombre_der,
    (array_agg(motivo ORDER BY created_at DESC))[1] AS motivo
  FROM pierre_derivaciones GROUP BY telefono
) d ON d.telefono = c.telefono
) w
