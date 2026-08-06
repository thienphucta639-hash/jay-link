"use client";

import { useState, useCallback } from "react";
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
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, id: Date.now() });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const onSaved = useCallback(() => {
    // Toast is shown by SaveTab with timestamp
    refresh();
    setActiveTab("home");
  }, [refresh]);

  return (
    <div className="flex flex-col h-dvh">
      {/* Tab content */}
      <main className="flex-1 overflow-y-auto pb-[76px] hide-scroll">
        <div key={`${activeTab}-${refreshKey}`} className="anim-fade">
          {activeTab === "home" && (
            <HomeTab onNav={setActiveTab} toast={showToast} />
          )}
          {activeTab === "search" && <SearchTab toast={showToast} />}
          {activeTab === "save" && (
            <SaveTab onSaved={onSaved} toast={showToast} />
          )}
          {activeTab === "collections" && (
            <CollectionsTab toast={showToast} />
          )}
          {activeTab === "profile" && <ProfileTab toast={showToast} />}
        </div>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
      {toast && <Toast key={toast.id} message={toast.msg} />}
    </div>
  );
}
