"use client";

import React, { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "tertiary" | "neutral";
};

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const base = "inline-flex items-center justify-center font-semibold rounded-[0.55rem] px-4 py-2 transition-all duration-200 ease-out";
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)] hover:shadow-md",
    secondary:
      "bg-[var(--color-dark-surface)] text-[var(--color-dark-text-on-surface)] border-[1px] border-[var(--color-strong-border)] hover:bg-[color-mix(in_srgb,var(--color-dark-surface)_92%,white)] hover:opacity-95",
    ghost:
      "bg-[var(--color-surface-soft)] text-[var(--color-ink)] border-[1px] border-[var(--color-soft-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-strong-border)]",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
    outline:
      "bg-transparent text-[var(--color-ink)] border-[1px] border-[var(--color-soft-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-strong-border)]",
    tertiary: "bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] hover:shadow-sm",
    neutral: "bg-stone-900 text-stone-50 shadow-sm hover:bg-stone-800 hover:shadow-md"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
