import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface ClickStreakProps {
  userId: string;
}

export const ClickStreak = ({ userId }: ClickStreakProps) => {
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    fetchStreak();
  }, [userId]);

  const fetchStreak = async () => {
    const { data } = await supabase
      .from("click_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setStreak({
        current: data.current_streak,
        longest: data.longest_streak,
      });
    }
  };

  return (
    <Card className="p-4 border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground font-medium">
            Daily Streak
          </div>
          <div className="text-3xl font-bold text-primary flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            {streak.current} Days
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Record</div>
          <div className="text-xl font-semibold">{streak.longest}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Click daily to maintain your streak
      </div>
    </Card>
  );
};
