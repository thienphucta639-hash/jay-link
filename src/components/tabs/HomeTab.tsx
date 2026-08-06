"use client";

import { useEffect, useState, useCallback } from "react";
import type { Clip, Collection, Creator } from "@/lib/types";
import type { TabKey } from "@/app/page";
import ClipCard from "@/components/ClipCard";
import { ClipRow } from "@/components/ClipCard";
import { getTimeOfDay, timeAgo } from "@/lib/time";

interface Props {
  onNav: (tab: TabKey) => void;
  toast: (msg: string) => void;
}

export default function HomeTab({ onNav, toast }: Props) {
  const [recent, setRecent] = useState<Clip[]>([]);
  const [pinned, setPinned] = useState<Clip[]>([]);
  const [inbox, setInbox] = useState<Clip[]>([]);
  const [cols, setCols] = useState<Collection[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState({ totalClips: 0, unclassified: 0, pinned: 0, unreviewed: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        fetch("/api/clips?limit=10&sort=saved_at"),
        fetch("/api/clips?pinned=true&limit=6"),
        fetch("/api/clips?limit=6"),
        fetch("/api/collections"),
        fetch("/api/creators"),
        fetch("/api/stats"),
      ]);
      const [d1, d2, d3, d4, d5, d6] = await Promise.all([
        r1.json(), r2.json(), r3.json(), r4.json(), r5.json(), r6.json(),
      ]);
      setRecent(d1.clips);
      setPinned(d2.clips);
      setInbox(d3.clips.filter((c: Clip) => !c.collectionId));
      setCols(d4.collections);
      setCreators(d5.creators);
      setStats(d6);
    } catch {
      toast("Lỗi tải dữ liệu");
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-9 h-9 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted font-semibold">Đang mở kho...</p>
      </div>
    );
  }

  const empty = stats.totalClips === 0;
  const greeting = getTimeOfDay();
  const timeStr = currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" });

  return (
    <div className="space-y-5 pb-4">
      {/* ── Header with real time ── */}
      <div className="px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              {greeting === "sáng" && "☀️"}
              {greeting === "chiều" && "🌤"}
              {greeting === "tối" && "🌙"} Chào buổi {greeting}!
            </h1>
            <p className="text-[13px] text-muted mt-0.5">Kho clip của bạn</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold text-lavender">{timeStr}</p>
            <p className="text-[11px] text-muted capitalize">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* ── Search shortcut ── */}
      {!empty && (
        <div className="px-5">
          <button
            onClick={() => onNav("search")}
            className="w-full bg-card rounded-2xl px-4 py-3 text-left text-[13px] text-muted border border-soft/60 flex items-center gap-2 press shadow-sm"
          >
            🔍 Tìm clip, @creator, tag, ghi chú...
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {empty && (
        <div className="mx-5 bg-card rounded-3xl p-8 text-center border border-soft/60 shadow-sm anim-pop">
          <div className="text-6xl mb-3 anim-float">📎</div>
          <h2 className="text-base font-extrabold mb-1">Kho này hơi trống nha!</h2>
          <p className="text-[13px] text-muted mb-5">Dán link TikTok đầu tiên của bạn vào đây</p>
          <button
            onClick={() => onNav("save")}
            className="bg-lavender text-white px-6 py-3 rounded-2xl font-bold text-sm press shadow-lg shadow-lavender/25"
          >
            ✚ Ghim clip đầu tiên
          </button>
        </div>
      )}

      {/* ── Quick stats — horizontal chips ── */}
      {!empty && (
        <div className="flex gap-2 px-5 overflow-x-auto hide-scroll">
          {[
            { n: stats.totalClips, l: "clip", e: "📦", c: "bg-lavender/10 text-lavender" },
            { n: stats.unclassified, l: "chưa loại", e: "📥", c: "bg-peach/20 text-[#E07B3C]" },
            { n: stats.pinned, l: "ghim", e: "📌", c: "bg-coral/10 text-coral" },
            { n: stats.unreviewed, l: "chưa xem", e: "👀", c: "bg-aqua/15 text-[#2AA89A]" },
          ].map((s) => (
            <div
              key={s.l}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-[12px] flex-shrink-0 ${s.c}`}
            >
              <span>{s.e}</span>
              <span>{s.n}</span>
              <span className="opacity-70">{s.l}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Pinned — horizontal scroll ── */}
      {pinned.length > 0 && (
        <Section title="📌 Đã ghim" count={pinned.length}>
          <HScroll>
            {pinned.map((c) => (
              <div key={c.id} className="w-[160px] flex-shrink-0 anim-pop">
                <ClipCard clip={c} onUpdate={load} />
              </div>
            ))}
          </HScroll>
        </Section>
      )}

      {/* ── Recent — list rows with time ── */}
      {recent.length > 0 && (
        <Section title="🕐 Mới lưu" count={recent.length}>
          <div className="px-5 space-y-2 stagger">
            {recent.map((c) => (
              <div key={c.id} className="anim-pop">
                <ClipRow clip={c} onUpdate={load} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Collections — horizontal ── */}
      {cols.length > 0 && (
        <Section
          title="📁 Bộ sưu tập"
          action={{ label: "Tất cả →", fn: () => onNav("collections") }}
        >
          <HScroll>
            {cols.map((col) => (
              <button
                key={col.id}
                onClick={() => onNav("collections")}
                className="flex-shrink-0 w-[110px] bg-card rounded-2xl p-3 border border-soft/60 text-left press anim-pop shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white text-base font-extrabold"
                  style={{ background: col.color || "#8B6CFF" }}
                >
                  {col.name.charAt(0)}
                </div>
                <p className="text-[12px] font-bold line-clamp-1">{col.name}</p>
                <p className="text-[10px] text-muted">{col.clipCount} clip</p>
              </button>
            ))}
          </HScroll>
        </Section>
      )}

      {/* ── Inbox ── */}
      {inbox.length > 0 && (
        <Section title="📥 Chưa phân loại" count={inbox.length}>
          <HScroll>
            {inbox.map((c) => (
              <div key={c.id} className="w-[160px] flex-shrink-0 anim-pop">
                <ClipCard clip={c} onUpdate={load} />
              </div>
            ))}
          </HScroll>
        </Section>
      )}

      {/* ── Creators — horizontal ── */}
      {creators.length > 0 && (
        <Section title="👤 Creators">
          <HScroll>
            {creators.map((cr) => (
              <button
                key={cr.creatorHandle}
                onClick={() => onNav("search")}
                className="flex-shrink-0 w-[100px] bg-card rounded-2xl py-3 px-2 text-center border border-soft/60 press anim-pop shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-aqua/15 flex items-center justify-center text-sm font-extrabold text-aqua mx-auto mb-1.5">
                  @
                </div>
                <p className="text-[11px] font-bold truncate">{cr.creatorHandle}</p>
                <p className="text-[10px] text-muted">{cr.clipCount} clip</p>
              </button>
            ))}
          </HScroll>
        </Section>
      )}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: { label: string; fn: () => void };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between px-5 mb-2">
        <h2 className="text-[15px] font-extrabold">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-1.5 text-[11px] font-bold text-muted bg-soft px-2 py-0.5 rounded-lg">
              {count}
            </span>
          )}
        </h2>
        {action && (
          <button onClick={action.fn} className="text-[12px] text-lavender font-bold press">
            {action.label}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── Horizontal scroll container ── */
function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto hide-scroll px-5 pb-1 stagger">
      {children}
    </div>
  );
}
