import * as React from "react";
import { cn } from "@/lib/utils";

interface DuolingoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const DuolingoButton = React.forwardRef<HTMLButtonElement, DuolingoButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-95 shadow-lg",
          {
            // Variants
            "bg-duolingo-green hover:bg-green-600 text-white border-b-4 border-green-700 hover:border-green-800": variant === 'primary',
            "bg-gray-200 hover:bg-gray-300 text-duolingo-text border-b-4 border-gray-400 hover:border-gray-500": variant === 'secondary',
            "bg-duolingo-green hover:bg-green-600 text-white border-b-4 border-green-700": variant === 'success',
            "bg-duolingo-red hover:bg-red-600 text-white border-b-4 border-red-700": variant === 'danger',
            
            // Sizes
            "px-3 py-2 text-sm": size === 'sm',
            "px-6 py-3 text-base": size === 'md',
            "px-8 py-4 text-lg": size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
DuolingoButton.displayName = "DuolingoButton";

export { DuolingoButton };
