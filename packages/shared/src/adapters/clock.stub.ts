import type { Clock } from "./clock.js";

/**
 * Stub clock. Default behaviour is the system wall clock; pass a frozen
 * `Date` to lock time inside tests for stable audit assertions.
 */
export class ClockStub implements Clock {
  constructor(private readonly fixed?: Date) {}

  now(): Date {
    return this.fixed ? new Date(this.fixed.getTime()) : new Date();
  }

  isoNow(): string {
    return this.now().toISOString();
  }
}
