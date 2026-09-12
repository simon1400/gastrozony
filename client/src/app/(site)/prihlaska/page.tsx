import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DynamicForm, type EventOption } from '@/components/form/DynamicForm';
import { GreyClosingSection } from '@/components/GreyClosingSection';
import { PageIntro } from '@/components/PageIntro';
import { RichInline, RichText } from '@/components/RichText';
import { formatEventDate, getOpenEvents, type OpenEvent } from '@/lib/events';
import { CONSENT_KEY } from '@/lib/form-schema';
import { getApplicationPage, getForm } from '@/lib/forms';
import { seoMetadata } from '@/lib/seo';

/**
 * /prihlaska — přihláška prodejce. Pole z adminu (`form` s klíčem `prodejce`), texty z `application-page`.
 * `?akce=slug` předvybere akci (odkaz z detailu akce). Mřížka 427 + 80 + 933 jako sloupce HP.
 */

type Props = { searchParams: Promise<{ akce?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const page = await getApplicationPage();
  return seoMetadata(page.seo, { title: page.title, description: page.perex, path: '/prihlaska' });
}

const eventLabel = (e: OpenEvent) => [e.title, formatEventDate(e.dateFrom, e.dateTo), e.place].filter(Boolean).join(' · ');

export default async function ApplicationFormPage({ searchParams }: Props) {
  const [{ akce }, page, form, events] = await Promise.all([
    searchParams,
    getApplicationPage(),
    getForm('prodejce'),
    getOpenEvents().catch(() => null),
  ]);

  const options: EventOption[] = (events ?? []).map((e) => ({ slug: e.slug, label: eventLabel(e) }));
  const initialEvent = typeof akce === 'string' && options.some((o) => o.slug === akce) ? akce : '';
  const closed = Boolean(form?.requiresEvent) && options.length === 0;

  const richLabels: Record<string, ReactNode> = {};
  if (form?.consent) richLabels[CONSENT_KEY] = <RichInline>{form.consent.label}</RichInline>;
  for (const field of form?.fields ?? []) {
    if (field.__component === 'form.checkbox') richLabels[field.name] = <RichInline>{field.label}</RichInline>;
  }

  return (
    <>
      <PageIntro title={page.title} perex={page.perex} />
      <GreyClosingSection>
        <div className="grid items-start gap-10 xl:grid-cols-[427px_minmax(0,1fr)] xl:gap-20">
          {(page.contentBefore || page.contentAfter) && (
            <div className="space-y-6 xl:sticky xl:top-[142px]" /* sticky pod lepící hlavičkou (102 px) */>
              <RichText>{page.contentBefore}</RichText>
              <RichText>{page.contentAfter}</RichText>
            </div>
          )}

          <div className="xl:col-start-2">
            {form && events && !closed ? (
              <DynamicForm
                form={form}
                events={options}
                initialEvent={initialEvent}
                richLabels={richLabels}
                texts={{
                  eventSelectLabel: page.eventSelectLabel,
                  eventPlaceholder: page.eventPlaceholder,
                  uploadLabel: page.uploadLabel,
                  submitLabel: page.submitLabel,
                  successTitle: page.successTitle,
                  successText: page.successText,
                  errorText: page.errorText,
                  rateLimitText: page.rateLimitText,
                }}
              />
            ) : (
              <div className="bg-white px-5 py-8 sm:p-10 xl:px-[60px] xl:py-[56px]">
                <p className="max-w-[680px] text-lead font-extrabold">{closed ? page.noEventsText : page.errorText}</p>
              </div>
            )}
          </div>
        </div>
      </GreyClosingSection>
    </>
  );
}
