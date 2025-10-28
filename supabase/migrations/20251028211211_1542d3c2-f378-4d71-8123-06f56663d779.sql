-- Create function to increment user clicks
CREATE OR REPLACE FUNCTION increment_user_clicks(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;