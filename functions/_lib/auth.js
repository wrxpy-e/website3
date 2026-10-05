const SESSION_COOKIE = 'wrxpy_session';
const STATE_COOKIE = 'wrxpy_oauth_state';

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function b64urlText(text) { return b64url(new TextEncoder().encode(text)); }
function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return new Uint8Array([...bin].map(c => c.charCodeAt(0)));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function signPayload(payload, secret) {
  const body = b64urlText(JSON.stringify(payload));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

async function verifyPayload(token, secret) {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = await hmac(secret, body);
    const actual = fromB64url(sig);
    if (expected.length !== actual.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function clearCookie(name) { return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }

export async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !env.SESSION_SECRET) return null;
  return verifyPayload(token, env.SESSION_SECRET);
}

export async function requireOwner(request, env) {
  const session = await getSession(request, env);
  return session && session.sub === String(env.OWNER_DISCORD_ID || '') ? session : null;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders } });
}

export { SESSION_COOKIE, STATE_COOKIE, signPayload, verifyPayload, getCookie, cookie, clearCookie, b64url };
