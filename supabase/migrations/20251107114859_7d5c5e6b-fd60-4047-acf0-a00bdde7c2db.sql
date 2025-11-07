-- Raise click rate limit and add coin system
-- 1) Relax rate limit in increment_global_counter_secure
CREATE OR REPLACE FUNCTION public.increment_global_counter_secure(p_user_id uuid, p_is_premium boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_new_count bigint;
  v_increment integer;
  v_last_click timestamp with time zone;
  v_click_rate_limit interval := interval '0.001 seconds'; -- Max 1000 clicks per second
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
$$;

-- 2) Coins system
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coins bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: users can insert/select their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coin_transactions' AND policyname='Users can insert their own coin tx'
  ) THEN
    CREATE POLICY "Users can insert their own coin tx"
    ON public.coin_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coin_transactions' AND policyname='Users can view their own coin tx'
  ) THEN
    CREATE POLICY "Users can view their own coin tx"
    ON public.coin_transactions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to safely add coins and record transaction
CREATE OR REPLACE FUNCTION public.add_coins(p_user_id uuid, p_amount integer, p_description text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  -- Only allow users to modify their own balance
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount = 0 THEN
    RETURN;
  END IF;

  -- Update balance (never below zero)
  UPDATE public.profiles
  SET coins = GREATEST(coins + p_amount, 0),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.coin_transactions (user_id, amount, description)
  VALUES (p_user_id, p_amount, p_description);
END;
$$;