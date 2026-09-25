import React from "react";
import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

/**
 * ClickHouse PageHeader Component
 * Provides clean vertical hierarchy: Eyebrow label -> Headline -> Description + Action Slot.
 */
export const PageHeader = ({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
  className = "",
}) => {
  return (
    <div className={`mb-8 pb-6 border-b border-iron/60 flex flex-col md:flex-row md:items-end justify-between gap-4 ${className}`}>
      <div className="space-y-2 max-w-3xl">
        {/* Breadcrumbs or Eyebrow */}
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-smoke font-mono">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <FiChevronRight className="w-3.5 h-3.5 text-iron" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-lime transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-paper">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : eyebrow ? (
          <div className="eyebrow flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-cursor-blink" />
            <span>{eyebrow}</span>
          </div>
        ) : null}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-smoke leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action CTA slot */}
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
