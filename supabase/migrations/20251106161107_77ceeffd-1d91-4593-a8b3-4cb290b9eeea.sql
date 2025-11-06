-- Insert common tier starter items
INSERT INTO public.items (name, description, item_type, rarity, image_url, preview_data) VALUES
  ('Basic Click', 'A simple, clean button design', 'button_skin', 'common', NULL, '{"color": "#94a3b8", "style": "basic"}'),
  ('Sparkle Pop', 'A small sparkle effect on click', 'animation', 'common', NULL, '{"effect": "sparkle", "intensity": "low"}'),
  ('Default Pointer', 'Standard cursor with a subtle glow', 'cursor', 'common', NULL, '{"style": "pointer", "glow": "subtle"}');

-- Update the handle_new_user function to give starter items
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  v_starter_items uuid[];
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8))
  );

  -- Get starter item IDs (common rarity items)
  SELECT ARRAY_AGG(id) INTO v_starter_items
  FROM public.items
  WHERE rarity = 'common';

  -- Give starter items to new user
  IF v_starter_items IS NOT NULL THEN
    INSERT INTO public.user_items (user_id, item_id, equipped)
    SELECT NEW.id, item_id, false
    FROM UNNEST(v_starter_items) AS item_id;
  END IF;

  RETURN NEW;
END;
$$;