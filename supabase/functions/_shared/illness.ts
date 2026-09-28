/**
 * Back-from-illness context for coach-chat and daily-briefing (1.0.4).
 *
 * The app tracks a Sick episode against the user's pre-illness resting HR and
 * HRV and holds its training advice at Easy Day until every reading is back
 * (src/utils/illnessRecovery.ts, IllnessContext). The client is not trusted:
 * everything is re-validated here before it reaches a prompt.
 */

export interface IllnessInput {
  startDate:        string;
  day:              number;
  state:            'recovering' | 'recovered';
  recoveredDate:    string | null;
  backStreak:       number;
  requiredMornings: number;
  suggestDoctor:    boolean;
  signals: Array<{ label: string; unit: 'bpm' | 'ms'; latest: number | null; usual: number; back: boolean }>;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const int = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null;

export function sanitiseIllness(v: unknown): IllnessInput | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.startDate !== 'string' || !DATE.test(o.startDate)) return null;
  if (o.state !== 'recovering' && o.state !== 'recovered') return null;
  const day = int(o.day, 1, 365);
  if (day == null) return null;

  const signals = (Array.isArray(o.signals) ? o.signals : []).slice(0, 2).flatMap((s: unknown): IllnessInput['signals'] => {
    const x = (s ?? {}) as Record<string, unknown>;
    const unit = x.unit === 'bpm' || x.unit === 'ms' ? x.unit : null;
    const usual = int(x.usual, 1, 300);
    if (!unit || usual == null) return [];
    return [{
      label:  unit === 'bpm' ? 'Resting heart rate' : 'HRV',
      unit,
      latest: int(x.latest, 1, 300),
      usual,
      back:   x.back === true,
    }];
  });

  return {
    startDate:        o.startDate,
    day,
    state:            o.state,
    recoveredDate:    typeof o.recoveredDate === 'string' && DATE.test(o.recoveredDate) ? o.recoveredDate : null,
    backStreak:       int(o.backStreak, 0, 365) ?? 0,
    requiredMornings: int(o.requiredMornings, 1, 7) ?? 2,
    suggestDoctor:    o.suggestDoctor === true,
    signals,
  };
}

/** Prompt lines describing the episode, including the rule the app applies. */
export function illnessLines(ill: IllnessInput): string[] {
  if (ill.state === 'recovered') {
    return [
      `Back from illness: the user tagged Sick on ${ill.startDate}. Their resting heart rate and HRV were back at their pre-illness usual by ${ill.recoveredDate ?? 'recently'}, so the app's training advice follows the score normally again.`,
    ];
  }
  const lines = [`Recovering from illness: the user tagged Sick on ${ill.startDate} (day ${ill.day}).`];
  if (ill.signals.length === 0) {
    lines.push("  There is not enough data from before they got sick to compare with, so the app can't tell when they are back; it holds training at Easy Day until they say they feel better.");
  }
  for (const s of ill.signals) {
    const now = s.latest != null ? `${s.latest} ${s.unit}` : 'no reading yet';
    lines.push(`  ${s.label}: ${now}, pre-illness usual ${s.usual} ${s.unit} (${s.back ? 'back to usual' : 'not back yet'})`);
  }
  if (ill.signals.length > 0) {
    lines.push(`  Mornings with every reading back so far: ${ill.backStreak} of ${ill.requiredMornings} in a row needed.`);
  }
  lines.push("  The app's training recommendation is held at Easy Day (conversational effort) until then, however high today's score is.");
  lines.push('  Resting heart rate and HRV usually return to normal days after symptoms clear, so feeling better is not yet a reason to train hard.');
  if (ill.suggestDoctor) {
    lines.push('  It has been over two weeks. If they still feel unwell, suggest checking in with a doctor.');
  }
  return lines;
}

/** One rule for each system prompt, so both describe it the same way. */
export const ILLNESS_RULE =
  'If the context says the user is recovering from illness, never suggest anything harder than easy, conversational training, even on a high score. Say which readings are still off their pre-illness usual. Do not diagnose or guess what illness it was.';
