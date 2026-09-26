import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

/**
 * ClickHouse Modal Component
 * Sits at Level 3 (Slate Dark / Carbon) in the surface hierarchy.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="fixed inset-0 bg-void/80 backdrop-blur-sm -z-10"
        onClick={onClose}
      />
      <div
        className={`bg-carbon border border-iron rounded-cards w-full ${maxWidth} shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-iron/60 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-smoke mt-0.5">{subtitle}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-inputs text-smoke hover:text-white hover:bg-graphite transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-iron/60 bg-void/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
