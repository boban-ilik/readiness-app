-- Record which device produced each HRV reading.
--
-- Apple Watch writes SDNN, Garmin writes RMSSD, and a manual entry is a single
-- typed number. Without a source, a device switch reads as a spurious HRV
-- "change" in History, the weekly report and pattern analysis. Nullable:
-- rows written before this shipped have no source.

ALTER TABLE public.readiness_scores
  ADD COLUMN IF NOT EXISTS hrv_source text;
