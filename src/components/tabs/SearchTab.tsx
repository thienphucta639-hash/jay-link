"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Clip, Collection } from "@/lib/types";
import { SAVE_REASONS } from "@/lib/types";
import { ClipRow } from "@/components/ClipCard";

const QUICK = [
  { l: "Hôm nay", k: "today" },
  { l: "Tuần này", k: "week" },
  { l: "Tháng này", k: "month" },
  { l: "Coi lại", k: "reason_Coi lại" },
  { l: "Làm theo", k: "reason_Làm theo" },
  { l: "Mua sau", k: "reason_Mua sau" },
  { l: "Chưa xem lại", k: "status_unreviewed" },
  { l: "Đã ghim", k: "pinned" },
];

interface Props {
  toast: (msg: string) => void;
}

export default function SearchTab({ toast }: Props) {
  const [q, setQ] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [fuzzy, setFuzzy] = useState(false);
  const [total, setTotal] = useState(0);
  const [cols, setCols] = useState<Collection[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fuzzy state
  const [fCat, setFCat] = useState("");
  const [fWhen, setFWhen] = useState("");
  const [fReason, setFReason] = useState("");
  const [fCreator, setFCreator] = useState("");

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then((d) => setCols(d.collections));
  }, []);

  const buildParams = useCallback((offset: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (filter) {
      if (filter === "today") p.set("date_from", new Date().toISOString().split("T")[0]);
      else if (filter === "week") { const d = new Date(); d.setDate(d.getDate() - 7); p.set("date_from", d.toISOString().split("T")[0]); }
      else if (filter === "month") { const d = new Date(); d.setDate(d.getDate() - 30); p.set("date_from", d.toISOString().split("T")[0]); }
      else if (filter.startsWith("reason_")) p.set("save_reason", filter.slice(7));
      else if (filter.startsWith("status_")) p.set("watch_status", filter.slice(7));
      else if (filter === "pinned") p.set("pinned", "true");
      else if (filter.startsWith("col_")) p.set("collection_id", filter.slice(4));
    }
    p.set("limit", "20");
    p.set("offset", String(offset));
    return p;
  }, [q, filter]);

  const search = useCallback(async (reset: boolean) => {
    setLoading(true);
    const offset = reset ? 0 : page * 20;
    try {
      const res = await fetch(`/api/clips?${buildParams(offset)}`);
      const data = await res.json();
      if (reset) {
        setClips(data.clips);
        setPage(1);
      } else {
        setClips((prev) => [...prev, ...data.clips]);
        setPage((p) => p + 1);
      }
      setTotal(data.total);
      setHasMore(data.clips.length === 20);
    } catch { toast("Lỗi tìm kiếm"); }
    setLoading(false);
  }, [buildParams, page, toast]);

  // Search on q / filter change
  useEffect(() => {
    const t = setTimeout(() => search(true), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) search(false);
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  const fuzzySearch = async () => {
    const p = new URLSearchParams();
    if (fCat) p.set("tag", fCat);
    if (fCreator) p.set("creator", fCreator.replace("@", ""));
    if (fReason) p.set("save_reason", fReason);
    if (fWhen === "today") p.set("date_from", new Date().toISOString().split("T")[0]);
    else if (fWhen === "week") { const d = new Date(); d.setDate(d.getDate() - 7); p.set("date_from", d.toISOString().split("T")[0]); }
    else if (fWhen === "month") { const d = new Date(); d.setMonth(d.getMonth() - 1); p.set("date_from", d.toISOString().split("T")[0]); }
    p.set("limit", "50");
    setFuzzy(false);
    setLoading(true);
    const res = await fetch(`/api/clips?${p}`);
    const data = await res.json();
    setClips(data.clips);
    setTotal(data.total);
    setHasMore(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 glass px-5 pt-[max(12px,env(safe-area-inset-top))] pb-3 space-y-2.5 border-b border-soft/40">
        <h1 className="text-[20px] font-extrabold">🔍 Tìm clip</h1>

        <div className="relative">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm clip, @creator, tag, ghi chú..."
            className="w-full bg-card rounded-2xl pl-10 pr-4 py-3 text-[13px] border border-soft/60 shadow-sm"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🔍</span>
        </div>

        {/* Fuzzy trigger */}
        <button
          onClick={() => setFuzzy(true)}
          className="w-full bg-lavender/8 border border-lavender/20 text-lavender rounded-2xl px-4 py-2.5 text-[13px] font-bold text-center press"
        >
          🧠 Nhớ mang máng — tìm theo trí nhớ
        </button>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto hide-scroll -mx-1 px-1 pb-0.5">
          {QUICK.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter((p) => (p === f.k ? null : f.k))}
              className={`flex-shrink-0 text-[11px] px-3 py-1.5 rounded-xl font-bold press transition-all ${
                filter === f.k ? "bg-lavender text-white" : "bg-card border border-soft/60"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Collection chips */}
        <div className="flex gap-1.5 overflow-x-auto hide-scroll -mx-1 px-1 pb-0.5">
          {cols.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter((p) => (p === `col_${c.id}` ? null : `col_${c.id}`))}
              className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-xl font-bold press transition-all"
              style={{
                background: filter === `col_${c.id}` ? (c.color || "#8B6CFF") : "#fff",
                color: filter === `col_${c.id}` ? "#fff" : "#151515",
                border: filter === `col_${c.id}` ? "none" : "1px solid rgba(240,237,232,.6)",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto hide-scroll px-5 pt-3 pb-4">
        <p className="text-[11px] text-muted font-semibold mb-2">{total} kết quả</p>

        {clips.length === 0 && !loading ? (
          <div className="text-center py-16 anim-pop">
            <div className="text-5xl mb-2">🔎</div>
            <p className="text-sm text-muted font-bold">Không tìm thấy clip nào</p>
            <p className="text-[12px] text-muted mt-1">Thử từ khóa khác hoặc dùng <b>Nhớ mang máng</b></p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {clips.map((c) => (
              <div key={c.id} className="anim-pop">
                <ClipRow clip={c} />
              </div>
            ))}
          </div>
        )}

        {/* Lazy load trigger */}
        {hasMore && <div ref={loaderRef} className="h-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
        </div>}

        {loading && clips.length === 0 && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Fuzzy bottom sheet ── */}
      {fuzzy && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <div className="absolute inset-0 bg-ink/40 anim-fade" onClick={() => setFuzzy(false)} />
          <div className="relative w-full max-w-[430px] bg-cream rounded-t-[28px] anim-slide-up max-h-[85vh] overflow-y-auto hide-scroll p-5">
            <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-muted/30" /></div>
            <h2 className="text-lg font-extrabold mb-1">🧠 Nhớ mang máng</h2>
            <p className="text-[13px] text-muted mb-5">Không nhớ tên clip? Chỉ cần nhớ mang máng!</p>

            <div className="space-y-5">
              <FuzzyQ label="Clip thuộc loại nào?" opts={["đồ ăn","outfit","beauty","decor","travel","quote","edit","gym","music"]} val={fCat} set={setFCat} />
              <FuzzyQ label="Lưu khoảng khi nào?" opts={[{v:"today",l:"Hôm nay"},{v:"week",l:"Tuần này"},{v:"month",l:"Tháng trước"},{v:"",l:"Không nhớ"}]} val={fWhen} set={setFWhen} />
              <FuzzyQ label="Lưu để làm gì?" opts={SAVE_REASONS as unknown as string[]} val={fReason} set={setFReason} />

              <div>
                <p className="text-sm font-bold mb-2">Nhớ creator nào không?</p>
                <input
                  value={fCreator}
                  onChange={(e) => setFCreator(e.target.value)}
                  placeholder="@creator..."
                  className="w-full bg-card rounded-2xl px-4 py-3 text-sm border border-soft/60"
                />
              </div>

              <button onClick={fuzzySearch} className="w-full bg-lavender text-white py-3.5 rounded-2xl font-bold text-sm press shadow-lg shadow-lavender/20">
                🔍 Tìm theo manh mối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fuzzy question component ── */
function FuzzyQ({
  label,
  opts,
  val,
  set,
}: {
  label: string;
  opts: (string | { v: string; l: string })[];
  val: string;
  set: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const v = typeof o === "string" ? o : o.v;
          const l = typeof o === "string" ? o : o.l;
          return (
            <button
              key={l}
              onClick={() => set(val === v ? "" : v)}
              className={`text-[12px] px-3 py-2 rounded-xl font-bold press transition-all ${
                val === v ? "bg-coral text-white" : "bg-card border border-soft/60"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
