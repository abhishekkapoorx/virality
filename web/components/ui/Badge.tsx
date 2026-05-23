"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "neutral" | "accent";
  className?: string;
};

export function Badge({ children, variant = "neutral", className = "" }: Props) {
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold";
  const map: Record<string, string> = {
    neutral: "bg-[var(--color-surface-soft)] text-[var(--color-ink)] border-[1px] border-[var(--color-soft-border)]",
    accent: "bg-[var(--color-accent-1)] text-[var(--color-strong-border)]"
  };
  return <span className={`${base} ${map[variant]} ${className}`}>{children}</span>;
}
