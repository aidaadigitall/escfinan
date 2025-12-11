-- Migration: add lead_sources table with RLS policies and indexes
-- Created at: 2025-12-11

BEGIN;

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_sources' AND policyname = 'Users can view own lead sources'
  ) THEN
    DROP POLICY "Users can view own lead sources" ON public.lead_sources;
  END IF;
END $$;
CREATE POLICY "Users can view own lead sources"
ON public.lead_sources
FOR SELECT
USING (user_id = auth.uid());

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_sources' AND policyname = 'Users can create own lead sources'
  ) THEN
    DROP POLICY "Users can create own lead sources" ON public.lead_sources;
  END IF;
END $$;
CREATE POLICY "Users can create own lead sources"
ON public.lead_sources
FOR INSERT
WITH CHECK (user_id = auth.uid());

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_sources' AND policyname = 'Users can update own lead sources'
  ) THEN
    DROP POLICY "Users can update own lead sources" ON public.lead_sources;
  END IF;
END $$;
CREATE POLICY "Users can update own lead sources"
ON public.lead_sources
FOR UPDATE
USING (user_id = auth.uid());

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_sources' AND policyname = 'Users can delete own lead sources'
  ) THEN
    DROP POLICY "Users can delete own lead sources" ON public.lead_sources;
  END IF;
END $$;
CREATE POLICY "Users can delete own lead sources"
ON public.lead_sources
FOR DELETE
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_lead_sources_user_id ON public.lead_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_name ON public.lead_sources(name);

COMMIT;
