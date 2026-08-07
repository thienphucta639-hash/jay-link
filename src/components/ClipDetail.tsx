"use client";

import { useEffect, useState, useCallback } from "react";
import type { Collection, Tag } from "@/lib/types";
import { WATCH_STATUSES, SAVE_REASONS } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/time";

interface ClipData {
  id: number;
  sourceUrl: string;
  creatorName: string | null;
  creatorHandle: string | null;
  previewImage: string | null;
  customTitle: string | null;
  note: string | null;
  saveReason: string | null;
  watchStatus: string;
  isPinned: boolean;
  savedAt: string;
  lastOpenedAt: string | null;
  openCount: number;
  collectionId: number | null;
  tags: { tagId: number; tagName: string }[];
}

export default function ClipDetail({ clipId, onClose }: { clipId: number; onClose: () => void }) {
  const [clip, setClip] = useState<ClipData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [cols, setCols] = useState<Collection[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", note: "", reason: "", status: "unreviewed", colId: null as number | null, tagIds: [] as number[] });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/clips/${clipId}`);
      if (!res.ok) { setLoadError(`Lỗi ${res.status}`); return; }
      const data = await res.json();
      const c = data.clip;
      if (!c) { setLoadError("Clip không tồn tại"); return; }

      // Normalize tags — API may return [{tagId, tagName}] or string[]
      let normalizedTags: { tagId: number; tagName: string }[] = [];
      if (Array.isArray(c.tags)) {
        normalizedTags = c.tags.map((t: string | { tagId: number; tagName: string }) => {
          if (typeof t === "string") return { tagId: 0, tagName: t };
          return { tagId: t.tagId, tagName: t.tagName };
        });
      }

      setClip({ ...c, tags: normalizedTags });
      setForm({
        title: c.customTitle || "",
        note: c.note || "",
        reason: c.saveReason || "",
        status: c.watchStatus || "unreviewed",
        colId: c.collectionId,
        tagIds: normalizedTags.map((t: { tagId: number }) => t.tagId).filter((id: number) => id > 0),
      });
      setLoadError("");
    } catch (err) {
      setLoadError(`Lỗi: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, [clipId]);

  useEffect(() => {
    load();
    fetch("/api/collections").then(r => r.json()).then(d => setCols(d.collections || [])).catch(() => {});
    fetch("/api/tags").then(r => r.json()).then(d => setAllTags(d.tags || [])).catch(() => {});
  }, [load]);

  const save = async () => {
    await fetch(`/api/clips/${clipId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customTitle: form.title, note: form.note, saveReason: form.reason, watchStatus: form.status, collectionId: form.colId, tagIds: form.tagIds }),
    });
    setEditing(false);
    load();
  };

  const togglePin = async () => {
    if (!clip) return;
    await fetch(`/api/clips/${clipId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned: !clip.isPinned }) });
    load();
  };

  const remove = async () => {
    if (!confirm("Xóa clip này khỏi kho?")) return;
    await fetch(`/api/clips/${clipId}`, { method: "DELETE" });
    onClose();
  };

  const tagNames = clip?.tags.map(t => t.tagName) || [];
  const st = WATCH_STATUSES.find(s => s.value === clip?.watchStatus);
  const col = cols.find(c => c.id === clip?.collectionId);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/40 anim-fade" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-cream rounded-t-[28px] anim-slide-up max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/30" /></div>
        <div className="flex items-center justify-between px-5 pb-3">
          <button onClick={onClose} className="text-sm text-muted font-semibold press">← Quay lại</button>
          {clip && (
            <div className="flex gap-2">
              <button onClick={togglePin} className={`text-xs px-3 py-1.5 rounded-xl font-bold press ${clip.isPinned ? "bg-coral text-white" : "bg-soft text-ink"}`}>
                📌 {clip.isPinned ? "Bỏ ghim" : "Ghim"}
              </button>
              <button onClick={() => setEditing(!editing)} className="text-xs px-3 py-1.5 rounded-xl font-bold bg-lavender/10 text-lavender press">✏️ Sửa</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto hide-scroll px-5 pb-8 space-y-4">
          {loadError ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">😵</div>
              <p className="text-sm text-coral font-bold">{loadError}</p>
              <button onClick={load} className="mt-3 text-sm text-lavender font-bold press">Thử lại</button>
            </div>
          ) : !clip ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-lavender/15 to-peach/20">
                {clip.previewImage
                  ? <img src={clip.previewImage} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl anim-float">🎬</span></div>}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full text-base font-bold bg-card rounded-2xl px-4 py-3 border border-soft/60" placeholder="Tên clip..." />
                  <div><p className="text-xs font-bold text-muted mb-2">📁 Bộ sưu tập</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setForm({ ...form, colId: null })} className={`text-[11px] px-3 py-1.5 rounded-xl font-bold press ${!form.colId ? "bg-ink text-white" : "bg-soft"}`}>Inbox</button>
                      {cols.filter(c => c.name !== "Inbox").map(c => (
                        <button key={c.id} onClick={() => setForm({ ...form, colId: c.id })} className="text-[11px] px-3 py-1.5 rounded-xl font-bold press" style={{ background: form.colId === c.id ? (c.color || "#8B6CFF") : "#F0EDE8", color: form.colId === c.id ? "#fff" : "#151515" }}>{c.name}</button>
                      ))}
                    </div></div>
                  <div><p className="text-xs font-bold text-muted mb-2">💡 Lý do lưu</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SAVE_REASONS.map(r => (<button key={r} onClick={() => setForm({ ...form, reason: form.reason === r ? "" : r })} className={`text-[11px] px-3 py-1.5 rounded-xl font-bold press ${form.reason === r ? "bg-coral text-white" : "bg-soft"}`}>{r}</button>))}
                    </div></div>
                  <div><p className="text-xs font-bold text-muted mb-2">📋 Trạng thái</p>
                    <div className="flex flex-wrap gap-1.5">
                      {WATCH_STATUSES.map(s => (<button key={s.value} onClick={() => setForm({ ...form, status: s.value })} className="text-[11px] px-3 py-1.5 rounded-xl font-bold press" style={{ background: form.status === s.value ? s.color : "#F0EDE8" }}>{s.label}</button>))}
                    </div></div>
                  <div><p className="text-xs font-bold text-muted mb-2">🏷️ Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.map(tag => (<button key={tag.id} onClick={() => setForm({ ...form, tagIds: form.tagIds.includes(tag.id) ? form.tagIds.filter(id => id !== tag.id) : [...form.tagIds, tag.id] })} className={`text-[11px] px-3 py-1.5 rounded-xl font-bold press ${form.tagIds.includes(tag.id) ? "bg-lavender text-white" : "bg-soft"}`}>#{tag.name}</button>))}
                    </div></div>
                  <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full bg-card rounded-2xl px-4 py-3 text-sm border border-soft/60 resize-none" rows={3} placeholder="Thêm note để mai khỏi quên..." />
                  <div className="flex gap-2">
                    <button onClick={save} className="flex-1 bg-lavender text-white py-3 rounded-2xl font-bold text-sm press">Lưu thay đổi</button>
                    <button onClick={() => setEditing(false)} className="px-5 py-3 bg-soft rounded-2xl font-bold text-sm press">Hủy</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-lg font-extrabold leading-snug">{clip.customTitle || clip.sourceUrl.slice(0, 50)}</h2>
                  {clip.creatorHandle && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-lavender/15 flex items-center justify-center text-xs font-bold text-lavender">@</div>
                      <div><p className="text-sm font-bold">{clip.creatorName || clip.creatorHandle}</p><p className="text-[11px] text-muted">@{clip.creatorHandle}</p></div>
                    </div>
                  )}
                  <div className="bg-aqua/10 rounded-2xl p-3 border border-aqua/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🕐</span>
                      <div><p className="text-sm font-bold text-[#2AA89A]">{timeAgo(clip.savedAt)}</p><p className="text-[11px] text-muted">{formatDateTime(clip.savedAt)}</p></div>
                    </div>
                    {clip.lastOpenedAt && <p className="text-[11px] text-muted mt-1.5 ml-7">Mở lại lần cuối: {formatDateTime(clip.lastOpenedAt)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {col && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl text-white" style={{ background: col.color || "#8B6CFF" }}>📁 {col.name}</span>}
                    {clip.saveReason && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-coral/10 text-coral">{clip.saveReason}</span>}
                    {st && <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl" style={{ background: st.color + "22", color: st.color }}>{st.label}</span>}
                  </div>
                  {tagNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tagNames.map(t => <span key={t} className="text-[11px] font-semibold bg-lavender/10 text-lavender px-2 py-0.5 rounded-lg">#{t}</span>)}
                    </div>
                  )}
                  {clip.note && (
                    <div className="bg-card rounded-2xl p-3 border border-soft/60">
                      <p className="text-[11px] font-bold text-muted mb-0.5">💬 Ghi chú</p><p className="text-sm">{clip.note}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    {clip.openCount > 0 && <span>👁 Đã mở {clip.openCount} lần</span>}
                  </div>
                  <a href={clip.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-ink text-white py-3.5 rounded-2xl font-bold text-sm press">▶️ Mở trên TikTok</a>
                  <button onClick={remove} className="w-full text-coral text-sm font-semibold py-2 press">🗑 Xóa clip</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
