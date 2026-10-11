// pm2 process definitions for Goodsly.
// Ports remapped to avoid the existing nitm services (3000/3001/5432).
// All bound to 127.0.0.1 — public exposure is handled by Traefik later.
module.exports = {
  apps: [
    {
      name: 'goodsly-backend',
      cwd: '/root/Goodsly/apps/backend/dist',
      script: 'pnpm',
      args: 'exec medusa start',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'goodsly-storefront',
      cwd: '/root/Goodsly/apps/storefront',
      script: 'pnpm',
      args: 'exec next start -p 3100 -H 127.0.0.1',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'goodsly-admin',
      cwd: '/root/Goodsly/apps/admin',
      script: 'pnpm',
      args: 'exec next start -p 3101 -H 127.0.0.1',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
    },
  ],
}
