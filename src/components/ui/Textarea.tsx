import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = "",
      disabled,
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;

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
            htmlFor={textareaId}
            className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-[#D4AF37]" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          className={`
            w-full rounded-md bg-[#111115] text-[#F8F8FC] placeholder:text-[#6B6B7E] text-sm p-3.5
            border transition-colors duration-150 resize-y min-h-[80px]
            ${error ? "border-[#EF4444] focus:border-[#EF4444]" : "border-[#2A2A38] focus:border-[#D4AF37]"}
            focus-visible:outline-none focus-visible:ring-1 ${error ? "focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#D4AF37]"}
            disabled:opacity-50 disabled:bg-[#09090B] disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = "Textarea";
