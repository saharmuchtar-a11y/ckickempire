import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlobalCounter } from "@/components/GlobalCounter";
import { ClickButton } from "@/components/ClickButton";
import { Chat } from "@/components/Chat";
import { Leaderboard } from "@/components/Leaderboard";
import { AchievementsBadges } from "@/components/AchievementsBadges";
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
      <header className="border-b-2 border-primary/20 bg-white/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                🎯 Click Empire
              </h1>
              {profile && (
                <div className="text-sm bg-secondary/50 px-3 py-1 rounded-full border border-primary/20">
                  <span className="text-muted-foreground">Your clicks: </span>
                  <span className="font-bold text-primary">
                    {profile.total_clicks.toLocaleString()} 🎉
                  </span>
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
                variant="outline"
                size="sm"
                onClick={() => navigate("/subscribe")}
                className="box-glow-primary"
              >
                <Crown className="h-4 w-4 mr-2" />
                Go Premium
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>

          {/* Main Click Area */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-6">
            <GlobalCounter />
            <ClickButton
              currentCount={currentCount}
              onClickSuccess={handleClickSuccess}
              userId={user.id}
            />
            <p className="text-foreground/60 text-center max-w-md font-medium">
              Join the global clicking madness! Every click counts toward the
              worldwide total. Can you hit a legendary number? 👀
            </p>
            
            {/* Achievements Section */}
            <div className="w-full max-w-2xl mt-4">
              <AchievementsBadges userId={user.id} />
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 h-[600px]">
            <Chat
              userId={user.id}
              username={profile?.username || "Anonymous"}
              isPremium={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;