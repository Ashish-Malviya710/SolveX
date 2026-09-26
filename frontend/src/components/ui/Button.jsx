import React from "react";
import { Link } from "react-router-dom";

/**
 * ClickHouse Phosphor Terminal Button Component
 * Single action trigger with Electric Lime (#faff69) primary or hair-line secondary variants.
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  to,
  href,
  type = "button",
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-sans font-medium transition-all duration-150 select-none focus:outline-none disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-buttons gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-buttons gap-2",
    lg: "px-7 py-3.5 text-base font-semibold rounded-buttons gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-bone text-ink font-semibold shadow-glow-sm hover:bg-white hover:shadow-glow-md active:translate-y-0 hover:-translate-y-0.5",
    secondary:
      "bg-onyx border border-slate-deep text-bone hover:bg-carbon hover:border-violet hover:text-white",
    ghost:
      "bg-transparent text-ash-mid hover:bg-onyx hover:text-bone",
    danger:
      "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/60 hover:text-white",
    outline:
      "bg-carbon border border-slate-deep text-bone hover:border-violet hover:bg-slate-deep hover:text-white",
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
    variantStyles[variant] || variantStyles.primary
  } ${className}`;

  const content = (
    <>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : Icon && iconPosition === "left" ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="w-4 h-4 flex-shrink-0" />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} target="_blank" rel="noreferrer" {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
