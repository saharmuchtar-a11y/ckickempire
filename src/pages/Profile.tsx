import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch all achievements
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*");

    // Fetch user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", session.user.id);

    if (allAchievements) {
      const achievementsWithStatus = allAchievements.map((ach) => {
        const unlocked = userAchievements?.find(
          (ua) => ua.achievement_id === ach.id
        );
        return {
          ...ach,
          unlocked_at: unlocked?.unlocked_at,
        };
      });
      setAchievements(achievementsWithStatus);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-2xl glow-primary animate-glow-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Game
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Stats */}
          <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 box-glow-primary">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center text-4xl">
                🎮
              </div>
              <h2 className="text-2xl font-bold glow-primary mb-2">
                {profile?.username} 👑
              </h2>
              <p className="text-muted-foreground mb-6">
                Premium Member
              </p>

              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">
                    {profile?.total_clicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Clicks</div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-3xl font-bold text-secondary">
                    {achievements.filter((a) => a.unlocked_at).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Achievements Unlocked
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="md:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold glow-primary">Achievements</h3>
              </div>
            </div>

            <ScrollArea className="h-[600px]">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.unlocked_at
                        ? "bg-muted border-primary box-glow-primary"
                        : "bg-muted/50 border-border opacity-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {achievement.unlocked_at && (
                          <p className="text-xs text-primary mt-2">
                            Unlocked{" "}
                            {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;