"use client";

import { useState, useEffect } from "react";
import type { Collection, Tag } from "@/lib/types";
import { SAVE_REASONS } from "@/lib/types";

interface Props {
  onSaved: () => void;
  toast: (msg: string) => void;
}

// ── Strict TikTok URL validation ──
function isTikTokUrl(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  // Must start with http:// or https://
  if (!text.startsWith("http://") && !text.startsWith("https://")) return false;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase();
    // Only these domains are valid TikTok
    return (
      host === "tiktok.com" ||
      host === "www.tiktok.com" ||
      host === "m.tiktok.com" ||
      host === "vm.tiktok.com" ||
      host === "vt.tiktok.com"
    );
  } catch {
    return false;
  }
}

export default function SaveTab({ onSaved, toast }: Props) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [colId, setColId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [cols, setCols] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then((d) => setCols(d.collections || [])).catch(() => {});
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags || [])).catch(() => {});
  }, []);

  // Auto-detect clipboard
  useEffect(() => {
    try {
      navigator.clipboard?.readText().then((text) => {
        if (isTikTokUrl(text)) setLink(text.trim());
      }).catch(() => {});
    } catch {}
  }, []);

  const trimmed = link.trim();
  const valid = isTikTokUrl(trimmed);
  const hasInput = trimmed.length > 0;

  const submit = async () => {
    setError("");

    if (!hasInput) {
      toast("Dán link vô đây nha!");
      return;
    }

    if (!valid) {
      setError("Link không hợp lệ. Cần link dạng: https://www.tiktok.com/@user/video/...");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trimmed,
          customTitle: title.trim() || null,
          creatorHandle: creator.replace("@", "").trim() || null,
          creatorName: null,
          previewImage: null,
          note: note.trim() || null,
          saveReason: reason || null,
          collectionId: colId,
          tagIds,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        const t = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        toast(`Đã ghim lúc ${t}! 📌`);
        setLink(""); setTitle(""); setCreator(""); setNote(""); setReason("");
        setColId(null); setTagIds([]); setShowMore(false); setError("");
        setSaving(false);
        setTimeout(() => onSaved(), 400);
        return;
      }

      if (res.status === 409) {
        setError("Clip này đã có trong kho rồi!");
        setSaving(false);
        return;
      }

      setError(String(data.error || `Lỗi server (${res.status})`));
      setSaving(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng";
      setError(`Không kết nối được: ${msg}`);
      setSaving(false);
    }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      const res = await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTag.trim() }) });
      const data = await res.json();
      if (data.tag) {
        setTags((p) => p.find((t) => t.id === data.tag.id) ? p : [...p, data.tag]);
        setTagIds((p) => p.includes(data.tag.id) ? p : [...p, data.tag.id]);
      }
      setNewTag("");
    } catch { toast("Lỗi thêm tag"); }
  };

  return (
    <div className="px-5 pt-[max(16px,env(safe-area-inset-top))] pb-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold">✚ Ghim clip mới</h1>
        <p className="text-[13px] text-muted mt-0.5">Dán link TikTok vô đây, ghim lẹ!</p>
      </div>

      <div className="space-y-4">
        {/* ── Link input ── */}
        <div>
          <label className="text-[12px] font-bold text-muted mb-2 block">🔗 Link TikTok *</label>
          <input
            type="url"
            value={link}
            onChange={(e) => { setLink(e.target.value); setError(""); }}
            placeholder="https://www.tiktok.com/@user/video/..."
            className={`w-full bg-card rounded-2xl px-4 py-4 text-[14px] border-2 outline-none transition-colors shadow-sm ${
              !hasInput ? "border-lavender/30 focus:border-lavender" :
              valid ? "border-aqua/50 focus:border-aqua" :
              "border-coral/50 focus:border-coral"
            }`}
            autoComplete="off"
          />

          {/* Status indicator */}
          {hasInput && (
            <div className="mt-2 flex items-center justify-between">
              {valid ? (
                <span className="text-[12px] text-aqua font-bold flex items-center gap-1">
                  <span className="w-4 h-4 bg-aqua/20 rounded-full flex items-center justify-center text-[10px]">✓</span>
                  Link TikTok hợp lệ
                </span>
              ) : (
                <span className="text-[12px] text-coral font-bold flex items-center gap-1">
                  <span className="w-4 h-4 bg-coral/20 rounded-full flex items-center justify-center text-[10px]">✗</span>
                  Không phải link TikTok
                </span>
              )}
              <button onClick={() => { setLink(""); setError(""); }} className="text-[11px] text-muted underline">Xóa</button>
            </div>
          )}
        </div>

        {/* ── Error box ── */}
        {error && (
          <div className="bg-coral/10 border border-coral/20 rounded-2xl p-3 text-[12px] text-coral font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* ── Save button ── */}
        <button
          onClick={submit}
          disabled={saving || !valid}
          className={`w-full py-4 rounded-2xl font-bold text-[15px] press transition-all shadow-lg ${
            saving ? "bg-muted/30 text-muted" :
            !valid ? "bg-muted/15 text-muted/50 cursor-not-allowed" :
            "bg-coral text-white shadow-coral/25 active:scale-[0.98]"
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang ghim...
            </span>
          ) : "📌 Ghim clip"}
        </button>

        {/* ── Details toggle ── */}
        {valid && (
          <button onClick={() => setShowMore(!showMore)} className="w-full text-center text-[13px] text-lavender font-bold py-2 press">
            {showMore ? "▲ Ẩn chi tiết" : "▼ Thêm chi tiết (tuỳ chọn)"}
          </button>
        )}

        {/* ── Detail fields ── */}
        {showMore && valid && (
          <div className="space-y-4 pt-2 anim-slide-dn">
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">✏️ Tên clip</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Công thức mì kem siêu nhanh"
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">👤 Creator</label>
              <input type="text" value={creator} onChange={(e) => setCreator(e.target.value)}
                placeholder="@username"
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">📁 Bộ sưu tập</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setColId(null)}
                  className={`text-[11px] px-3 py-2 rounded-xl font-bold press ${colId === null ? "bg-ink text-white" : "bg-card border border-soft/60"}`}>
                  📥 Inbox
                </button>
                {cols.filter((c) => c.name !== "Inbox").map((c) => (
                  <button key={c.id} onClick={() => setColId(colId === c.id ? null : c.id)}
                    className="text-[11px] px-3 py-2 rounded-xl font-bold press transition-all"
                    style={{ background: colId === c.id ? (c.color || "#8B6CFF") : "#fff", color: colId === c.id ? "#fff" : "#151515", border: colId === c.id ? "none" : "1px solid rgba(240,237,232,.6)" }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">💡 Lưu để làm gì?</label>
              <div className="flex flex-wrap gap-1.5">
                {SAVE_REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(reason === r ? "" : r)}
                    className={`text-[11px] px-3 py-2 rounded-xl font-bold press ${reason === r ? "bg-coral text-white" : "bg-card border border-soft/60"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-muted mb-2 block">🏷️ Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <button key={t.id}
                    onClick={() => setTagIds((p) => p.includes(t.id) ? p.filter((i) => i !== t.id) : [...p, t.id])}
                    className={`text-[11px] px-2.5 py-1.5 rounded-xl font-bold press ${tagIds.includes(t.id) ? "bg-lavender text-white" : "bg-card border border-soft/60"}`}>
                    #{t.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Thêm tag mới..."
                  className="flex-1 bg-card rounded-xl px-3 py-2 text-[12px] border border-soft/60"
                  onKeyDown={(e) => e.key === "Enter" && addTag()} />
                <button onClick={addTag} className="bg-lavender/10 text-lavender px-4 py-2 rounded-xl text-[12px] font-bold press">+</button>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold text-muted mb-1.5 block">💬 Ghi chú</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm note để mai khỏi quên..."
                className="w-full bg-card rounded-2xl px-4 py-3 text-[13px] border border-soft/60 resize-none" rows={3} />
            </div>
          </div>
        )}

        {/* ── Instructions ── */}
        <div className="bg-soft/50 rounded-2xl p-4 mt-4">
          <p className="text-[12px] font-bold text-muted mb-2">💡 Cách lấy link TikTok:</p>
          <ol className="text-[11px] text-muted space-y-1.5 list-decimal list-inside">
            <li>Mở video TikTok bạn muốn lưu</li>
            <li>Bấm nút <b>Chia sẻ</b> (mũi tên)</li>
            <li>Chọn <b>Sao chép liên kết</b></li>
            <li>Quay lại đây, dán link vào ô trên</li>
          </ol>
          <div className="mt-3 p-2 bg-card rounded-xl">
            <p className="text-[10px] text-muted/70">Link hợp lệ trông như:</p>
            <p className="text-[11px] text-lavender font-mono mt-0.5 break-all">https://www.tiktok.com/@user/video/123...</p>
            <p className="text-[11px] text-lavender font-mono mt-0.5 break-all">https://vm.tiktok.com/ZM...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
