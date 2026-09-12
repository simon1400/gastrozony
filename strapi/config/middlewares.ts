import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          // ik.imagekit.io — náhledy v Media Library (ImageKit), eml.imagekit.io — widget knihovny ImageKit
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'ik.imagekit.io'],
          'media-src': ["'self'", 'data:', 'blob:', 'ik.imagekit.io'],
          'frame-src': ["'self'", 'data:', 'blob:', 'eml.imagekit.io'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
