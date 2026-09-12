import { getNotFoundTexts } from '@/lib/global';
import { renderFlecks } from '@/lib/flecks';
import { Button } from './Button';

/** Obsah stránky 404 ve stylu webu: velké žluté „404“, H1 s flekem, text, dvě tlačítka. Texty z `global`. */
export async function NotFoundContent() {
  const texts = await getNotFoundTexts();
  return (
    <div className="container pb-20 pt-12 xl:pb-[140px] xl:pt-[90px]">
      <p aria-hidden className="text-[110px] font-extrabold leading-none text-yellow sm:text-[170px]">
        404
      </p>
      <h1 className="mt-6 max-w-[1000px] text-h1">{renderFlecks(texts.title)}</h1>
      <p className="mt-6 max-w-[680px] text-lead xl:mt-[37px]">{texts.text}</p>
      <div className="mt-10 flex flex-wrap gap-5">
        <Button href="/">{texts.homeLabel}</Button>
        <Button href="/akce" variant="outline">
          {texts.eventsLabel}
        </Button>
      </div>
    </div>
  );
}
