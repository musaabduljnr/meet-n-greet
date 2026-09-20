import React from "react";
import { Check, Clock, AlertCircle } from "lucide-react";

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: string;
  state: "completed" | "current" | "upcoming" | "error";
}

export interface TimelineProps {
  steps: TimelineStep[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  orientation = "horizontal",
  className = "",
}) => {
  return (
    <nav aria-label="Progress" className={`w-full ${className}`}>
      <ol
        className={`
          flex w-full
          ${orientation === "horizontal" ? "flex-col md:flex-row items-start md:items-center" : "flex-col"}
          gap-4 md:gap-0
        `}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`
                relative flex items-start md:items-center
                ${orientation === "horizontal" ? "w-full flex-1" : "pb-8 last:pb-0"}
              `}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    absolute pointer-events-none
                    ${
                      orientation === "horizontal"
                        ? "hidden md:block top-4 left-8 right-0 h-[2px]"
                        : "top-8 left-4 bottom-0 w-[2px]"
                    }
                    ${step.state === "completed" ? "bg-[#D4AF37]" : "bg-[#2A2A38]"}
                  `}
                  aria-hidden="true"
                />
              )}

              <div
                className={`
                  flex items-start gap-3.5
                  ${orientation === "horizontal" ? "md:flex-col md:items-start" : "flex-row"}
                `}
              >
                {/* Step Circle */}
                <div
                  className={`
                    relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors
                    ${
                      step.state === "completed"
                        ? "border-[#D4AF37] bg-[#D4AF37] text-[#09090B]"
                        : step.state === "current"
                        ? "border-[#D4AF37] bg-[#181820] text-[#D4AF37] ring-4 ring-[#D4AF37]/20"
                        : step.state === "error"
                        ? "border-[#EF4444] bg-[#EF4444] text-white"
                        : "border-[#2A2A38] bg-[#111115] text-[#6B6B7E]"
                    }
                  `}
                >
                  {step.state === "completed" ? (
                    <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                  ) : step.state === "current" ? (
                    <Clock className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                  ) : step.state === "error" ? (
                    <AlertCircle className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span
                    className={`
                      text-xs font-semibold tracking-wide uppercase
                      ${
                        step.state === "current"
                          ? "text-[#D4AF37]"
                          : step.state === "completed"
                          ? "text-[#F8F8FC]"
                          : step.state === "error"
                          ? "text-[#EF4444]"
                          : "text-[#6B6B7E]"
                      }
                    `}
                  >
                    {step.title}
                  </span>

                  {step.description && (
                    <p className="text-xs text-[#9E9EAF] mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  )}

                  {step.date && (
                    <span className="text-[11px] text-[#6B6B7E] mt-1 font-mono">
                      {step.date}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
