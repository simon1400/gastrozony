/** Strukturovaná data schema.org. `<` je escapované, aby text z CMS nemohl ukončit <script>. */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
);
