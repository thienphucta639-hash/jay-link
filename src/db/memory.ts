// In-memory database — always works, no PostgreSQL needed

export interface Clip {
  id: number;
  sourceUrl: string;
  creatorName: string | null;
  creatorHandle: string | null;
  previewImage: string | null;
  customTitle: string | null;
  note: string | null;
  saveReason: string | null;
  watchStatus: string;
  isPinned: boolean;
  savedAt: string;
  lastOpenedAt: string | null;
  openCount: number;
  collectionId: number | null;
  tags: string[];
}

export interface Collection {
  id: number;
  name: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

// ── Global store (persists while server is running) ──
const g = globalThis as typeof globalThis & {
  _clips?: Clip[];
  _collections?: Collection[];
  _tags?: Tag[];
  _clipTags?: { clipId: number; tagId: number }[];
  _nextId?: { clip: number; col: number; tag: number };
  _seeded?: boolean;
};

function seed() {
  if (g._seeded) return;

  g._collections = [
    { id: 1, name: "Inbox", color: "#8B6CFF", isPinned: true, createdAt: new Date().toISOString() },
    { id: 2, name: "Ăn thử", color: "#FF6B6B", isPinned: false, createdAt: new Date().toISOString() },
    { id: 3, name: "Mặc thử", color: "#C7FF5E", isPinned: false, createdAt: new Date().toISOString() },
    { id: 4, name: "Làm thử", color: "#57E6D6", isPinned: false, createdAt: new Date().toISOString() },
    { id: 5, name: "Xem lại", color: "#FFB38A", isPinned: false, createdAt: new Date().toISOString() },
    { id: 6, name: "Mua sau", color: "#FF8B8B", isPinned: false, createdAt: new Date().toISOString() },
    { id: 7, name: "Cười xỉu", color: "#C7FF5E", isPinned: false, createdAt: new Date().toISOString() },
    { id: 8, name: "Đi sau", color: "#57E6D6", isPinned: false, createdAt: new Date().toISOString() },
    { id: 9, name: "Decor gu tui", color: "#8B6CFF", isPinned: false, createdAt: new Date().toISOString() },
    { id: 10, name: "Routine", color: "#FFB38A", isPinned: false, createdAt: new Date().toISOString() },
    { id: 11, name: "Quote giữ lại", color: "#FF6B6B", isPinned: false, createdAt: new Date().toISOString() },
    { id: 12, name: "Edit học ké", color: "#C7FF5E", isPinned: false, createdAt: new Date().toISOString() },
    { id: 13, name: "Quán phải đi", color: "#57E6D6", isPinned: false, createdAt: new Date().toISOString() },
  ];

  g._tags = [
    "đồ ăn", "outfit", "beauty", "decor", "travel", "music", "quote", "study", "edit", "gym",
    "làm theo", "mua", "coi lại", "học", "gửi bạn", "lấy idea", "chill", "cute", "sang", "tối giản", "buồn cười", "healing",
  ].map((name, i) => ({ id: i + 1, name }));

  g._clips = [];
  g._clipTags = [];
  g._nextId = { clip: 1, col: 14, tag: 23 };
  g._seeded = true;
}

export function store() {
  seed();
  return {
    clips: g._clips!,
    collections: g._collections!,
    tags: g._tags!,
    clipTags: g._clipTags!,
    nextId: g._nextId!,
  };
}
