import type { Core } from '@strapi/strapi';

/**
 * Публичные read-права для контента, который читает фронтенд.
 * Заявки и подписчики публично НЕ читаются — фронт пишет их через
 * server-only API routes с токеном.
 */
const PUBLIC_READ: Record<string, string[]> = {
  'api::global.global': ['find'],
  'api::navigation.navigation': ['find'],
  'api::homepage.homepage': ['find'],
  'api::newsletter.newsletter': ['find'],
  'api::application-page.application-page': ['find'],
  'api::contact-page.contact-page': ['find'],
  'api::event.event': ['find', 'findOne'],
  'api::page.page': ['find', 'findOne'],
  'api::form.form': ['find', 'findOne'],
  'api::team-member.team-member': ['find'],
  'api::client-logo.client-logo': ['find'],
  'api::article.article': ['find', 'findOne'],
  'api::blog-page.blog-page': ['find'],
  'api::events-page.events-page': ['find'],
  'api::cookie-consent.cookie-consent': ['find'],
  // write-only с фронта (Next API routes валидируют + honeypot); читать их публично нельзя.
  // TODO(deploy): заменить на STRAPI_API_TOKEN и убрать публичный create.
  'api::application.application': ['create'],
  'api::newsletter-subscriber.newsletter-subscriber': ['create'],
};

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });
    if (!publicRole) return;

    for (const [uid, actions] of Object.entries(PUBLIC_READ)) {
      for (const action of actions) {
        const actionId = `${uid}.${action}`;
        const existing = await strapi.db
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action: actionId, role: publicRole.id } });
        if (!existing) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .create({ data: { action: actionId, role: publicRole.id } });
          strapi.log.info(`[bootstrap] public permission granted: ${actionId}`);
        }
      }
    }
  },
};
