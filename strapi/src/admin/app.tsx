import type { StrapiApp } from '@strapi/strapi/admin';

/** Klíč, ze kterého si admin panel bere jazyk rozhraní (@strapi/admin). */
const LANGUAGE_STORAGE_KEY = 'strapi-admin-language';

export default {
  config: {
    // čeština; angličtinu Strapi do seznamu přidává vždy, takže se dá přepnout zpět
    // v Profil → Jazyk rozhraní
    locales: ['cs'],
  },

  bootstrap(_app: StrapiApp) {
    // Bez toho by admin naběhl v angličtině: Strapi bere jazyk z localStorage a jinak
    // padá na 'en'. Nastavíme češtinu jen tehdy, když si uživatel jazyk ještě nevybral.
    try {
      if (!window.localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'cs');
      }
    } catch {
      // anonymní okno nebo zablokované storage — rozhraní zůstane v angličtině
    }
  },
};
