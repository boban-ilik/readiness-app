/**
 * Shared Anthropic Messages API access for the edge functions.
 *
 * Centralises the endpoint, the current model ids and the auth headers, so a
 * model bump or an API-version change is one edit rather than four. Callers
 * own the prompt, the token budget and the response parsing.
 */

export const CLAUDE_HAIKU  = 'claude-haiku-4-5-20251001';
export const CLAUDE_SONNET = 'claude-sonnet-5-5';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/** POST one Messages API body with the caller's already-validated API key. */
export function postClaude(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  return fetch(CLAUDE_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
}
