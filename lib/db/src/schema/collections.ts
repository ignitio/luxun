import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titleZh: text("title_zh").notNull(),
  titlePt: text("title_pt").notNull(),
  titleEn: text("title_en"),
  year: integer("year").notNull(),
  volumeNumber: integer("volume_number").notNull(),
  essayCount: integer("essay_count").notNull().default(0),
  characteristics: text("characteristics").notNull(),
  isPoeticCollection: boolean("is_poetic_collection").notNull().default(false),
  sortOrder: integer("sort_order").notNull(),
});

export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({ id: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;
