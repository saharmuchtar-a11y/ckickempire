import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectCoolNumber, getRarityColor } from "@/lib/coolNumbers";

interface ClickButtonProps {
  currentCount: number;
  onClickSuccess: () => void;
  userId: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface EquippedItem {
  id: string;
  item_type: string;
  name: string;
  preview_data: any;
}

export const ClickButton = ({ currentCount, onClickSuccess, userId }: ClickButtonProps) => {
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [celebration, setCelebration] = useState<{ show: boolean; text: string; milestone: number } | null>(null);
  const [localClickCount, setLocalClickCount] = useState(0);
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const { toast } = useToast();

  // Fetch equipped cosmetics
  useEffect(() => {
    const fetchEquippedItems = async () => {
      const { data } = await supabase
        .from("user_items")
        .select(`
          id,
          items (
            id,
            item_type,
            name,
            preview_data
          )
        `)
        .eq("user_id", userId)
        .eq("equipped", true);

      if (data) {
        const equipped = data.map((ui: any) => ({
          id: ui.items.id,
          item_type: ui.items.item_type,
          name: ui.items.name,
          preview_data: ui.items.preview_data,
        }));
        setEquippedItems(equipped);
      }
    };

    fetchEquippedItems();
  }, [userId]);

  // Apply cursor cosmetic globally
  useEffect(() => {
    const cursorItem = equippedItems.find(item => item.item_type === 'cursor');
    if (cursorItem && cursorItem.preview_data?.emoji) {
      // Use emoji as cursor - encode it as SVG data URL
      const emoji = cursorItem.preview_data.emoji;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="24">${emoji}</text></svg>`;
      const cursorUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      document.body.style.cursor = `url('${cursorUrl}') 16 16, auto`;
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [equippedItems]);

  // Check for cool numbers and reward coins
  const checkCoolNumber = async (num: number) => {
    const coolResult = detectCoolNumber(num);
    
    if (coolResult.isCool && coolResult.name) {
      // Award coins if there's a reward
      if (coolResult.coinsReward && coolResult.coinsReward > 0) {
        try {
          await supabase.rpc("add_coins", {
            p_user_id: userId,
            p_amount: coolResult.coinsReward,
            p_description: `Cool number: ${coolResult.name}`,
          });
        } catch (error) {
          console.error("Error awarding coins:", error);
        }
      }

      // Show celebration
      const celebrationText = `${coolResult.emoji} ${coolResult.name.toUpperCase()}! ${coolResult.emoji}`;
      setCelebration({ show: true, text: celebrationText, milestone: num });
      createConfetti();
      
      // Clear celebration after animation
      setTimeout(() => {
        setCelebration(null);
      }, 3000);

      // Show toast with coin reward
      toast({
        title: celebrationText,
        description: coolResult.coinsReward 
          ? `${coolResult.description} +${coolResult.coinsReward} coins!` 
          : coolResult.description,
        duration: 5000,
      });
    }
  };

  // Function to create particles
  const createParticles = (centerX: number, centerY: number, count: number = 8) => {
    // Check for equipped animation
    const animationItem = equippedItems.find(item => item.item_type === 'animation');
    const particleColor = animationItem?.preview_data?.color || null;
    
    const defaultColors = ["#4A90E2", "#50E3C2", "#F5A623", "#BD10E0", "#F8E71C"];
    const colors = particleColor ? [particleColor] : defaultColors;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 50 + Math.random() * 50;
      newParticles.push({
        id: Date.now() + i,
        x: centerX + Math.cos(angle) * velocity,
        y: centerY + Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  };

  // Function to create confetti
  const createConfetti = () => {
    const confettiCount = 50;
    const colors = ["#4A90E2", "#50E3C2", "#F5A623", "#BD10E0", "#F8E71C", "#FF6B6B"];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = 2 + Math.random() * 3 + "s";
      confetti.style.animationDelay = Math.random() * 0.5 + "s";
      confetti.style.animation = "confetti-fall linear forwards";
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 5000);
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Increment local click count
    const newLocalCount = localClickCount + 1;
    setLocalClickCount(newLocalCount);

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

    // Create particles on every click
    createParticles(x, y, 6);

    // Fire and forget - don't wait for the response
    (async () => {
      try {
        // Get user's current premium status and clicks for cool number checking
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium, total_clicks")
          .eq("id", userId)
          .single();

        const isPremium = profile?.is_premium || false;
        const currentUserClicks = profile?.total_clicks || 0;

        // Use secure RPC to increment global counter with server-side validation
        const { data: counterResult, error: counterError } = await supabase.rpc(
          "increment_global_counter_secure",
          {
            p_user_id: userId,
            p_is_premium: isPremium,
          }
        );

        if (counterError) {
          // Handle rate limiting gracefully
          if (counterError.message.includes("Rate limit")) {
            toast({
              title: "Slow down! ⏱️",
              description: "Please wait a moment between clicks",
              variant: "destructive",
              duration: 2000,
            });
            return;
          }
          throw counterError;
        }

        const newCount = (counterResult as any).new_count;
        const clickMultiplier = (counterResult as any).increment;

        // Record the click
        const { error: clickError } = await supabase.from("clicks").insert({
          user_id: userId,
          global_count_at_click: newCount,
        });

        if (clickError) throw clickError;

        // Use secure RPC to increment user clicks with server-side multiplier check
        const { data: actualMultiplier, error: userClickError } = await supabase.rpc(
          "increment_user_clicks_with_multiplier",
          { p_user_id: userId }
        );

        if (userClickError) throw userClickError;

        // Check for cool numbers on GLOBAL count
        await checkCoolNumber(newCount);

        // Update streak
        await updateStreak();

        // Check for achievements and milestones
        checkAchievements(newCount);

        onClickSuccess();

        // Show premium bonus toast based on server response
        if (actualMultiplier && actualMultiplier > 1) {
          toast({
            title: "Premium Bonus! 🌟",
            description: `+${actualMultiplier} clicks (2x multiplier active)`,
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

    // Check each achievement based on global count
    for (const achievement of achievements) {
      let shouldUnlock = false;

      if (achievement.condition_type === "global_count") {
        shouldUnlock = globalCount >= achievement.condition_value;
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
          .maybeSingle();

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

  // Get equipped button skin
  const buttonSkin = equippedItems.find(item => item.item_type === 'button_skin');
  const buttonStyle = buttonSkin?.preview_data?.background 
    ? { background: buttonSkin.preview_data.background }
    : { background: "var(--gradient-primary)" };
  const buttonEmoji = buttonSkin?.preview_data?.emoji || null;

  return (
    <>
      <div className="relative">
        <Button
          onClick={handleClick}
          className="relative overflow-hidden w-64 h-64 rounded-full text-6xl font-bold box-glow-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl"
          style={buttonStyle}
        >
          {buttonEmoji ? (
            <span className="select-none text-9xl drop-shadow-lg">
              {buttonEmoji}
            </span>
          ) : (
            <span className="select-none text-white font-extrabold drop-shadow-lg">
              CLICK
            </span>
          )}

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

        {/* Particle effects */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute rounded-full pointer-events-none"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
            }}
          />
        ))}
      </div>

      {/* Celebration overlay */}
      {celebration && celebration.show && (
        <div className="celebration-overlay">
          <div className="celebration-text glow-secondary">
            {celebration.text}
          </div>
        </div>
      )}
    </>
  );
};