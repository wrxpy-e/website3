import { json } from '../_lib/auth.js';
async function read(env, key, fallback) {
  if (!env.SITE_DATA) return fallback;
  try { return JSON.parse(await env.SITE_DATA.get(key)) ?? fallback; } catch { return fallback; }
}
export async function onRequestGet({ env }) {
  const [config, showcase, music] = await Promise.all([
    read(env, 'config', null),
    read(env, 'showcase', null),
    read(env, 'music', null)
  ]);
  return json({ config, showcase, music }, 200, { 'Cache-Control': 'no-store' });
}
