"use client";

import { useState } from "react";
import type { Clip } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import ClipDetail from "./ClipDetail";

const RE: Record<string, string> = {
  "Coi lại": "🔁", "Làm theo": "🛠", "Mua sau": "🛒", "Học": "📖",
  "Cười": "😂", "Truyền cảm hứng": "✨", "Gửi bạn bè": "💌", "Lưu ý tưởng": "💡",
};

/* ── List row ── */
export function ClipRow({ clip, onUpdate }: { clip: Clip; onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const title = clip.customTitle || clip.creatorHandle || clip.sourceUrl.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, "").slice(0, 30);
  const tags = Array.isArray(clip.tags) ? clip.tags.map(t => typeof t === "string" ? t : t.tagName) : [];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-card border border-soft/60 active:bg-soft/50 transition-colors cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender/20 to-coral/15 flex-shrink-0 flex items-center justify-center text-xl">🎬</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate">{clip.isPinned ? "📌 " : ""}{title}</p>
          {clip.creatorHandle && <p className="text-[11px] text-muted truncate">@{clip.creatorHandle}</p>}
          <div className="flex items-center gap-1 mt-0.5">
            {clip.saveReason && <span className="text-[9px] font-semibold bg-coral/10 text-coral px-1.5 py-0.5 rounded">{RE[clip.saveReason] || "📎"} {clip.saveReason}</span>}
            {tags.slice(0, 1).map(t => <span key={t} className="text-[9px] text-lavender font-semibold">#{t}</span>)}
          </div>
        </div>
        <span className="text-[10px] text-muted/70 flex-shrink-0">{timeAgo(clip.savedAt)}</span>
      </div>
      {open && <ClipDetail clipId={clip.id} onClose={() => { setOpen(false); onUpdate?.(); }} />}
    </>
  );
}

/* ── Grid card ── */
export default function ClipCard({ clip, onUpdate }: { clip: Clip; onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const title = clip.customTitle || clip.creatorHandle || "Clip";
  const tags = Array.isArray(clip.tags) ? clip.tags.map(t => typeof t === "string" ? t : t.tagName) : [];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="w-full bg-card rounded-2xl shadow-sm border border-soft/60 overflow-hidden active:bg-soft/50 transition-colors cursor-pointer"
      >
        <div className="relative aspect-[4/3] bg-gradient-to-br from-lavender/15 to-peach/20 flex items-center justify-center">
          <span className="text-4xl">🎬</span>
          {clip.isPinned && <span className="absolute top-1.5 left-1.5 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">📌</span>}
          <span className="absolute top-1.5 right-1.5 bg-white/90 text-ink text-[9px] font-semibold px-1.5 py-0.5 rounded-lg">{timeAgo(clip.savedAt)}</span>
          {clip.saveReason && <span className="absolute bottom-1.5 left-1.5 bg-ink/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-lg">{RE[clip.saveReason] || ""} {clip.saveReason}</span>}
        </div>
        <div className="p-2.5">
          <p className="text-[12px] font-bold leading-tight line-clamp-2">{title}</p>
          {clip.creatorHandle && <p className="text-[10px] text-muted mt-0.5">@{clip.creatorHandle}</p>}
          {tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {tags.slice(0, 2).map(t => <span key={t} className="text-[9px] font-semibold bg-lavender/10 text-lavender px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
          )}
        </div>
      </div>
      {open && <ClipDetail clipId={clip.id} onClose={() => { setOpen(false); onUpdate?.(); }} />}
    </>
  );
}
