import { pgTable, text, serial, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const essaysTable = pgTable("essays", {
  id: serial("id").primaryKey(),
  essayId: text("essay_id").notNull().unique(),
  titlePt: text("title_pt").notNull(),
  titleZh: text("title_zh").notNull(),
  titlePinyin: text("title_pinyin"),
  collectionSlug: text("collection_slug").notNull(),
  volumeNumber: integer("volume_number").notNull(),
  firstPublishedDate: date("first_published_date"),
  firstPublishedVenueZh: text("first_published_venue_zh"),
  firstPublishedVenuePt: text("first_published_venue_pt"),
  pseudonymUsed: text("pseudonym_used"),
  pseudonymNotePt: text("pseudonym_note_pt"),
  essayType: text("essay_type").notNull().default("crônica"),
  genreTagsPt: text("genre_tags_pt").array().notNull().default([]),
  genreTagsZh: text("genre_tags_zh").array().notNull().default([]),
  themesPt: text("themes_pt").array().notNull().default([]),
  historicalContextPt: text("historical_context_pt"),
  contentOriginalZh: text("content_original_zh"),
  contentModernZh: text("content_modern_zh"),
  contentPinyin: text("content_pinyin"),
  contentPt: text("content_pt"),
  translatorName: text("translator_name"),
  translationNotesPt: text("translation_notes_pt"),
  sourceTextEdition: text("source_text_edition"),
  difficultyLevel: text("difficulty_level").notNull().default("intermediate"),
  estimatedReadingTime: integer("estimated_reading_time"),
  wordCountPt: integer("word_count_pt"),
  wordCountZh: integer("word_count_zh"),
  isFeatured: boolean("is_featured").notNull().default(false),
});

export const insertEssaySchema = createInsertSchema(essaysTable).omit({ id: true });
export type InsertEssay = z.infer<typeof insertEssaySchema>;
export type Essay = typeof essaysTable.$inferSelect;
