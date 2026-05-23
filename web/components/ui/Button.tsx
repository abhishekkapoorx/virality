"use client";

import React, { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const base = "inline-flex items-center justify-center font-semibold rounded-[0.55rem] px-4 py-2 transition-shadow";
  const variants: Record<string, string> = {
    primary: "bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm hover:shadow-md",
    secondary: "bg-[var(--color-dark-surface)] text-[var(--color-dark-text-on-surface)] border-[1px] border-[var(--color-strong-border)] hover:opacity-95",
    ghost: "bg-transparent text-[var(--color-primary)]"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
