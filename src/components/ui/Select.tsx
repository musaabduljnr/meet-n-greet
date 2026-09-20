import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      placeholder,
      id,
      className = "",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-[#D4AF37]" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            className={`
              w-full h-11 appearance-none rounded-md bg-[#111115] text-[#F8F8FC] text-sm
              border transition-colors duration-150 pl-3.5 pr-10
              ${error ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#2A2A38] focus:border-[#D4AF37]"}
              focus-visible:outline-none focus-visible:ring-1 ${error ? "focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#D4AF37]"}
              disabled:opacity-50 disabled:bg-[#09090B] disabled:cursor-not-allowed cursor-pointer
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#181820] text-[#6B6B7E]">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#181820] text-[#F8F8FC] py-2"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3.5 pointer-events-none text-[#6B6B7E] flex items-center">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {error && (
          <p id={errorId} className="text-xs text-[#EF4444] flex items-center gap-1" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#6B6B7E]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
