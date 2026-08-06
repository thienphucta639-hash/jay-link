export interface Clip {
  id: number;
  sourceUrl: string;
  creatorName: string | null;
  creatorHandle: string | null;
  previewImage: string | null;
  customTitle: string | null;
  note: string | null;
  saveReason: string | null;
  watchStatus: string | null;
  isPinned: boolean | null;
  savedAt: string;
  lastOpenedAt: string | null;
  openCount: number | null;
  collectionId: number | null;
  tags: string[] | { tagName: string; tagId: number }[];
}

export interface Collection {
  id: number;
  name: string;
  color: string | null;
  coverImage: string | null;
  isPinned: boolean | null;
  createdAt: string;
  clipCount: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Creator {
  creatorHandle: string;
  creatorName: string | null;
  clipCount: number;
  latestPreview: string | null;
}

export const SAVE_REASONS = [
  "Coi lại",
  "Làm theo",
  "Mua sau",
  "Học",
  "Cười",
  "Truyền cảm hứng",
  "Gửi bạn bè",
  "Lưu ý tưởng",
] as const;

export const WATCH_STATUSES = [
  { value: "unreviewed", label: "Chưa xem lại", color: "#FFB38A" },
  { value: "reviewed", label: "Đã xem lại", color: "#57E6D6" },
  { value: "done", label: "Đã làm theo", color: "#C7FF5E" },
  { value: "not_needed", label: "Không còn cần", color: "#8E8E93" },
  { value: "keep", label: "Lưu lâu dài", color: "#8B6CFF" },
] as const;

export const COLLECTION_COLORS = [
  "#FF6B6B",
  "#C7FF5E",
  "#8B6CFF",
  "#57E6D6",
  "#FFB38A",
  "#FF8B8B",
  "#4D7CFE",
  "#93F2C2",
  "#7059FF",
];
