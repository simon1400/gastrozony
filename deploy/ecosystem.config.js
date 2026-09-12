/**
 * pm2 pro server dimi-strapi-server (157.90.169.205), stejný vzor jako ostatní aplikace v /opt.
 * Spuštění: pm2 start /opt/gastrozony/deploy/ecosystem.config.js --only gastrozony-client
 * Porty: client 3012, Strapi 1343 (ověřeno jako volné 12. 9. 2026 — 3011 zabral tulsio).
 */
module.exports = {
  apps: [
    {
      name: 'gastrozony-client',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/opt/gastrozony/client',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3012,
      },
      error_file: '/var/log/pm2/gastrozony-client-error.log',
      out_file: '/var/log/pm2/gastrozony-client-out.log',
      time: true,
      merge_logs: true,
    },
    {
      name: 'gastrozony-strapi',
      script: 'node_modules/@strapi/strapi/bin/strapi.js',
      args: 'start',
      cwd: '/opt/gastrozony/strapi',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 1343,
      },
      error_file: '/var/log/pm2/gastrozony-strapi-error.log',
      out_file: '/var/log/pm2/gastrozony-strapi-out.log',
      time: true,
      merge_logs: true,
    },
  ],
};
