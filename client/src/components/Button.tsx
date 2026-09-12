import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

/**
 * Кнопка из макета: высота 66, прямые углы, текст 19/24 ExtraBold, паддинг-х 29.
 * primary — жёлтая с тенью 0 3px 6px rgba(0,0,0,.161)
 * outline — белая с рамкой 1px #FFD100
 * dark    — чёрная с жёлтым текстом («Odebírat» в newsletteru)
 */

export type ButtonVariant = 'primary' | 'outline' | 'dark';

const base =
  'inline-flex h-[66px] items-center justify-center px-[27.5px] text-[19px] font-extrabold leading-[24px] ' +
  'whitespace-nowrap transition-[transform,background-color,filter] duration-150 hover:-translate-y-0.5 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-yellow text-ink shadow-btn hover:brightness-105',
  outline: 'border border-yellow bg-white text-ink shadow-btn hover:bg-[#fffbe6]',
  dark: 'bg-ink text-yellow shadow-btn hover:bg-black',
};

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type LinkButtonProps = CommonProps & { href: string; newTab?: boolean };
type NativeButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; ref?: Ref<HTMLButtonElement> };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

export const Button = (props: ButtonProps) => {
  const { variant = 'primary', className = '', children } = props;
  const cls = `${base} ${variants[variant]} ${className}`;

  if ('href' in props && props.href !== undefined) {
    const { href, newTab } = props;
    return (
      <Link href={href} className={cls} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </Link>
    );
  }

  const rest = { ...(props as NativeButtonProps) };
  delete rest.variant;
  delete rest.className;
  delete (rest as Partial<NativeButtonProps>).children;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};
