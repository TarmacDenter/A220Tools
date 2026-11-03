// Railway Infrastructure as Code. Replaces the deprecated railway.toml
// (Config as Code stops being read on 2026-12-01).
// Docs: https://docs.railway.com/infrastructure-as-code
//
// Nothing reads this file at deploy time; changes take effect only through
// `railway config plan` / `railway config apply`.
//
// Edge rules (scanner blocking) are not expressible here as of railway@3.16.0;
// they live in the dashboard. See docs/railway-edge-rules.json.

import { defineRailway, github, redis, service } from 'railway/iac'

// TODO(before first apply): replace with the exact names shown in the Railway
// dashboard. A mismatched name makes `plan` propose creating a new resource.
const PROJECT_NAME = 'a220tools'
const SERVICE_NAME = 'a220tools'
const REDIS_NAME = 'Redis'
const CUSTOM_DOMAIN = 'TODO.example.com'
const DEPLOY_BRANCH = 'master'

export default defineRailway((_ctx, project) => {
  const cache = redis(REDIS_NAME)

  const web = service(SERVICE_NAME, {
    source: github('tarmacdenter/a220tools', { branch: DEPLOY_BRANCH }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'npm run build',
    },
    deploy: {
      startCommand: 'node .output/server/index.mjs',
      numReplicas: 1,
      healthcheckPath: '/',
      healthcheckTimeout: 100,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
    },
    domains: [CUSTOM_DOMAIN],
    env: {
      REDIS_URL: cache.env.REDIS_URL,
      NUXT_PUBLIC_APP_BASE_URL: { preserveExisting: true, isOptional: true },
    },
  })

  return project(PROJECT_NAME, {
    resources: [cache, web],
  })
})
