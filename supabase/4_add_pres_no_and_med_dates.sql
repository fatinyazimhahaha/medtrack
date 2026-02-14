-- ============================================================
-- MIGRATION: Add pres_no and medication date columns
-- Run this if you already have the schema but missing these columns
-- ============================================================

-- Add pres_no to medication_plans (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medication_plans' AND column_name = 'pres_no'
  ) THEN
    ALTER TABLE public.medication_plans ADD COLUMN pres_no TEXT;
  END IF;
END $$;

-- Add start_date to medications (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medications' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.medications ADD COLUMN start_date DATE;
  END IF;
END $$;

-- Add end_date to medications (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medications' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.medications ADD COLUMN end_date DATE;
  END IF;
END $$;
