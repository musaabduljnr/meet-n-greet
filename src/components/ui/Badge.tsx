import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "info" | "error" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const variantStyles = {
    default: "bg-[#D4AF37]/10 text-[#F3E5AB] border border-[#D4AF37]/30",
    secondary: "bg-[#181820] text-[#A1A1B2] border border-[#2A2A38]",
    success: "bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/30",
    warning: "bg-[#F59E0B]/10 text-[#FBBF24] border border-[#F59E0B]/30",
    info: "bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/30",
    error: "bg-[#EF4444]/10 text-[#F87171] border border-[#EF4444]/30",
    neutral: "bg-[#272732] text-[#E2E8F0] border border-[#3E3E52]",
  };

  const dotColors = {
    default: "bg-[#D4AF37]",
    secondary: "bg-[#A1A1B2]",
    success: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    info: "bg-[#3B82F6]",
    error: "bg-[#EF4444]",
    neutral: "bg-[#94A3B8]",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full tracking-wide select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
