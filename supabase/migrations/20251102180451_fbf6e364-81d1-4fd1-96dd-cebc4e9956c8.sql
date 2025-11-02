-- Fix Security Issue 1: Global Counter Vulnerable to Manipulation
-- Remove the unsafe UPDATE policy on global_counter
DROP POLICY IF EXISTS "Authenticated users can update counter" ON public.global_counter;

-- Create a secure function to increment the global counter with validation
CREATE OR REPLACE FUNCTION public.increment_global_counter_secure(
  p_user_id uuid,
  p_is_premium boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_new_count bigint;
  v_increment integer;
  v_last_click timestamp with time zone;
  v_click_rate_limit interval := interval '0.1 seconds'; -- Max 10 clicks per second
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

-- Fix Security Issue 2: Premium Features Rely on Client-Side Status
-- Create a secure function to increment user clicks with server-side premium check
CREATE OR REPLACE FUNCTION public.increment_user_clicks_with_multiplier(
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_is_premium boolean;
  v_multiplier integer;
BEGIN
  -- Get premium status from database (server-side check)
  SELECT is_premium INTO v_is_premium
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If user not found, return 0
  IF v_is_premium IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Determine multiplier based on actual premium status
  v_multiplier := CASE WHEN v_is_premium THEN 2 ELSE 1 END;
  
  -- Update with multiplier
  UPDATE public.profiles
  SET total_clicks = total_clicks + v_multiplier,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN v_multiplier;
END;
$function$;

-- Create a function to validate chat messages (emoji check for premium users)
CREATE OR REPLACE FUNCTION public.validate_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_is_premium boolean;
  v_has_emoji boolean;
BEGIN
  -- Check premium status from profiles table
  SELECT is_premium INTO v_is_premium
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Check for emojis using regex pattern
  v_has_emoji := NEW.message ~ '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]';
  
  -- Block non-premium users from using emojis
  IF v_has_emoji AND NOT COALESCE(v_is_premium, false) THEN
    RAISE EXCEPTION 'Emojis are only available for premium users';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to enforce premium emoji validation
DROP TRIGGER IF EXISTS enforce_premium_emojis ON public.chat_messages;
CREATE TRIGGER enforce_premium_emojis
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_chat_message();

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.increment_global_counter_secure(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_clicks_with_multiplier(uuid) TO authenticated;