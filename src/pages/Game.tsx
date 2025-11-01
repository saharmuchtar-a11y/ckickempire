import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlobalCounter } from "@/components/GlobalCounter";
import { ClickButton } from "@/components/ClickButton";
import { Chat } from "@/components/Chat";
import { Leaderboard } from "@/components/Leaderboard";
import { AchievementsBadges } from "@/components/AchievementsBadges";
import { ClickStreak } from "@/components/ClickStreak";
import { DailyChallenge } from "@/components/DailyChallenge";
import { GlobalMilestone } from "@/components/GlobalMilestone";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { User, LogOut, Crown } from "lucide-react";

const Game = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleClickSuccess = () => {
    // Refresh user stats
    if (user) {
      fetchProfile(user.id);
    }
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
      {/* Header */}
      <header className="border-b-2 border-border bg-white backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-primary">
                Click Empire
              </h1>
              {profile && (
                <div className="flex items-center gap-3">
                  <div className="text-sm bg-secondary px-4 py-2 rounded-md border border-border">
                    <span className="text-muted-foreground">Clicks: </span>
                    <span className="font-bold text-primary">
                      {profile.total_clicks.toLocaleString()}
                    </span>
                  </div>
                  <ShareButton clicks={profile.total_clicks} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/subscribe")}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0 shadow-sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Premium
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Leaderboard & Milestones */}
          <div className="lg:col-span-3 space-y-4">
            <Leaderboard />
            <GlobalMilestone />
          </div>

          {/* Main Click Area */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
            <GlobalCounter />
            <ClickButton
              currentCount={currentCount}
              onClickSuccess={handleClickSuccess}
              userId={user.id}
            />
            <p className="text-muted-foreground text-center max-w-md text-sm">
              Every click contributes to the global count. Premium members get 2x multiplier!
            </p>
            
            {/* User Stats Grid */}
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ClickStreak userId={user.id} />
              <DailyChallenge userId={user.id} />
            </div>

            {/* Achievements Section */}
            <div className="w-full max-w-2xl mt-2">
              <AchievementsBadges userId={user.id} />
            </div>
          </div>

          {/* Right Sidebar - Chat */}
          <div className="lg:col-span-3 h-[700px]">
            <Chat
              userId={user.id}
              username={profile?.username || "Anonymous"}
              isPremium={profile?.is_premium || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;