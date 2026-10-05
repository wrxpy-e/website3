import { requireOwner, json } from '../../_lib/auth.js';
async function read(env) { try { return JSON.parse(await env.SITE_DATA.get('config')); } catch { return null; } }
export async function onRequestGet({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  return json({ config: await read(env) });
}
export async function onRequestPut({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  const data = await request.json();
  if (!env.SITE_DATA) return json({ error: 'SITE_DATA is not configured.' }, 503);
  await env.SITE_DATA.put('config', JSON.stringify(data));
  return json({ ok: true, config: data });
}
export async function onRequestDelete({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  await env.SITE_DATA.delete('config');
  return json({ ok: true });
}
