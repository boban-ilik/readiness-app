/**
 * Trial window shared by the server entitlement gate and the app.
 *
 * Single source of truth so the server gate and the client's trial countdown
 * cannot drift apart. Pure — no Deno or React imports — so it is importable
 * from the edge functions and unit-testable from jest.
 */

/** Trial length for new accounts, in days. */
export const TRIAL_DAYS = 7;

/** Trial length in milliseconds. */
export const TRIAL_MS = TRIAL_DAYS * 86_400_000;

/** True when `nowMs` is still inside the trial that began at `createdAtMs`. */
export function isInTrial(createdAtMs: number, nowMs: number): boolean {
  return Number.isFinite(createdAtMs) && nowMs < createdAtMs + TRIAL_MS;
}
