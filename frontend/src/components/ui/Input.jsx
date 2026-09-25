import React, { forwardRef } from "react";

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      rightElement,
      className = "",
      containerClassName = "",
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label} {required && <span className="text-lime">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-smoke">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`input-field ${Icon ? "pl-10" : ""} ${
              rightElement ? "pr-10" : ""
            } ${error ? "input-error" : ""} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-smoke mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      className = "",
      containerClassName = "",
      required,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label} {required && <span className="text-lime">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          required={required}
          className={`textarea-field ${error ? "input-error" : ""} ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-smoke mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      children,
      className = "",
      containerClassName = "",
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label} {required && <span className="text-lime">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          required={required}
          className={`select-field ${error ? "input-error" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-smoke mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

export default Input;
