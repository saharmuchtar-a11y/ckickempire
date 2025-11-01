import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Crown, Lock, User, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (newUsername.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername.trim() })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: "Username updated successfully",
      });

      setUsernameDialogOpen(false);
      setNewUsername("");
      fetchData(); // Refresh profile data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: "Password updated successfully",
      });

      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-bg flex items-center justify-center">
        <div className="text-2xl glow-primary animate-glow-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-bg">
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

                {/* Account Management Section */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-semibold">Account Settings</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Manage Subscription */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/subscribe")}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>

                    {/* Change Username Dialog */}
                    <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Change Username
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Change Username</DialogTitle>
                          <DialogDescription>
                            Enter your new username. It must be at least 3 characters long.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="new-username">New Username</Label>
                            <Input
                              id="new-username"
                              placeholder="Enter new username"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              disabled={updating}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setUsernameDialogOpen(false)}
                            disabled={updating}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleUsernameChange} disabled={updating}>
                            {updating ? "Updating..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Change Password Dialog */}
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your new password. It must be at least 6 characters long.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              disabled={updating}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              disabled={updating}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setPasswordDialogOpen(false)}
                            disabled={updating}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handlePasswordChange} disabled={updating}>
                            {updating ? "Updating..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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