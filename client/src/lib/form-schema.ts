import { z } from 'zod';

/**
 * Dynamický formulář ze Strapi (collection `form`, dynamic zone `fields`) — typy polí a zod-schéma.
 * Izomorfní: stejné schéma validuje v prohlížeči (react-hook-form) i v /api/application.
 * `File` existuje v obou prostředích (Node ≥ 20), takže přes zod jdou i soubory.
 */

export type TextInputType = 'text' | 'email' | 'tel' | 'number' | 'url' | 'textarea';
export type FieldWidth = 'full' | 'half';

export type SelectItem = { id: number; label: string; value: string | null; disabled: boolean | null };

type FieldBase = {
  id: number;
  name: string;
  label: string;
  helperText?: string | null;
  errorMessage: string | null;
  required: boolean | null;
};

export type TextField = FieldBase & {
  __component: 'form.text-field';
  placeholder: string | null;
  inputType: TextInputType | null;
  width: FieldWidth | null;
};
export type SelectField = FieldBase & {
  __component: 'form.select';
  placeholder: string | null;
  multiple: boolean | null;
  width: FieldWidth | null;
  items: SelectItem[];
};
export type RadioField = FieldBase & { __component: 'form.radio'; items: SelectItem[] };
export type CheckboxField = FieldBase & { __component: 'form.checkbox' };
export type UploadField = FieldBase & { __component: 'form.upload'; multiple: boolean | null; allowedTypes: string | null };

export type FormField = TextField | SelectField | RadioField | CheckboxField | UploadField;

export const FIELD_COMPONENTS: FormField['__component'][] = [
  'form.text-field',
  'form.select',
  'form.radio',
  'form.checkbox',
  'form.upload',
];

export type ConsentField = { name: string; label: string; errorMessage: string | null; required: boolean | null };

export type FormKey = 'prodejce' | 'poradatel';

export type FormDefinition = {
  key: FormKey;
  name: string;
  requiresEvent: boolean;
  fields: FormField[];
  consent: ConsentField | null;
};

export type FieldValue = string | string[] | boolean | File[];
export type FormValues = Record<string, FieldValue>;

/** Systémová pole mimo `fields` — prefix `gz_`, aby nekolidovala s názvy polí z adminu (ty s `gz_` se zahazují). */
export const EVENT_KEY = 'gz_event';
export const CONSENT_KEY = 'gz_consent';
/** Honeypot: lidé ho nevidí, boti ho vyplní. */
export const HONEYPOT_KEY = 'gz_website';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES = 3;

/** Víc než obrázky a PDF nepustíme, ať je u pole v adminu cokoli (server navíc kontroluje obsah souboru). */
const SAFE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'application/pdf',
];

/** Hlášky, když pole v adminu nemá vlastní `errorMessage`, a drobné texty ovládacích prvků. */
export const FORM_MESSAGES = {
  required: 'Toto pole je povinné',
  email: 'Zadejte platný e-mail',
  tel: 'Zadejte platné telefonní číslo',
  url: 'Zadejte platnou adresu webu',
  number: 'Zadejte číslo',
  tooLong: 'Text je příliš dlouhý',
  invalidOption: 'Vyberte jednu z nabízených možností',
  selectPlaceholder: '— vyberte —',
  event: 'Vyberte akci',
  consent: 'Potvrďte prosím souhlas',
  fileType: 'Tento typ souboru nelze nahrát — povolené jsou obrázky (JPG, PNG, WebP) a PDF',
  fileSize: `Soubor je větší než ${MAX_FILE_SIZE / 1024 / 1024} MB`,
  fileCount: `Nahrajte nejvýše ${MAX_FILES} soubory`,
  fileSingle: 'Nahrajte jen jeden soubor',
  removeFile: 'Odebrat soubor',
};

export const itemValue = (item: SelectItem) => item.value || item.label;

/** Pole s kontaktem žadatele: první e-mailové textové pole a pole `name` / `jmeno` (přihláška i tabulka přihlášek). */
export const contactFieldNames = (form: FormDefinition): { email?: string; name?: string } => {
  const textFields = form.fields.filter((f): f is TextField => f.__component === 'form.text-field');
  return {
    email: textFields.find((f) => f.inputType === 'email')?.name,
    name: textFields.find((f) => f.name === 'name' || f.name === 'jmeno')?.name,
  };
};

export const maxFiles = (field: UploadField) => (field.multiple ? MAX_FILES : 1);

/** MIME typy, které pole přijme: `allowedTypes` z adminu (i s maskou `image/*`) ∩ SAFE_TYPES. */
export const acceptedTypes = (field: UploadField): string[] => {
  const patterns = (field.allowedTypes || 'image/*,application/pdf')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return SAFE_TYPES.filter((type) =>
    patterns.some((p) => p === type || (p.endsWith('/*') && type.startsWith(p.slice(0, -1)))),
  );
};

const isFile = (v: unknown): v is File => typeof File !== 'undefined' && v instanceof File;

const FORMATS: Partial<Record<TextInputType, { test: (v: string) => boolean; message: string }>> = {
  email: { test: (v) => z.email().safeParse(v).success, message: FORM_MESSAGES.email },
  tel: { test: (v) => /^\+?[\d\s()/-]+$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 9, message: FORM_MESSAGES.tel },
  url: { test: (v) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v), message: FORM_MESSAGES.url },
  number: { test: (v) => /^-?\d+([.,]\d+)?$/.test(v), message: FORM_MESSAGES.number },
};

const requiredMessage = (field: FieldBase) => field.errorMessage || FORM_MESSAGES.required;

function textSchema(field: TextField) {
  const format = FORMATS[field.inputType ?? 'text'];
  return z
    .string()
    .trim()
    .max(field.inputType === 'textarea' ? 5000 : 500, FORM_MESSAGES.tooLong)
    .refine((v) => !field.required || v !== '', requiredMessage(field))
    .refine((v) => !format || v === '' || format.test(v), field.errorMessage || format?.message || FORM_MESSAGES.required);
}

function choiceSchema(field: SelectField | RadioField, multiple: boolean) {
  const allowed = new Set(field.items.filter((i) => !i.disabled).map(itemValue));
  if (multiple) {
    return z
      .array(z.string())
      .refine((vs) => vs.every((v) => allowed.has(v)), FORM_MESSAGES.invalidOption)
      .refine((vs) => !field.required || vs.length > 0, requiredMessage(field));
  }
  return z
    .string()
    .refine((v) => v === '' || allowed.has(v), FORM_MESSAGES.invalidOption)
    .refine((v) => !field.required || v !== '', requiredMessage(field));
}

function uploadSchema(field: UploadField) {
  const types = acceptedTypes(field);
  const max = maxFiles(field);
  return z
    .array(z.custom<File>(isFile))
    .refine((fs) => !field.required || fs.length > 0, requiredMessage(field))
    .refine((fs) => fs.length <= max, max === 1 ? FORM_MESSAGES.fileSingle : FORM_MESSAGES.fileCount)
    .refine((fs) => fs.every((f) => f.size <= MAX_FILE_SIZE), FORM_MESSAGES.fileSize)
    .refine((fs) => fs.every((f) => types.includes(f.type)), FORM_MESSAGES.fileType);
}

function fieldSchema(field: FormField): z.ZodType {
  switch (field.__component) {
    case 'form.text-field':
      return textSchema(field);
    case 'form.select':
      return choiceSchema(field, Boolean(field.multiple));
    case 'form.radio':
      return choiceSchema(field, false);
    case 'form.checkbox':
      return z.boolean().refine((v) => !field.required || v, requiredMessage(field));
    case 'form.upload':
      return uploadSchema(field);
  }
}

/** Schéma celé přihlášky; `eventSlugs` = akce, na které se dá právě přihlásit. */
export function buildFormSchema(form: FormDefinition, eventSlugs: string[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of form.fields) shape[field.name] = fieldSchema(field);

  shape[EVENT_KEY] = z
    .string()
    .refine((v) => (v === '' ? !form.requiresEvent : eventSlugs.includes(v)), FORM_MESSAGES.event);

  const { consent } = form;
  if (consent) {
    shape[CONSENT_KEY] = z.boolean().refine((v) => !consent.required || v, consent.errorMessage || FORM_MESSAGES.consent);
  }
  return z.object(shape);
}

const emptyValue = (field: FormField): FieldValue => {
  switch (field.__component) {
    case 'form.checkbox':
      return false;
    case 'form.upload':
      return [];
    case 'form.select':
      return field.multiple ? [] : '';
    default:
      return '';
  }
};

export function defaultValues(form: FormDefinition, event = ''): FormValues {
  const values: FormValues = { [EVENT_KEY]: event, [CONSENT_KEY]: false, [HONEYPOT_KEY]: '' };
  for (const field of form.fields) values[field.name] = emptyValue(field);
  return values;
}

/** Prohlížeč → multipart: boolean jako 'true'/'false', pole hodnot a soubory jako opakované klíče. */
export function toFormData(values: FormValues, honeypot: string): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'boolean' || typeof value === 'string') data.append(key, String(value));
    else for (const item of value) data.append(key, item);
  }
  data.set(HONEYPOT_KEY, honeypot);
  return data;
}

/** Multipart → hodnoty pro schéma; tvar podle definice formuláře, ne podle toho, co poslal klient. */
export function valuesFromFormData(form: FormDefinition, data: FormData): Record<string, unknown> {
  const text = (key: string) => {
    const v = data.get(key);
    return typeof v === 'string' ? v : '';
  };
  const values: Record<string, unknown> = { [EVENT_KEY]: text(EVENT_KEY), [CONSENT_KEY]: text(CONSENT_KEY) === 'true' };
  for (const field of form.fields) {
    switch (field.__component) {
      case 'form.checkbox':
        values[field.name] = text(field.name) === 'true';
        break;
      case 'form.upload':
        values[field.name] = data.getAll(field.name).filter((v): v is File => isFile(v) && v.size > 0);
        break;
      case 'form.select':
        values[field.name] = field.multiple
          ? data.getAll(field.name).filter((v): v is string => typeof v === 'string')
          : text(field.name);
        break;
      default:
        values[field.name] = text(field.name);
    }
  }
  return values;
}
