// Railway Infrastructure as Code. Replaces the deprecated railway.toml
// (Config as Code stops being read on 2026-12-01).
// Docs: https://docs.railway.com/infrastructure-as-code
//
// Nothing reads this file at deploy time; changes take effect only through
// `railway config plan` / `railway config apply`.
//
// Edge rules (scanner blocking) are not expressible here as of railway@3.16.0;
// they live in the dashboard. See docs/railway-edge-rules.md.

import { defineRailway, github, preserve, redis, service } from 'railway/iac'

// Values below were checked against live config (project "A220 Stuff",
// production) on 2026-11-03 via the Railway API.
const PROJECT_NAME = 'A220 Stuff'
const SERVICE_NAME = 'A220Tools'
const REDIS_NAME = 'Redis'
const DEPLOY_BRANCH = 'master'

export default defineRailway((_ctx, project) => {
  // Live Redis (image redis:8.2.9, custom start command, volume
  // redis-volume-qp49 at /data) is referenced by name only. Verified on
  // 2026-11-09 with CLI 5.71.0 / railway@3.16.0: `railway config plan` shows
  // no change to Redis or its volume. Re-check the plan for Redis/volume
  // changes after any CLI or SDK upgrade before applying.
  const cache = redis(REDIS_NAME)

  const web = service(SERVICE_NAME, {
    source: github('TarmacDenter/A220Tools', { branch: DEPLOY_BRANCH }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'npm run build',
      watchPatterns: [
        '/app/**',
        '/server/**',
        '/shared/**',
        '/public/**',
        '**/*.ts',
        '/package.json*',
      ],
    },
    deploy: {
      startCommand: 'node .output/server/index.mjs',
      healthcheckPath: '/',
      healthcheckTimeout: 100,
      // Restart policy is left at Railway's default (ON_FAILURE, 10 retries).
      // Declaring the default here causes a permanent no-op diff in
      // `railway config plan`, because Railway reports default values as unset.
    },
    replicas: { 'us-west2': 1 },
    domains: [
      { domain: '220stuff.app', port: 8080 },
      { domain: 'www.220stuff.app', port: 8080 },
    ],
    env: {
      REDIS_URL: cache.env.REDIS_URL,
      RAILPACK_NODE_VERSION: preserve(),
    },
  })

  return project(PROJECT_NAME, {
    resources: [cache, web],
  })
})
