# Railway edge rules

Railway edge rules block vulnerability-scanner probes (`/wp-admin`, `/.env`, `*.php`, …) before they reach Nuxt, so they are never SSR-rendered or logged.

- Docs: https://docs.railway.com/networking/edge-rules
- Edge rules are **not** part of `.railway/railway.ts` (not supported by the IaC SDK as of `railway@3.16.0`). Configure them in the dashboard: Service → Settings → Edge → Edge rules.
- Requires a public domain and a Railway plan with an edge-rule allowance.
- Rules cover both the custom domain (via Cloudflare) and the generated `*.up.railway.app` domain.

## Rule 1 — Block scanner paths (Block, status 404, empty body)

Path `matches` any of (paths are case-sensitive; add uppercase variants only if logs show them):

| Pattern        | Catches                       |
| -------------- | ----------------------------- |
| `/wp-*`        | WordPress admin/login/content |
| `*.php`        | PHP probes                    |
| `/.env*`       | `.env`, `.env.local`, …       |
| `/.git*`       | `.git/config`, `.gitignore`   |
| `*phpmyadmin*` | phpMyAdmin                    |
| `/cgi-bin/*`   | CGI probes                    |
| `/vendor/*`    | Composer/PHPUnit probes       |

None of these collide with app routes (`/`, `/api/*`, `/_nuxt/*`, `/icons/*`, `/sw.js`, `/manifest.webmanifest`, `/favicon.ico`). Do not add `/.well-known/*`.

## Rule 2 (optional) — Force traffic through Cloudflare (Block, status 403)

Host `is` `<service>.up.railway.app`.

Before enabling, confirm the deploy healthcheck (`/`) still passes; it should not traverse the public edge, but this is unverified.

## Not recommended

WAF Under Attack Mode (https://docs.railway.com/networking/waf) is for floods only: while on, non-navigation requests without browser clearance — including `/api/*` calls — are turned away.

## Verify

```sh
curl -i https://<domain>/wp-login.php   # 404 from edge, no request.started log line
curl -i https://<domain>/.env           # 404
curl -i https://<domain>/               # 200
curl -i https://<domain>/api/metar/KJFK # 200
```
