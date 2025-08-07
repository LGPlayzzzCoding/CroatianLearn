import { useEffect, useState } from "react";
import { DuolingoButton } from "./ui/duolingo-button";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  totalXP: number;
}

export function CelebrationModal({ isOpen, onClose, xpEarned, totalXP }: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center relative overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce-slow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                {['🎉', '⭐', '💫', '✨'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 relative z-10">
          {/* Celebration Animation */}
          <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
          <h2 className="text-2xl font-bold text-duolingo-text mb-2">Lesson Complete!</h2>
          <p className="text-duolingo-text-light">You earned {xpEarned} XP</p>
        </div>
        
        {/* XP Progress */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-duolingo-text-light">{totalXP - xpEarned} XP</span>
            <span className="text-sm text-duolingo-text-light">{totalXP} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-duolingo-green h-3 rounded-full transition-all duration-1000" 
              style={{ width: "100%" }}
            />
          </div>
        </div>
        
        <DuolingoButton onClick={onClose} size="lg" className="w-full relative z-10">
          CONTINUE
        </DuolingoButton>
      </div>
    </div>
  );
}
