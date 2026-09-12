import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksAccordion extends Struct.ComponentSchema {
  collectionName: 'components_blocks_accordions';
  info: {
    description: '';
    displayName: 'Akordeon / FAQ';
    icon: 'chevronDown';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.accordion-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksAccordionItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_accordion_items';
  info: {
    description: '';
    displayName: 'Polo\u017Eka akordeonu';
    icon: 'chevronDown';
  };
  attributes: {
    answer: Schema.Attribute.RichText & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlocksCards extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cardss';
  info: {
    description: '';
    displayName: 'Karty 01/02/03';
    icon: 'grid';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<['white', 'grey', 'black']> &
      Schema.Attribute.DefaultTo<'grey'>;
    items: Schema.Attribute.Component<'shared.numbered-card', true>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksCta extends Struct.ComponentSchema {
  collectionName: 'components_blocks_ctas';
  info: {
    description: '';
    displayName: 'CTA blok';
    icon: 'cursor';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<
      ['white', 'grey', 'black', 'yellow']
    > &
      Schema.Attribute.DefaultTo<'yellow'>;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksEvents extends Struct.ComponentSchema {
  collectionName: 'components_blocks_eventss';
  info: {
    description: '';
    displayName: 'V\u00FDpis akc\u00ED';
    icon: 'calendar';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.cta', false>;
    filter: Schema.Attribute.Enumeration<['all', 'upcoming', 'past']> &
      Schema.Attribute.DefaultTo<'upcoming'>;
    limit: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksGallery extends Struct.ComponentSchema {
  collectionName: 'components_blocks_gallerys';
  info: {
    description: '';
    displayName: 'Galerie';
    icon: 'picture';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    images: Schema.Attribute.Media<'images', true> & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface BlocksImageText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_image_texts';
  info: {
    description: '';
    displayName: 'Obr\u00E1zek + text';
    icon: 'layout';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<['white', 'grey', 'black']> &
      Schema.Attribute.DefaultTo<'white'>;
    body: Schema.Attribute.RichText;
    cta: Schema.Attribute.Component<'shared.cta', false>;
    image: Schema.Attribute.Media<'images', true>;
    imagePosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'right'>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksLogos extends Struct.ComponentSchema {
  collectionName: 'components_blocks_logoss';
  info: {
    description: '';
    displayName: 'Logotypy klient\u016F';
    icon: 'briefcase';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.cta', false>;
    logos: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-logo.client-logo'
    >;
    moreLabel: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface BlocksStats extends Struct.ComponentSchema {
  collectionName: 'components_blocks_statss';
  info: {
    description: '';
    displayName: 'Statistiky';
    icon: 'chartBubble';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.stat', true>;
  };
}

export interface BlocksTags extends Struct.ComponentSchema {
  collectionName: 'components_blocks_tagss';
  info: {
    description: '';
    displayName: '\u0160t\u00EDtky';
    icon: 'priceTag';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.tag', true>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Stav\u00EDme pro:'>;
  };
}

export interface BlocksText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_texts';
  info: {
    description: '';
    displayName: 'Text';
    icon: 'alignLeft';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<['white', 'grey', 'black']> &
      Schema.Attribute.DefaultTo<'white'>;
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface FormCheckbox extends Struct.ComponentSchema {
  collectionName: 'components_form_checkboxs';
  info: {
    description: '';
    displayName: 'Za\u0161krt\u00E1v\u00E1tko';
    icon: 'check';
  };
  attributes: {
    errorMessage: Schema.Attribute.String;
    label: Schema.Attribute.Text & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface FormRadio extends Struct.ComponentSchema {
  collectionName: 'components_form_radios';
  info: {
    description: '';
    displayName: 'P\u0159ep\u00EDna\u010De (radio)';
    icon: 'dot-circle';
  };
  attributes: {
    errorMessage: Schema.Attribute.String;
    helperText: Schema.Attribute.String;
    items: Schema.Attribute.Component<'form.select-item', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface FormResultItem extends Struct.ComponentSchema {
  collectionName: 'components_form_result_items';
  info: {
    description: '';
    displayName: 'Polo\u017Eka v\u00FDsledku';
    icon: 'bulletList';
  };
  attributes: {
    key: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String;
    value: Schema.Attribute.Text;
  };
}

export interface FormSelect extends Struct.ComponentSchema {
  collectionName: 'components_form_selects';
  info: {
    description: '';
    displayName: 'V\u00FDb\u011Br (select)';
    icon: 'filter';
  };
  attributes: {
    errorMessage: Schema.Attribute.String;
    helperText: Schema.Attribute.String;
    items: Schema.Attribute.Component<'form.select-item', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    multiple: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    placeholder: Schema.Attribute.String;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    width: Schema.Attribute.Enumeration<['full', 'half']> &
      Schema.Attribute.DefaultTo<'full'>;
  };
}

export interface FormSelectItem extends Struct.ComponentSchema {
  collectionName: 'components_form_select_items';
  info: {
    description: '';
    displayName: 'Polo\u017Eka v\u00FDb\u011Bru';
    icon: 'bulletList';
  };
  attributes: {
    disabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String;
  };
}

export interface FormTextField extends Struct.ComponentSchema {
  collectionName: 'components_form_text_fields';
  info: {
    description: '';
    displayName: 'Textov\u00E9 pole';
    icon: 'write';
  };
  attributes: {
    errorMessage: Schema.Attribute.String;
    helperText: Schema.Attribute.String;
    inputType: Schema.Attribute.Enumeration<
      ['text', 'email', 'tel', 'number', 'url', 'textarea']
    > &
      Schema.Attribute.DefaultTo<'text'>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    placeholder: Schema.Attribute.String;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    width: Schema.Attribute.Enumeration<['full', 'half']> &
      Schema.Attribute.DefaultTo<'full'>;
  };
}

export interface FormUpload extends Struct.ComponentSchema {
  collectionName: 'components_form_uploads';
  info: {
    description: '';
    displayName: 'Nahr\u00E1n\u00ED souboru';
    icon: 'upload';
  };
  attributes: {
    allowedTypes: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'image/*,application/pdf'>;
    errorMessage: Schema.Attribute.String;
    helperText: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    multiple: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface HomeClientsBlock extends Struct.ComponentSchema {
  collectionName: 'components_home_clients_blocks';
  info: {
    description: '';
    displayName: 'Blok klient\u016F';
    icon: 'briefcase';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.cta', false>;
    logos: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-logo.client-logo'
    >;
    moreLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'a dal\u0161\u00ED\u2026'>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface HomeEventsBlock extends Struct.ComponentSchema {
  collectionName: 'components_home_events_blocks';
  info: {
    description: '';
    displayName: 'Blok akc\u00ED';
    icon: 'calendar';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.cta', false>;
    limit: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface HomeHero extends Struct.ComponentSchema {
  collectionName: 'components_home_heros';
  info: {
    description: '';
    displayName: 'Hero';
    icon: 'picture';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    images: Schema.Attribute.Media<'images', true>;
    perex: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeIntro extends Struct.ComponentSchema {
  collectionName: 'components_home_intros';
  info: {
    description: '';
    displayName: 'Intro (2 sloupce)';
    icon: 'layer';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_nav_footer_columns';
  info: {
    description: '';
    displayName: 'Sloupec pati\u010Dky';
    icon: 'layout';
  };
  attributes: {
    links: Schema.Attribute.Component<'nav.nav-link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavNavItem extends Struct.ComponentSchema {
  collectionName: 'components_nav_nav_items';
  info: {
    description: '';
    displayName: 'Polo\u017Eka navigace';
    icon: 'bulletList';
  };
  attributes: {
    children: Schema.Attribute.Component<'nav.nav-link', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface NavNavLink extends Struct.ComponentSchema {
  collectionName: 'components_nav_nav_links';
  info: {
    description: '';
    displayName: 'Odkaz';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_ctas';
  info: {
    description: '';
    displayName: 'CTA tla\u010D\u00EDtko';
    icon: 'cursor';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    newTab: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<['primary', 'outline', 'dark']> &
      Schema.Attribute.DefaultTo<'primary'>;
  };
}

export interface SharedNumberedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_numbered_cards';
  info: {
    description: '';
    displayName: '\u010C\u00EDslovan\u00E1 karta';
    icon: 'grid';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 180;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: '';
    displayName: 'Soci\u00E1ln\u00ED s\u00ED\u0165';
    icon: 'link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'x']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_stats';
  info: {
    description: '';
    displayName: 'Statistika';
    icon: 'chartBubble';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTag extends Struct.ComponentSchema {
  collectionName: 'components_shared_tags';
  info: {
    description: '';
    displayName: '\u0160t\u00EDtek';
    icon: 'priceTag';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.accordion': BlocksAccordion;
      'blocks.accordion-item': BlocksAccordionItem;
      'blocks.cards': BlocksCards;
      'blocks.cta': BlocksCta;
      'blocks.events': BlocksEvents;
      'blocks.gallery': BlocksGallery;
      'blocks.image-text': BlocksImageText;
      'blocks.logos': BlocksLogos;
      'blocks.stats': BlocksStats;
      'blocks.tags': BlocksTags;
      'blocks.text': BlocksText;
      'form.checkbox': FormCheckbox;
      'form.radio': FormRadio;
      'form.result-item': FormResultItem;
      'form.select': FormSelect;
      'form.select-item': FormSelectItem;
      'form.text-field': FormTextField;
      'form.upload': FormUpload;
      'home.clients-block': HomeClientsBlock;
      'home.events-block': HomeEventsBlock;
      'home.hero': HomeHero;
      'home.intro': HomeIntro;
      'nav.footer-column': NavFooterColumn;
      'nav.nav-item': NavNavItem;
      'nav.nav-link': NavNavLink;
      'shared.cta': SharedCta;
      'shared.numbered-card': SharedNumberedCard;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
      'shared.stat': SharedStat;
      'shared.tag': SharedTag;
    }
  }
}
