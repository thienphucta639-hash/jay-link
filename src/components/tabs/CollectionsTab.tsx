"use client";

import { useState, useEffect, useCallback } from "react";
import type { Collection, Clip } from "@/lib/types";
import { ClipRow } from "@/components/ClipCard";
import { COLLECTION_COLORS } from "@/lib/types";

interface Props {
  toast: (msg: string) => void;
}

export default function CollectionsTab({ toast }: Props) {
  const [cols, setCols] = useState<Collection[]>([]);
  const [sel, setSel] = useState<Collection | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#FF6B6B");
  const [clipLoad, setClipLoad] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      const d = await res.json();
      setCols(d.collections);
    } catch { toast("Lỗi tải bộ sưu tập"); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const open = async (c: Collection) => {
    setSel(c);
    setClipLoad(true);
    try {
      const res = await fetch(`/api/clips?collection_id=${c.id}&limit=100`);
      const d = await res.json();
      setClips(d.clips);
    } catch { toast("Lỗi tải clip"); }
    setClipLoad(false);
  };

  const create = async () => {
    if (!newName.trim()) return;
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName(""); setShowNew(false);
    load();
    toast("Đã tạo bộ sưu tập!");
  };

  const del = async (id: number) => {
    if (!confirm("Xóa bộ sưu tập này?")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setSel(null);
    load();
    toast("Đã xóa!");
  };

  /* ── Collection detail ── */
  if (sel) {
    return (
      <div className="px-5 pt-[max(12px,env(safe-area-inset-top))] pb-4 space-y-4">
        <button onClick={() => setSel(null)} className="text-sm text-muted font-semibold press">← Quay lại</button>

        <div className="flex items-center gap-3 anim-pop">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-lg"
            style={{ background: sel.color || "#8B6CFF", boxShadow: `0 8px 24px ${sel.color || "#8B6CFF"}30` }}
          >
            {sel.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold">{sel.name}</h1>
            <p className="text-[12px] text-muted">{sel.clipCount} clip</p>
          </div>
          <button onClick={() => del(sel.id)} className="text-coral text-[12px] font-bold press">Xóa</button>
        </div>

        {clipLoad ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clips.length === 0 ? (
          <div className="text-center py-16 anim-pop">
            <div className="text-5xl mb-2 anim-float">📁</div>
            <p className="text-sm text-muted font-bold">Bộ sưu tập này đang trống nè</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {clips.map((c) => (
              <div key={c.id} className="anim-pop">
                <ClipRow clip={c} onUpdate={() => open(sel)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Collection list ── */
  return (
    <div className="px-5 pt-[max(12px,env(safe-area-inset-top))] pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold">📁 Bộ sưu tập</h1>
        <button
          onClick={() => setShowNew(true)}
          className="bg-lavender text-white px-4 py-2 rounded-xl text-[12px] font-bold press shadow-md shadow-lavender/20"
        >
          + Tạo mới
        </button>
      </div>

      {/* Create */}
      {showNew && (
        <div className="bg-card rounded-2xl p-4 border border-soft/60 space-y-3 anim-pop shadow-md">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên bộ sưu tập..."
            className="w-full bg-cream rounded-xl px-4 py-3 text-[13px] border border-soft/60"
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <div className="flex gap-2 flex-wrap">
            {COLLECTION_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-8 h-8 rounded-full press transition-transform ${newColor === c ? "scale-125 ring-2 ring-ink ring-offset-2" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="flex-1 bg-lavender text-white py-2.5 rounded-xl text-sm font-bold press">Tạo</button>
            <button onClick={() => setShowNew(false)} className="px-5 py-2.5 bg-soft rounded-xl text-sm font-bold press">Hủy</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-lavender border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger">
          {cols.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c)}
              className="bg-card rounded-2xl p-4 text-left border border-soft/60 press transition-shadow hover:shadow-md anim-pop"
            >
              <div
                className="w-11 h-11 rounded-xl mb-2.5 flex items-center justify-center text-white text-lg font-extrabold shadow-md"
                style={{ background: c.color || "#8B6CFF", boxShadow: `0 4px 12px ${c.color || "#8B6CFF"}30` }}
              >
                {c.name.charAt(0)}
              </div>
              <p className="text-[13px] font-bold line-clamp-1">{c.name}</p>
              <p className="text-[11px] text-muted mt-0.5">{c.clipCount} clip</p>
              {c.isPinned && <span className="text-[10px] text-coral font-bold">📌</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
