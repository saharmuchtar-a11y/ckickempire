-- Add cost columns to cases table
ALTER TABLE public.cases
ADD COLUMN coin_cost integer DEFAULT 0,
ADD COLUMN gem_cost integer DEFAULT 0;

-- Create a new case that costs 500 coins
INSERT INTO public.cases (name, description, coin_cost, is_free, one_time_only)
VALUES ('Premium Case', 'A premium case containing exclusive cosmetic items', 500, false, false);

-- Link the new items to the Premium Case
INSERT INTO public.case_items (case_id, item_id)
SELECT 
  (SELECT id FROM public.cases WHERE name = 'Premium Case'),
  items.id
FROM public.items
WHERE items.name IN ('Cookie Button', 'Fire Animation', 'SpongeBob Cursor');

-- Fix the handle_new_user function to prevent duplicate starter items
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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