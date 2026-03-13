-- ─────────────────────────────────────────────────────────────────────────────
-- Additive patch: ensure all columns required by scoreSync.ts exist.
--
-- The initial migration used CREATE TABLE IF NOT EXISTS.  If the table was
-- already present (e.g. created manually), those new columns were never added.
-- This migration adds them idempotently with ADD COLUMN IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.readiness_scores
  ADD COLUMN IF NOT EXISTS hrv              real,
  ADD COLUMN IF NOT EXISTS rhr              smallint,
  ADD COLUMN IF NOT EXISTS sleep_duration   smallint,
  ADD COLUMN IF NOT EXISTS sleep_efficiency real,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

-- Re-apply the updated_at trigger function in case it was also missing
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create the trigger only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'readiness_scores_updated_at'
  ) THEN
    CREATE TRIGGER readiness_scores_updated_at
      BEFORE UPDATE ON public.readiness_scores
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
