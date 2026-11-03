/**
 * CORS headers shared by the edge functions.
 *
 * The app sends Authorization, apikey and Content-Type on every call; all
 * endpoints are POST plus the OPTIONS preflight, so one allow-list covers them.
 */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  // GET covers the Garmin read endpoints; every other function is POST-only.
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
