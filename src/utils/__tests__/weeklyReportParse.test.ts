import { parseReport } from '../../../supabase/functions/_shared/report';

describe('weekly report parsing', () => {
  it('reads a reply wrapped in a ```json fence (the bug users saw) and removes dashes', () => {
    const raw = '```json\n{\n  "summary": "You\'re trending in the right direction this week—your overall readiness climbed from 75 to 81.",\n  "tip": "Stress stayed in the 64–75 range, so a small practice—5 minutes of breathing—could help."\n}\n```';
    const r = parseReport(raw);
    expect(r.summary).toBe("You're trending in the right direction this week, your overall readiness climbed from 75 to 81.");
    expect(r.tip).toBe('Stress stayed in the 64-75 range, so a small practice, 5 minutes of breathing, could help.');
  });

  it('reads plain JSON and JSON with text around it', () => {
    expect(parseReport('{"summary":"Good week.","tip":"Sleep earlier."}')).toEqual({ summary: 'Good week.', tip: 'Sleep earlier.' });
    expect(parseReport('Here you go: {"summary":"Good week.","tip":""} Hope it helps')).toEqual({ summary: 'Good week.', tip: '' });
  });

  it('never shows a code fence when the reply is not JSON at all', () => {
    const r = parseReport('```\nA steady week overall.\n```');
    expect(r).toEqual({ summary: 'A steady week overall.', tip: '' });
  });
});
