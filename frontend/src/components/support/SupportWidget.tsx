"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { SupportPanel } from "./SupportPanel";

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <SupportPanel onClose={() => setOpen(false)} />}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="touch-target fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] end-[calc(1rem+env(safe-area-inset-right,0px))] z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#4a9fd4] text-white shadow-lg transition hover:scale-105 hover:bg-[#3d8fc4] sm:h-14 sm:w-14 lg:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]"
          aria-label="پشتیبانی آنلاین"
        >
          <ChatIcon />
        </button>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="sm:h-[26px] sm:w-[26px]" aria-hidden>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
