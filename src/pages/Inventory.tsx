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

interface Item {
  id: string;
  name: string;
  description: string;
  item_type: string;
  rarity: CoolNumberRarity;
  image_url?: string;
  preview_data?: any;
}

interface UserItem {
  id: string;
  item_id: string;
  equipped: boolean;
  obtained_at: string;
  items: Item;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<UserItem[]>([]);
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
    const { data: inventoryData, error } = await supabase
      .from("user_items")
      .select(`
        *,
        items (*)
      `)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error fetching inventory:", error);
    } else if (inventoryData) {
      setInventory(inventoryData as any);
    }

    setLoading(false);
  };

  const equipItem = async (userItem: UserItem) => {
    if (!profile) return;

    try {
      const itemType = userItem.items.item_type;

      // Unequip all items of this type for this user
      const { data: userItems } = await supabase
        .from("user_items")
        .select("id, items!inner(item_type)")
        .eq("user_id", profile.id)
        .eq("items.item_type", itemType);

      if (userItems) {
        await supabase
          .from("user_items")
          .update({ equipped: false })
          .in("id", userItems.map((item: any) => item.id));
      }

      // Equip this item
      await supabase
        .from("user_items")
        .update({ equipped: true })
        .eq("id", userItem.id);

      toast({
        title: "Item equipped! ✨",
        description: `${userItem.items.name} is now active`,
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

  const unequipItem = async (userItem: UserItem) => {
    if (!profile) return;

    try {
      await supabase
        .from("user_items")
        .update({ equipped: false })
        .eq("id", userItem.id);

      toast({
        title: "Item unequipped",
        description: `${userItem.items.name} has been removed`,
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

  const getCategoryIcon = (itemType: string) => {
    switch (itemType) {
      case 'button_skin':
        return '🎨';
      case 'animation':
        return '✨';
      case 'cursor':
        return '🖱️';
      default:
        return '🎁';
    }
  };

  const getCategoryName = (itemType: string) => {
    switch (itemType) {
      case 'button_skin':
        return 'Button Skins';
      case 'animation':
        return 'Animations';
      case 'cursor':
        return 'Cursors';
      default:
        return 'Other';
    }
  };

  const filterByCategory = (items: UserItem[], category: string) => {
    if (category === 'all') return items;
    return items.filter(item => item.items.item_type === category);
  };

  const categories = [
    { key: 'all', label: '🎁 All Items' },
    { key: 'button_skin', label: '🎨 Button Skins' },
    { key: 'animation', label: '✨ Animations' },
    { key: 'cursor', label: '🖱️ Cursors' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen space-bg flex items-center justify-center">
        <div className="text-2xl glow-primary">Loading inventory...</div>
      </div>
    );
  }

  const filteredItems = filterByCategory(inventory, activeTab);
  const equippedCount = inventory.filter(item => item.equipped).length;

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
          <TabsList className="grid grid-cols-4 w-full mb-8">
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
                  {filteredItems.map((userItem) => (
                    <Card
                      key={userItem.id}
                      className="p-6 bg-card/80 backdrop-blur-sm border-2 transition-all"
                      style={{
                        borderColor: userItem.equipped 
                          ? getRarityColor(userItem.items.rarity)
                          : 'hsl(var(--border))',
                        boxShadow: userItem.equipped 
                          ? `0 0 20px ${getRarityColor(userItem.items.rarity)}40`
                          : 'none',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-4 relative">
                          {getCategoryIcon(userItem.items.item_type)}
                          {userItem.equipped && (
                            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">
                          {userItem.items.name}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {userItem.items.description}
                        </p>

                        <div 
                          className="text-sm font-bold mb-4"
                          style={{ color: getRarityColor(userItem.items.rarity) }}
                        >
                          {getRarityText(userItem.items.rarity)}
                        </div>

                        <div className="text-xs text-muted-foreground mb-4">
                          {getCategoryName(userItem.items.item_type)}
                        </div>

                        {userItem.equipped ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => unequipItem(userItem)}
                          >
                            Unequip
                          </Button>
                        ) : (
                          <Button
                            className="w-full box-glow-primary"
                            onClick={() => equipItem(userItem)}
                            style={{
                              backgroundColor: getRarityColor(userItem.items.rarity),
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

