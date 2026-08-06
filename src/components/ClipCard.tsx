"use client";

import { useState } from "react";
import type { Clip } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import ClipDetail from "./ClipDetail";

const REASON_EMOJI: Record<string, string> = {
  "Coi lại": "🔁",
  "Làm theo": "🛠",
  "Mua sau": "🛒",
  "Học": "📖",
  "Cười": "😂",
  "Truyền cảm hứng": "✨",
  "Gửi bạn bè": "💌",
  "Lưu ý tưởng": "💡",
};

/* ── Compact horizontal card (list row) ── */
export function ClipRow({
  clip,
  onUpdate,
}: {
  clip: Clip;
  onUpdate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const title = clip.customTitle || clip.creatorName || "Clip chưa đặt tên";
  const tagList = Array.isArray(clip.tags)
    ? clip.tags.map((t) => (typeof t === "string" ? t : t.tagName))
    : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full text-left px-4 py-3 press rounded-2xl bg-card border border-soft/60 transition-shadow hover:shadow-md"
      >
        {/* thumb */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lavender/20 to-coral/15 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {clip.previewImage ? (
            <img src={clip.previewImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🎬</span>
          )}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {clip.isPinned && <span className="text-xs">📌</span>}
            <p className="text-sm font-bold truncate">{title}</p>
          </div>
          {clip.creatorHandle && (
            <p className="text-[11px] text-muted truncate">@{clip.creatorHandle}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {clip.saveReason && (
              <span className="text-[10px] font-semibold bg-coral/10 text-coral px-1.5 py-0.5 rounded-md">
                {REASON_EMOJI[clip.saveReason] || "📎"} {clip.saveReason}
              </span>
            )}
            {tagList.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] text-lavender font-semibold">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* time */}
        <div className="flex-shrink-0 text-right">
          <span className="text-[10px] text-muted/80 font-medium">
            {timeAgo(clip.savedAt)}
          </span>
        </div>
      </button>

      {open && (
        <ClipDetail
          clipId={clip.id}
          onClose={() => {
            setOpen(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}

/* ── Grid card (2-col) ── */
export default function ClipCard({
  clip,
  onUpdate,
}: {
  clip: Clip;
  onUpdate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const title = clip.customTitle || clip.creatorName || "Clip";
  const tagList = Array.isArray(clip.tags)
    ? clip.tags.map((t) => (typeof t === "string" ? t : t.tagName))
    : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left bg-card rounded-2xl shadow-sm border border-soft/60 overflow-hidden press transition-shadow hover:shadow-md"
      >
        <div className="relative aspect-[4/3] bg-gradient-to-br from-lavender/15 to-peach/20 overflow-hidden">
          {clip.previewImage ? (
            <img src={clip.previewImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl anim-float">🎬</span>
            </div>
          )}
          {clip.isPinned && (
            <span className="absolute top-1.5 left-1.5 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">📌</span>
          )}
          {clip.saveReason && (
            <span className="absolute bottom-1.5 left-1.5 bg-ink/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
              {REASON_EMOJI[clip.saveReason] || "📎"} {clip.saveReason}
            </span>
          )}
          {/* Time badge */}
          <span className="absolute top-1.5 right-1.5 bg-white/90 text-ink text-[9px] font-semibold px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
            {timeAgo(clip.savedAt)}
          </span>
        </div>
        <div className="p-2.5">
          <p className="text-[13px] font-bold leading-tight line-clamp-2">{title}</p>
          {clip.creatorHandle && (
            <p className="text-[11px] text-muted mt-0.5">@{clip.creatorHandle}</p>
          )}
          {tagList.length > 0 && (
            <div className="flex gap-1 mt-1 overflow-hidden">
              {tagList.slice(0, 2).map((t) => (
                <span key={t} className="text-[9px] font-semibold bg-lavender/10 text-lavender px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {open && (
        <ClipDetail
          clipId={clip.id}
          onClose={() => {
            setOpen(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
