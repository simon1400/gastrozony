'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from './Button';

export type NewsletterTexts = {
  title: string;
  text: string;
  emailLabel: string;
  placeholder: string;
  buttonLabel: string;
  consentText: string;
  successText: string;
  errorText: string;
};

const schema = z.object({
  email: z.string().trim().email('Zadejte platný e-mail'),
  consent: z.boolean().refine((v) => v, 'Potvrďte prosím souhlas'),
  website: z.string().max(0).optional(), // honeypot
});

type FormValues = z.infer<typeof schema>;

/** Белая карта 680×243 из макета: паддинг 38/40/38/30, input 460×66 r4, кнопка 142×66, чекбокс 26. */
const CARD = 'bg-white px-5 py-7 sm:pb-[38px] sm:pl-[30px] sm:pr-[40px] sm:pt-[38px]';

export const NewsletterForm = ({ texts }: { texts: NewsletterTexts }) => {
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', consent: false, website: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setState('idle');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, consent: true, website: values.website }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className={`${CARD} flex min-h-[243px] w-full max-w-[680px] items-center`} role="status">
        <p className="text-[20px] font-extrabold leading-[26px]">{texts.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={`${CARD} w-full max-w-[680px]`}>
      <label htmlFor="newsletter-email" className="block text-[20px] font-extrabold leading-[26px]">
        {texts.emailLabel}
      </label>
      <div className="mt-[19px] flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder={texts.placeholder}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
          className="h-[66px] w-full min-w-0 rounded border-[1.5px] border-grey-line/35 pl-[27px] pr-4 text-[20px] outline-none transition-colors placeholder:text-ink/60 focus:border-ink sm:flex-1"
          {...register('email')}
        />
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {texts.buttonLabel}
        </Button>
      </div>
      {errors.email && (
        <p id="newsletter-email-error" className="mt-2 text-[14px] font-extrabold text-red-700">
          {errors.email.message}
        </p>
      )}

      {/* honeypot — скрыт от людей, боты его заполняют */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register('website')} />

      <label className="mt-[30px] flex cursor-pointer items-center gap-[13px] text-[14px] leading-[20px]">
        <input type="checkbox" className="gz-checkbox" {...register('consent')} />
        <span>{texts.consentText}</span>
      </label>
      {errors.consent && <p className="mt-1 text-[14px] font-extrabold text-red-700">{errors.consent.message}</p>}

      {state === 'error' && (
        <p className="mt-4 text-[14px] font-extrabold text-red-700" role="alert">
          {texts.errorText}
        </p>
      )}
    </form>
  );
};
