import { requireOwner, json } from '../../_lib/auth.js';

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;
const allowed = new Set(['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm']);

export async function onRequestPost({ request, env }) {
  if (!await requireOwner(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.SITE_ASSETS) return json({ error: 'SITE_ASSETS is not configured.' }, 503);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'No file supplied.' }, 400);
  if (!allowed.has(file.type)) return json({ error: 'Unsupported file type.' }, 400);
  const isAudio = file.type.startsWith('audio/');
  const limit = isAudio ? MAX_AUDIO : MAX_IMAGE;
  if (file.size > limit) return json({ error: `File is too large. Maximum is ${Math.round(limit / 1024 / 1024)} MB.` }, 400);
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.SITE_ASSETS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ src: `/api/assets/${key}`, key, type: file.type, size: file.size });
}
