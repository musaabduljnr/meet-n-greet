import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      className = "",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

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
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-[#D4AF37]" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#6B6B7E]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            className={`
              w-full h-11 rounded-md bg-[#111115] text-[#F8F8FC] placeholder:text-[#6B6B7E] text-sm
              border transition-colors duration-150
              ${error ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#2A2A38] focus:border-[#D4AF37]"}
              ${leftIcon ? "pl-10" : "pl-3.5"}
              ${rightIcon ? "pr-10" : "pr-3.5"}
              focus-visible:outline-none focus-visible:ring-1 ${error ? "focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#D4AF37]"}
              disabled:opacity-50 disabled:bg-[#09090B] disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#6B6B7E]">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";
