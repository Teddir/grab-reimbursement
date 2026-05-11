"use client";

import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = "primary", 
  className, 
  isLoading, 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20",
    secondary: "bg-card text-foreground border border-border hover:bg-muted",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
  };

  return (
    <button
      className={cn(
        "h-12 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95",
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
  );
};
