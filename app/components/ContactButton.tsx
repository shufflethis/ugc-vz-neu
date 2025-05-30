'use client';

import { useState } from 'react';
import ContactPopup from './ContactPopup';

interface ContactButtonProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'primary' | 'secondary';
}

export default function ContactButton({
  children,
  className = '',
  title,
  subtitle,
  variant = 'primary'
}: ContactButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const baseClasses = variant === 'primary'
    ? "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
    : "border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105";

  return (
    <>
      <button
        onClick={() => setIsPopupOpen(true)}
        className={`inline-flex items-center justify-center ${className || baseClasses}`}
      >
        {children}
      </button>

      <ContactPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title={title}
        subtitle={subtitle}
      />
    </>
  );
}
