
-- Add registration_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN registration_number TEXT;
-- Create a unique index on registration_number to prevent duplicates
CREATE UNIQUE INDEX profiles_registration_number_idx ON public.profiles(registration_number);
-- Add comment to the column
COMMENT ON COLUMN public.profiles.registration_number IS 'Unique registration number for students';
