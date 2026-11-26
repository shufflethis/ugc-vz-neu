'use client';

import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function InlineError({ message, actionLabel, onAction }: InlineErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[#D93025]/25 bg-[#FEF2F2] px-3.5 py-3 text-sm leading-5 text-[#B42318]"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#D93025]" aria-hidden="true" />
      <div className="space-y-1.5">
        <p>{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-[#202124] underline underline-offset-2 hover:opacity-80"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
