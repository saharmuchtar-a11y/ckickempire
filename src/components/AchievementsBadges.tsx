import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface AchievementsBadgesProps {
  userId: string;
}

export const AchievementsBadges = ({ userId }: AchievementsBadgesProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAchievements();
    fetchUserAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("condition_value", { ascending: true });

    if (data) {
      setAchievements(data);
    }
  };

  const fetchUserAchievements = async () => {
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);

    if (data) {
      setUnlockedIds(new Set(data.map((ua) => ua.achievement_id)));
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-secondary/50 to-card border-2 border-primary/20">
      <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
        🏆 Your Epic Badges
        <span className="text-sm text-muted-foreground font-normal">
          ({unlockedIds.size}/{achievements.length})
        </span>
      </h3>
      <ScrollArea className="h-32">
        <div className="flex flex-wrap gap-2">
          {achievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`group relative transition-all duration-200 ${
                  isUnlocked 
                    ? "scale-100 hover:scale-110" 
                    : "scale-90 opacity-40 grayscale"
                }`}
                title={`${achievement.name}: ${achievement.description}`}
              >
                <div className={`text-4xl ${isUnlocked ? "animate-bounce-slow" : ""}`}>
                  {achievement.icon}
                </div>
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-card border border-border rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                    <div className="font-bold">{achievement.name}</div>
                    <div className="text-muted-foreground">{achievement.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
