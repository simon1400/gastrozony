import type { TeamMember } from '@/lib/pages';
import { mediaUrl } from '@/lib/strapi';
import { CmsImage } from './CmsImage';

/** Tým na /kontakt: bílé karty, fotka v kruhu (bez fotky žlutý kruh s iniciálami), kontakty. */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const linkClass = 'font-extrabold underline decoration-yellow decoration-[3px] underline-offset-4 hover:decoration-ink';

export const TeamList = ({ title, members }: { title: string; members: TeamMember[] }) => (
  <div>
    <h2 className="text-h2-sm">{title}</h2>
    <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:mt-14 xl:grid-cols-3 xl:gap-x-10 min-[1520px]:gap-x-20">
      {members.map((m) => {
        const photo = mediaUrl(m.photo);
        return (
          <li key={m.id} className="flex items-center gap-6 bg-white p-6 text-ink sm:p-8">
            {photo ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-grey-muted">
                <CmsImage src={photo} alt={m.photo?.alternativeText || m.name} fill sizes="96px" className="object-cover" />
              </div>
            ) : (
              <span
                aria-hidden
                className="flex size-24 shrink-0 items-center justify-center rounded-full bg-yellow text-[29px] font-extrabold leading-[33px]"
              >
                {initials(m.name)}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-h4">{m.name}</h3>
              {m.position && <p className="text-[16px] leading-[24px] text-ink/70">{m.position}</p>}
              {(m.email || m.phone) && (
                <ul className="mt-3 space-y-1 text-[16px] leading-[24px]">
                  {m.email && (
                    <li className="truncate">
                      <a href={`mailto:${m.email}`} className={linkClass}>
                        {m.email}
                      </a>
                    </li>
                  )}
                  {m.phone && (
                    <li>
                      <a href={`tel:${m.phone.replace(/\s/g, '')}`} className={linkClass}>
                        {m.phone}
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);
