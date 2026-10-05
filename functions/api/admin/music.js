import { requireOwner, json } from '../../_lib/auth.js';
export async function onRequestGet({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  let music = null; try { music = JSON.parse(await env.SITE_DATA.get('music')); } catch {}
  return json({ music });
}
export async function onRequestPut({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  const data = await request.json();
  if (!Array.isArray(data.tracks)) return json({ error: 'tracks must be an array.' }, 400);
  await env.SITE_DATA.put('music', JSON.stringify({ tracks: data.tracks }));
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  await env.SITE_DATA.delete('music');
  return json({ ok: true });
}
