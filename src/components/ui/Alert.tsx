import React from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = "info",
  title,
  onDismiss,
  className = "",
  ...props
}) => {
  const variantConfig = {
    info: {
      container: "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#93C5FD]",
      icon: <Info className="h-5 w-5 text-[#60A5FA] shrink-0" aria-hidden="true" />,
      role: "status",
    },
    success: {
      container: "bg-[#10B981]/10 border-[#10B981]/30 text-[#6EE7B7]",
      icon: <CheckCircle2 className="h-5 w-5 text-[#34D399] shrink-0" aria-hidden="true" />,
      role: "status",
    },
    warning: {
      container: "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FDE68A]",
      icon: <AlertTriangle className="h-5 w-5 text-[#FBBF24] shrink-0" aria-hidden="true" />,
      role: "alert",
    },
    error: {
      container: "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#FCA5A5]",
      icon: <XCircle className="h-5 w-5 text-[#F87171] shrink-0" aria-hidden="true" />,
      role: "alert",
    },
  };

  const current = variantConfig[variant];

  return (
    <div
      role={current.role}
      className={`
        flex items-start gap-3 p-4 rounded-lg border text-sm leading-normal
        ${current.container} ${className}
      `}
      {...props}
    >
      <div className="pt-0.5">{current.icon}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-white tracking-tight mb-1">
            {title}
          </h4>
        )}
        <div className="text-current/90">{children}</div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss alert"
          className="text-current/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
