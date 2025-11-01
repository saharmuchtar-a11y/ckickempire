-- =====================================================
-- VIRTUAL ECONOMY & COSMETICS SYSTEM
-- =====================================================

-- Add economy columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS gems integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_bonus timestamp with time zone,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);

-- Create index for referral codes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- =====================================================
-- COOL NUMBERS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cool_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number_value bigint NOT NULL,
  number_type text NOT NULL, -- 'meme', 'palindrome', 'sequence', 'repeating', 'milestone'
  rarity text NOT NULL, -- 'common', 'rare', 'epic', 'legendary', 'mythic'
  achieved_at timestamp with time zone NOT NULL DEFAULT now(),
  coins_rewarded integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, number_value)
);

ALTER TABLE public.cool_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cool numbers"
ON public.cool_numbers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all cool numbers for leaderboard"
ON public.cool_numbers FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own cool numbers"
ON public.cool_numbers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cool_numbers_user ON public.cool_numbers(user_id);
CREATE INDEX idx_cool_numbers_type ON public.cool_numbers(number_type);
CREATE INDEX idx_cool_numbers_rarity ON public.cool_numbers(rarity);

-- =====================================================
-- COSMETICS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cosmetic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL, -- 'button_skin', 'click_effect', 'profile_frame', 'chat_emote', 'sound_pack', 'title'
  rarity text NOT NULL, -- 'common', 'rare', 'epic', 'legendary', 'mythic'
  price_coins integer,
  price_gems integer,
  tradeable boolean NOT NULL DEFAULT true,
  is_premium_only boolean NOT NULL DEFAULT false,
  image_url text,
  effect_data jsonb, -- stores animation/effect configurations
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmetic_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cosmetics are viewable by everyone"
ON public.cosmetic_items FOR SELECT
USING (true);

CREATE INDEX idx_cosmetics_category ON public.cosmetic_items(category);
CREATE INDEX idx_cosmetics_rarity ON public.cosmetic_items(rarity);

-- User inventory
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.cosmetic_items(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  is_equipped boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
ON public.user_inventory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
ON public.user_inventory FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX idx_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_inventory_equipped ON public.user_inventory(user_id, is_equipped) WHERE is_equipped = true;

-- =====================================================
-- CASE OPENING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price_coins integer,
  price_gems integer,
  price_usd decimal(10,2),
  is_free boolean NOT NULL DEFAULT false,
  cooldown_hours integer, -- for free cases
  image_url text,
  rarity_weights jsonb NOT NULL, -- probability distribution
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cases are viewable by everyone"
ON public.case_types FOR SELECT
USING (true);

-- Case opening history
CREATE TABLE IF NOT EXISTS public.case_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_type_id uuid REFERENCES public.case_types(id) ON DELETE SET NULL,
  items_won jsonb NOT NULL, -- array of item ids and quantities
  opened_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.case_openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own case openings"
ON public.case_openings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case openings"
ON public.case_openings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_case_openings_user ON public.case_openings(user_id);

-- =====================================================
-- TRADING & MARKETPLACE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_items jsonb NOT NULL, -- array of {item_id, quantity}
  receiver_items jsonb NOT NULL,
  sender_coins integer NOT NULL DEFAULT 0,
  receiver_coins integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert trades they send"
ON public.trades FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update trades they're part of"
ON public.trades FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE INDEX idx_trades_sender ON public.trades(sender_id);
CREATE INDEX idx_trades_receiver ON public.trades(receiver_id);
CREATE INDEX idx_trades_status ON public.trades(status);

-- Marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.cosmetic_items(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_coins integer,
  price_gems integer,
  status text NOT NULL DEFAULT 'active', -- 'active', 'sold', 'cancelled'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sold_at timestamp with time zone,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (price_coins IS NOT NULL OR price_gems IS NOT NULL)
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone"
ON public.marketplace_listings FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own listings"
ON public.marketplace_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings"
ON public.marketplace_listings FOR UPDATE
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE INDEX idx_marketplace_status ON public.marketplace_listings(status) WHERE status = 'active';
CREATE INDEX idx_marketplace_item ON public.marketplace_listings(item_id);

-- =====================================================
-- GLOBAL EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.global_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL, -- 'double_click', 'reverse_click', 'golden_hour', 'bonus_coins'
  multiplier decimal(10,2) NOT NULL DEFAULT 1.0,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
ON public.global_events FOR SELECT
USING (true);

CREATE INDEX idx_events_active ON public.global_events(is_active) WHERE is_active = true;

-- =====================================================
-- FRIENDS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own friendships"
ON public.friendships FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- =====================================================
-- TRANSACTIONS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.currency_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency_type text NOT NULL, -- 'coins', 'gems'
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'earned', 'spent', 'purchased', 'rewarded', 'traded'
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.currency_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user ON public.currency_transactions(user_id);
CREATE INDEX idx_transactions_created ON public.currency_transactions(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to add coins to user
CREATE OR REPLACE FUNCTION add_coins(p_user_id uuid, p_amount integer, p_description text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET coins = coins + p_amount
  WHERE id = p_user_id;
  
  INSERT INTO public.currency_transactions (user_id, currency_type, amount, transaction_type, description)
  VALUES (p_user_id, 'coins', p_amount, 'earned', p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add gems to user
CREATE OR REPLACE FUNCTION add_gems(p_user_id uuid, p_amount integer, p_description text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET gems = gems + p_amount
  WHERE id = p_user_id;
  
  INSERT INTO public.currency_transactions (user_id, currency_type, amount, transaction_type, description)
  VALUES (p_user_id, 'gems', p_amount, 'earned', p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert some starter cosmetic items
INSERT INTO public.cosmetic_items (name, description, category, rarity, price_coins, price_gems) VALUES
('Classic Button', 'The original clicker button', 'button_skin', 'common', 0, 0),
('Golden Button', 'Shine like gold!', 'button_skin', 'rare', 5000, NULL),
('Neon Button', 'Cyberpunk vibes', 'button_skin', 'epic', NULL, 100),
('Troll Face Button', 'U mad bro?', 'button_skin', 'legendary', 50000, NULL),
('Cosmic Core', 'Channel the universe', 'button_skin', 'mythic', NULL, 500),
('Sparkle Trail', 'Leave sparkles behind', 'click_effect', 'common', 1000, NULL),
('Lightning Strike', 'Zeus approved', 'click_effect', 'epic', 10000, NULL),
('Fire Burst', 'Feel the burn', 'click_effect', 'rare', 5000, NULL),
('Bronze Frame', 'Show off your starter status', 'profile_frame', 'common', 2000, NULL),
('Diamond Frame', 'Flex on the peasants', 'profile_frame', 'legendary', NULL, 200),
('Trollface Emote', 'The classic', 'chat_emote', 'common', 500, NULL),
('Stonks Emote', 'To the moon!', 'chat_emote', 'rare', 3000, NULL)
ON CONFLICT DO NOTHING;

-- Insert case types
INSERT INTO public.case_types (name, description, is_free, cooldown_hours, rarity_weights) VALUES
('Free Case', 'Open once per day!', true, 24, '{"common": 70, "rare": 25, "epic": 4, "legendary": 1, "mythic": 0}'),
('Bronze Case', 'Basic loot box', false, NULL, '{"common": 50, "rare": 35, "epic": 12, "legendary": 3, "mythic": 0}'),
('Premium Case', 'Better odds!', false, NULL, '{"common": 30, "rare": 40, "epic": 20, "legendary": 8, "mythic": 2}'),
('Legendary Case', 'Top tier drops', false, NULL, '{"common": 0, "rare": 20, "epic": 40, "legendary": 30, "mythic": 10}')
ON CONFLICT DO NOTHING;

-- Update case prices
UPDATE public.case_types SET price_coins = 10000 WHERE name = 'Bronze Case';
UPDATE public.case_types SET price_gems = 250 WHERE name = 'Premium Case';
UPDATE public.case_types SET price_gems = 1000 WHERE name = 'Legendary Case';

-- Generate referral codes for existing users (you can run this manually)
-- UPDATE public.profiles SET referral_code = substr(md5(random()::text), 1, 8) WHERE referral_code IS NULL;

