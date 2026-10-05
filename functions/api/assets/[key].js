export async function onRequestGet({ params, env }) {
  if (!env.SITE_ASSETS) return new Response('Asset storage is not configured.', { status: 503 });
  const obj = await env.SITE_ASSETS.get(params.key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
