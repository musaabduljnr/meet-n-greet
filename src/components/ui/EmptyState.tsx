import React from "react";
import { FolderSearch } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2A2A38] rounded-xl bg-[#111115]/50">
      <div className="h-12 w-12 rounded-full bg-[#181820] border border-[#2A2A38] flex items-center justify-center text-[#D4AF37] mb-4">
        {icon || <FolderSearch className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-[#F8F8FC] tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-[#9E9EAF] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
