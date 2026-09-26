import React from "react";

/**
 * ClickHouse Standardized Layout Container
 * Enforces unified max-width (1200px), responsive gutter padding, and vertical rhythm.
 */
export const Container = ({
  children,
  size = "normal",
  className = "",
  as = "div",
  ...props
}) => {
  const Tag = as;

  const sizeMap = {
    narrow: "max-w-3xl",      // ~768px (Auth / Focused forms)
    normal: "max-w-[1200px]", // ClickHouse standard ~1200px
    wide: "max-w-7xl",        // ~1280px
    full: "max-w-full",
  };

  return (
    <Tag
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeMap[size] || sizeMap.normal} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const PageWrapper = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <main className={`min-h-[calc(100vh-4rem)] bg-void text-paper py-8 sm:py-12 ${className}`} {...props}>
      {children}
    </main>
  );
};

export default Container;
