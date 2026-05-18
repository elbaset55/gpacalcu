ALTER TABLE public.academic_profiles
ADD COLUMN IF NOT EXISTS current_level integer NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 6);