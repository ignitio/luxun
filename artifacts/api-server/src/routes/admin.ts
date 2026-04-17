import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import { eq, sql, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { db, essaysTable, collectionsTable } from "@workspace/db";
import { requireAdmin, isAdminUserId } from "../middlewares/requireAdmin";
import { parseMarkdown, type ParsedMarkdown } from "../lib/markdownParser";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const collectionCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG_REGEX, "slug deve conter apenas letras minúsculas, números e hífens"),
  titleZh: z.string().min(1).max(200),
  titlePt: z.string().min(1).max(200),
  titleEn: z.string().max(200).nullable().optional(),
  year: z.number().int().min(1800).max(2100),
  volumeNumber: z.number().int().min(1).max(99),
  characteristics: z.string().min(1),
  isPoeticCollection: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999),
});

const collectionUpdateSchema = collectionCreateSchema.partial().omit({ slug: true });

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

type BatchEntryStatus = "create" | "update" | "invalid";

interface BatchEntry {
  fileName: string;
  status: BatchEntryStatus;
  essayId: string | null;
  titlePt: string | null;
  titleZh: string | null;
  collectionSlug: string | null;
  error: string | null;
}

interface BatchPreviewResult {
  entries: BatchEntry[];
  summary: {
    total: number;
    toCreate: number;
    toUpdate: number;
    invalid: number;
  };
}

function extractMarkdownEntries(
  buffer: Buffer,
): { fileName: string; content: string }[] {
  const zip = new AdmZip(buffer);
  const out: { fileName: string; content: string }[] = [];
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;
    if (name.startsWith("__MACOSX/")) continue;
    const base = name.split("/").pop() ?? name;
    if (base.startsWith(".")) continue;
    if (!/\.md$/i.test(base)) continue;
    out.push({
      fileName: name,
      content: entry.getData().toString("utf-8"),
    });
  }
  return out;
}

async function buildBatchPreview(
  files: { fileName: string; content: string }[],
): Promise<{ entries: BatchEntry[]; parsedByFile: Map<string, ParsedMarkdown> }> {
  const parsedByFile = new Map<string, ParsedMarkdown>();
  const tentative: {
    fileName: string;
    parsed?: ParsedMarkdown;
    error?: string;
  }[] = [];

  for (const f of files) {
    try {
      const parsed = parseMarkdown(f.content);
      tentative.push({ fileName: f.fileName, parsed });
    } catch (err) {
      tentative.push({ fileName: f.fileName, error: (err as Error).message });
    }
  }

  const essayIds = Array.from(
    new Set(
      tentative
        .map((t) => t.parsed?.frontmatter.essayId)
        .filter((v): v is string => !!v),
    ),
  );
  const collectionSlugs = Array.from(
    new Set(
      tentative
        .map((t) => t.parsed?.frontmatter.collectionSlug)
        .filter((v): v is string => !!v),
    ),
  );

  const existingEssays = essayIds.length
    ? await db
        .select({ essayId: essaysTable.essayId })
        .from(essaysTable)
        .where(inArray(essaysTable.essayId, essayIds))
    : [];
  const existingEssayIds = new Set(existingEssays.map((e) => e.essayId));

  const existingCollections = collectionSlugs.length
    ? await db
        .select({ slug: collectionsTable.slug })
        .from(collectionsTable)
        .where(inArray(collectionsTable.slug, collectionSlugs))
    : [];
  const existingCollectionSlugs = new Set(
    existingCollections.map((c) => c.slug),
  );

  const seenEssayIdsInBatch = new Set<string>();
  const entries: BatchEntry[] = [];

  for (const t of tentative) {
    if (t.error || !t.parsed) {
      entries.push({
        fileName: t.fileName,
        status: "invalid",
        essayId: null,
        titlePt: null,
        titleZh: null,
        collectionSlug: null,
        error: t.error ?? "Falha ao analisar",
      });
      continue;
    }
    const fm = t.parsed.frontmatter;
    const sections = t.parsed.sections;
    const isUpdate = existingEssayIds.has(fm.essayId);

    let error: string | null = null;
    if (seenEssayIdsInBatch.has(fm.essayId)) {
      error = `essayId duplicado no zip: ${fm.essayId}`;
    } else if (!isUpdate) {
      if (!fm.titlePt || !fm.titleZh || !fm.collectionSlug) {
        error =
          "Para criar um novo ensaio são obrigatórios: titlePt, titleZh, collectionSlug";
      } else if (!existingCollectionSlugs.has(fm.collectionSlug)) {
        error = `Coleção desconhecida: ${fm.collectionSlug}`;
      }
    } else {
      const hasAnything =
        Object.values(sections).some((v) => !!v) ||
        Object.entries(fm).some(([k, v]) => k !== "essayId" && v !== undefined);
      if (!hasAnything) error = "Nada para atualizar";
    }

    seenEssayIdsInBatch.add(fm.essayId);
    parsedByFile.set(t.fileName, t.parsed);

    entries.push({
      fileName: t.fileName,
      status: error ? "invalid" : isUpdate ? "update" : "create",
      essayId: fm.essayId,
      titlePt: fm.titlePt ?? null,
      titleZh: fm.titleZh ?? null,
      collectionSlug: fm.collectionSlug ?? null,
      error,
    });
  }

  return { entries, parsedByFile };
}

function summarize(entries: BatchEntry[]): BatchPreviewResult["summary"] {
  return {
    total: entries.length,
    toCreate: entries.filter((e) => e.status === "create").length,
    toUpdate: entries.filter((e) => e.status === "update").length,
    invalid: entries.filter((e) => e.status === "invalid").length,
  };
}

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

type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function applyParsed(
  parsed: ParsedMarkdown,
  exec: DbExecutor,
): Promise<{
  action: "created" | "updated";
  essayId: string;
  collectionSlugs: string[];
}> {
  const { frontmatter: fm, sections, derived } = parsed;

  const [existing] = await exec
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
    if (
      derived.wordCountZh !== null &&
      (sections.contentOriginalZh || sections.contentModernZh)
    )
      updates["wordCountZh"] = derived.wordCountZh;
    if (derived.estimatedReadingTime !== null && sections.contentPt)
      updates["estimatedReadingTime"] = derived.estimatedReadingTime;

    if (Object.keys(updates).length === 0) {
      throw new Error("Nada para atualizar");
    }

    await exec
      .update(essaysTable)
      .set(updates)
      .where(eq(essaysTable.essayId, fm.essayId));

    const slugs = new Set<string>([existing.collectionSlug]);
    if (fm.collectionSlug) slugs.add(fm.collectionSlug);
    return {
      action: "updated",
      essayId: fm.essayId,
      collectionSlugs: Array.from(slugs),
    };
  }

  if (!fm.titlePt || !fm.titleZh || !fm.collectionSlug) {
    throw new Error(
      "Para criar um novo ensaio são obrigatórios: essayId, titlePt, titleZh, collectionSlug",
    );
  }

  const [collection] = await exec
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, fm.collectionSlug));
  if (!collection) {
    throw new Error(`Coleção desconhecida: ${fm.collectionSlug}`);
  }

  await exec.insert(essaysTable).values({
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

  return {
    action: "created",
    essayId: fm.essayId,
    collectionSlugs: [fm.collectionSlug],
  };
}

async function recountCollections(
  slugs: Iterable<string>,
  exec: DbExecutor,
): Promise<void> {
  for (const slug of new Set(slugs)) {
    await exec
      .update(collectionsTable)
      .set({
        essayCount: sql`(SELECT COUNT(*)::int FROM ${essaysTable} WHERE ${essaysTable.collectionSlug} = ${slug})`,
      })
      .where(eq(collectionsTable.slug, slug));
  }
}

router.post(
  "/admin/essays/upload",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .md é obrigatório" });
      return;
    }

    let parsed: ParsedMarkdown;
    try {
      parsed = parseMarkdown(req.file.buffer.toString("utf-8"));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }

    try {
      const result = await db.transaction(async (tx) => {
        const r = await applyParsed(parsed, tx);
        await recountCollections(r.collectionSlugs, tx);
        return r;
      });
      res
        .status(result.action === "created" ? 201 : 200)
        .json({ action: result.action, essayId: result.essayId });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/admin/essays/batch-preview",
  requireAdmin,
  uploadZip.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .zip é obrigatório" });
      return;
    }
    let files: { fileName: string; content: string }[];
    try {
      files = extractMarkdownEntries(req.file.buffer);
    } catch (err) {
      res
        .status(400)
        .json({ error: "Zip inválido: " + (err as Error).message });
      return;
    }
    if (files.length === 0) {
      res
        .status(400)
        .json({ error: "Nenhum arquivo .md encontrado no zip" });
      return;
    }
    const { entries } = await buildBatchPreview(files);
    const result: BatchPreviewResult = {
      entries,
      summary: summarize(entries),
    };
    res.json(result);
  },
);

router.post(
  "/admin/essays/batch-upload",
  requireAdmin,
  uploadZip.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .zip é obrigatório" });
      return;
    }

    const selectedRaw = req.body?.fileNames;
    let selected: string[] | null = null;
    if (typeof selectedRaw === "string" && selectedRaw.length) {
      try {
        const v = JSON.parse(selectedRaw);
        if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
          selected = v;
        }
      } catch {
        // ignore parse error; treated as none provided
      }
    }

    let files: { fileName: string; content: string }[];
    try {
      files = extractMarkdownEntries(req.file.buffer);
    } catch (err) {
      res
        .status(400)
        .json({ error: "Zip inválido: " + (err as Error).message });
      return;
    }
    if (files.length === 0) {
      res
        .status(400)
        .json({ error: "Nenhum arquivo .md encontrado no zip" });
      return;
    }

    const { entries, parsedByFile } = await buildBatchPreview(files);
    const validByFile = new Map(
      entries.filter((e) => e.status !== "invalid").map((e) => [e.fileName, e]),
    );

    const toApply = (selected ?? Array.from(validByFile.keys())).filter((fn) =>
      validByFile.has(fn),
    );

    if (toApply.length === 0) {
      res.status(400).json({
        error: "Nenhum arquivo válido selecionado para publicar",
        entries,
        summary: summarize(entries),
      });
      return;
    }

    try {
      const applied = await db.transaction(async (tx) => {
        const results: {
          fileName: string;
          action: "created" | "updated";
          essayId: string;
        }[] = [];
        const touchedSlugs = new Set<string>();
        for (const fileName of toApply) {
          const parsed = parsedByFile.get(fileName);
          if (!parsed) continue;
          const r = await applyParsed(parsed, tx);
          for (const s of r.collectionSlugs) touchedSlugs.add(s);
          results.push({
            fileName,
            action: r.action,
            essayId: r.essayId,
          });
        }
        await recountCollections(touchedSlugs, tx);
        return results;
      });

      res.json({
        applied,
        summary: {
          created: applied.filter((a) => a.action === "created").length,
          updated: applied.filter((a) => a.action === "updated").length,
          skipped: entries.length - applied.length,
        },
        entries,
      });
    } catch (err) {
      res.status(400).json({
        error:
          "Falha ao publicar em lote (transação revertida): " +
          (err as Error).message,
      });
    }
  },
);

router.post(
  "/admin/essays",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Record<string, unknown>;
    const essayId = typeof body.essayId === "string" ? body.essayId.trim() : "";
    const titlePt = typeof body.titlePt === "string" ? body.titlePt.trim() : "";
    const titleZh = typeof body.titleZh === "string" ? body.titleZh.trim() : "";
    const collectionSlug =
      typeof body.collectionSlug === "string" ? body.collectionSlug.trim() : "";

    if (!essayId || !titlePt || !titleZh || !collectionSlug) {
      res
        .status(400)
        .json({ error: "Campos obrigatórios: essayId, titlePt, titleZh, collectionSlug" });
      return;
    }

    const [existing] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, essayId));
    if (existing) {
      res.status(409).json({ error: `Ensaio já existe: ${essayId}` });
      return;
    }

    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, collectionSlug));
    if (!collection) {
      res.status(400).json({ error: `Coleção desconhecida: ${collectionSlug}` });
      return;
    }

    const str = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? (v as string[]).filter((s) => typeof s === "string") : [];

    await db.insert(essaysTable).values({
      essayId,
      titlePt,
      titleZh,
      titlePinyin: str(body.titlePinyin),
      collectionSlug,
      volumeNumber: collection.volumeNumber,
      firstPublishedDate: str(body.firstPublishedDate),
      firstPublishedVenuePt: str(body.firstPublishedVenuePt),
      firstPublishedVenueZh: str(body.firstPublishedVenueZh),
      pseudonymUsed: str(body.pseudonymUsed),
      pseudonymNotePt: str(body.pseudonymNotePt),
      essayType: str(body.essayType) ?? "ensaio",
      genreTagsPt: arr(body.genreTagsPt),
      genreTagsZh: arr(body.genreTagsZh),
      themesPt: arr(body.themesPt),
      historicalContextPt: str(body.historicalContextPt),
      contentOriginalZh: str(body.contentOriginalZh),
      contentModernZh: str(body.contentModernZh),
      contentPinyin: str(body.contentPinyin),
      contentPt: str(body.contentPt),
      translatorName: str(body.translatorName),
      translationNotesPt: str(body.translationNotesPt),
      sourceTextEdition: str(body.sourceTextEdition),
      difficultyLevel: str(body.difficultyLevel) ?? "intermediate",
      isFeatured:
        typeof body.isFeatured === "boolean" ? body.isFeatured : false,
      estimatedReadingTime: null,
      wordCountPt: null,
      wordCountZh: null,
    });

    await db
      .update(collectionsTable)
      .set({
        essayCount: sql`(SELECT COUNT(*)::int FROM ${essaysTable} WHERE ${essaysTable.collectionSlug} = ${collectionSlug})`,
      })
      .where(eq(collectionsTable.slug, collectionSlug));

    const [created] = await db
      .select()
      .from(essaysTable)
      .where(eq(essaysTable.essayId, essayId));

    res.status(201).json({
      ...created,
      firstPublishedDate: created.firstPublishedDate
        ? created.firstPublishedDate.toString()
        : null,
    });
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
      "historicalContextPt",
      "contentOriginalZh",
      "contentModernZh",
      "contentPinyin",
      "contentPt",
      "translationNotesPt",
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
pseudonymNotePt: null
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

router.get(
  "/admin/collections",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const collections = await db
      .select()
      .from(collectionsTable)
      .orderBy(collectionsTable.sortOrder);

    const counts = await db
      .select({
        slug: essaysTable.collectionSlug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(essaysTable)
      .groupBy(essaysTable.collectionSlug);

    const countMap = new Map(counts.map((c) => [c.slug, c.count]));
    const result = collections.map((c) => ({
      ...c,
      essayCount: countMap.get(c.slug) ?? 0,
    }));
    res.json(result);
  },
);

router.get(
  "/admin/collections/:slug",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, String(req.params["slug"])));
    if (!collection) {
      res.status(404).json({ error: "Coleção não encontrada" });
      return;
    }
    res.json(collection);
  },
);

router.post(
  "/admin/collections",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = collectionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
      return;
    }
    const data = parsed.data;
    const [existing] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, data.slug));
    if (existing) {
      res.status(409).json({ error: `Já existe uma coleção com o slug "${data.slug}"` });
      return;
    }
    const [created] = await db
      .insert(collectionsTable)
      .values({
        slug: data.slug,
        titleZh: data.titleZh,
        titlePt: data.titlePt,
        titleEn: data.titleEn ?? null,
        year: data.year,
        volumeNumber: data.volumeNumber,
        characteristics: data.characteristics,
        isPoeticCollection: data.isPoeticCollection ?? false,
        sortOrder: data.sortOrder,
        essayCount: 0,
      })
      .returning();
    res.status(201).json(created);
  },
);

router.patch(
  "/admin/collections/:slug",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const slug = String(req.params["slug"]);
    const parsed = collectionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
      return;
    }
    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nada para atualizar" });
      return;
    }
    const [existing] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, slug));
    if (!existing) {
      res.status(404).json({ error: "Coleção não encontrada" });
      return;
    }
    await db
      .update(collectionsTable)
      .set(updates)
      .where(eq(collectionsTable.slug, slug));

    if (updates.volumeNumber !== undefined && updates.volumeNumber !== existing.volumeNumber) {
      await db
        .update(essaysTable)
        .set({ volumeNumber: updates.volumeNumber })
        .where(eq(essaysTable.collectionSlug, slug));
    }

    const [updated] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, slug));
    res.json(updated);
  },
);

router.delete(
  "/admin/collections/:slug",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const slug = String(req.params["slug"]);
    const [existing] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, slug));
    if (!existing) {
      res.status(404).json({ error: "Coleção não encontrada" });
      return;
    }
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(essaysTable)
      .where(eq(essaysTable.collectionSlug, slug));
    if (count > 0) {
      res.status(409).json({
        error: `Não é possível excluir: ${count} ensaio(s) ainda usam esta coleção.`,
      });
      return;
    }
    await db.delete(collectionsTable).where(eq(collectionsTable.slug, slug));
    res.json({ success: true });
  },
);

router.get("/admin/template.md", requireAdmin, (_req, res): void => {
  res.type("text/markdown; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="lu-xun-template.md"',
  );
  res.send(TEMPLATE_MD);
});

export default router;
