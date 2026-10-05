import { STATE_COOKIE, SESSION_COOKIE, getCookie, cookie, clearCookie, signPayload, b64url, json } from '../_lib/auth.js';

function redirect(url, headers = {}) { return new Response(null, { status: 302, headers: { Location: url, ...headers } }); }

export async function onRequestGet({ request, env }) {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.OWNER_DISCORD_ID || !env.SESSION_SECRET) {
    return json({ error: 'Cloudflare auth is not configured yet.' }, 500);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const stateValue = b64url(bytes);
    const callback = env.DISCORD_REDIRECT_URI || `${url.origin}/auth/discord`;
    const auth = new URL('https://discord.com/oauth2/authorize');
    auth.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
    auth.searchParams.set('redirect_uri', callback);
    auth.searchParams.set('response_type', 'code');
    auth.searchParams.set('scope', 'identify');
    auth.searchParams.set('state', stateValue);
    return redirect(auth.toString(), { 'Set-Cookie': cookie(STATE_COOKIE, stateValue, 600) });
  }

  const savedState = getCookie(request, STATE_COOKIE);
  if (!state || !savedState || state !== savedState) {
    return redirect('/admin.html?error=invalid_state', { 'Set-Cookie': clearCookie(STATE_COOKIE) });
  }

  const callback = env.DISCORD_REDIRECT_URI || `${url.origin}/auth/discord`;
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: callback
  });
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!tokenRes.ok) return redirect('/admin.html?error=discord_token', { 'Set-Cookie': clearCookie(STATE_COOKIE) });
  const token = await tokenRes.json();

  const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!userRes.ok) return redirect('/admin.html?error=discord_user', { 'Set-Cookie': clearCookie(STATE_COOKIE) });
  const user = await userRes.json();

  if (String(user.id) !== String(env.OWNER_DISCORD_ID)) {
    return redirect('/admin.html?error=unauthorized', { 'Set-Cookie': clearCookie(STATE_COOKIE) });
  }

  const payload = {
    sub: String(user.id),
    username: user.global_name || user.username || 'owner',
    avatar: user.avatar || '',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  };
  const session = await signPayload(payload, env.SESSION_SECRET);
  const headers = new Headers({ Location: '/admin.html' });
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, 60 * 60 * 24 * 7));
  headers.append('Set-Cookie', clearCookie(STATE_COOKIE));
  return new Response(null, { status: 302, headers });
}
