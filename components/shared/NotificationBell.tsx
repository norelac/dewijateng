'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import {
  getNotificationsAction,
  type AppNotification,
} from '@/app/actions/notificationActions';

const TONE_STYLE: Record<
  AppNotification['tone'],
  { icon: React.ComponentType<{ className?: string }>; wrap: string }
> = {
  warning: { icon: AlertTriangle, wrap: 'bg-[#FFF4DC] text-[#936015]' },
  success: { icon: CheckCircle2, wrap: 'bg-[#E7F5ED] text-[#16725C]' },
  info: { icon: Info, wrap: 'bg-[#EDF3FC] text-[#0D2453]' },
};

/**
 * Lonceng notifikasi bersama untuk header pengelola desa & Disbudparekraf.
 * Isi notifikasi diambil dari basis data lewat server action (per peran).
 */
export default function NotificationBell({
  buttonClassName = 'relative p-2 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0D2453] transition-colors cursor-pointer',
  align = 'right',
}: {
  buttonClassName?: string;
  align?: 'left' | 'right';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [read, setRead] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationsAction()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const hasUnread = items.length > 0 && !read;

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && hasUnread) setRead(true);
  };

  const panelClass = `absolute ${
    align === 'right' ? 'right-0' : 'left-0'
  } mt-2 w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-[#E6ECF5] overflow-hidden z-50`;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={buttonClassName}
        aria-label={hasUnread ? 'Notifikasi, ada yang belum dibaca' : 'Notifikasi'}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="w-[18px] h-[18px]" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={panelClass} role="dialog" aria-label="Daftar notifikasi">
            <div className="px-4 py-3 border-b border-[#E6ECF5] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#0D2453]">Notifikasi</span>
              {items.length > 0 && (
                <span className="text-[11px] font-medium text-[#64748B]">
                  {items.length} terbaru
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                <CheckCheck className="w-5 h-5 text-[#16725C]" />
                <p className="text-[12px] text-[#64748B]">
                  Tidak ada notifikasi baru. Semua tertangani.
                </p>
              </div>
            ) : (
              <ul className="max-h-[380px] overflow-y-auto overscroll-contain divide-y divide-[#F1F5F9]">
                {items.map((item) => {
                  const tone = TONE_STYLE[item.tone];
                  const ToneIcon = tone.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          router.refresh();
                        }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-[#F7F9FC] transition-colors"
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${tone.wrap}`}
                        >
                          <ToneIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-[12px] font-semibold text-[#0D2453] block leading-snug">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-[#64748B] block mt-0.5 leading-relaxed">
                            {item.description}
                          </span>
                          {item.time && (
                            <span className="text-[10px] text-[#94A3B8] block mt-1">
                              {item.time}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
