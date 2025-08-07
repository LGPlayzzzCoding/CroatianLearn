import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import type { User } from "@shared/schema";

interface LeaderboardUser {
  id: string;
  username: string;
  xp: number;
  streak: number;
  completedLessons: number;
  rank: number;
}

const CURRENT_USER_ID = "default-user";

// Mock leaderboard data - in a real app this would come from the API
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: "user1",
    username: "CroatianMaster",
    xp: 2500,
    streak: 45,
    completedLessons: 50,
    rank: 1,
  },
  {
    id: "user2", 
    username: "LanguageLover",
    xp: 2100,
    streak: 30,
    completedLessons: 42,
    rank: 2,
  },
  {
    id: "user3",
    username: "StudyBuddy",
    xp: 1800,
    streak: 25,
    completedLessons: 35,
    rank: 3,
  },
  {
    id: "default-user",
    username: "learner",
    xp: 1250,
    streak: 7,
    completedLessons: 12,
    rank: 4,
  },
  {
    id: "user4",
    username: "QuickLearner",
    xp: 950,
    streak: 15,
    completedLessons: 20,
    rank: 5,
  },
  {
    id: "user5",
    username: "SteadyProgress",
    xp: 750,
    streak: 12,
    completedLessons: 18,
    rank: 6,
  },
  {
    id: "user6",
    username: "NewStarter",
    xp: 500,
    streak: 5,
    completedLessons: 10,
    rank: 7,
  },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-duolingo-gold" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Award className="w-6 h-6 text-yellow-600" />;
    default:
      return <Trophy className="w-6 h-6 text-duolingo-text-light" />;
  }
}

function getRankBadgeColor(rank: number) {
  switch (rank) {
    case 1:
      return "bg-duolingo-gold text-white";
    case 2:
      return "bg-gray-400 text-white";
    case 3:
      return "bg-yellow-600 text-white";
    default:
      return "bg-duolingo-blue text-white";
  }
}

export default function Leaderboard() {
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user", CURRENT_USER_ID],
  });

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const currentUserRank = mockLeaderboardData.find(u => u.id === CURRENT_USER_ID);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-duolingo-gray">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <TopHeader />
        
        <main className="flex-1 p-4 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Leaderboard Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-duolingo-text flex items-center space-x-2">
                      <Trophy className="w-8 h-8 text-duolingo-gold" />
                      <span>Leaderboard</span>
                    </CardTitle>
                    <p className="text-duolingo-text-light">See how you rank against other CroatianLearn users</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-duolingo-green">#{currentUserRank?.rank || 'N/A'}</div>
                    <div className="text-sm text-duolingo-text-light">Your Rank</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Top 3 Podium */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-end space-x-8">
                  {/* 2nd Place */}
                  {mockLeaderboardData[1] && (
                    <div className="text-center">
                      <div className="w-20 h-16 bg-gray-300 rounded-t-lg flex items-end justify-center mb-2">
                        <span className="text-white font-bold text-lg mb-2">2</span>
                      </div>
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-gray-400">
                        <AvatarFallback className="bg-duolingo-blue text-white text-lg font-bold">
                          {mockLeaderboardData[1].username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-duolingo-text">{mockLeaderboardData[1].username}</div>
                      <div className="text-sm text-duolingo-text-light">{mockLeaderboardData[1].xp} XP</div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {mockLeaderboardData[0] && (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-duolingo-gold rounded-t-lg flex items-end justify-center mb-2">
                        <Crown className="w-8 h-8 text-white mb-2" />
                      </div>
                      <Avatar className="w-20 h-20 mx-auto mb-2 border-4 border-duolingo-gold">
                        <AvatarFallback className="bg-duolingo-green text-white text-xl font-bold">
                          {mockLeaderboardData[0].username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-bold text-duolingo-text text-lg">{mockLeaderboardData[0].username}</div>
                      <div className="text-duolingo-text-light">{mockLeaderboardData[0].xp} XP</div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {mockLeaderboardData[2] && (
                    <div className="text-center">
                      <div className="w-20 h-12 bg-yellow-600 rounded-t-lg flex items-end justify-center mb-2">
                        <span className="text-white font-bold text-lg mb-1">3</span>
                      </div>
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-yellow-600">
                        <AvatarFallback className="bg-duolingo-blue text-white text-lg font-bold">
                          {mockLeaderboardData[2].username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-duolingo-text">{mockLeaderboardData[2].username}</div>
                      <div className="text-sm text-duolingo-text-light">{mockLeaderboardData[2].xp} XP</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>All Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockLeaderboardData.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                        user.id === CURRENT_USER_ID 
                          ? 'bg-duolingo-green/10 border-duolingo-green' 
                          : 'bg-white border-gray-200 hover:border-duolingo-green/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(user.rank)}
                          <Badge className={getRankBadgeColor(user.rank)}>
                            #{user.rank}
                          </Badge>
                        </div>
                        
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-duolingo-blue text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className={`font-semibold ${user.id === CURRENT_USER_ID ? 'text-duolingo-green' : 'text-duolingo-text'}`}>
                            {user.username}
                            {user.id === CURRENT_USER_ID && (
                              <Badge variant="outline" className="ml-2 text-xs bg-duolingo-green text-white">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-duolingo-text-light">
                            {user.completedLessons} lessons completed
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="font-bold text-duolingo-green text-lg">
                          {user.xp.toLocaleString()} XP
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-duolingo-text-light">
                          <span>🔥</span>
                          <span>{user.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* League Information */}
            <Card>
              <CardHeader>
                <CardTitle>About Leagues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-duolingo-green/10 rounded-lg">
                    <Trophy className="w-8 h-8 text-duolingo-green mx-auto mb-2" />
                    <div className="font-semibold text-duolingo-text">Compete Weekly</div>
                    <div className="text-sm text-duolingo-text-light">
                      Rankings reset every Monday
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-duolingo-blue/10 rounded-lg">
                    <Award className="w-8 h-8 text-duolingo-blue mx-auto mb-2" />
                    <div className="font-semibold text-duolingo-text">Earn XP</div>
                    <div className="text-sm text-duolingo-text-light">
                      Complete lessons to climb ranks
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-duolingo-gold/10 rounded-lg">
                    <Crown className="w-8 h-8 text-duolingo-gold mx-auto mb-2" />
                    <div className="font-semibold text-duolingo-text">Win Rewards</div>
                    <div className="text-sm text-duolingo-text-light">
                      Top performers get bonus gems
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
