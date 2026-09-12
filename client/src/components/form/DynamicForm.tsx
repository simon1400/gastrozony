'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { Button } from '@/components/Button';
import {
  acceptedTypes,
  buildFormSchema,
  CONSENT_KEY,
  defaultValues,
  EVENT_KEY,
  FORM_MESSAGES,
  HONEYPOT_KEY,
  itemValue,
  toFormData,
  type FormDefinition,
  type FormField,
  type FormValues,
  type TextInputType,
} from '@/lib/form-schema';
import {
  CheckboxInput,
  ChoiceGroup,
  describedBy,
  FieldShell,
  fieldId,
  GroupShell,
  INPUT_CLASS,
  SELECT_CLASS,
  TEXTAREA_CLASS,
  UploadInput,
} from './FormFields';

/**
 * Dynamický formulář: pole z adminu Strapi (`form.fields`), validace zod-schématem generovaným z polí
 * (totéž schéma kontroluje /api/application), react-hook-form. Po odeslání success bez reloadu.
 */

export type EventOption = { slug: string; label: string };

export type DynamicFormTexts = {
  eventSelectLabel: string;
  eventPlaceholder: string;
  uploadLabel: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  errorText: string;
  rateLimitText: string;
};

type Props = {
  form: FormDefinition;
  events: EventOption[];
  initialEvent?: string;
  texts: DynamicFormTexts;
  /** Popisky checkboxů (souhlas, form.checkbox) vykreslené na serveru z markdownu — kvůli odkazům. */
  richLabels: Record<string, ReactNode>;
};

const CARD = 'bg-white px-5 py-8 sm:p-10 xl:px-[60px] xl:py-[56px]';

const AUTOCOMPLETE: Record<string, string> = {
  name: 'name',
  company: 'organization',
  email: 'email',
  phone: 'tel',
  web: 'url',
};

/** `number` záměrně jako text + inputMode — nativní number input mění hodnotu kolečkem myši. */
const INPUT_TYPES: Partial<Record<TextInputType, string>> = { email: 'email', tel: 'tel', url: 'url' };

const serverErrors = (body: unknown): Record<string, string> | null => {
  if (typeof body !== 'object' || body === null || !('errors' in body)) return null;
  const { errors } = body;
  if (typeof errors !== 'object' || errors === null) return null;
  return Object.fromEntries(Object.entries(errors).filter((e): e is [string, string] => typeof e[1] === 'string'));
};

export const DynamicForm = ({ form, events, initialEvent = '', texts, richLabels }: Props) => {
  const schema = useMemo(() => buildFormSchema(form, events.map((e) => e.slug)), [form, events]);
  const [state, setState] = useState<'idle' | 'success' | 'error' | 'rate-limit'>('idle');
  const successRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // schéma je dynamické (Record<string, unknown>) — tvar hodnot drží `defaultValues`
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaultValues(form, initialEvent),
  });

  useEffect(() => {
    if (state !== 'success') return;
    successRef.current?.focus();
    successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state]);

  const errorOf = (name: string) => {
    const message = errors[name]?.message;
    return typeof message === 'string' ? message : undefined;
  };

  const onSubmit = async (values: FormValues) => {
    setState('idle');
    try {
      const honeypot = getValues(HONEYPOT_KEY);
      const res = await fetch('/api/application', {
        method: 'POST',
        body: toFormData(values, typeof honeypot === 'string' ? honeypot : ''),
      });
      if (res.ok) return setState('success');
      if (res.status === 429) return setState('rate-limit');

      const fieldErrors = res.status === 422 ? serverErrors(await res.json().catch(() => null)) : null;
      const entries = Object.entries(fieldErrors ?? {});
      if (entries.length === 0) return setState('error');
      for (const [name, message] of entries) setError(name, { type: 'server', message });
      setFocus(entries[0][0]);
    } catch {
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className={`${CARD} outline-none`}>
        <h2 className="text-h2-sm">{texts.successTitle}</h2>
        <p className="mt-6 max-w-[680px] text-lead">{texts.successText}</p>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const id = fieldId(field.name);
    const error = errorOf(field.name);
    const described = describedBy(id, field.helperText, error);
    const common = { id, label: field.label, required: field.required, helperText: field.helperText, error };

    switch (field.__component) {
      case 'form.text-field': {
        const half = field.width === 'half';
        const aria = {
          'aria-invalid': Boolean(error) || undefined,
          'aria-required': field.required || undefined,
          'aria-describedby': described,
        };
        return (
          <FieldShell {...common} className={half ? '' : 'sm:col-span-2'}>
            {field.inputType === 'textarea' ? (
              <textarea id={id} placeholder={field.placeholder ?? undefined} className={TEXTAREA_CLASS} {...aria} {...register(field.name)} />
            ) : (
              <input
                id={id}
                type={INPUT_TYPES[field.inputType ?? 'text'] ?? 'text'}
                inputMode={field.inputType === 'number' ? 'decimal' : undefined}
                autoComplete={AUTOCOMPLETE[field.name]}
                placeholder={field.placeholder ?? undefined}
                className={INPUT_CLASS}
                {...aria}
                {...register(field.name)}
              />
            )}
          </FieldShell>
        );
      }

      case 'form.select':
        if (!field.multiple) {
          return (
            <FieldShell {...common} className={field.width === 'half' ? '' : 'sm:col-span-2'}>
              <select
                id={id}
                className={SELECT_CLASS}
                aria-invalid={Boolean(error) || undefined}
                aria-required={field.required || undefined}
                aria-describedby={described}
                {...register(field.name)}
              >
                <option value="">{field.placeholder || FORM_MESSAGES.selectPlaceholder}</option>
                {field.items.map((item) => (
                  <option key={item.id} value={itemValue(item)} disabled={Boolean(item.disabled)}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          );
        }
      // multiple → štítky jako u radia
      // falls through
      case 'form.radio': {
        const multiple = field.__component === 'form.select';
        return (
          <GroupShell {...common} className="sm:col-span-2">
            <Controller
              control={control}
              name={field.name}
              render={({ field: f }) => (
                <ChoiceGroup
                  name={field.name}
                  items={field.items}
                  multiple={multiple}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  invalid={Boolean(error)}
                  required={field.required}
                  inputRef={f.ref}
                />
              )}
            />
          </GroupShell>
        );
      }

      case 'form.checkbox':
        return (
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name={field.name}
              render={({ field: f }) => (
                <CheckboxInput
                  id={id}
                  label={richLabels[field.name] ?? field.label}
                  checked={f.value === true}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  invalid={Boolean(error)}
                  required={field.required}
                  describedBy={describedBy(id, null, error)}
                  inputRef={f.ref}
                />
              )}
            />
            {error && (
              <p id={`${id}-error`} className="mt-2 text-[14px] font-extrabold leading-[20px] text-red-700">
                {error}
              </p>
            )}
          </div>
        );

      case 'form.upload':
        return (
          <GroupShell {...common} className="sm:col-span-2">
            <Controller
              control={control}
              name={field.name}
              render={({ field: f }) => (
                <UploadInput
                  id={id}
                  accept={acceptedTypes(field).join(',')}
                  multiple={Boolean(field.multiple)}
                  files={Array.isArray(f.value) ? f.value.filter((v): v is File => v instanceof File) : []}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  buttonLabel={texts.uploadLabel}
                  describedBy={described}
                  buttonRef={f.ref}
                />
              )}
            />
          </GroupShell>
        );
    }
  };

  const eventId = fieldId(EVENT_KEY);
  const eventError = errorOf(EVENT_KEY);
  const consentId = fieldId(CONSENT_KEY);
  const consentError = errorOf(CONSENT_KEY);
  const { consent } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={CARD} aria-busy={isSubmitting}>
      <div className="grid gap-x-[30px] gap-y-8 sm:grid-cols-2">
        {events.length > 0 && (
          <FieldShell
            id={eventId}
            label={texts.eventSelectLabel}
            required={form.requiresEvent}
            error={eventError}
            className="sm:col-span-2"
          >
            <select
              id={eventId}
              className={SELECT_CLASS}
              aria-invalid={Boolean(eventError) || undefined}
              aria-required={form.requiresEvent || undefined}
              aria-describedby={describedBy(eventId, null, eventError)}
              {...register(EVENT_KEY)}
            >
              <option value="">{texts.eventPlaceholder}</option>
              {events.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.label}
                </option>
              ))}
            </select>
          </FieldShell>
        )}

        {form.fields.map((field) => (
          <Fragment key={`${field.__component}-${field.id}`}>{renderField(field)}</Fragment>
        ))}
      </div>

      {/* honeypot — skrytý před lidmi i čtečkami, boti ho vyplní */}
      <div aria-hidden className="hidden">
        <label htmlFor={fieldId(HONEYPOT_KEY)}>Web</label>
        <input id={fieldId(HONEYPOT_KEY)} type="text" tabIndex={-1} autoComplete="off" {...register(HONEYPOT_KEY)} />
      </div>

      {consent && (
        <div className="mt-10 border-t border-grey-muted pt-8">
          <Controller
            control={control}
            name={CONSENT_KEY}
            render={({ field: f }) => (
              <CheckboxInput
                id={consentId}
                label={richLabels[CONSENT_KEY] ?? consent.label}
                checked={f.value === true}
                onChange={f.onChange}
                onBlur={f.onBlur}
                invalid={Boolean(consentError)}
                required={consent.required}
                describedBy={describedBy(consentId, null, consentError)}
                inputRef={f.ref}
              />
            )}
          />
          {consentError && (
            <p id={`${consentId}-error`} className="mt-2 text-[14px] font-extrabold leading-[20px] text-red-700">
              {consentError}
            </p>
          )}
        </div>
      )}

      <div className="mt-10 flex flex-col items-start gap-5">
        <Button type="submit" disabled={isSubmitting}>
          {texts.submitLabel}
        </Button>
        {(state === 'error' || state === 'rate-limit') && (
          <p role="alert" className="text-[16px] font-extrabold leading-[24px] text-red-700">
            {state === 'rate-limit' ? texts.rateLimitText : texts.errorText}
          </p>
        )}
      </div>
    </form>
  );
};
