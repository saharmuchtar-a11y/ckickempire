import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, PackageOpen, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRarityColor, getRarityText } from "@/lib/coolNumbers";
import type { CoolNumberRarity } from "@/lib/coolNumbers";

interface CaseType {
  id: string;
  name: string;
  description: string;
  price_coins?: number;
  price_gems?: number;
  price_usd?: number;
  is_free: boolean;
  cooldown_hours?: number;
  image_url?: string;
  rarity_weights: Record<string, number>;
}

interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: CoolNumberRarity;
  image_url?: string;
}

interface OpeningResult {
  items: CosmeticItem[];
  isOpening: boolean;
}

const Cases = () => {
  const [cases, setCases] = useState<CaseType[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<OpeningResult | null>(null);
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

    // Fetch cases
    const { data: casesData } = await (supabase as any)
      .from("case_types")
      .select("*");

    if (casesData) {
      setCases(casesData);
    }

    setLoading(false);
  };

  const openCase = async (caseType: CaseType) => {
    if (!profile) return;

    // Note: coins and gems currency not yet implemented
    // When implemented, add these fields to the profiles table and uncomment these checks
    /*
    if (caseType.price_coins && profile.coins < caseType.price_coins) {
      toast({
        title: "Not enough coins! 🪙",
        description: `You need ${caseType.price_coins} coins to open this case.`,
        variant: "destructive",
      });
      return;
    }

    if (caseType.price_gems && profile.gems < caseType.price_gems) {
      toast({
        title: "Not enough gems! 💎",
        description: `You need ${caseType.price_gems} gems to open this case.`,
        variant: "destructive",
      });
      return;
    }
    */

    setOpening({ items: [], isOpening: true });

    try {
      // For now, allow all cases to be opened for free
      
      // Determine rarity based on weights
      const rarity = selectRarityFromWeights(caseType.rarity_weights);

      // Fetch random items of that rarity
      const { data: items } = await (supabase as any)
        .from("cosmetic_items")
        .select("*")
        .eq("rarity", rarity)
        .limit(3);

      if (!items || items.length === 0) {
        throw new Error("No items found");
      }

      // Pick 1-3 random items
      const wonItems = items.slice(0, Math.floor(Math.random() * 3) + 1);

      // Add items to user inventory
      for (const item of wonItems) {
        await (supabase as any).from("user_inventory").insert({
          user_id: profile.id,
          item_id: item.id,
        });
      }

      // Record opening
      await (supabase as any).from("case_openings").insert({
        user_id: profile.id,
        case_type_id: caseType.id,
        items_won: wonItems.map(i => ({ id: i.id, name: i.name, rarity: i.rarity })),
      });

      // Show results after animation
      setTimeout(() => {
        setOpening({ items: wonItems, isOpening: false });
        
        toast({
          title: "Case opened! 🎉",
          description: `You got ${wonItems.length} item(s)!`,
          duration: 5000,
        });

        fetchData(); // Refresh profile balance
      }, 3000);
    } catch (error: any) {
      console.error("Error opening case:", error);
      toast({
        title: "Error opening case",
        description: error.message,
        variant: "destructive",
      });
      setOpening(null);
    }
  };

  const selectRarityFromWeights = (weights: Record<string, number>): CoolNumberRarity => {
    const rarities: CoolNumberRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (const rarity of rarities) {
      const weight = weights[rarity] || 0;
      if (random < weight) {
        return rarity;
      }
      random -= weight;
    }

    return 'common';
  };

  const closeResults = () => {
    setOpening(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen space-bg flex items-center justify-center">
        <div className="text-2xl glow-primary">Loading cases...</div>
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

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold glow-primary mb-4">
            🎁 Cases & Loot Boxes
          </h1>
          <p className="text-xl text-muted-foreground">
            Open cases to get cosmetics, effects, and exclusive items!
          </p>
          
          {/* Currency display */}
          {profile && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="text-lg bg-yellow-900/30 px-6 py-3 rounded-lg border border-yellow-600/50">
                <span className="text-yellow-200">🪙 </span>
                <span className="font-bold text-yellow-400">
                  {profile.coins?.toLocaleString() || 0}
                </span>
              </div>
              <div className="text-lg bg-purple-900/30 px-6 py-3 rounded-lg border border-purple-600/50">
                <span className="text-purple-200">💎 </span>
                <span className="font-bold text-purple-400">
                  {profile.gems?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {cases.map((caseType) => (
            <Card
              key={caseType.id}
              className="p-6 bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => !opening && openCase(caseType)}
            >
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  📦
                </div>
                <h3 className="text-xl font-bold mb-2 glow-primary">
                  {caseType.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {caseType.description}
                </p>

                {caseType.is_free ? (
                  <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg border border-green-600/50 font-bold">
                    FREE
                    {caseType.cooldown_hours && (
                      <div className="text-xs text-green-300 mt-1">
                        Every {caseType.cooldown_hours}h
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseType.price_coins && (
                      <div className="bg-yellow-900/30 text-yellow-400 px-4 py-2 rounded-lg border border-yellow-600/50 font-bold">
                        🪙 {caseType.price_coins.toLocaleString()}
                      </div>
                    )}
                    {caseType.price_gems && (
                      <div className="bg-purple-900/30 text-purple-400 px-4 py-2 rounded-lg border border-purple-600/50 font-bold">
                        💎 {caseType.price_gems.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  className="w-full mt-4 box-glow-primary"
                  disabled={opening !== null}
                >
                  <PackageOpen className="h-4 w-4 mr-2" />
                  Open Case
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Opening animation / Results modal */}
        {opening && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border-2 border-primary rounded-xl p-8 max-w-2xl w-full mx-4">
              {opening.isOpening ? (
                <div className="text-center">
                  <div className="text-8xl mb-6 animate-bounce">
                    📦
                  </div>
                  <h2 className="text-3xl font-bold glow-primary mb-2">
                    Opening case...
                  </h2>
                  <p className="text-muted-foreground">
                    Let's see what you got!
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-3xl font-bold glow-secondary mb-6">
                    🎉 You won! 🎉
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {opening.items.map((item) => (
                      <Card
                        key={item.id}
                        className="p-4 border-2"
                        style={{
                          borderColor: getRarityColor(item.rarity),
                          boxShadow: `0 0 20px ${getRarityColor(item.rarity)}40`,
                        }}
                      >
                        <div className="text-4xl mb-2">
                          {item.category === 'button_skin' && '🎨'}
                          {item.category === 'click_effect' && '✨'}
                          {item.category === 'profile_frame' && '🖼️'}
                          {item.category === 'chat_emote' && '😀'}
                          {item.category === 'sound_pack' && '🔊'}
                        </div>
                        <h3 className="font-bold mb-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <div
                          className="text-sm font-bold"
                          style={{ color: getRarityColor(item.rarity) }}
                        >
                          {getRarityText(item.rarity)}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Button onClick={closeResults} size="lg" className="box-glow-primary">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Awesome!
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;

