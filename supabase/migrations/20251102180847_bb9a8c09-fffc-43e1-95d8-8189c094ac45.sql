-- Increase click rate limit
CREATE OR REPLACE FUNCTION public.increment_global_counter_secure(p_user_id uuid, p_is_premium boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_new_count bigint;
  v_increment integer;
  v_last_click timestamp with time zone;
  v_click_rate_limit interval := interval '0.01 seconds'; -- Max 100 clicks per second (increased from 10)
BEGIN
  -- Determine increment based on premium status (server-side check)
  v_increment := CASE WHEN p_is_premium THEN 2 ELSE 1 END;
  
  -- Rate limiting: Check last click time for this user
  SELECT MAX(clicked_at) INTO v_last_click
  FROM public.clicks
  WHERE user_id = p_user_id;
  
  IF v_last_click IS NOT NULL AND (NOW() - v_last_click) < v_click_rate_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
  END IF;
  
  -- Atomically increment the global counter
  UPDATE public.global_counter
  SET count = count + v_increment,
      last_updated = NOW()
  WHERE id = 1
  RETURNING count INTO v_new_count;
  
  -- Return the new count and increment used
  RETURN jsonb_build_object(
    'new_count', v_new_count,
    'increment', v_increment
  );
END;
$function$;

-- Create items table for skins, animations, and cursors
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('button_skin', 'animation', 'cursor')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  image_url TEXT,
  preview_data JSONB, -- For storing animation/cursor data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_items table for inventory
CREATE TABLE IF NOT EXISTS public.user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT FALSE,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items (viewable by everyone)
CREATE POLICY "Items are viewable by everyone"
ON public.items FOR SELECT
USING (true);

-- RLS Policies for user_items
CREATE POLICY "Users can view their own items"
ON public.user_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
ON public.user_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
ON public.user_items FOR UPDATE
USING (auth.uid() = user_id);

-- Insert example items
INSERT INTO public.items (name, description, item_type, rarity, image_url, preview_data) VALUES
-- Button Skin
('Golden Click', 'A luxurious golden button that shimmers with every click', 'button_skin', 'legendary', NULL, 
 '{"gradient": "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", "glow": "0 0 30px rgba(255, 215, 0, 0.6)", "scale": 1.05}'::jsonb),

-- Animation
('Firework Explosion', 'Your clicks explode in a dazzling firework display', 'animation', 'epic', NULL,
 '{"type": "firework", "colors": ["#FF1744", "#F50057", "#D500F9", "#651FFF"], "particleCount": 50, "duration": 1500}'::jsonb),

-- Cursor
('Rainbow Trail', 'A magical cursor that leaves a rainbow trail behind', 'cursor', 'rare', NULL,
 '{"trailColor": "rainbow", "trailLength": 20, "glowIntensity": 0.8}'::jsonb);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON public.user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_equipped ON public.user_items(user_id, equipped) WHERE equipped = true;