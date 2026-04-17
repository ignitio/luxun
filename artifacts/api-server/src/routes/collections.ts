import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, collectionsTable, essaysTable } from "@workspace/db";
import {
  GetCollectionParams,
  ListCollectionsResponse,
  GetCollectionResponse,
  ListEssaysByCollectionParams,
  ListEssaysByCollectionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/collections", async (_req, res): Promise<void> => {
  const collections = await db
    .select()
    .from(collectionsTable)
    .orderBy(collectionsTable.sortOrder);
  res.json(ListCollectionsResponse.parse(collections));
});

router.get("/collections/:slug", async (req, res): Promise<void> => {
  const params = GetCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, params.data.slug));

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  res.json(GetCollectionResponse.parse(collection));
});

router.get("/collections/:slug/essays", async (req, res): Promise<void> => {
  const params = ListEssaysByCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const collection = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, params.data.slug))
    .limit(1);

  if (collection.length === 0) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const essays = await db
    .select()
    .from(essaysTable)
    .where(eq(essaysTable.collectionSlug, params.data.slug))
    .orderBy(essaysTable.id);

  const essayList = await Promise.all(
    essays.map(async (essay) => {
      const coll = collection[0];
      return {
        ...essay,
        firstPublishedDate: essay.firstPublishedDate
          ? essay.firstPublishedDate.toString()
          : null,
        collectionTitlePt: coll.titlePt,
      };
    })
  );

  res.json(ListEssaysByCollectionResponse.parse(essayList));
});

export default router;
