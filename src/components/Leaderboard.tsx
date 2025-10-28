import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  username: string;
  total_clicks: number;
  is_premium: boolean;
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, total_clicks, is_premium")
        .order("total_clicks", { ascending: false })
        .limit(10);

      if (data) {
        setLeaders(data);
      }
    };

    fetchLeaderboard();

    // Refresh every 10 seconds
    const interval = setInterval(fetchLeaderboard, 10000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-primary" />;
    if (index === 1) return <Medal className="h-5 w-5 text-secondary" />;
    if (index === 2) return <Award className="h-5 w-5 text-accent" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-lg glow-accent">Top Clickers 🏆</h3>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-2">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center justify-center w-8">
                {getIcon(index)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-primary glow-primary">
                  {leader.username} 👑
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {leader.total_clicks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">clicks</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};