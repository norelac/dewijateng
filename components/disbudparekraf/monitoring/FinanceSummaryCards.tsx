import React from 'react';

export type FinanceCard = {
  label: string;
  value: string;
  note: string;
  variant: 'navy' | 'white' | 'amber';
};

/**
 * Kartu ringkasan keuangan. Dipakai di dashboard (Figma 422:1010-422:1025) dan
 * layar monitoring (Figma 422:604, 422:665, 422:726, 422:787).
 */
export default function FinanceSummaryCards({
  cards,
  compact = false,
}: {
  cards: FinanceCard[];
  compact?: boolean;
}) {
  const columns =
    cards.length === 3
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  return (
    <div className={`grid ${columns} gap-4 w-full`}>
      {cards.map((card) => {
        const navy = card.variant === 'navy';
        return (
          <div
            key={card.label}
            className={`rounded-[14px] p-5 flex flex-col justify-between gap-2 ${
              compact ? 'min-h-[104px]' : 'h-[130px]'
            } ${navy ? 'bg-[#0D2453] text-white' : 'bg-white border border-[#E6ECF5] shadow-xs'}`}
          >
            <span className={`text-[12px] ${navy ? 'text-white' : 'text-[#64748B]'}`}>
              {card.label}
            </span>
            <span
              className={`font-semibold leading-[1.2] tracking-[-0.5px] ${
                compact ? 'text-[24px]' : 'text-[32px] tracking-[-0.8px]'
              } ${
                navy
                  ? 'text-white'
                  : card.variant === 'amber'
                    ? 'text-[#875B12]'
                    : 'text-[#0D2453]'
              }`}
            >
              {card.value}
            </span>
            <span className={`text-[11px] ${navy ? 'text-white/90' : 'text-[#64748B]'}`}>
              {card.note}
            </span>
          </div>
        );
      })}
    </div>
  );
}
