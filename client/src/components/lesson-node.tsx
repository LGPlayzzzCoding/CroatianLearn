import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface LessonNodeProps {
  lesson: Lesson;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  position: 'center' | 'left' | 'right';
  onClick: () => void;
  stars?: number;
}

export function LessonNode({ 
  lesson, 
  isCompleted, 
  isCurrent, 
  isLocked, 
  position, 
  onClick, 
  stars = 0 
}: LessonNodeProps) {
  return (
    <div className={cn(
      "flex",
      position === 'center' && "justify-center",
      position === 'left' && "justify-start ml-8 lg:ml-16",
      position === 'right' && "justify-end mr-8 lg:mr-16"
    )}>
      <div className="relative">
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 cursor-pointer hover:scale-105 transition-transform",
            isCompleted && "bg-duolingo-green border-white",
            isCurrent && "bg-duolingo-green border-duolingo-green-light animate-pulse-slow",
            isLocked && "bg-gray-300 border-white cursor-not-allowed hover:scale-100"
          )}
          onClick={() => !isLocked && onClick()}
        >
          {isCompleted ? (
            <Check className="w-8 h-8 text-white" />
          ) : isLocked ? (
            <Lock className="w-8 h-8 text-gray-500" />
          ) : (
            <span className="text-white text-2xl font-bold">{lesson.id}</span>
          )}
        </div>
        
        {/* Lesson Title */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <p className={cn(
            "text-sm font-semibold whitespace-nowrap",
            isLocked ? "text-gray-500" : "text-duolingo-text"
          )}>
            {lesson.title}
          </p>
        </div>
        
        {/* Stars for completed lessons */}
        {isCompleted && stars > 0 && (
          <div className="absolute -top-2 -right-2 flex">
            {Array.from({ length: Math.min(stars, 3) }).map((_, i) => (
              <span key={i} className="text-duolingo-gold text-lg">⭐</span>
            ))}
          </div>
        )}
        
        {/* Progress Ring for current lesson */}
        {isCurrent && !isCompleted && (
          <svg className="absolute inset-0 w-20 h-20 transform -rotate-90">
            <circle 
              cx="40" 
              cy="40" 
              r="36" 
              stroke="#E5E7EB" 
              strokeWidth="4" 
              fill="transparent"
            />
            <circle 
              cx="40" 
              cy="40" 
              r="36" 
              stroke="var(--duolingo-green)" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="226" 
              strokeDashoffset="135" 
              className="transition-all duration-500"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
