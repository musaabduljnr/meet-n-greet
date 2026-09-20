import React from "react";

export type RegistrationStatusType =
  | "REGISTERED"
  | "SCHEDULE_PENDING"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type FanCardStatusType =
  | "REGISTERED"
  | "PROCESSING"
  | "PREPARED"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_ISSUE"
  | "CANCELLED";

interface StatusIndicatorProps {
  type: "registration" | "fan_card";
  status: RegistrationStatusType | FanCardStatusType;
  showDot?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  status,
  showDot = true,
  className = "",
}) => {
  // Label and styling mapping
  const getStatusConfig = () => {
    switch (status) {
      case "REGISTERED":
        return {
          label: "Registered",
          dotColor: "bg-[#94A3B8]",
          textColor: "text-[#CBD5E1]",
          bgColor: "bg-[#94A3B8]/10",
          borderColor: "border-[#94A3B8]/30",
        };
      case "SCHEDULE_PENDING":
        return {
          label: "Schedule Pending",
          dotColor: "bg-[#F59E0B]",
          textColor: "text-[#FBBF24]",
          bgColor: "bg-[#F59E0B]/10",
          borderColor: "border-[#F59E0B]/30",
        };
      case "SCHEDULED":
        return {
          label: "Scheduled",
          dotColor: "bg-[#3B82F6]",
          textColor: "text-[#60A5FA]",
          bgColor: "bg-[#3B82F6]/10",
          borderColor: "border-[#3B82F6]/30",
        };
      case "PROCESSING":
        return {
          label: "Processing",
          dotColor: "bg-[#8B5CF6]",
          textColor: "text-[#A78BFA]",
          bgColor: "bg-[#8B5CF6]/10",
          borderColor: "border-[#8B5CF6]/30",
        };
      case "PREPARED":
        return {
          label: "Prepared",
          dotColor: "bg-[#06B6D4]",
          textColor: "text-[#22D3EE]",
          bgColor: "bg-[#06B6D4]/10",
          borderColor: "border-[#06B6D4]/30",
        };
      case "SHIPPED":
        return {
          label: "Shipped",
          dotColor: "bg-[#3B82F6]",
          textColor: "text-[#60A5FA]",
          bgColor: "bg-[#3B82F6]/10",
          borderColor: "border-[#3B82F6]/30",
        };
      case "IN_TRANSIT":
        return {
          label: "In Transit",
          dotColor: "bg-[#D4AF37]",
          textColor: "text-[#F3E5AB]",
          bgColor: "bg-[#D4AF37]/10",
          borderColor: "border-[#D4AF37]/30",
        };
      case "OUT_FOR_DELIVERY":
        return {
          label: "Out for Delivery",
          dotColor: "bg-[#D4AF37] animate-pulse",
          textColor: "text-[#F3E5AB]",
          bgColor: "bg-[#D4AF37]/15",
          borderColor: "border-[#D4AF37]/40",
        };
      case "DELIVERED":
      case "COMPLETED":
        return {
          label: status === "COMPLETED" ? "Completed" : "Delivered",
          dotColor: "bg-[#10B981]",
          textColor: "text-[#34D399]",
          bgColor: "bg-[#10B981]/10",
          borderColor: "border-[#10B981]/30",
        };
      case "DELIVERY_ISSUE":
        return {
          label: "Delivery Issue",
          dotColor: "bg-[#EF4444]",
          textColor: "text-[#F87171]",
          bgColor: "bg-[#EF4444]/10",
          borderColor: "border-[#EF4444]/30",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          dotColor: "bg-[#64748B]",
          textColor: "text-[#94A3B8]",
          bgColor: "bg-[#64748B]/10",
          borderColor: "border-[#64748B]/30",
        };
      default:
        return {
          label: String(status),
          dotColor: "bg-[#94A3B8]",
          textColor: "text-[#94A3B8]",
          bgColor: "bg-[#181820]",
          borderColor: "border-[#2A2A38]",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.textColor} ${className}`}
      aria-label={`${type === "registration" ? "Registration Status" : "Fan Card Status"}: ${config.label}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
