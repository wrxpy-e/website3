import { clearCookie, SESSION_COOKIE } from '../_lib/auth.js';
export function onRequestGet() { return new Response(null, { status: 302, headers: { Location: '/admin.html', 'Set-Cookie': clearCookie(SESSION_COOKIE) } }); }
export function onRequestPost() { return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie(SESSION_COOKIE) } }); }
