"use client";

import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const Input = ({ label, icon: Icon, className, ...props }: InputProps) => (
  <div className="space-y-2 w-full">
    {label && (
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        className={cn(
          "w-full h-14 bg-muted border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium dark:text-white outline-none",
          Icon && "pl-12",
          className
        )}
        {...props}
      />
    </div>
  </div>
);
