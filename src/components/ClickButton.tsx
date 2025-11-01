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
        // Increment the global counter
        const { data: counterData, error: counterError } = await supabase
          .from("global_counter")
          .select("count")
          .eq("id", 1)
          .single();

        if (counterError) throw counterError;

        const newCount = (counterData?.count || 0) + 1;

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

        // Update user's total clicks
        await supabase.rpc("increment_user_clicks", {
          user_id: userId,
        });

        // Check for achievements
        checkAchievements(newCount);

        onClickSuccess();
      } catch (error: any) {
        console.error("Click error:", error);
      }
    })();
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
        className="relative overflow-hidden w-64 h-64 rounded-full text-7xl font-black box-glow-primary hover:scale-105 active:scale-95 transition-transform duration-100 shadow-2xl"
        style={{
          background: "var(--gradient-primary)",
        }}
      >
        <span className="select-none drop-shadow-lg">
          CLICK<br/>
          <span className="text-5xl">ME! 😄</span>
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