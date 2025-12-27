-- Ensure ai_settings can be upserted by user_id (requires UNIQUE constraint)

-- Remove any accidental duplicates (keep most recently updated)
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
  FROM public.ai_settings
)
DELETE FROM public.ai_settings a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- Add unique constraint on user_id (needed for ON CONFLICT (user_id))
ALTER TABLE public.ai_settings
ADD CONSTRAINT ai_settings_user_id_unique UNIQUE (user_id);
