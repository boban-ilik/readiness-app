# ai-insight — Edge Function

Secure server-side proxy for Claude API calls. The Anthropic API key **never leaves this function** — it is stored as a Supabase secret and is not present anywhere in the app binary.

## Architecture

```
iOS App  →  Supabase Edge Function  →  Anthropic API
              (holds the secret key)
```

## One-time setup

### 1. Install Supabase CLI (if not already installed)
```bash
brew install supabase/tap/supabase
```

### 2. Link your project
```bash
supabase link --project-ref vgvrmhqkcqdimgwzbbhc
```

### 3. Set your Claude API key as a server secret
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
The key is stored encrypted in Supabase — it never appears in your codebase or app bundle.

### 4. Deploy the function
```bash
supabase functions deploy ai-insight
```

## Rotating the key

If you need to rotate the key (e.g. if it was accidentally exposed):
```bash
# 1. Generate a new key at console.anthropic.com → API Keys
# 2. Set the new key — this takes effect immediately, no re-deploy needed:
supabase secrets set ANTHROPIC_API_KEY=sk-ant-<new-key>
# 3. Delete the old key from console.anthropic.com
```

## Local development

Create `supabase/.env.local` (git-ignored):
```
ANTHROPIC_API_KEY=sk-ant-...
```

Then serve locally:
```bash
supabase start
supabase functions serve ai-insight --env-file supabase/.env.local
```

The app will automatically hit the local function when `EXPO_PUBLIC_SUPABASE_URL`
points to `http://localhost:54321` (the default local Supabase URL).

## Security notes

- The Supabase **anon key** (safe to expose) gates access to the function
- For extra protection, add Supabase Auth so only authenticated Pro users can call it
- The function validates `component` is one of `recovery | sleep | stress` before calling Claude
- All errors return generic messages — no internal details leak to the client
