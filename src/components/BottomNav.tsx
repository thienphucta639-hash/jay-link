"use client";

import type { TabKey } from "@/app/page";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "home", label: "Kho", icon: "📦" },
  { key: "search", label: "Tìm", icon: "🔍" },
  { key: "save", label: "Lưu", icon: "✚" },
  { key: "collections", label: "Bộ sưu tập", icon: "📁" },
  { key: "profile", label: "Tôi", icon: "⚙️" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass border-t border-soft/80 z-50">
      <div className="grid grid-cols-5 h-[68px] items-end pb-[max(6px,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const on = active === t.key;
          const center = t.key === "save";

          if (center) {
            return (
              <button
                key={t.key}
                onClick={() => onChange(t.key)}
                className="flex flex-col items-center -mt-3 press"
              >
                <div
                  className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center text-xl font-black shadow-lg transition-all duration-200 ${
                    on
                      ? "bg-coral text-white shadow-coral/40 scale-105"
                      : "bg-lavender text-white shadow-lavender/30"
                  }`}
                >
                  {t.icon}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-bold transition-colors ${
                    on ? "text-coral" : "text-muted"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="flex flex-col items-center gap-0.5 pt-1.5 press"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                {on && (
                  <span className="absolute inset-0 bg-lavender/12 rounded-xl anim-pop" />
                )}
                <span className="text-[20px] relative z-10">{t.icon}</span>
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  on ? "text-lavender" : "text-muted"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
