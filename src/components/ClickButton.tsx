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
    setIsClicking(true);

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
      const { error: profileError } = await supabase.rpc("increment_user_clicks", {
        user_id: userId,
      });

      // Check for achievements
      checkAchievements(newCount);

      onClickSuccess();
    } catch (error: any) {
      toast({
        title: "Click failed!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClicking(false);
    }
  };

  const checkAchievements = async (count: number) => {
    const specialNumbers = [666, 777, 6969, 10000, 42069];
    if (specialNumbers.includes(count)) {
      toast({
        title: `🎉 SPECIAL NUMBER! ${count}`,
        description: "You hit a legendary number!",
      });
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        disabled={isClicking}
        className="relative overflow-hidden w-64 h-64 rounded-full text-8xl font-bold box-glow-primary hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
        style={{
          background: "var(--gradient-primary)",
        }}
      >
        <span className="glow-primary animate-glow-pulse select-none">CLICK</span>

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