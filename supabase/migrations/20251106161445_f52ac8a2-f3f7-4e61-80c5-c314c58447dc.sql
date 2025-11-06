-- Create cases table
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  is_free boolean NOT NULL DEFAULT false,
  one_time_only boolean NOT NULL DEFAULT false,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create case_items junction table (links cases to items they can contain)
CREATE TABLE public.case_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(case_id, item_id)
);

-- Create user_case_openings to track who opened which cases
CREATE TABLE public.user_case_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  opened_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_case_openings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cases (everyone can view)
CREATE POLICY "Cases are viewable by everyone"
  ON public.cases FOR SELECT
  USING (true);

-- RLS Policies for case_items (everyone can view)
CREATE POLICY "Case items are viewable by everyone"
  ON public.case_items FOR SELECT
  USING (true);

-- RLS Policies for user_case_openings
CREATE POLICY "Users can view their own openings"
  ON public.user_case_openings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own openings"
  ON public.user_case_openings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_case_items_case_id ON public.case_items(case_id);
CREATE INDEX idx_user_case_openings_user_id ON public.user_case_openings(user_id);
CREATE INDEX idx_user_case_openings_case_id ON public.user_case_openings(case_id);

-- Insert the free starter case
INSERT INTO public.cases (name, description, is_free, one_time_only)
VALUES ('Starter Case', 'A free one-time case containing 10 common items to get you started!', true, true)
RETURNING id;

-- Link 10 common items to the starter case
-- First we need to get the case id and all common item ids
DO $$
DECLARE
  v_case_id uuid;
  v_item_ids uuid[];
BEGIN
  -- Get the starter case id
  SELECT id INTO v_case_id FROM public.cases WHERE name = 'Starter Case' LIMIT 1;
  
  -- Get all common item ids (we have 6 common items total from previous inserts)
  SELECT ARRAY_AGG(id) INTO v_item_ids FROM public.items WHERE rarity = 'common';
  
  -- Insert all common items into case_items for the starter case
  INSERT INTO public.case_items (case_id, item_id)
  SELECT v_case_id, unnest(v_item_ids);
END $$;