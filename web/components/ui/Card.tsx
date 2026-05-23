"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: Props) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--color-soft-border)] bg-[var(--color-surface)] p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
