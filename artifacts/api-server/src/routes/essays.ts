import { Router, type IRouter } from "express";
import { eq, ilike, and, or, isNotNull, ne, sql } from "drizzle-orm";
import { db, essaysTable, collectionsTable } from "@workspace/db";

const hasPortugueseContent = and(
  isNotNull(essaysTable.contentPt),
  ne(essaysTable.contentPt, ""),
);
import {
  ListEssaysQueryParams,
  ListEssaysResponse,
  GetEssayParams,
  GetEssayResponse,
  GetFeaturedEssaysResponse,
  GetArchiveStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/essays/featured", async (_req, res): Promise<void> => {
  const featured = await db
    .select({
      id: essaysTable.id,
      essayId: essaysTable.essayId,
      titlePt: essaysTable.titlePt,
      titleZh: essaysTable.titleZh,
      titlePinyin: essaysTable.titlePinyin,
      collectionSlug: essaysTable.collectionSlug,
      firstPublishedDate: essaysTable.firstPublishedDate,
      firstPublishedVenuePt: essaysTable.firstPublishedVenuePt,
      pseudonymUsed: essaysTable.pseudonymUsed,
      essayType: essaysTable.essayType,
      genreTagsPt: essaysTable.genreTagsPt,
      difficultyLevel: essaysTable.difficultyLevel,
      estimatedReadingTime: essaysTable.estimatedReadingTime,
      wordCountPt: essaysTable.wordCountPt,
      collectionTitlePt: collectionsTable.titlePt,
    })
    .from(essaysTable)
    .innerJoin(collectionsTable, eq(essaysTable.collectionSlug, collectionsTable.slug))
    .where(and(eq(essaysTable.isFeatured, true), hasPortugueseContent))
    .limit(6);

  const result = featured.map((e) => ({
    ...e,
    firstPublishedDate: e.firstPublishedDate ? e.firstPublishedDate.toString() : null,
  }));

  res.json(GetFeaturedEssaysResponse.parse(result));
});

router.get("/essays", async (req, res): Promise<void> => {
  const query = ListEssaysQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, collectionSlug, essayType, difficulty } = query.data;

  const conditions = [hasPortugueseContent];

  if (collectionSlug) {
    conditions.push(eq(essaysTable.collectionSlug, collectionSlug));
  }
  if (essayType) {
    conditions.push(eq(essaysTable.essayType, essayType));
  }
  if (difficulty) {
    conditions.push(eq(essaysTable.difficultyLevel, difficulty));
  }
  if (search) {
    conditions.push(
      or(
        ilike(essaysTable.titlePt, `%${search}%`),
        ilike(essaysTable.titleZh, `%${search}%`),
        ilike(essaysTable.historicalContextPt, `%${search}%`)
      )
    );
  }

  const essays = await db
    .select({
      id: essaysTable.id,
      essayId: essaysTable.essayId,
      titlePt: essaysTable.titlePt,
      titleZh: essaysTable.titleZh,
      titlePinyin: essaysTable.titlePinyin,
      collectionSlug: essaysTable.collectionSlug,
      firstPublishedDate: essaysTable.firstPublishedDate,
      firstPublishedVenuePt: essaysTable.firstPublishedVenuePt,
      pseudonymUsed: essaysTable.pseudonymUsed,
      essayType: essaysTable.essayType,
      genreTagsPt: essaysTable.genreTagsPt,
      difficultyLevel: essaysTable.difficultyLevel,
      estimatedReadingTime: essaysTable.estimatedReadingTime,
      wordCountPt: essaysTable.wordCountPt,
      collectionTitlePt: collectionsTable.titlePt,
    })
    .from(essaysTable)
    .innerJoin(collectionsTable, eq(essaysTable.collectionSlug, collectionsTable.slug))
    .where(and(...conditions))
    .orderBy(essaysTable.id);

  const result = essays.map((e) => ({
    ...e,
    firstPublishedDate: e.firstPublishedDate ? e.firstPublishedDate.toString() : null,
  }));

  res.json(ListEssaysResponse.parse(result));
});

router.get("/essays/:essayId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.essayId)
    ? req.params.essayId[0]
    : req.params.essayId;

  const params = GetEssayParams.safeParse({ essayId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [essay] = await db
    .select({
      id: essaysTable.id,
      essayId: essaysTable.essayId,
      titlePt: essaysTable.titlePt,
      titleZh: essaysTable.titleZh,
      titlePinyin: essaysTable.titlePinyin,
      collectionSlug: essaysTable.collectionSlug,
      volumeNumber: essaysTable.volumeNumber,
      firstPublishedDate: essaysTable.firstPublishedDate,
      firstPublishedVenueZh: essaysTable.firstPublishedVenueZh,
      firstPublishedVenuePt: essaysTable.firstPublishedVenuePt,
      pseudonymUsed: essaysTable.pseudonymUsed,
      pseudonymNotePt: essaysTable.pseudonymNotePt,
      essayType: essaysTable.essayType,
      genreTagsPt: essaysTable.genreTagsPt,
      genreTagsZh: essaysTable.genreTagsZh,
      themesPt: essaysTable.themesPt,
      historicalContextPt: essaysTable.historicalContextPt,
      contentOriginalZh: essaysTable.contentOriginalZh,
      contentModernZh: essaysTable.contentModernZh,
      contentPinyin: essaysTable.contentPinyin,
      contentPt: essaysTable.contentPt,
      translatorName: essaysTable.translatorName,
      translationNotesPt: essaysTable.translationNotesPt,
      sourceTextEdition: essaysTable.sourceTextEdition,
      difficultyLevel: essaysTable.difficultyLevel,
      estimatedReadingTime: essaysTable.estimatedReadingTime,
      wordCountPt: essaysTable.wordCountPt,
      wordCountZh: essaysTable.wordCountZh,
      collectionTitlePt: collectionsTable.titlePt,
      collectionTitleZh: collectionsTable.titleZh,
    })
    .from(essaysTable)
    .innerJoin(collectionsTable, eq(essaysTable.collectionSlug, collectionsTable.slug))
    .where(and(eq(essaysTable.essayId, params.data.essayId), hasPortugueseContent));

  if (!essay) {
    res.status(404).json({ error: "Essay not found" });
    return;
  }

  const result = {
    ...essay,
    firstPublishedDate: essay.firstPublishedDate
      ? essay.firstPublishedDate.toString()
      : null,
  };

  res.json(GetEssayResponse.parse(result));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalEssaysRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(essaysTable)
    .where(hasPortugueseContent);
  const [totalCollectionsRow] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(collectionsTable);
  const [yearRangeRow] = await db.select({
    min: sql<number>`MIN(year)::int`,
    max: sql<number>`MAX(year)::int`,
  }).from(collectionsTable);
  const [pseudonymsRow] = await db
    .select({ count: sql<number>`COUNT(DISTINCT pseudonym_used)::int` })
    .from(essaysTable)
    .where(hasPortugueseContent);

  const essaysByTypeRaw = await db.select({
    type: essaysTable.essayType,
    count: sql<number>`COUNT(*)::int`,
  })
    .from(essaysTable)
    .where(hasPortugueseContent)
    .groupBy(essaysTable.essayType)
    .orderBy(sql`count DESC`);

  const essaysByVolumeRaw = await db.select({
    volume: essaysTable.volumeNumber,
    count: sql<number>`COUNT(*)::int`,
  })
    .from(essaysTable)
    .where(hasPortugueseContent)
    .groupBy(essaysTable.volumeNumber)
    .orderBy(essaysTable.volumeNumber);

  const stats = {
    totalEssays: totalEssaysRow.count,
    totalCollections: totalCollectionsRow.count,
    yearRange: `${yearRangeRow.min}–${yearRangeRow.max}`,
    totalPseudonyms: pseudonymsRow.count,
    essaysByType: essaysByTypeRaw.map((r) => ({ type: r.type, count: r.count })),
    essaysByVolume: essaysByVolumeRaw.map((r) => ({ volume: r.volume, count: r.count })),
  };

  res.json(GetArchiveStatsResponse.parse(stats));
});

export default router;
