"use client";

import { useEffect, useState, useCallback } from "react";
import type { Collection, Tag } from "@/lib/types";
import { WATCH_STATUSES, SAVE_REASONS } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/time";

interface ClipData {
  id: number; sourceUrl: string; creatorName: string | null; creatorHandle: string | null;
  customTitle: string | null; note: string | null; saveReason: string | null;
  watchStatus: string; isPinned: boolean; savedAt: string; lastOpenedAt: string | null;
  openCount: number; collectionId: number | null; previewImage: string | null;
  tags: { tagId: number; tagName: string }[];
}

export default function ClipDetail({ clipId, onClose }: { clipId: number; onClose: () => void }) {
  const [clip, setClip] = useState<ClipData | null>(null);
  const [error, setError] = useState("");
  const [cols, setCols] = useState<Collection[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", note: "", reason: "", status: "unreviewed", colId: null as number | null, tagIds: [] as number[] });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/clips/${clipId}`);
      if (!res.ok) { setError(`Lỗi ${res.status}`); return; }
      const { clip: c } = await res.json();
      if (!c) { setError("Clip không tồn tại"); return; }
      // Normalize tags
      const tags = Array.isArray(c.tags) ? c.tags.map((t: string | { tagId: number; tagName: string }) =>
        typeof t === "string" ? { tagId: 0, tagName: t } : t
      ) : [];
      const normalized = { ...c, tags };
      setClip(normalized);
      setForm({ title: c.customTitle || "", note: c.note || "", reason: c.saveReason || "", status: c.watchStatus || "unreviewed", colId: c.collectionId, tagIds: tags.filter((t: {tagId:number}) => t.tagId > 0).map((t: {tagId:number}) => t.tagId) });
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
  }, [clipId]);

  useEffect(() => {
    load();
    fetch("/api/collections").then(r => r.json()).then(d => setCols(d.collections || [])).catch(() => {});
    fetch("/api/tags").then(r => r.json()).then(d => setAllTags(d.tags || [])).catch(() => {});
  }, [load]);

  const save = async () => {
    await fetch(`/api/clips/${clipId}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customTitle: form.title, note: form.note, saveReason: form.reason, watchStatus: form.status, collectionId: form.colId, tagIds: form.tagIds }) });
    setEditing(false); load();
  };

  const togglePin = async () => {
    if (!clip) return;
    await fetch(`/api/clips/${clipId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned: !clip.isPinned }) });
    load();
  };

  const remove = async () => {
    if (!confirm("Xóa clip này khỏi kho?")) return;
    await fetch(`/api/clips/${clipId}`, { method: "DELETE" }); onClose();
  };

  const col = cols.find(c => c.id === clip?.collectionId);
  const st = WATCH_STATUSES.find(s => s.value === clip?.watchStatus);

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50" />

      {/* Sheet — stop propagation so clicking inside doesn't close */}
      <div className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-cream rounded-t-[28px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Handle + close */}
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/30" /></div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto hide-scroll px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
          {error ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">😵</p>
              <p className="text-sm text-coral font-bold">{error}</p>
              <button onClick={load} className="mt-3 text-sm text-lavender font-bold">Thử lại</button>
            </div>
          ) : !clip ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
            </div>
          ) : editing ? (
            /* ── EDIT MODE ── */
            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">✏️ Sửa clip</h2>
                <button onClick={() => setEditing(false)} className="text-sm text-muted font-semibold">Hủy</button>
              </div>

              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full text-sm font-bold bg-card rounded-2xl px-4 py-3 border border-soft/60" placeholder="Tên clip..." />

              <div>
                <p className="text-[11px] font-bold text-muted mb-1.5">📁 Bộ sưu tập</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip on={!form.colId} onClick={() => setForm({ ...form, colId: null })}>Inbox</Chip>
                  {cols.filter(c => c.name !== "Inbox").map(c => (
                    <Chip key={c.id} on={form.colId === c.id} color={c.color || undefined} onClick={() => setForm({ ...form, colId: c.id })}>{c.name}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted mb-1.5">💡 Lý do lưu</p>
                <div className="flex flex-wrap gap-1.5">
                  {SAVE_REASONS.map(r => <Chip key={r} on={form.reason === r} variant="coral" onClick={() => setForm({ ...form, reason: form.reason === r ? "" : r })}>{r}</Chip>)}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted mb-1.5">📋 Trạng thái</p>
                <div className="flex flex-wrap gap-1.5">
                  {WATCH_STATUSES.map(s => <Chip key={s.value} on={form.status === s.value} color={s.color} onClick={() => setForm({ ...form, status: s.value })}>{s.label}</Chip>)}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted mb-1.5">🏷️ Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <Chip key={tag.id} on={form.tagIds.includes(tag.id)} variant="lavender"
                      onClick={() => setForm({ ...form, tagIds: form.tagIds.includes(tag.id) ? form.tagIds.filter(i => i !== tag.id) : [...form.tagIds, tag.id] })}>
                      #{tag.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full bg-card rounded-2xl px-4 py-3 text-sm border border-soft/60 resize-none" rows={3} placeholder="Ghi chú..." />

              <button onClick={save} className="w-full bg-lavender text-white py-3.5 rounded-2xl font-bold text-sm active:opacity-80">💾 Lưu thay đổi</button>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <div className="space-y-4 py-3">
              {/* Title */}
              <h2 className="text-lg font-extrabold leading-snug">{clip.customTitle || clip.sourceUrl.replace(/https?:\/\/(www\.)?/, "").slice(0, 50)}</h2>

              {/* Creator */}
              {clip.creatorHandle && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-lavender/15 flex items-center justify-center text-xs font-bold text-lavender">@</div>
                  <p className="text-sm font-bold">@{clip.creatorHandle}</p>
                </div>
              )}

              {/* Time */}
              <div className="bg-aqua/10 rounded-2xl p-3 border border-aqua/20">
                <p className="text-sm font-bold text-[#2AA89A]">🕐 {timeAgo(clip.savedAt)}</p>
                <p className="text-[11px] text-muted">{formatDateTime(clip.savedAt)}</p>
                {clip.lastOpenedAt && <p className="text-[11px] text-muted mt-1">Mở lần cuối: {formatDateTime(clip.lastOpenedAt)}</p>}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {col && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl text-white" style={{ background: col.color || "#8B6CFF" }}>📁 {col.name}</span>}
                {clip.saveReason && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-coral/10 text-coral">{clip.saveReason}</span>}
                {st && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl" style={{ background: st.color + "22", color: st.color }}>{st.label}</span>}
              </div>

              {/* Tags */}
              {clip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {clip.tags.map(t => <span key={t.tagName} className="text-[11px] font-semibold bg-lavender/10 text-lavender px-2 py-0.5 rounded-lg">#{t.tagName}</span>)}
                </div>
              )}

              {/* Note */}
              {clip.note && (
                <div className="bg-card rounded-2xl p-3 border border-soft/60">
                  <p className="text-[11px] font-bold text-muted mb-0.5">💬 Ghi chú</p>
                  <p className="text-sm">{clip.note}</p>
                </div>
              )}

              {clip.openCount > 0 && <p className="text-[11px] text-muted">👁 Đã mở {clip.openCount} lần</p>}

              {/* ── ACTION BUTTONS — clean layout ── */}
              <div className="space-y-2 pt-2">
                <a href={clip.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-ink text-white py-3.5 rounded-2xl font-bold text-sm active:opacity-80">
                  ▶️ Mở trên TikTok
                </a>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={togglePin} className={`py-2.5 rounded-xl font-bold text-[11px] active:opacity-70 ${clip.isPinned ? "bg-coral/10 text-coral" : "bg-soft text-ink"}`}>
                    📌 {clip.isPinned ? "Bỏ ghim" : "Ghim"}
                  </button>
                  <button onClick={() => setEditing(true)} className="py-2.5 rounded-xl font-bold text-[11px] bg-lavender/10 text-lavender active:opacity-70">
                    ✏️ Sửa
                  </button>
                  <button onClick={remove} className="py-2.5 rounded-xl font-bold text-[11px] bg-coral/10 text-coral active:opacity-70">
                    🗑 Xóa
                  </button>
                </div>

                <button onClick={onClose} className="w-full py-2.5 text-center text-[13px] text-muted font-semibold active:opacity-70">
                  ← Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable chip button ── */
function Chip({ on, onClick, children, variant, color }: {
  on: boolean; onClick: () => void; children: React.ReactNode;
  variant?: "coral" | "lavender"; color?: string;
}) {
  let bg = on ? "#151515" : "#F0EDE8";
  let fg = on ? "#fff" : "#151515";

  if (on && variant === "coral") { bg = "#FF6B6B"; fg = "#fff"; }
  if (on && variant === "lavender") { bg = "#8B6CFF"; fg = "#fff"; }
  if (on && color) { bg = color; fg = "#fff"; }

  return (
    <button onClick={onClick} className="text-[11px] px-3 py-1.5 rounded-xl font-bold active:opacity-70 transition-colors"
      style={{ background: bg, color: fg }}>
      {children}
    </button>
  );
}
