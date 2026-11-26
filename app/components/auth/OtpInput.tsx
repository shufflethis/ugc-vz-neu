'use client';

import { ClipboardEvent, KeyboardEvent, useEffect, useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  shakeKey?: number;
  idPrefix?: string;
}

const LENGTH = 6;

/**
 * 6-Feld-OTP-Eingabe nach Spec 8.10 (otp_input):
 * - Einfuegen fuellt alle 6 Felder und triggert Auto-Submit
 * - Auto-Fokus vorwaerts/rueckwaerts
 * - Fehler-Shake ausschliesslich per CSS transform (respektiert prefers-reduced-motion)
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  shakeKey = 0,
  idPrefix = 'otp-digit',
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, idx) => value[idx] || '');

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const commit = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, LENGTH);
    onChange(clean);
    if (clean.length === LENGTH && onComplete) {
      onComplete(clean);
    }
  };

  const handleDigitChange = (index: number, raw: string) => {
    const onlyDigits = raw.replace(/\D/g, '');
    if (!onlyDigits) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    if (onlyDigits.length > 1) {
      commit(onlyDigits);
      const nextIdx = Math.min(LENGTH - 1, onlyDigits.length - 1);
      refs.current[nextIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = onlyDigits[0];
    const joined = next.join('');
    onChange(joined);
    if (index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
    if (joined.length === LENGTH && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        onChange(next.join(''));
        e.preventDefault();
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        onChange(next.join(''));
        refs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    refs.current[Math.min(LENGTH - 1, pasted.length - 1)]?.focus();
  };

  return (
    <div
      key={shakeKey}
      className={`grid grid-cols-6 gap-2 sm:gap-2.5 ${hasError && shakeKey > 0 ? 'otp-shake' : ''}`}
      role="group"
      aria-label="6-stelliger Anmeldecode"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Ziffer ${index + 1} von ${LENGTH}`}
          maxLength={LENGTH}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={`min-h-[52px] w-full rounded-xl border bg-white text-center font-mono text-2xl font-bold tabular-nums text-[#202124] outline-none transition-colors focus:ring-4 disabled:opacity-60 ${
            hasError
              ? 'border-[#D93025] focus:border-[#D93025] focus:ring-[#D93025]/15'
              : 'border-[#DCE2EA] focus:border-[#06458F] focus:ring-[#06458F]/15'
          }`}
        />
      ))}
    </div>
  );
}
