'use client';

import { useState } from 'react';

export interface FaqTabGroup {
  id: 'marken' | 'creator' | 'abrechnung' | 'technik';
  label: string;
  items: Array<{ question: string; answer: string }>;
}

export default function FaqTabsClient({ groups }: { groups: FaqTabGroup[] }) {
  const [activeId, setActiveId] = useState<FaqTabGroup['id']>(groups[0]?.id || 'marken');

  return (
    <div>
      {/* 4 Tabs als Segmented Control */}
      <div
        role="tablist"
        aria-label="FAQ Themenbereiche"
        className="flex flex-wrap justify-center gap-2 rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-2"
      >
        {groups.map((group) => {
          const selected = activeId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              id={`faq-tab-${group.id}`}
              aria-selected={selected}
              aria-controls={`faq-panel-${group.id}`}
              onClick={() => setActiveId(group.id)}
              className={`min-h-[44px] rounded-full px-5 text-sm font-semibold transition-colors duration-150 ${
                selected
                  ? 'bg-[#121212] text-[#F7F6F2]'
                  : 'text-[#5C5A55] hover:bg-white hover:text-[#121212]'
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* Alle 4 Tab-Panels serverseitig im HTML (hidden="until-found" fuer SEO & KI) */}
      <div className="mt-8">
        {groups.map((group) => {
          const isVisible = activeId === group.id;
          return (
            <section
              key={group.id}
              id={`faq-panel-${group.id}`}
              role="tabpanel"
              aria-labelledby={`faq-tab-${group.id}`}
              // @ts-expect-error React 18 forwards hidden="until-found" to DOM
              hidden={!isVisible ? 'until-found' : undefined}
              className="space-y-3"
            >
              <h2 className="sr-only">{group.label}</h2>
              {group.items.map((item, idx) => (
                <details
                  key={item.question}
                  open={idx === 0}
                  className="group rounded-[20px] border border-[#E4E1D8] bg-white px-5 transition-colors open:border-[#121212]/30 sm:px-6"
                >
                  <summary className="flex min-h-[62px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base font-semibold text-[#121212] sm:text-lg [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span
                      className="shrink-0 text-xl font-normal text-[#5C5A55] transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-sm leading-7 text-[#5C5A55] sm:text-base">{item.answer}</p>
                </details>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
