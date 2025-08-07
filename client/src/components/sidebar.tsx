import { Link, useLocation } from "wouter";
import { Home, Users, Trophy, BookOpen, ShoppingBag, User } from "lucide-react";

const navigation = [
  { name: "Learn", href: "/", icon: Home, current: true },
  { name: "Practice", href: "/practice", icon: BookOpen, current: false },
  { name: "Leaderboards", href: "/leaderboard", icon: Trophy, current: false },
  { name: "Quests", href: "/quests", icon: BookOpen, current: false },
  { name: "Shop", href: "/shop", icon: ShoppingBag, current: false },
  { name: "Profile", href: "/profile", icon: User, current: false },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-lg z-30">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-duolingo-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CL</span>
            </div>
            <span className="ml-2 text-xl font-bold text-duolingo-text">CroatianLearn</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location === "/" && item.href === "/");
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`${
                    isActive
                      ? "bg-duolingo-green text-white"
                      : "text-duolingo-text-light hover:bg-gray-100"
                  } group flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
