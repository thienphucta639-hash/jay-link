"use client";

import { useEffect, useState, useRef } from "react";
import type { Clip, Collection } from "@/lib/types";
import type { TabKey } from "@/app/page";
import ClipCard from "@/components/ClipCard";
import { ClipRow } from "@/components/ClipCard";
import { getTimeOfDay } from "@/lib/time";

interface Props {
  onNav: (tab: TabKey) => void;
  toast: (msg: string) => void;
  refreshSignal: number;
}

interface HomeData {
  stats: { totalClips: number; unclassified: number; pinned: number; unreviewed: number };
  pinned: Clip[];
  recent: Clip[];
  inbox: Clip[];
  collections: (Collection & { clipCount: number })[];
  creators: { handle: string; name: string | null; count: number }[];
}

export default function HomeTab({ onNav, refreshSignal }: Props) {
  const [data, setData] = useState<HomeData | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const fetchRef = useRef(0);

  useEffect(() => {
    const id = ++fetchRef.current;
    fetch("/api/home")
      .then(r => r.json())
      .then(d => {
        if (id === fetchRef.current) {
          setData(d);
          setFirstLoad(false);
        }
      })
      .catch(() => setFirstLoad(false));
  }, [refreshSignal]);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Only show full-page spinner on very first load
  if (firstLoad && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-9 h-9 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted font-semibold">Đang mở kho...</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, pinned, recent, inbox, collections, creators } = data;
  const empty = stats.totalClips === 0;
  const greeting = getTimeOfDay();
  const timeStr = currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" });

  const reload = () => {
    fetch("/api/home").then(r => r.json()).then(setData).catch(() => {});
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              {greeting === "sáng" ? "☀️" : greeting === "chiều" ? "🌤" : "🌙"} Chào buổi {greeting}!
            </h1>
            <p className="text-[13px] text-muted mt-0.5">Kho clip của bạn</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold text-lavender">{timeStr}</p>
            <p className="text-[11px] text-muted capitalize">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Search shortcut */}
      {!empty && (
        <div className="px-5">
          <button onClick={() => onNav("search")} className="w-full bg-card rounded-2xl px-4 py-3 text-left text-[13px] text-muted border border-soft/60 flex items-center gap-2 press shadow-sm">
            🔍 Tìm clip, @creator, tag, ghi chú...
          </button>
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <div className="mx-5 bg-card rounded-3xl p-8 text-center border border-soft/60 shadow-sm">
          <div className="text-6xl mb-3">📎</div>
          <h2 className="text-base font-extrabold mb-1">Kho này hơi trống nha!</h2>
          <p className="text-[13px] text-muted mb-5">Dán link TikTok đầu tiên của bạn vào đây</p>
          <button onClick={() => onNav("save")} className="bg-lavender text-white px-6 py-3 rounded-2xl font-bold text-sm press shadow-lg shadow-lavender/25">
            ✚ Ghim clip đầu tiên
          </button>
        </div>
      )}

      {/* Stats chips */}
      {!empty && (
        <div className="flex gap-2 px-5 overflow-x-auto hide-scroll">
          {[
            { n: stats.totalClips, l: "clip", e: "📦", c: "bg-lavender/10 text-lavender" },
            { n: stats.unclassified, l: "chưa loại", e: "📥", c: "bg-peach/20 text-[#E07B3C]" },
            { n: stats.pinned, l: "ghim", e: "📌", c: "bg-coral/10 text-coral" },
            { n: stats.unreviewed, l: "chưa xem", e: "👀", c: "bg-aqua/15 text-[#2AA89A]" },
          ].map(s => (
            <div key={s.l} className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-[12px] flex-shrink-0 ${s.c}`}>
              <span>{s.e}</span><span>{s.n}</span><span className="opacity-70">{s.l}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <Section title="📌 Đã ghim" count={pinned.length}>
          <HScroll>
            {pinned.map(c => (
              <div key={c.id} className="w-[160px] flex-shrink-0">
                <ClipCard clip={c} onUpdate={reload} />
              </div>
            ))}
          </HScroll>
        </Section>
      )}

      {/* Recent clips */}
      {recent.length > 0 && (
        <Section title="🕐 Mới lưu" count={recent.length}>
          <div className="px-5 space-y-2">
            {recent.map(c => (
              <ClipRow key={c.id} clip={c} onUpdate={reload} />
            ))}
          </div>
        </Section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <Section title="📁 Bộ sưu tập" action={{ label: "Tất cả →", fn: () => onNav("collections") }}>
          <HScroll>
            {collections.map(col => (
              <button key={col.id} onClick={() => onNav("collections")} className="flex-shrink-0 w-[110px] bg-card rounded-2xl p-3 border border-soft/60 text-left press shadow-sm">
                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white text-base font-extrabold" style={{ background: col.color || "#8B6CFF" }}>
                  {col.name.charAt(0)}
                </div>
                <p className="text-[12px] font-bold line-clamp-1">{col.name}</p>
                <p className="text-[10px] text-muted">{col.clipCount} clip</p>
              </button>
            ))}
          </HScroll>
        </Section>
      )}

      {/* Inbox */}
      {inbox.length > 0 && (
        <Section title="📥 Chưa phân loại" count={inbox.length}>
          <HScroll>
            {inbox.map(c => (
              <div key={c.id} className="w-[160px] flex-shrink-0">
                <ClipCard clip={c} onUpdate={reload} />
              </div>
            ))}
          </HScroll>
        </Section>
      )}

      {/* Creators */}
      {creators.length > 0 && (
        <Section title="👤 Creators">
          <HScroll>
            {creators.map(cr => (
              <button key={cr.handle} onClick={() => onNav("search")} className="flex-shrink-0 w-[100px] bg-card rounded-2xl py-3 px-2 text-center border border-soft/60 press shadow-sm">
                <div className="w-10 h-10 rounded-full bg-aqua/15 flex items-center justify-center text-sm font-extrabold text-aqua mx-auto mb-1.5">@</div>
                <p className="text-[11px] font-bold truncate">{cr.handle}</p>
                <p className="text-[10px] text-muted">{cr.count} clip</p>
              </button>
            ))}
          </HScroll>
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, action, children }: {
  title: string; count?: number; action?: { label: string; fn: () => void }; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between px-5 mb-2">
        <h2 className="text-[15px] font-extrabold">
          {title}
          {count != null && count > 0 && <span className="ml-1.5 text-[11px] font-bold text-muted bg-soft px-2 py-0.5 rounded-lg">{count}</span>}
        </h2>
        {action && <button onClick={action.fn} className="text-[12px] text-lavender font-bold press">{action.label}</button>}
      </div>
      {children}
    </section>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2.5 overflow-x-auto hide-scroll px-5 pb-1">{children}</div>;
}
