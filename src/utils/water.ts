/**
 * Water logging: units and formatting (pure).
 *
 * Everything is stored and sent in litres, which is what Apple Health's
 * Water type uses; fl oz is a display setting only.
 */

export type WaterUnit = 'l' | 'floz';

export const ML_PER_FL_OZ = 29.5735;

/** What one tap adds: a 0.5 l bottle, or a 16 fl oz US bottle. */
export const TAP_LITRES: Record<WaterUnit, number> = {
  l:    0.5,
  floz: (16 * ML_PER_FL_OZ) / 1000,
};

export const DEFAULT_TARGET_LITRES = 2.5;

/** Target stepper: 0.25 l, or 8 fl oz, per step. */
export const TARGET_STEP_LITRES: Record<WaterUnit, number> = {
  l:    0.25,
  floz: (8 * ML_PER_FL_OZ) / 1000,
};
export const TARGET_MIN_LITRES = 0.5;
export const TARGET_MAX_LITRES = 6;

export function litresToFlOz(litres: number): number {
  return (litres * 1000) / ML_PER_FL_OZ;
}

/** "1.5 l" / "48 fl oz". Litres to one decimal, trailing .0 dropped. */
export function formatWater(litres: number, unit: WaterUnit): string {
  if (unit === 'floz') return `${Math.round(litresToFlOz(litres))} fl oz`;
  const v = Math.round(litres * 10) / 10;
  return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)} l`;
}

/** Share of the target, 0 to 1, for the progress bar. */
export function waterProgress(litres: number, targetLitres: number): number {
  if (!(targetLitres > 0)) return 0;
  return Math.max(0, Math.min(1, litres / targetLitres));
}

export function clampTarget(litres: number): number {
  return Math.max(TARGET_MIN_LITRES, Math.min(TARGET_MAX_LITRES, Math.round(litres * 1000) / 1000));
}
