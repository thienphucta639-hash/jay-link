import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#FF6B6B"),
  coverImage: text("cover_image"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  creatorName: varchar("creator_name", { length: 100 }),
  creatorHandle: varchar("creator_handle", { length: 100 }),
  previewImage: text("preview_image"),
  customTitle: varchar("custom_title", { length: 255 }),
  note: text("note"),
  saveReason: varchar("save_reason", { length: 50 }),
  watchStatus: varchar("watch_status", { length: 30 }).default("unreviewed"),
  isPinned: boolean("is_pinned").default(false),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  lastOpenedAt: timestamp("last_opened_at"),
  openCount: integer("open_count").default(0),
  collectionId: integer("collection_id").references(() => collections.id, {
    onDelete: "set null",
  }),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const clipTags = pgTable("clip_tags", {
  clipId: integer("clip_id")
    .notNull()
    .references(() => clips.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});
