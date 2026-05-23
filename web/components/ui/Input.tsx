"use client";

import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  textarea?: boolean;
};

export function Input({ textarea = false, className = "", ...rest }: Props) {
  const base =
    "w-full mt-2 rounded-md border p-3 text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20";

  if (textarea) {
    return <textarea className={`${base} min-h-[6rem] resize-vertical ${className}`} {...(rest as any)} />;
  }

  return <input className={`${base} ${className}`} {...rest} />;
}
