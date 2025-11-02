-- Fix search_path for existing SECURITY DEFINER functions
-- This addresses the linter warnings about mutable search_path

CREATE OR REPLACE FUNCTION public.increment_user_clicks(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE public.profiles
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$function$;