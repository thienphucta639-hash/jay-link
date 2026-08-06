"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalClips: number;
  unclassified: number;
  pinned: number;
  unreviewed: number;
}

interface Props {
  toast: (msg: string) => void;
}

export default function ProfileTab({ toast }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const exportData = async () => {
    try {
      const res = await fetch("/api/clips?limit=9999");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.clips, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghimclip-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Đã xuất dữ liệu!");
    } catch { toast("Lỗi xuất dữ liệu"); }
  };

  return (
    <div className="px-5 pt-[max(12px,env(safe-area-inset-top))] pb-8 space-y-5">
      <h1 className="text-[22px] font-extrabold">⚙️ Tôi</h1>

      {/* Brand card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-lavender via-lavender to-coral rounded-3xl p-6 text-white shadow-xl shadow-lavender/20 anim-pop">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/8" />

        <h2 className="text-xl font-extrabold relative z-10">📌 GhimClip</h2>
        <p className="text-[14px] opacity-90 mt-1 relative z-10">Lưu clip theo cách não bạn nhớ</p>
        <p className="text-[12px] opacity-60 mt-2 relative z-10">TikTok giúp bạn lưu, GhimClip giúp bạn tìm lại.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-card rounded-2xl p-4 border border-soft/60 shadow-sm anim-pop">
          <h3 className="text-[13px] font-extrabold mb-3">📊 Thống kê kho</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: stats.totalClips, l: "Tổng clip", e: "📦" },
              { n: stats.unclassified, l: "Chưa phân loại", e: "📥" },
              { n: stats.pinned, l: "Đã ghim", e: "📌" },
              { n: stats.unreviewed, l: "Chưa xem lại", e: "👀" },
            ].map((s) => (
              <div key={s.l} className="bg-cream rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base">{s.e}</span>
                  <span className="text-xl font-extrabold">{s.n}</span>
                </div>
                <p className="text-[11px] text-muted font-semibold">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 stagger">
        {[
          { icon: "📤", t: "Xuất dữ liệu", d: "Export ra file JSON", fn: exportData },
          { icon: "📱", t: "Thêm vào màn hình", d: "Thao tác như app native", fn: () => toast("Thêm trang web vào màn hình chính trên trình duyệt") },
          { icon: "🔒", t: "Quyền riêng tư", d: "Dữ liệu chỉ thuộc về bạn", fn: () => {} },
        ].map((a) => (
          <button
            key={a.t}
            onClick={a.fn}
            className="w-full bg-card rounded-2xl p-4 text-left border border-soft/60 flex items-center gap-3 press transition-shadow hover:shadow-md anim-pop"
          >
            <span className="text-xl">{a.icon}</span>
            <div>
              <p className="text-[13px] font-bold">{a.t}</p>
              <p className="text-[11px] text-muted">{a.d}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-muted font-semibold">GhimClip v1.0</p>
        <p className="text-[10px] text-muted/50 mt-0.5">Dán link → Ghim → Tìm lại trong vài giây</p>
      </div>
    </div>
  );
}
