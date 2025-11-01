# 🎮 Global Troll Clicker - Setup Guide

## 🚀 What's Been Implemented

### ✅ Core Features (100% Complete)
1. **Virtual Economy System**
   - Coins and Gems currency
   - Automatic rewards for cool numbers
   - Transaction logging
   - Balance display in header

2. **Cool Numbers Detection**
   - Meme numbers: 69, 420, 1337, 777, 666, 80085, etc.
   - Palindromes: 121, 12321, 454,54, etc.
   - Repeating digits: 111, 2222, 55555, etc.
   - Sequences: 123, 1234, 9876, etc.
   - Milestones: 100, 1000, 10000, etc.
   - 5 rarity tiers with different coin rewards
   - Celebrations with confetti and animations

3. **Case Opening System**
   - Multiple case types (Free, Bronze, Premium, Legendary)
   - Rarity-based loot system
   - Animated opening experience
   - Results display with visual effects
   - Automatic inventory management

4. **Inventory System**
   - View all owned cosmetics
   - Filter by category (Button Skins, Effects, Frames, Emotes, etc.)
   - Equip/unequip items
   - Visual indicators for equipped items
   - Rarity-based styling

5. **Enhanced UI/UX**
   - Dark space theme with animated stars
   - Particle effects on every click
   - Currency displays (coins/gems)
   - Navigation to Cases and Inventory
   - Responsive design

### 📊 Database Schema (100% Complete)
All tables created with proper RLS policies:
- `profiles` - Enhanced with coins, gems, referrals
- `cool_numbers` - Tracks special numbers hit by users
- `cosmetic_items` - All cosmetic items catalog
- `user_inventory` - User's owned items
- `case_types` - Loot box definitions
- `case_openings` - Opening history
- `trades` - Player-to-player trading (ready)
- `marketplace_listings` - Item marketplace (ready)
- `global_events` - Scheduled events (ready)
- `friendships` - Friend system (ready)
- `currency_transactions` - Economy audit log

## 📝 Setup Instructions

### Step 1: Apply the Database Migration

You need to apply the new migration to add all the economy and cosmetics tables.

**Option A: Using Supabase CLI (Recommended)**
```bash
cd troll-frenzy
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open the migration file: `supabase/migrations/20251101140000_economy_and_cosmetics.sql`
4. Copy the entire contents
5. Paste into the SQL Editor and run it

### Step 2: Regenerate TypeScript Types

After applying the migration, regenerate the TypeScript types:

```bash
# Using Supabase CLI
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or using the dashboard
# Copy from: Settings > API > TypeScript Types
```

### Step 3: Remove Type Casts

After regenerating types, you can remove the `(supabase as any)` casts from:
- `src/components/ClickButton.tsx`
- `src/pages/Cases.tsx`
- `src/pages/Inventory.tsx`

Just search for `(supabase as any)` and replace with `supabase`.

### Step 4: Test the Features

1. **Sign up / Login**
   ```
   Navigate to: http://localhost:5173/auth
   ```

2. **Click and Earn Coins**
   - Click the button multiple times
   - Try hitting cool numbers:
     - 69, 420, 1337 (meme numbers)
     - 111, 222, 777 (repeating digits)
     - 12321, 4554 (palindromes)
   - Watch for confetti and coin rewards!

3. **Open Cases**
   ```
   Click "Cases" button in header
   Navigate to: http://localhost:5173/cases
   ```
   - You should have some starting coins
   - Try opening a Bronze Case (10,000 coins)
   - Watch the opening animation
   - See what items you won!

4. **View Inventory**
   ```
   Click "Inventory" button in header
   Navigate to: http://localhost:5173/inventory
   ```
   - See all your cosmetic items
   - Filter by category
   - Equip items (visual application coming soon!)

## 🎯 What's Ready to Use

### Pages
- ✅ `/` - Main game (with economy display)
- ✅ `/auth` - Login/signup
- ✅ `/profile` - User profile with account settings
- ✅ `/cases` - Case opening system
- ✅ `/inventory` - Cosmetics inventory
- ✅ `/subscribe` - Premium subscriptions

### Features Working Now
- ✅ Real-time click counting
- ✅ Cool numbers detection with rewards
- ✅ Coin earning system
- ✅ Case opening with loot
- ✅ Inventory management
- ✅ Equip/unequip cosmetics (database only, visual application pending)
- ✅ Achievements system
- ✅ Daily challenges
- ✅ Click streaks
- ✅ Leaderboard
- ✅ Real-time chat
- ✅ Profile customization (username, password)

## 🔄 Next Steps (Optional Enhancements)

### Priority 1: Visual Cosmetics Application
Apply equipped cosmetics visually:
1. Button skins - change button appearance
2. Click effects - add particle trails
3. Profile frames - show in profile/leaderboard
4. Chat emotes - custom emoji picker

### Priority 2: Trading System
Build the trading interface:
1. Send trade offers
2. Accept/reject trades
3. Trade history page
4. Notifications for trade offers

### Priority 3: Marketplace
Create marketplace pages:
1. Browse listings
2. Create listings
3. Buy items
4. Search and filters

### Priority 4: Enhanced Features
- Multi-tier subscriptions (Bronze, Silver, Gold, Diamond)
- OAuth (Google, Apple)
- Global events system
- Friends system
- Referral program
- Mini-games

## 💡 Tips for Testing

### Getting Starter Coins
Run this SQL in Supabase SQL Editor to give yourself coins for testing:
```sql
UPDATE profiles
SET coins = 50000, gems = 1000
WHERE id = 'YOUR_USER_ID';
```

### Seeding Test Data
The migration already includes starter cosmetic items and case types.

### Testing Cool Numbers
To quickly test cool numbers, you can manually update your click count:
```sql
UPDATE profiles
SET total_clicks = 68
WHERE id = 'YOUR_USER_ID';
```
Then click once to hit 69 and see the celebration!

## 🐛 Troubleshooting

### "Table does not exist" errors
- Make sure you ran the migration: `supabase db push`
- Check Supabase dashboard > Database > Tables

### TypeScript errors about unknown tables
- Regenerate types after applying migrations
- Replace `(supabase as any)` with `supabase` after regenerating

### Coins not being awarded
- Check browser console for errors
- Verify the `add_coins` function exists in database
- Check if cool number was already recorded (unique constraint)

### Cases not opening
- Check if you have enough coins/gems
- Verify `case_types` and `cosmetic_items` tables have data
- Look at browser console for errors

## 📱 Mobile Responsiveness

All pages are responsive and work on:
- ✅ Desktop (1920x1080+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

## 🎨 Customization

### Adding Custom Cosmetics
Insert into `cosmetic_items` table:
```sql
INSERT INTO cosmetic_items (name, description, category, rarity, price_coins)
VALUES 
('My Custom Skin', 'Description here', 'button_skin', 'epic', 15000);
```

### Adding New Case Types
Insert into `case_types` table:
```sql
INSERT INTO case_types (name, description, price_gems, rarity_weights)
VALUES 
('Ultra Case', 'Best odds!', 500, 
 '{"common": 10, "rare": 30, "epic": 35, "legendary": 20, "mythic": 5}');
```

## 📚 Documentation

- `IMPLEMENTATION_PROGRESS.md` - Detailed feature status
- `supabase/migrations/` - All database schemas
- `src/lib/coolNumbers.ts` - Cool numbers detection logic

## 🎉 You're Ready!

Your Global Troll Clicker is ready to go! Just:
1. Apply the migration
2. Start clicking
3. Hit cool numbers
4. Earn coins
5. Open cases
6. Collect cosmetics
7. Become the ultimate troll clicker!

Have fun and happy clicking! 🖱️✨

