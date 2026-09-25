import React from "react";

/**
 * ClickHouse Badge & Status Indicator Component
 */
export const Badge = ({
  children,
  variant = "lime",
  size = "sm",
  pill = true,
  dot = false,
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
  };

  const variantStyles = {
    lime: "bg-lime-dark text-lime border border-lime/20",
    primary: "bg-lime-dark text-lime border border-lime/20",
    neutral: "bg-carbon text-ash-light border border-slate-deep",
    success: "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30",
    warning: "bg-amber-950/60 text-amber-300 border border-amber-500/30",
    danger: "bg-red-950/60 text-red-300 border border-red-500/30",
    ghost: "bg-transparent text-smoke border border-iron",
  };

  const dotColor = {
    lime: "bg-lime",
    primary: "bg-lime",
    neutral: "bg-smoke",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    ghost: "bg-smoke",
  };

  return (
    <span
      className={`inline-flex items-center font-medium font-sans tracking-wide ${
        pill ? "rounded-pills" : "rounded-tags"
      } ${sizeStyles[size] || sizeStyles.sm} ${
        variantStyles[variant] || variantStyles.lime
      } ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
            dotColor[variant] || "bg-lime"
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
