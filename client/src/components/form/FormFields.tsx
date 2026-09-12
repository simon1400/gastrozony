'use client';

import { useRef, useState, type ReactNode, type Ref } from 'react';
import { Button } from '@/components/Button';
import { FORM_MESSAGES, itemValue, type FieldValue, type SelectItem } from '@/lib/form-schema';

/**
 * Prezentační části dynamického formuláře ve stylu webu:
 * input 66 px, r 4, rámeček 1.5 px #707070/35 (jako newsletter), volby jako štítky «Stavíme pro», upload s drag & drop.
 */

export const INPUT_CLASS =
  'mt-3 block h-[66px] w-full min-w-0 rounded border-[1.5px] border-grey-line/35 bg-white px-[22px] text-[18px] ' +
  'outline-none transition-colors placeholder:text-ink/50 focus:border-ink aria-[invalid=true]:border-red-700';

export const TEXTAREA_CLASS = `${INPUT_CLASS} h-auto min-h-[180px] resize-y py-[18px] leading-[28px]`;

/** Nativní select s vlastní šipkou — sama šipka je v .gz-select (globals.css). */
export const SELECT_CLASS = `${INPUT_CLASS} gz-select cursor-pointer appearance-none pr-14`;

const LABEL_CLASS = 'block text-[18px] font-extrabold leading-[24px]';

const CHIP_CLASS =
  'inline-flex min-h-[66px] cursor-pointer items-center border-[1.5px] border-grey-line/35 bg-white px-[24px] py-3 ' +
  'text-[17px] font-extrabold leading-[22px] transition-colors hover:border-ink ' +
  'peer-checked:border-yellow peer-checked:bg-yellow peer-checked:shadow-btn ' +
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ' +
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-40';

export const fieldId = (name: string) => `f-${name}`;

/** `aria-describedby` na nápovědu a chybu pole. */
export const describedBy = (id: string, helperText?: string | null, error?: string) =>
  [helperText ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

const RequiredMark = () => (
  <span aria-hidden className="text-grey-line">
    {' *'}
  </span>
);

const Hints = ({ id, helperText, error }: { id: string; helperText?: string | null; error?: string }) => (
  <>
    {helperText && (
      <p id={`${id}-help`} className="mt-2 text-[14px] leading-[20px] text-ink/70">
        {helperText}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="mt-2 text-[14px] font-extrabold leading-[20px] text-red-700">
        {error}
      </p>
    )}
  </>
);

type ShellProps = {
  id: string;
  label: ReactNode;
  required?: boolean | null;
  helperText?: string | null;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Jedno pole: popisek (label for), vstup, nápověda, chyba. */
export const FieldShell = ({ id, label, required, helperText, error, className = '', children }: ShellProps) => (
  <div className={className}>
    <label htmlFor={id} className={LABEL_CLASS}>
      {label}
      {required && <RequiredMark />}
    </label>
    {children}
    <Hints id={id} helperText={helperText} error={error} />
  </div>
);

/** Skupina voleb / upload: fieldset + legend. */
export const GroupShell = ({ id, label, required, helperText, error, className = '', children }: ShellProps) => (
  <fieldset className={className} aria-describedby={describedBy(id, helperText, error)}>
    <legend className={LABEL_CLASS}>
      {label}
      {required && <RequiredMark />}
    </legend>
    {children}
    <Hints id={id} helperText={helperText} error={error} />
  </fieldset>
);

const asStrings = (value: FieldValue): string[] => {
  const list: unknown[] = Array.isArray(value) ? value : [value];
  return list.filter((v): v is string => typeof v === 'string');
};

type ChoiceGroupProps = {
  name: string;
  items: SelectItem[];
  multiple: boolean;
  value: FieldValue;
  onChange: (value: string | string[]) => void;
  onBlur: () => void;
  invalid: boolean;
  required?: boolean | null;
  inputRef?: Ref<HTMLInputElement>;
};

/** Radio (jedna volba) nebo checkboxy (víc voleb) jako štítky; vybraný = žlutý. */
export const ChoiceGroup = ({ name, items, multiple, value, onChange, onBlur, invalid, required, inputRef }: ChoiceGroupProps) => {
  const selected = asStrings(value);
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {items.map((item, index) => {
        const v = itemValue(item);
        const checked = selected.includes(v);
        return (
          <label key={item.id} className="relative">
            <input
              ref={index === 0 ? inputRef : undefined}
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={v}
              checked={checked}
              disabled={Boolean(item.disabled)}
              onChange={() => onChange(multiple ? (checked ? selected.filter((s) => s !== v) : [...selected, v]) : v)}
              onBlur={onBlur}
              aria-invalid={invalid || undefined}
              aria-required={(!multiple && required) || undefined}
              className="peer sr-only"
            />
            <span className={CHIP_CLASS}>{item.label}</span>
          </label>
        );
      })}
    </div>
  );
};

type CheckboxProps = {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur: () => void;
  invalid: boolean;
  required?: boolean | null;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/** Zaškrtávátko 26×26 z makety (souhlas, form.checkbox). */
export const CheckboxInput = ({ id, label, checked, onChange, onBlur, invalid, required, describedBy, inputRef }: CheckboxProps) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-[13px] text-[15px] leading-[22px]">
    <input
      ref={inputRef}
      id={id}
      type="checkbox"
      className="gz-checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onBlur={onBlur}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
    />
    <span className="pt-0.5">
      {label}
      {required && <RequiredMark />}
    </span>
  </label>
);

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} kB`
    : `${(bytes / 1024 / 1024).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} MB`;

type UploadProps = {
  id: string;
  accept: string;
  multiple: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  onBlur: () => void;
  buttonLabel: string;
  describedBy?: string;
  buttonRef?: Ref<HTMLButtonElement>;
};

/** Výběr souborů tlačítkem nebo přetažením; seznam s možností odebrat. Validace (počet, velikost, typ) je ve schématu. */
export const UploadInput = ({ id, accept, multiple, files, onChange, onBlur, buttonLabel, describedBy, buttonRef }: UploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const add = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next = multiple ? [...files] : [];
    for (const file of Array.from(list)) {
      if (!next.some((f) => f.name === file.name && f.size === file.size)) next.push(file);
    }
    onChange(multiple ? next : next.slice(-1));
  };

  return (
    <div
      className={`mt-3 rounded border-[1.5px] border-dashed p-5 transition-colors sm:p-6 ${
        dragging ? 'border-ink bg-yellow/15' : 'border-grey-line/50 bg-white'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        add(e.dataTransfer.files);
        onBlur();
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
          onBlur();
        }}
      />
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        aria-describedby={describedBy}
        onClick={() => inputRef.current?.click()}
      >
        {buttonLabel}
      </Button>

      {files.length > 0 && (
        <ul className="mt-5 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-4 bg-grey-bg py-2 pl-4 pr-2 text-[16px] leading-[24px]"
            >
              <span className="min-w-0 truncate">
                <span className="font-extrabold">{file.name}</span>
                <span className="text-ink/70"> · {formatSize(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`${FORM_MESSAGES.removeFile}: ${file.name}`}
                className="flex size-10 shrink-0 items-center justify-center text-[24px] leading-none transition-colors hover:bg-yellow focus-visible:outline-2 focus-visible:outline-ink"
              >
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
