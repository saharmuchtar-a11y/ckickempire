import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRarityColor, getRarityText } from "@/lib/coolNumbers";
import type { CoolNumberRarity } from "@/lib/coolNumbers";

interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  cosmetic_item: {
    id: string;
    name: string;
    description: string;
    category: string;
    rarity: CoolNumberRarity;
    image_url?: string;
  };
}

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
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

    // Fetch inventory with items
    const { data: inventoryData, error } = await (supabase as any)
      .from("user_inventory")
      .select(`
        *,
        cosmetic_item:cosmetic_items (*)
      `)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error fetching inventory:", error);
    } else if (inventoryData) {
      setInventory(inventoryData);
    }

    setLoading(false);
  };

  const equipItem = async (inventoryItem: InventoryItem) => {
    if (!profile) return;

    try {
      const category = inventoryItem.cosmetic_item.category;

      // Unequip all items in this category
      await (supabase as any)
        .from("user_inventory")
        .update({ is_equipped: false })
        .eq("user_id", profile.id)
        .eq("cosmetic_item.category", category);

      // Equip this item
      await (supabase as any)
        .from("user_inventory")
        .update({ is_equipped: true })
        .eq("id", inventoryItem.id);

      toast({
        title: "Item equipped! ✨",
        description: `${inventoryItem.cosmetic_item.name} is now active`,
      });

      fetchData(); // Refresh inventory
    } catch (error: any) {
      console.error("Error equipping item:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unequipItem = async (inventoryItem: InventoryItem) => {
    if (!profile) return;

    try {
      await (supabase as any)
        .from("user_inventory")
        .update({ is_equipped: false })
        .eq("id", inventoryItem.id);

      toast({
        title: "Item unequipped",
        description: `${inventoryItem.cosmetic_item.name} has been removed`,
      });

      fetchData(); // Refresh inventory
    } catch (error: any) {
      console.error("Error unequipping item:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'button_skin':
        return '🎨';
      case 'click_effect':
        return '✨';
      case 'profile_frame':
        return '🖼️';
      case 'chat_emote':
        return '😀';
      case 'sound_pack':
        return '🔊';
      case 'title':
        return '👑';
      default:
        return '🎁';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'button_skin':
        return 'Button Skins';
      case 'click_effect':
        return 'Click Effects';
      case 'profile_frame':
        return 'Profile Frames';
      case 'chat_emote':
        return 'Chat Emotes';
      case 'sound_pack':
        return 'Sound Packs';
      case 'title':
        return 'Titles';
      default:
        return 'Other';
    }
  };

  const filterByCategory = (items: InventoryItem[], category: string) => {
    if (category === 'all') return items;
    return items.filter(item => item.cosmetic_item.category === category);
  };

  const categories = [
    { key: 'all', label: '🎁 All Items' },
    { key: 'button_skin', label: '🎨 Button Skins' },
    { key: 'click_effect', label: '✨ Click Effects' },
    { key: 'profile_frame', label: '🖼️ Profile Frames' },
    { key: 'chat_emote', label: '😀 Chat Emotes' },
    { key: 'sound_pack', label: '🔊 Sound Packs' },
    { key: 'title', label: '👑 Titles' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen space-bg flex items-center justify-center">
        <div className="text-2xl glow-primary">Loading inventory...</div>
      </div>
    );
  }

  const filteredItems = filterByCategory(inventory, activeTab);
  const equippedCount = inventory.filter(item => item.is_equipped).length;

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
            🎒 Your Inventory
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Manage your cosmetics and customize your experience
          </p>
          
          <div className="flex items-center justify-center gap-6 text-lg">
            <div className="bg-card/80 px-6 py-3 rounded-lg border border-border">
              <span className="text-muted-foreground">Total Items: </span>
              <span className="font-bold text-primary">
                {inventory.length}
              </span>
            </div>
            <div className="bg-card/80 px-6 py-3 rounded-lg border border-border">
              <span className="text-muted-foreground">Equipped: </span>
              <span className="font-bold text-green-400">
                {equippedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-7xl mx-auto">
          <TabsList className="grid grid-cols-7 w-full mb-8">
            {categories.map(cat => (
              <TabsTrigger key={cat.key} value={cat.key}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.key} value={cat.key}>
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-2xl font-bold mb-2 text-muted-foreground">
                    No items in this category
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Open cases to get cosmetics!
                  </p>
                  <Button onClick={() => navigate("/cases")} className="box-glow-primary">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Open Cases
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-6 bg-card/80 backdrop-blur-sm border-2 transition-all"
                      style={{
                        borderColor: item.is_equipped 
                          ? getRarityColor(item.cosmetic_item.rarity)
                          : 'hsl(var(--border))',
                        boxShadow: item.is_equipped 
                          ? `0 0 20px ${getRarityColor(item.cosmetic_item.rarity)}40`
                          : 'none',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-4 relative">
                          {getCategoryIcon(item.cosmetic_item.category)}
                          {item.is_equipped && (
                            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">
                          {item.cosmetic_item.name}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.cosmetic_item.description}
                        </p>

                        <div 
                          className="text-sm font-bold mb-4"
                          style={{ color: getRarityColor(item.cosmetic_item.rarity) }}
                        >
                          {getRarityText(item.cosmetic_item.rarity)}
                        </div>

                        <div className="text-xs text-muted-foreground mb-4">
                          {getCategoryName(item.cosmetic_item.category)}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                        </div>

                        {item.is_equipped ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => unequipItem(item)}
                          >
                            Unequip
                          </Button>
                        ) : (
                          <Button
                            className="w-full box-glow-primary"
                            onClick={() => equipItem(item)}
                            style={{
                              backgroundColor: getRarityColor(item.cosmetic_item.rarity),
                            }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Equip
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Inventory;

