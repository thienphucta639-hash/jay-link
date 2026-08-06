"use client";

import { useState, useEffect } from "react";
import type { Collection, Tag } from "@/lib/types";
import { SAVE_REASONS } from "@/lib/types";

interface Props {
  onSaved: () => void;
  toast: (msg: string) => void;
}

export default function SaveTab({ onSaved, toast }: Props) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [colId, setColId] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [cols, setCols] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then((d) => setCols(d.collections));
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags));
  }, []);

  // Clipboard auto-detect on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          if (text && (text.includes("tiktok.com") || text.includes("vm.tiktok.com"))) {
            setLink(text.trim());
          }
        }
      } catch {
        // Clipboard permission denied, ignore
      }
    };
    checkClipboard();
  }, []);

  const isValidLink = link.trim().length > 0 && (link.includes("tiktok.com") || link.includes("vm.tiktok.com"));

  const submit = async () => {
    const trimmedLink = link.trim();
    
    if (!trimmedLink) {
      toast("Dán link vô đây nha!");
      return;
    }

    if (!trimmedLink.includes("tiktok.com") && !trimmedLink.includes("vm.tiktok.com")) {
      toast("Link không hợp lệ! Cần link TikTok");
      return;
    }

    setSaving(true);
    
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trimmedLink,
          customTitle: title.trim() || null,
          creatorHandle: creator.replace("@", "").trim() || null,
          note: note.trim() || null,
          saveReason: reason || null,
          collectionId: colId || null,
          tagIds: tagIds.length > 0 ? tagIds : [],
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast(data.message || "Clip này đã có trong kho rồi!");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Lỗi server");
      }

      // Success - reset form
      setLink("");
      setTitle("");
      setCreator("");
      setNote("");
      setReason("");
      setColId("");
      setTagIds([]);
      setShowMore(false);
      
      // Show time in toast
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      toast(`Đã ghim lúc ${timeStr}! 📌`);
      onSaved();
    } catch (err) {
      console.error("Save error:", err);
      toast("Lỗi khi lưu clip!");
    }
    
    setSaving(false);
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag.trim() }),
      });
      const data = await res.json();
      if (data.tag) {
        setTags((p) => p.find((t) => t.id === data.tag.id) ? p : [...p, data.tag]);
        setTagIds((p) => [...p, data.tag.id]);
      }
      setNewTag("");
    } catch {
      toast("Lỗi thêm tag");
    }
  };

  return (
    <div className="px-5 pt-[max(16px,env(safe-area-inset-top))] pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold">✚ Ghim clip mới</h1>
        <p className="text-[13px] text-muted mt-0.5">Dán link TikTok vô đây, ghim lẹ!</p>
      </div>

      {/* Main form */}
      <div className="space-y-4">
        {/* Link input - always visible and prominent */}
        <div className="anim-pop">
          <label className="text-[12px] font-bold text-muted mb-2 block">🔗 Link TikTok *</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/..."
            className="w-full bg-card rounded-2xl px-4 py-4 text-[14px] border-2 border-lavender/30 focus:border-lavender outline-none transition-colors shadow-sm"
            autoComplete="off"
          />
          {link && (
            <div className="mt-2 flex items-center gap-2">
              {isValidLink ? (
                <span className="text-[12px] text-aqua font-bold">✓ Link hợp lệ</span>
              ) : (
                <span className="text-[12px] text-coral font-bold">✗ Cần link TikTok</span>
              )}
              <button 
                onClick={() => setLink("")}
                className="text-[11px] text-muted underline"
              >
                Xóa
              </button>
            </div>
          )}
        </div>

        {/* Quick save button - always visible */}
        <button
          onClick={submit}
          disabled={saving || !link.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-[15px] press transition-all shadow-lg ${
            saving || !link.trim()
              ? "bg-muted/20 text-muted cursor-not-allowed"
              : "bg-coral text-white shadow-coral/25 active:scale-[0.98]"
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang ghim...
            </span>
          ) : (
            "📌 Ghim clip"
          )}
        </button>

        {/* Toggle more options */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full text-center text-[13px] text-lavender font-bold py-2 press"
        >
          {showMore ? "▲ Ẩn chi tiết" : "▼ Thêm chi tiết (tuỳ chọn)"}
        </button>

        {/* More options - collapsible */}
        {showMore && (
          <div className="space-y-4 pt-2 anim-slide-dn">
            {/* Title */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">✏️ Tên clip</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Công thức mì kem siêu nhanh"
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60"
              />
            </div>

            {/* Creator */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">👤 Creator</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="@username"
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60"
              />
            </div>

            {/* Collection */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">📁 Bộ sưu tập</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setColId("")}
                  className={`text-[11px] px-3 py-2 rounded-xl font-bold press transition-all ${
                    !colId ? "bg-ink text-white" : "bg-card border border-soft/60"
                  }`}
                >
                  📥 Inbox
                </button>
                {cols.filter((c) => c.name !== "Inbox").map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColId(colId === c.id.toString() ? "" : c.id.toString())}
                    className="text-[11px] px-3 py-2 rounded-xl font-bold press transition-all"
                    style={{
                      background: colId === c.id.toString() ? (c.color || "#8B6CFF") : "#fff",
                      color: colId === c.id.toString() ? "#fff" : "#151515",
                      border: colId === c.id.toString() ? "none" : "1px solid rgba(240,237,232,.6)",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">💡 Lưu để làm gì?</label>
              <div className="flex flex-wrap gap-1.5">
                {SAVE_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(reason === r ? "" : r)}
                    className={`text-[11px] px-3 py-2 rounded-xl font-bold press transition-all ${
                      reason === r ? "bg-coral text-white" : "bg-card border border-soft/60"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">🏷️ Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTagIds((p) => p.includes(t.id) ? p.filter((i) => i !== t.id) : [...p, t.id])}
                    className={`text-[11px] px-2.5 py-1.5 rounded-xl font-bold press transition-all ${
                      tagIds.includes(t.id) ? "bg-lavender text-white" : "bg-card border border-soft/60"
                    }`}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Thêm tag mới..."
                  className="flex-1 bg-card rounded-xl px-3 py-2 text-[12px] border border-soft/60"
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                />
                <button 
                  onClick={addTag} 
                  className="bg-lavender/10 text-lavender px-4 py-2 rounded-xl text-[12px] font-bold press"
                >
                  +
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">💬 Ghi chú</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm note để mai khỏi quên... VD: Đoạn phút 2:30 có công thức hay"
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60 resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="bg-soft/50 rounded-2xl p-4 mt-4">
          <p className="text-[12px] font-bold text-muted mb-2">💡 Cách lấy link TikTok:</p>
          <ol className="text-[11px] text-muted space-y-1 list-decimal list-inside">
            <li>Mở video TikTok bạn muốn lưu</li>
            <li>Bấm nút <b>Chia sẻ</b> (mũi tên)</li>
            <li>Chọn <b>Sao chép liên kết</b></li>
            <li>Quay lại đây dán link</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
