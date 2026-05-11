/**
 * Clock adapter — keeps node code testable by making "now" explicit.
 * Production code injects a system clock; tests inject a frozen one.
 */
export interface Clock {
  now(): Date;
  isoNow(): string;
}
