import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle2 } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  goal_value: number;
  reward_text: string;
}

interface DailyChallengeProps {
  userId: string;
}

export const DailyChallenge = ({ userId }: DailyChallengeProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChallenges();
    fetchCompletions();
  }, [userId]);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from("daily_challenges")
      .select("*")
      .limit(3);

    if (data) {
      setChallenges(data);
    }
  };

  const fetchCompletions = async () => {
    const { data } = await supabase
      .from("user_challenge_completions")
      .select("challenge_id")
      .eq("user_id", userId);

    if (data) {
      setCompletedIds(new Set(data.map((c) => c.challenge_id)));
    }
  };

  return (
    <Card className="p-4 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Daily Challenges</h3>
      </div>
      <div className="space-y-2">
        {challenges.map((challenge) => {
          const isCompleted = completedIds.has(challenge.id);
          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : "bg-secondary/50 border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {challenge.title}
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {challenge.description}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {challenge.reward_text}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
