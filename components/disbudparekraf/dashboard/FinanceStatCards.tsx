import React from 'react';
import { FINANCE_CARDS, type FinanceCard } from '@/components/disbudparekraf/dashboard/demoData';

function Card({ card }: { card: FinanceCard }) {
  const navy = card.variant === 'navy';
  return (
    <div
      className={`rounded-[14px] h-[130px] p-5 flex flex-col justify-between ${
        navy
          ? 'bg-[#0D2453] text-white'
          : 'bg-white border border-[#E6ECF5] shadow-xs'
      }`}
    >
      <span className={`text-[12px] ${navy ? 'text-white' : 'text-[#64748B]'}`}>{card.label}</span>
      <span
        className={`text-[32px] font-semibold leading-[1.2] tracking-[-0.8px] ${
          navy ? 'text-white' : 'text-[#0D2453]'
        }`}
      >
        {card.value}
      </span>
      <span className={`text-[11px] ${navy ? 'text-white/90' : 'text-[#64748B]'}`}>
        {card.note}
      </span>
    </div>
  );
}

/** Empat kartu ringkasan keuangan periode berjalan (Figma 422:1010–422:1025). */
export default function FinanceStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {FINANCE_CARDS.map((card) => (
        <Card key={card.label} card={card} />
      ))}
    </div>
  );
}
