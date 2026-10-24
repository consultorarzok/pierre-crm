# Pierre CRM

CRM interno de Pierre Centro Profesional conectado al agente de WhatsApp.

- **Front:** HTML/CSS/JS estático (sin build), Chart.js para gráficos. Marca: morado `#662486` + degradado dorado (ver pestaña *Manual de marca*).
- **Datos:** Supabase (tablas del agente `pierre_*`) a través de la API `Pierre CRM API` en n8n (`POST /webhook/pierre-crm-api`, acciones `list`, `detail`, `save`, `note`, `derivs`, `stats`).
- **Escrituras:** solo en `pierre_crm_contactos` (estado de atención y nombre) y `pierre_crm_notas`. Las tablas del agente no se modifican.
- **Backend:** `backend/db.sql` (tablas y vista `pierre_crm_v`) y `backend/build-api.js` (crea/actualiza el workflow).

Acceso abierto por link, sin contraseña (etapa de presentación). Antes de pasar a producción hay que agregar acceso por usuario.
