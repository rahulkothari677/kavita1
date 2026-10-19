"use client";

import { cloneElement, isValidElement, useId } from "react";
import { Switch } from "../ui";

/** Label above, control, optional helper below — wires htmlFor / aria-describedby. */
export function Field({ label, helper, children, className = "" }: { label: string; helper?: React.ReactNode; children: React.ReactElement<{ id?: string; "aria-describedby"?: string }>; className?: string }) {
  const id = useId();
  const helpId = helper ? `${id}-help` : undefined;
  const control = isValidElement(children) ? cloneElement(children, { id, "aria-describedby": helpId }) : children;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {control}
      {helper && (
        <p id={helpId} className="helper">
          {helper}
        </p>
      )}
    </div>
  );
}

/** A setting with a title, helper text and a switch on the right. */
export function SwitchRow({ title, text, checked, onChange, className = "" }: { title: string; text?: string; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-[6px] border border-admin-line bg-admin-inset px-4 py-3 ${className}`}>
      <div className="min-w-0">
        <p className="text-[15px] leading-6 font-semibold md:text-[14px] md:leading-5">{title}</p>
        {text && <p className="text-[14px] leading-5 text-muted md:text-[13px]">{text}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/** Card title with a leading 16px muted icon. */
export function CardTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
      {children}
    </span>
  );
}

/** Annotated settings section: title + description on the left (desktop), white card on the right. */
export function Section({ title, text, icon, children, id }: { title: string; text?: string; icon?: React.ReactNode; children: React.ReactNode; id?: string }) {
  const hid = useId();
  return (
    <section id={id} aria-labelledby={hid} className="grid gap-3 border-t border-admin-line pt-6 first:border-0 first:pt-0 lg:grid-cols-[240px_1fr] lg:gap-8">
      <div>
        <h2 id={hid} className="flex items-center gap-2 text-[16px] font-semibold md:text-[14px]">
          {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
          {title}
        </h2>
        {text && <p className="mt-1 text-[14px] leading-5 text-muted md:text-[13px]">{text}</p>}
      </div>
      <div className="min-w-0 rounded-[8px] border border-admin-line bg-white p-4 md:p-5">{children}</div>
    </section>
  );
}

/** Error state for a page whose data failed to load. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-[8px] border border-admin-line bg-white p-6 text-center">
      <p className="font-display text-[22px] font-[380] tracking-[-0.01em]">Something didn’t load</p>
      <p className="mt-1 text-[14px] text-muted">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex h-11 items-center rounded-[6px] bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink-soft md:h-9">
        Try again
      </button>
    </div>
  );
}
