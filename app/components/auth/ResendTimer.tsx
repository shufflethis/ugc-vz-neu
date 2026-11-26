'use client';

import { useEffect, useState } from 'react';

interface ResendTimerProps {
  initialSeconds?: number;
  resetTrigger: number;
  onResend: () => Promise<void> | void;
  disabled?: boolean;
}

export default function ResendTimer({
  initialSeconds = 60,
  resetTrigger,
  onResend,
  disabled = false,
}: ResendTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds, resetTrigger]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const handleClick = async () => {
    if (secondsLeft > 0 || resending || disabled) return;
    setResending(true);
    try {
      await onResend();
      setSecondsLeft(initialSeconds);
    } finally {
      setResending(false);
    }
  };

  if (secondsLeft > 0) {
    return (
      <span className="text-xs font-medium tabular-nums text-[#5C5A55]">
        Code erneut senden (in {secondsLeft} s)
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={resending || disabled}
      className="text-xs font-semibold text-[#6C2BD9] underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      {resending ? 'Code wird gesendet ...' : 'Code erneut senden'}
    </button>
  );
}
