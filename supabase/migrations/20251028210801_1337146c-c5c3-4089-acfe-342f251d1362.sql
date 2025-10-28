-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  total_clicks BIGINT DEFAULT 0 NOT NULL,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create global counter table
CREATE TABLE public.global_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial counter
INSERT INTO public.global_counter (id, count) VALUES (1, 0);

-- Enable RLS
ALTER TABLE public.global_counter ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the counter
CREATE POLICY "Counter is viewable by everyone"
  ON public.global_counter FOR SELECT
  USING (true);

-- Only authenticated users can update (through edge function)
CREATE POLICY "Authenticated users can update counter"
  ON public.global_counter FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create clicks history table
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  global_count_at_click BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Policies for clicks
CREATE POLICY "Users can view their own clicks"
  ON public.clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clicks"
  ON public.clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT message_length CHECK (char_length(message) <= 500)
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read chat
CREATE POLICY "Chat messages are viewable by everyone"
  ON public.chat_messages FOR SELECT
  USING (true);

-- Only authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert achievements
CREATE POLICY "Authenticated users can unlock achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for global counter and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_counter;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create trigger to update profiles updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial achievements
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value) VALUES
  ('First Click', 'Welcome to the game!', '🎉', 'personal_clicks', 1),
  ('Century Club', 'Clicked 100 times', '💯', 'personal_clicks', 100),
  ('Thousand Warrior', 'Clicked 1,000 times', '⚔️', 'personal_clicks', 1000),
  ('Satan''s Favorite', 'Clicked when counter was at 666', '😈', 'special_number', 666),
  ('Lucky 777', 'Clicked when counter was at 777', '🎰', 'special_number', 777),
  ('Party Time', 'Clicked when counter was at 6969', '🎊', 'special_number', 6969),
  ('Perfect Ten', 'Clicked when counter was at 10,000', '🔟', 'special_number', 10000),
  ('Meme Lord', 'Clicked when counter was at 42069', '👑', 'special_number', 42069);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();