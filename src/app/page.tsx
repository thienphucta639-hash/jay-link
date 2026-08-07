"use client";

import { useState, useCallback, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import HomeTab from "@/components/tabs/HomeTab";
import SearchTab from "@/components/tabs/SearchTab";
import SaveTab from "@/components/tabs/SaveTab";
import CollectionsTab from "@/components/tabs/CollectionsTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import Toast from "@/components/Toast";

export type TabKey = "home" | "search" | "save" | "collections" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const onSaved = useCallback(() => {
    showToast(`Đã ghim lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}! 📌`);
    setRefreshSignal(n => n + 1);
    setActiveTab("home");
  }, [showToast]);

  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 overflow-y-auto pb-[76px] hide-scroll">
        {activeTab === "home" && <HomeTab onNav={setActiveTab} toast={showToast} refreshSignal={refreshSignal} />}
        {activeTab === "search" && <SearchTab toast={showToast} />}
        {activeTab === "save" && <SaveTab onSaved={onSaved} toast={showToast} />}
        {activeTab === "collections" && <CollectionsTab toast={showToast} />}
        {activeTab === "profile" && <ProfileTab toast={showToast} />}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {toast && <Toast key={toast.id} message={toast.msg} />}
    </div>
  );
}
