"use client";

import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  textarea?: boolean;
  label?: React.ReactNode;
  labelClassName?: string;
};

export function Input({ textarea = false, label, labelClassName = "", className = "", ...rest }: Props) {
  const base =
    "w-full mt-2 rounded-md border p-3 text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20";

  const control = textarea ? (
    <textarea className={`${base} min-h-[6rem] resize-vertical ${className}`} {...(rest as any)} />
  ) : (
    <input className={`${base} ${className}`} {...rest} />
  );

  if (label) {
    return (
      <label className={`grid gap-2 text-sm font-semibold ${labelClassName || "text-stone-700"}`}>
        <span>{label}</span>
        {control}
      </label>
    );
  }

  return control;
}
