import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { eq, sql } from "drizzle-orm";
import { db, essaysTable, collectionsTable } from "@workspace/db";
import { requireAdmin, isAdminUserId } from "../middlewares/requireAdmin";
import { parseMarkdown } from "../lib/markdownParser";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/admin/me", (req: Request, res: Response): void => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  res.json({
    user: req.user,
    isAdmin: isAdminUserId(req.user.id),
  });
});

router.get(
  "/admin/essays",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select({
        essayId: essaysTable.essayId,
        titlePt: essaysTable.titlePt,
        titleZh: essaysTable.titleZh,
        titlePinyin: essaysTable.titlePinyin,
        collectionSlug: essaysTable.collectionSlug,
        firstPublishedDate: essaysTable.firstPublishedDate,
        essayType: essaysTable.essayType,
        difficultyLevel: essaysTable.difficultyLevel,
        isFeatured: essaysTable.isFeatured,
        contentOriginalZh: essaysTable.contentOriginalZh,
        contentModernZh: essaysTable.contentModernZh,
        contentPinyin: essaysTable.contentPinyin,
        contentPt: essaysTable.contentPt,
        collectionTitlePt: collectionsTable.titlePt,
      })
      .from(essaysTable)
      .leftJoin(
        collectionsTable,
        eq(essaysTable.collectionSlug, collectionsTable.slug),
      )
      .orderBy(essaysTable.id);

    const result = rows.map((r) => ({
      essayId: r.essayId,
      titlePt: r.titlePt,
      titleZh: r.titleZh,
      titlePinyin: r.titlePinyin,
      collectionSlug: r.collectionSlug,
      collectionTitlePt: r.collectionTitlePt,
      firstPublishedDate: r.firstPublishedDate
        ? r.firstPublishedDate.toString()
        : null,
      essayType: r.essayType,
      difficultyLevel: r.difficultyLevel,
      isFeatured: r.isFeatured,
      hasOriginalZh: !!r.contentOriginalZh,
      hasModernZh: !!r.contentModernZh,
      hasPinyin: !!r.contentPinyin,
      hasPt: !!r.contentPt,
    }));

    res.json(result);
  },
);

router.post(
  "/admin/essays/preview",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .md é obrigatório" });
      return;
    }
    try {
      const parsed = parseMarkdown(req.file.buffer.toString("utf-8"));
      res.json(parsed);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/admin/essays/upload",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .md é obrigatório" });
      return;
    }

    let parsed;
    try {
      parsed = parseMarkdown(req.file.buffer.toString("utf-8"));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }

    const { frontmatter: fm, sections, derived } = parsed;

    const [existing] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, fm.essayId));

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (fm.titlePt) updates["titlePt"] = fm.titlePt;
      if (fm.titleZh) updates["titleZh"] = fm.titleZh;
      if (fm.titlePinyin !== undefined) updates["titlePinyin"] = fm.titlePinyin;
      if (fm.collectionSlug) updates["collectionSlug"] = fm.collectionSlug;
      if (fm.firstPublishedDate !== undefined)
        updates["firstPublishedDate"] = fm.firstPublishedDate;
      if (fm.firstPublishedVenuePt !== undefined)
        updates["firstPublishedVenuePt"] = fm.firstPublishedVenuePt;
      if (fm.firstPublishedVenueZh !== undefined)
        updates["firstPublishedVenueZh"] = fm.firstPublishedVenueZh;
      if (fm.pseudonymUsed !== undefined)
        updates["pseudonymUsed"] = fm.pseudonymUsed;
      if (fm.pseudonymNotePt !== undefined)
        updates["pseudonymNotePt"] = fm.pseudonymNotePt;
      if (fm.essayType) updates["essayType"] = fm.essayType;
      if (fm.genreTagsPt) updates["genreTagsPt"] = fm.genreTagsPt;
      if (fm.genreTagsZh) updates["genreTagsZh"] = fm.genreTagsZh;
      if (fm.themesPt) updates["themesPt"] = fm.themesPt;
      if (fm.difficultyLevel) updates["difficultyLevel"] = fm.difficultyLevel;
      if (fm.isFeatured !== undefined) updates["isFeatured"] = fm.isFeatured;
      if (fm.translatorName !== undefined)
        updates["translatorName"] = fm.translatorName;
      if (fm.sourceTextEdition !== undefined)
        updates["sourceTextEdition"] = fm.sourceTextEdition;

      for (const [field, value] of Object.entries(sections)) {
        if (value) updates[field] = value;
      }

      if (derived.wordCountPt !== null && sections.contentPt)
        updates["wordCountPt"] = derived.wordCountPt;
      if (derived.wordCountZh !== null && (sections.contentOriginalZh || sections.contentModernZh))
        updates["wordCountZh"] = derived.wordCountZh;
      if (derived.estimatedReadingTime !== null && sections.contentPt)
        updates["estimatedReadingTime"] = derived.estimatedReadingTime;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: "Nada para atualizar" });
        return;
      }

      await db
        .update(essaysTable)
        .set(updates)
        .where(eq(essaysTable.essayId, fm.essayId));

      res.json({ action: "updated", essayId: fm.essayId });
      return;
    }

    if (!fm.titlePt || !fm.titleZh || !fm.collectionSlug) {
      res.status(400).json({
        error:
          "Para criar um novo ensaio são obrigatórios: essayId, titlePt, titleZh, collectionSlug",
      });
      return;
    }

    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, fm.collectionSlug));
    if (!collection) {
      res
        .status(400)
        .json({ error: `Coleção desconhecida: ${fm.collectionSlug}` });
      return;
    }

    await db.insert(essaysTable).values({
      essayId: fm.essayId,
      titlePt: fm.titlePt,
      titleZh: fm.titleZh,
      titlePinyin: fm.titlePinyin ?? null,
      collectionSlug: fm.collectionSlug,
      volumeNumber: collection.volumeNumber,
      firstPublishedDate: fm.firstPublishedDate ?? null,
      firstPublishedVenuePt: fm.firstPublishedVenuePt ?? null,
      firstPublishedVenueZh: fm.firstPublishedVenueZh ?? null,
      pseudonymUsed: fm.pseudonymUsed ?? null,
      pseudonymNotePt: fm.pseudonymNotePt ?? null,
      essayType: fm.essayType ?? "ensaio",
      genreTagsPt: fm.genreTagsPt ?? [],
      genreTagsZh: fm.genreTagsZh ?? [],
      themesPt: fm.themesPt ?? [],
      historicalContextPt: sections.historicalContextPt ?? null,
      contentOriginalZh: sections.contentOriginalZh ?? null,
      contentModernZh: sections.contentModernZh ?? null,
      contentPinyin: sections.contentPinyin ?? null,
      contentPt: sections.contentPt ?? null,
      translatorName: fm.translatorName ?? null,
      translationNotesPt: sections.translationNotesPt ?? null,
      sourceTextEdition: fm.sourceTextEdition ?? null,
      difficultyLevel: fm.difficultyLevel ?? "intermediate",
      estimatedReadingTime: derived.estimatedReadingTime,
      wordCountPt: derived.wordCountPt,
      wordCountZh: derived.wordCountZh,
      isFeatured: fm.isFeatured ?? false,
    });

    await db
      .update(collectionsTable)
      .set({
        essayCount: sql`(SELECT COUNT(*)::int FROM ${essaysTable} WHERE ${essaysTable.collectionSlug} = ${fm.collectionSlug})`,
      })
      .where(eq(collectionsTable.slug, fm.collectionSlug));

    res.status(201).json({ action: "created", essayId: fm.essayId });
  },
);

router.get(
  "/admin/essays/:essayId",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const [essay] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));
    if (!essay) {
      res.status(404).json({ error: "Não encontrado" });
      return;
    }
    res.json({
      ...essay,
      firstPublishedDate: essay.firstPublishedDate
        ? essay.firstPublishedDate.toString()
        : null,
    });
  },
);

router.patch(
  "/admin/essays/:essayId",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const allowed = [
      "titlePt",
      "titleZh",
      "titlePinyin",
      "collectionSlug",
      "firstPublishedDate",
      "firstPublishedVenuePt",
      "firstPublishedVenueZh",
      "pseudonymUsed",
      "pseudonymNotePt",
      "essayType",
      "difficultyLevel",
      "isFeatured",
      "translatorName",
      "sourceTextEdition",
      "genreTagsPt",
      "themesPt",
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nada para atualizar" });
      return;
    }

    const [essay] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));
    if (!essay) {
      res.status(404).json({ error: "Não encontrado" });
      return;
    }

    await db
      .update(essaysTable)
      .set(updates)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));

    const [updated] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));

    res.json({
      ...updated,
      firstPublishedDate: updated.firstPublishedDate
        ? updated.firstPublishedDate.toString()
        : null,
    });
  },
);

router.delete(
  "/admin/essays/:essayId",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const [essay] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));
    if (!essay) {
      res.status(404).json({ error: "Não encontrado" });
      return;
    }
    await db
      .delete(essaysTable)
      .where(eq(essaysTable.essayId, String(req.params["essayId"])));
    await db
      .update(collectionsTable)
      .set({
        essayCount: sql`(SELECT COUNT(*)::int FROM ${essaysTable} WHERE ${essaysTable.collectionSlug} = ${essay.collectionSlug})`,
      })
      .where(eq(collectionsTable.slug, essay.collectionSlug));
    res.json({ success: true });
  },
);

const TEMPLATE_MD = `---
essayId: lx_YYYYMMDD_001
titleZh: 标题
titlePt: Título em Português
titlePinyin: Pinyin do título (opcional)
collectionSlug: hua-gai-ji-xu-bian
firstPublishedDate: 1926-04-01
firstPublishedVenuePt: Yusi (Fio de Linguagem)
pseudonymUsed: null
essayType: ensaio
genreTagsPt: [memória, crítica política]
themesPt: [violência estatal, coragem feminina]
difficultyLevel: advanced
isFeatured: false
translatorName: Arquivo Lu Xun Digital
sourceTextEdition: 鲁迅全集 (2005版), Vol. 3
---

## historical-context
Contexto histórico em português (opcional).

## zh-original
原文（古汉语）

## zh-modern
现代汉语翻译

## pinyin
pīn yīn

## pt
Tradução em português.

## translation-notes
Notas do tradutor (opcional).
`;

router.get("/admin/template.md", requireAdmin, (_req, res): void => {
  res.type("text/markdown; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="lu-xun-template.md"',
  );
  res.send(TEMPLATE_MD);
});

export default router;
