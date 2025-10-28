import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GlobalCounter = () => {
  const [count, setCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    // Fetch initial count
    const fetchCount = async () => {
      const { data } = await supabase
        .from("global_counter")
        .select("count")
        .eq("id", 1)
        .single();

      if (data) {
        setCount(data.count);
        setDisplayCount(data.count);
      }
    };

    fetchCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("global_counter_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_counter",
        },
        (payload: any) => {
          setCount(payload.new.count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Animate count changes
  useEffect(() => {
    if (count !== displayCount) {
      const diff = count - displayCount;
      const step = diff > 0 ? 1 : -1;
      const duration = Math.min(Math.abs(diff) * 50, 500);
      const steps = Math.abs(diff);
      const stepDuration = duration / steps;

      let current = displayCount;
      const interval = setInterval(() => {
        current += step;
        setDisplayCount(current);
        if (current === count) {
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [count, displayCount]);

  return (
    <div className="text-center">
      <p className="text-muted-foreground text-lg mb-2">Global Clicks</p>
      <div className="text-7xl font-bold glow-primary animate-glow-pulse">
        {displayCount.toLocaleString()}
      </div>
    </div>
  );
};