"use client";

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] anim-slide-dn pointer-events-none">
      <div className="bg-ink text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-xl shadow-ink/20 whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
