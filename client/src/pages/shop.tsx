import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DuolingoButton } from "@/components/ui/duolingo-button";
import { Badge } from "@/components/ui/badge";
import { Heart, Flame, Shield, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const CURRENT_USER_ID = "default-user";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  type: 'hearts' | 'streak' | 'boost' | 'protection';
  benefit: string;
}

const shopItems: ShopItem[] = [
  {
    id: 'refill-hearts',
    name: 'Refill Hearts',
    description: 'Restore all your hearts to full',
    price: 350,
    icon: Heart,
    type: 'hearts',
    benefit: 'Instant full hearts'
  },
  {
    id: 'streak-freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for one day if you forget to practice',
    price: 200,
    icon: Shield,
    type: 'protection',
    benefit: 'One day protection'
  },
  {
    id: 'double-xp',
    name: 'Double XP Boost',
    description: 'Earn double XP for the next 5 lessons',
    price: 500,
    icon: Zap,
    type: 'boost',
    benefit: '5 lessons 2x XP'
  },
  {
    id: 'streak-repair',
    name: 'Streak Repair',
    description: 'Repair your broken streak and get back on track',
    price: 450,
    icon: Flame,
    type: 'streak',
    benefit: 'Restore your streak'
  },
];

export default function Shop() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", CURRENT_USER_ID],
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async (item: ShopItem) => {
      if (!user) throw new Error("User not found");
      
      if (user.gems < item.price) {
        throw new Error("Not enough gems");
      }

      let updates: Partial<User> = { gems: user.gems - item.price };

      switch (item.type) {
        case 'hearts':
          updates.hearts = 5;
          break;
        case 'streak':
          updates.streak = (user.streak || 0) + 1;
          break;
        case 'boost':
          // This would require additional tracking in the user model
          break;
        case 'protection':
          // This would require additional tracking in the user model
          break;
      }

      return apiRequest("POST", `/api/user/${CURRENT_USER_ID}/update`, updates);
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", CURRENT_USER_ID] });
      toast({
        title: "Purchase Successful!",
        description: `You bought ${item.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-duolingo-gray">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <TopHeader />
        
        <main className="flex-1 p-4 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Shop Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-duolingo-text">Shop</CardTitle>
                    <p className="text-duolingo-text-light">Use your gems to get helpful items</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-duolingo-blue rounded flex items-center justify-center">
                      <span className="text-white text-sm">💎</span>
                    </div>
                    <span className="text-2xl font-bold text-duolingo-blue">{user.gems}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Shop Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {shopItems.map((item) => {
                const Icon = item.icon;
                const canAfford = user.gems >= item.price;
                const isUseful = 
                  (item.type === 'hearts' && user.hearts < 5) ||
                  (item.type === 'streak' && user.streak === 0) ||
                  item.type === 'boost' ||
                  item.type === 'protection';

                return (
                  <Card key={item.id} className={`relative ${!canAfford ? 'opacity-50' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            item.type === 'hearts' ? 'bg-duolingo-red' :
                            item.type === 'streak' ? 'bg-duolingo-gold' :
                            item.type === 'boost' ? 'bg-purple-500' :
                            'bg-duolingo-blue'
                          }`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <p className="text-sm text-duolingo-text-light">{item.description}</p>
                          </div>
                        </div>
                        {isUseful && (
                          <Badge variant="secondary" className="bg-duolingo-green text-white">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-duolingo-blue rounded flex items-center justify-center">
                            <span className="text-white text-xs">💎</span>
                          </div>
                          <span className="font-bold text-duolingo-blue text-xl">{item.price}</span>
                        </div>
                        <DuolingoButton
                          variant="primary"
                          size="sm"
                          disabled={!canAfford || purchaseItemMutation.isPending}
                          onClick={() => purchaseItemMutation.mutate(item)}
                        >
                          {!canAfford ? 'Not enough gems' : 'BUY'}
                        </DuolingoButton>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.benefit}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* How to Earn Gems */}
            <Card>
              <CardHeader>
                <CardTitle>How to Earn Gems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-duolingo-green/10 rounded-lg">
                    <div className="w-10 h-10 bg-duolingo-green rounded-full flex items-center justify-center">
                      <span className="text-white">📚</span>
                    </div>
                    <div>
                      <div className="font-semibold text-duolingo-text">Complete Lessons</div>
                      <div className="text-sm text-duolingo-text-light">Earn gems for each lesson</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-duolingo-gold/10 rounded-lg">
                    <div className="w-10 h-10 bg-duolingo-gold rounded-full flex items-center justify-center">
                      <span className="text-white">🔥</span>
                    </div>
                    <div>
                      <div className="font-semibold text-duolingo-text">Maintain Streaks</div>
                      <div className="text-sm text-duolingo-text-light">Bonus gems for consistency</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-duolingo-blue/10 rounded-lg">
                    <div className="w-10 h-10 bg-duolingo-blue rounded-full flex items-center justify-center">
                      <span className="text-white">🎯</span>
                    </div>
                    <div>
                      <div className="font-semibold text-duolingo-text">Perfect Lessons</div>
                      <div className="text-sm text-duolingo-text-light">Extra gems for no mistakes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
