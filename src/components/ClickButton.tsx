import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClickButtonProps {
  currentCount: number;
  onClickSuccess: () => void;
  userId: string;
}

export const ClickButton = ({ currentCount, onClickSuccess, userId }: ClickButtonProps) => {
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    // Fire and forget - don't wait for the response
    (async () => {
      try {
        // Check if user is premium for 2x multiplier
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", userId)
          .single();

        const isPremium = profile?.is_premium || false;
        const clickMultiplier = isPremium ? 2 : 1;

        // Increment the global counter
        const { data: counterData, error: counterError } = await supabase
          .from("global_counter")
          .select("count")
          .eq("id", 1)
          .single();

        if (counterError) throw counterError;

        const newCount = (counterData?.count || 0) + clickMultiplier;

        // Update global counter
        const { error: updateError } = await supabase
          .from("global_counter")
          .update({ count: newCount, last_updated: new Date().toISOString() })
          .eq("id", 1);

        if (updateError) throw updateError;

        // Record the click
        const { error: clickError } = await supabase.from("clicks").insert({
          user_id: userId,
          global_count_at_click: newCount,
        });

        if (clickError) throw clickError;

        // Update user's total clicks (with multiplier)
        for (let i = 0; i < clickMultiplier; i++) {
          await supabase.rpc("increment_user_clicks", {
            user_id: userId,
          });
        }

        // Update streak
        await updateStreak();

        // Check for achievements and milestones
        checkAchievements(newCount);

        onClickSuccess();

        // Show premium bonus toast
        if (isPremium && clickMultiplier > 1) {
          toast({
            title: "Premium Bonus! 🌟",
            description: `+${clickMultiplier} clicks (2x multiplier active)`,
            duration: 2000,
          });
        }
      } catch (error: any) {
        console.error("Click error:", error);
      }
    })();
  };

  const updateStreak = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: streak } = await supabase
      .from("click_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!streak) {
      // Create new streak
      await supabase.from("click_streaks").insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_click_date: today,
      });
    } else {
      const lastDate = streak.last_click_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = streak.current_streak;

      if (lastDate === today) {
        // Already clicked today, no change
        return;
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newStreak = streak.current_streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await supabase
        .from("click_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_click_date: today,
        })
        .eq("user_id", userId);
    }
  };

  const checkAchievements = async (globalCount: number) => {
    // Fetch all achievements
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*");

    if (!achievements) return;

    // Get user's current total clicks
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_clicks")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const userClicks = profile.total_clicks;

    // Check each achievement
    for (const achievement of achievements) {
      let shouldUnlock = false;

      if (achievement.condition_type === "total_clicks") {
        shouldUnlock = userClicks >= achievement.condition_value;
      } else if (achievement.condition_type === "special_number") {
        shouldUnlock = globalCount === achievement.condition_value;
      }

      if (shouldUnlock) {
        // Check if already unlocked
        const { data: existing } = await supabase
          .from("user_achievements")
          .select("id")
          .eq("user_id", userId)
          .eq("achievement_id", achievement.id)
          .single();

        if (!existing) {
          // Unlock the achievement
          await supabase.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

          toast({
            title: `${achievement.icon} ${achievement.name} Unlocked!`,
            description: achievement.description,
            duration: 5000,
          });
        }
      }
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        className="relative overflow-hidden w-64 h-64 rounded-full text-6xl font-bold box-glow-primary hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg"
        style={{
          background: "var(--gradient-primary)",
        }}
      >
        <span className="select-none text-white font-extrabold">
          CLICK
        </span>

        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: "20px",
              height: "20px",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </Button>
    </div>
  );
};