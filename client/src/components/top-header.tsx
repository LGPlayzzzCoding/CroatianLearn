import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function TopHeader() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user/default-user"],
  });

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Stats Left */}
        <div className="flex items-center space-x-4">
          {/* Streak */}
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-duolingo-gold rounded flex items-center justify-center">
              <span className="text-white text-xs">🔥</span>
            </div>
            <span className="font-bold text-duolingo-gold">{user.streak}</span>
          </div>
          
          {/* Gems */}
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-duolingo-blue rounded flex items-center justify-center">
              <span className="text-white text-xs">💎</span>
            </div>
            <span className="font-bold text-duolingo-blue">{user.gems}</span>
          </div>
        </div>
        
        {/* Stats Right */}
        <div className="flex items-center space-x-4">
          {/* Hearts */}
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-6 h-6 ${i < user.hearts ? 'text-duolingo-red' : 'text-gray-300'}`}>
                  {i < user.hearts ? '❤️' : '🤍'}
                </div>
              ))}
            </div>
          </div>
          
          {/* XP Counter */}
          <div className="bg-duolingo-green rounded-full px-3 py-1">
            <span className="text-white font-bold text-sm">{user.xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
