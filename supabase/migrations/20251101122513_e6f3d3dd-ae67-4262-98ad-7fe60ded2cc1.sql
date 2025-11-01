-- Add tables for viral features

-- Click streaks table
CREATE TABLE IF NOT EXISTS public.click_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_click_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.click_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak"
ON public.click_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
ON public.click_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.click_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  goal_type text NOT NULL, -- 'clicks', 'streak', 'special_number'
  goal_value integer NOT NULL,
  reward_text text NOT NULL,
  active_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by everyone"
ON public.daily_challenges FOR SELECT
USING (true);

-- User challenge completions
CREATE TABLE IF NOT EXISTS public.user_challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
ON public.user_challenge_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
ON public.user_challenge_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Global milestones
CREATE TABLE IF NOT EXISTS public.global_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_value bigint NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  reached boolean NOT NULL DEFAULT false,
  reached_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.global_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones are viewable by everyone"
ON public.global_milestones FOR SELECT
USING (true);

-- Insert some daily challenges
INSERT INTO public.daily_challenges (title, description, goal_type, goal_value, reward_text) VALUES
('Speed Demon', 'Click 100 times today!', 'clicks', 100, 'Achievement Badge 🏃'),
('Keep the Streak', 'Maintain a 7-day streak', 'streak', 7, 'Dedication Badge 🔥'),
('Lucky Seven', 'Be the one to hit 777', 'special_number', 777, 'Lucky Badge 🍀')
ON CONFLICT DO NOTHING;

-- Insert global milestones
INSERT INTO public.global_milestones (milestone_value, title, description, icon) VALUES
(1000000, 'One Million!', 'The community hit 1 million clicks!', '🎯'),
(10000000, 'Ten Million!', 'Ten million clicks achieved!', '🚀'),
(100000000, 'One Hundred Million!', 'The legendary 100M clicks!', '👑'),
(1000000000, 'One Billion!', 'One BILLION clicks! Unbelievable!', '🌟')
ON CONFLICT (milestone_value) DO NOTHING;

-- Trigger for updating streaks updated_at
CREATE TRIGGER update_streaks_updated_at
BEFORE UPDATE ON public.click_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();