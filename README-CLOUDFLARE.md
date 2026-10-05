# wrxpy — Cloudflare + Discord owner verification

This version keeps the existing website design and admin UI, but replaces the old Claude-only data/auth layer with Cloudflare Pages Functions.

## What changed

- Discord OAuth2 owner verification at `/auth/discord`
- Owner is checked by Discord user ID, not username
- Secure `HttpOnly` session cookie signed with `SESSION_SECRET`
- Cloudflare KV stores profile, showcase, and music data
- Cloudflare R2 stores uploaded admin images/audio
- All admin write endpoints verify the Discord session server-side
- Existing public pages still render the same defaults when no Cloudflare data has been saved yet

## Cloudflare resources

Create these two resources in the same Cloudflare account as the Pages project:

1. Workers KV namespace — use binding name `SITE_DATA`
2. R2 bucket — use binding name `SITE_ASSETS`

Bind them to the Pages project under **Settings → Bindings**.

## Cloudflare variables / secrets

Add these under the Pages project's production environment:

### Variables

- `DISCORD_CLIENT_ID` — your Discord application client ID
- `OWNER_DISCORD_ID` — your personal Discord user ID
- `DISCORD_REDIRECT_URI` — `https://YOUR-DOMAIN/auth/discord`

### Secrets

- `DISCORD_CLIENT_SECRET` — Discord OAuth2 client secret
- `SESSION_SECRET` — a long random secret used to sign login sessions

Cloudflare recommends encrypted Secrets for sensitive values. Do not put the Discord client secret in `script.js`, HTML, or any public file.

## Discord Developer Portal

Create/configure a Discord application and add this exact OAuth2 redirect URI:

`https://YOUR-DOMAIN/auth/discord`

The site requests only the `identify` OAuth2 scope.

## Deploying

Pages Functions require a Functions-capable deployment. Cloudflare's current Pages documentation says Direct Upload does not support Functions, so deploy this project through a connected Git provider or Wrangler.

After deployment, visit:

`https://YOUR-DOMAIN/admin.html`

Then click **verify with discord**.

## Important

Do not paste your Discord client secret into chat or into a public file. Put it in Cloudflare as an encrypted secret.
