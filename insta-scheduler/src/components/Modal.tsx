"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div 
        className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        
        <div
          className={`
            relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-3xl 
            bg-white shadow-2xl transition-all animate-slide-up
            ring-1 ring-black/5
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white transition-all shadow-lg"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


