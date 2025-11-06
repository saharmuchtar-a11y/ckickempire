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
  is_free: boolean;
  one_time_only: boolean;
  image_url?: string;
  already_opened?: boolean;
}

interface Item {
  id: string;
  name: string;
  description: string;
  item_type: string;
  rarity: CoolNumberRarity;
  image_url?: string;
}

interface OpeningResult {
  items: Item[];
  isOpening: boolean;
}

const Cases = () => {
  const [cases, setCases] = useState<CaseType[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<OpeningResult | null>(null);
  const [openedCases, setOpenedCases] = useState<Set<string>>(new Set());
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
    const { data: casesData } = await supabase
      .from("cases")
      .select("*");

    if (casesData) {
      setCases(casesData);
    }

    // Fetch user's opened cases
    const { data: openingsData } = await supabase
      .from("user_case_openings")
      .select("case_id")
      .eq("user_id", session.user.id);

    if (openingsData) {
      setOpenedCases(new Set(openingsData.map(o => o.case_id)));
    }

    setLoading(false);
  };

  const openCase = async (caseType: CaseType) => {
    if (!profile) return;

    // Check if already opened (for one-time cases)
    if (caseType.one_time_only && openedCases.has(caseType.id)) {
      toast({
        title: "Already opened! 📦",
        description: "You've already opened this one-time case.",
        variant: "destructive",
      });
      return;
    }

    setOpening({ items: [], isOpening: true });

    try {
      // Get all items in this case
      const { data: caseItems } = await supabase
        .from("case_items")
        .select(`
          items (*)
        `)
        .eq("case_id", caseType.id);

      if (!caseItems || caseItems.length === 0) {
        throw new Error("No items in this case");
      }

      // Extract the items
      const allItems = caseItems.map((ci: any) => ci.items).filter(Boolean);

      // Randomly pick 1-3 items
      const numItems = Math.min(Math.floor(Math.random() * 3) + 1, allItems.length);
      const wonItems: Item[] = [];
      const usedIndices = new Set<number>();

      while (wonItems.length < numItems) {
        const randomIndex = Math.floor(Math.random() * allItems.length);
        if (!usedIndices.has(randomIndex)) {
          wonItems.push(allItems[randomIndex]);
          usedIndices.add(randomIndex);
        }
      }

      // Add items to user inventory
      for (const item of wonItems) {
        // Check if user already has this item
        const { data: existing } = await supabase
          .from("user_items")
          .select("id")
          .eq("user_id", profile.id)
          .eq("item_id", item.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("user_items").insert({
            user_id: profile.id,
            item_id: item.id,
          });
        }
      }

      // Record opening
      await supabase.from("user_case_openings").insert({
        user_id: profile.id,
        case_id: caseType.id,
      });

      // Show results after animation
      setTimeout(() => {
        setOpening({ items: wonItems, isOpening: false });
        
        toast({
          title: "Case opened! 🎉",
          description: `You got ${wonItems.length} item(s)!`,
          duration: 5000,
        });

        fetchData(); // Refresh to update opened status
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
        </div>

        {/* Cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cases.map((caseType) => {
            const alreadyOpened = openedCases.has(caseType.id);
            const canOpen = !alreadyOpened || !caseType.one_time_only;
            
            return (
              <Card
                key={caseType.id}
                className={`p-6 bg-card/80 backdrop-blur-sm border-2 transition-all ${
                  canOpen && !opening
                    ? 'border-border hover:border-primary/50 cursor-pointer group'
                    : 'border-muted opacity-60 cursor-not-allowed'
                }`}
                onClick={() => canOpen && !opening && openCase(caseType)}
              >
                <div className="text-center">
                  <div className={`text-6xl mb-4 ${canOpen ? 'group-hover:scale-110 transition-transform' : ''}`}>
                    📦
                  </div>
                  <h3 className="text-xl font-bold mb-2 glow-primary">
                    {caseType.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {caseType.description}
                  </p>

                  {caseType.is_free ? (
                    <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg border border-green-600/50 font-bold mb-2">
                      FREE
                      {caseType.one_time_only && (
                        <div className="text-xs text-green-300 mt-1">
                          One-time only
                        </div>
                      )}
                    </div>
                  ) : null}

                  {alreadyOpened && caseType.one_time_only && (
                    <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg border border-border font-bold mb-2">
                      ✓ Already Opened
                    </div>
                  )}

                  <Button 
                    className="w-full mt-2 box-glow-primary"
                    disabled={!canOpen || opening !== null}
                  >
                    <PackageOpen className="h-4 w-4 mr-2" />
                    {alreadyOpened && caseType.one_time_only ? 'Opened' : 'Open Case'}
                  </Button>
                </div>
              </Card>
            );
          })}
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
                          {item.item_type === 'button_skin' && '🎨'}
                          {item.item_type === 'animation' && '✨'}
                          {item.item_type === 'cursor' && '🖱️'}
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

