import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Award, TrendingUp, Target } from "lucide-react";
import type { User } from "@shared/schema";

const CURRENT_USER_ID = "default-user";

export default function Profile() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", CURRENT_USER_ID],
  });

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const completionPercentage = ((user.completedLessons?.length || 0) / 50) * 100;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-duolingo-gray">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <TopHeader />
        
        <main className="flex-1 p-4 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-duolingo-green rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-duolingo-text">{user.username}</CardTitle>
                    <p className="text-duolingo-text-light">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                  <TrendingUp className="h-4 w-4 text-duolingo-green" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-duolingo-green">{user.xp.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Calendar className="h-4 w-4 text-duolingo-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-duolingo-gold">{user.streak} days</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
                  <Target className="h-4 w-4 text-duolingo-blue" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-duolingo-blue">
                    {user.completedLessons?.length || 0} / 50
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gems</CardTitle>
                  <Award className="h-4 w-4 text-duolingo-blue" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-duolingo-blue">{user.gems}</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Section */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-duolingo-text-light mb-2">
                      <span>CroatianLearn Course</span>
                      <span>{completionPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-duolingo-green">Unit 1</div>
                      <div className="text-sm text-duolingo-text-light">Basic Sentences</div>
                      <Progress value={Math.min(((user.completedLessons?.length || 0) / 10) * 100, 100)} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">Unit 2</div>
                      <div className="text-sm text-gray-400">Navigate Places</div>
                      <Progress value={Math.max(0, ((user.completedLessons?.length || 0) - 10) / 10 * 100)} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">Unit 3</div>
                      <div className="text-sm text-gray-400">Express Yourself</div>
                      <Progress value={Math.max(0, ((user.completedLessons?.length || 0) - 20) / 10 * 100)} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">Unit 4</div>
                      <div className="text-sm text-gray-400">Past & Future</div>
                      <Progress value={Math.max(0, ((user.completedLessons?.length || 0) - 30) / 10 * 100)} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">Unit 5</div>
                      <div className="text-sm text-gray-400">Advanced</div>
                      <Progress value={Math.max(0, ((user.completedLessons?.length || 0) - 40) / 10 * 100)} className="h-2 mt-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.achievements?.includes("first_lesson") && (
                    <div className="flex items-center space-x-3 p-3 bg-duolingo-green/10 rounded-lg">
                      <div className="w-10 h-10 bg-duolingo-green rounded-full flex items-center justify-center">
                        <span className="text-white">🎉</span>
                      </div>
                      <div>
                        <div className="font-semibold text-duolingo-text">First Lesson</div>
                        <div className="text-sm text-duolingo-text-light">Completed your first lesson</div>
                      </div>
                    </div>
                  )}
                  
                  {(user.completedLessons?.length || 0) >= 5 && (
                    <div className="flex items-center space-x-3 p-3 bg-duolingo-blue/10 rounded-lg">
                      <div className="w-10 h-10 bg-duolingo-blue rounded-full flex items-center justify-center">
                        <span className="text-white">🏃</span>
                      </div>
                      <div>
                        <div className="font-semibold text-duolingo-text">Getting Started</div>
                        <div className="text-sm text-duolingo-text-light">Completed 5 lessons</div>
                      </div>
                    </div>
                  )}
                  
                  {user.streak >= 7 && (
                    <div className="flex items-center space-x-3 p-3 bg-duolingo-gold/10 rounded-lg">
                      <div className="w-10 h-10 bg-duolingo-gold rounded-full flex items-center justify-center">
                        <span className="text-white">🔥</span>
                      </div>
                      <div>
                        <div className="font-semibold text-duolingo-text">Week Warrior</div>
                        <div className="text-sm text-duolingo-text-light">7-day streak</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
