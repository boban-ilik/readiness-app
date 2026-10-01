/**
 * Weekly report reply parsing, shared so it can be unit-tested outside Deno.
 */

// The prompt forbids dashes, but the model still slips them in.
function stripDashes(text: string): string {
  return text
    .replace(/(\d)\s*[—–]\s*(\d)/g, '$1-$2')   // numeric ranges keep a hyphen
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/,\s*,/g, ',');
}

/**
 * The model's reply as { summary, tip }. Tolerates a ```json fence or text
 * around the object (the model added a fence despite being told not to, and
 * users saw the raw JSON). If nothing parses, the text is shown as the
 * summary with any fence removed, never as code.
 */
export function parseReport(raw: string): { summary: string; tip: string } {
  const unfenced = raw.replace(/^\s*```[a-zA-Z]*\s*/, '').replace(/\s*```\s*$/, '').trim();
  const start = unfenced.indexOf('{');
  const end   = unfenced.lastIndexOf('}');
  for (const candidate of [unfenced, start >= 0 && end > start ? unfenced.slice(start, end + 1) : '']) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed?.summary === 'string' && parsed.summary.trim()) {
        return {
          summary: stripDashes(parsed.summary.trim()),
          tip:     typeof parsed.tip === 'string' ? stripDashes(parsed.tip.trim()) : '',
        };
      }
    } catch { /* try the next candidate */ }
  }
  return { summary: stripDashes(unfenced), tip: '' };
}
