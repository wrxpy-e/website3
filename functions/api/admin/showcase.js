import { requireOwner, json } from '../../_lib/auth.js';
async function read(env) { try { return JSON.parse(await env.SITE_DATA.get('showcase')) || []; } catch { return []; } }
async function write(env, items) { await env.SITE_DATA.put('showcase', JSON.stringify(items)); return items; }
export async function onRequestGet({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  return json({ items: await read(env) });
}
export async function onRequestPost({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  const item = await request.json();
  if (!item.title || !item.img) return json({ error: 'Title and image are required.' }, 400);
  const items = await read(env);
  const next = { id: crypto.randomUUID(), title: String(item.title).slice(0, 160), cat: String(item.cat || 'Graphics'), img: String(item.img), hidden: !!item.hidden, order: Number(item.order) || Date.now() };
  items.push(next);
  await write(env, items);
  return json({ item: next });
}
export async function onRequestPut({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  const patch = await request.json();
  const items = await read(env);
  const idx = items.findIndex(x => x.id === patch.id);
  if (idx < 0) return json({ error: 'Not found' }, 404);
  items[idx] = { ...items[idx], ...patch, id: items[idx].id };
  await write(env, items);
  return json({ item: items[idx] });
}
export async function onRequestDelete({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  const id = new URL(request.url).searchParams.get('id');
  const items = await read(env);
  await write(env, items.filter(x => x.id !== id));
  return json({ ok: true });
}
