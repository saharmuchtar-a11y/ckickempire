-- Fix the function search path issue by ensuring it's properly set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_starter_items uuid[];
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8))
  );

  -- Get starter item IDs (common rarity items) - limit to 3 to avoid duplicates
  SELECT ARRAY_AGG(id) INTO v_starter_items
  FROM (
    SELECT id FROM public.items
    WHERE rarity = 'common'
    LIMIT 3
  ) AS limited_items;

  -- Give starter items to new user (only if they don't already have items)
  IF v_starter_items IS NOT NULL THEN
    INSERT INTO public.user_items (user_id, item_id, equipped)
    SELECT NEW.id, item_id, false
    FROM UNNEST(v_starter_items) AS item_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;