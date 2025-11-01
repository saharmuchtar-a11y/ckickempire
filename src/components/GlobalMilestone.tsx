import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface Milestone {
  id: string;
  milestone_value: number;
  title: string;
  description: string;
  icon: string;
  reached: boolean;
}

export const GlobalMilestone = () => {
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [globalCount, setGlobalCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchGlobalCount();
    fetchNextMilestone();

    // Subscribe to global counter changes
    const channel = supabase
      .channel("global_counter_milestone")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_counter",
        },
        (payload: any) => {
          setGlobalCount(payload.new.count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (nextMilestone) {
      const prog = (globalCount / nextMilestone.milestone_value) * 100;
      setProgress(Math.min(prog, 100));
    }
  }, [globalCount, nextMilestone]);

  const fetchGlobalCount = async () => {
    const { data } = await supabase
      .from("global_counter")
      .select("count")
      .eq("id", 1)
      .single();

    if (data) {
      setGlobalCount(data.count);
    }
  };

  const fetchNextMilestone = async () => {
    const { data: counter } = await supabase
      .from("global_counter")
      .select("count")
      .eq("id", 1)
      .single();

    if (counter) {
      const { data: milestone } = await supabase
        .from("global_milestones")
        .select("*")
        .gt("milestone_value", counter.count)
        .eq("reached", false)
        .order("milestone_value", { ascending: true })
        .limit(1)
        .single();

      if (milestone) {
        setNextMilestone(milestone);
      }
    }
  };

  if (!nextMilestone) return null;

  return (
    <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Next Milestone</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{nextMilestone.icon}</div>
          <div className="flex-1">
            <div className="font-bold text-primary">{nextMilestone.title}</div>
            <div className="text-sm text-muted-foreground">
              {nextMilestone.description}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{globalCount.toLocaleString()} clicks</span>
            <span>{nextMilestone.milestone_value.toLocaleString()} goal</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
