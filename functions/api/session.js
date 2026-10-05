import { getSession, json } from '../_lib/auth.js';
export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  return json({ authenticated: !!session && session.sub === String(env.OWNER_DISCORD_ID || ''), user: session ? { id: session.sub, username: session.username, avatar: session.avatar } : null });
}
