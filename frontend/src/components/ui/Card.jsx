import React from "react";

/**
 * ClickHouse Carbon Card Component
 * Level 1 surface in the 5-step elevation stack.
 */
export const Card = ({
  children,
  hoverable = false,
  className = "",
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-carbon border border-iron rounded-cards text-paper shadow-card-inset ${
        hoverable
          ? "hover:border-steel hover:bg-graphite hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-iron/60 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", as = "h3", ...props }) => {
  const Tag = as;
  return (
    <Tag className={`text-base sm:text-lg font-bold text-white tracking-tight ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-xs sm:text-sm text-smoke mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-t border-iron/60 bg-void/30 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
