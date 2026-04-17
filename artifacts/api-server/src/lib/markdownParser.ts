import matter from "gray-matter";
import { z } from "zod";

const FrontmatterSchema = z.object({
  essayId: z.string().min(1),
  titleZh: z.string().optional(),
  titlePt: z.string().optional(),
  titlePinyin: z.string().optional().nullable(),
  collectionSlug: z.string().optional(),
  firstPublishedDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((v: string | Date | null | undefined) => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return String(v).slice(0, 10);
    }),
  firstPublishedVenuePt: z.string().optional().nullable(),
  firstPublishedVenueZh: z.string().optional().nullable(),
  pseudonymUsed: z.string().optional().nullable(),
  pseudonymNotePt: z.string().optional().nullable(),
  essayType: z.string().optional(),
  genreTagsPt: z.array(z.string()).optional(),
  genreTagsZh: z.array(z.string()).optional(),
  themesPt: z.array(z.string()).optional(),
  difficultyLevel: z.string().optional(),
  isFeatured: z.boolean().optional(),
  translatorName: z.string().optional().nullable(),
  sourceTextEdition: z.string().optional().nullable(),
});

export type ParsedFrontmatter = z.infer<typeof FrontmatterSchema>;

const SECTION_KEYS = [
  "historical-context",
  "zh-original",
  "zh-modern",
  "pinyin",
  "pt",
  "translation-notes",
] as const;

export interface ParsedSections {
  historicalContextPt?: string;
  contentOriginalZh?: string;
  contentModernZh?: string;
  contentPinyin?: string;
  contentPt?: string;
  translationNotesPt?: string;
}

const SECTION_TO_FIELD: Record<(typeof SECTION_KEYS)[number], keyof ParsedSections> = {
  "historical-context": "historicalContextPt",
  "zh-original": "contentOriginalZh",
  "zh-modern": "contentModernZh",
  pinyin: "contentPinyin",
  pt: "contentPt",
  "translation-notes": "translationNotesPt",
};

export interface ParsedMarkdown {
  frontmatter: ParsedFrontmatter;
  sections: ParsedSections;
  derived: {
    wordCountPt: number | null;
    wordCountZh: number | null;
    estimatedReadingTime: number | null;
  };
}

function splitSections(body: string): ParsedSections {
  const lines = body.split(/\r?\n/);
  const result: Partial<Record<(typeof SECTION_KEYS)[number], string[]>> = {};
  let current: (typeof SECTION_KEYS)[number] | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(\S+)\s*$/);
    if (headerMatch) {
      const slug = headerMatch[1].toLowerCase();
      if ((SECTION_KEYS as readonly string[]).includes(slug)) {
        current = slug as (typeof SECTION_KEYS)[number];
        result[current] = [];
        continue;
      } else {
        current = null;
        continue;
      }
    }
    if (current) {
      result[current]!.push(line);
    }
  }

  const sections: ParsedSections = {};
  for (const key of SECTION_KEYS) {
    const arr = result[key];
    if (arr) {
      const text = arr.join("\n").trim();
      if (text) {
        sections[SECTION_TO_FIELD[key]] = text;
      }
    }
  }
  return sections;
}

function countWords(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countChinese(text: string | undefined): number {
  if (!text) return 0;
  const matches = text.match(/[\u4e00-\u9fff]/g);
  return matches ? matches.length : 0;
}

export function parseMarkdown(raw: string): ParsedMarkdown {
  const file = matter(raw);
  const fmResult = FrontmatterSchema.safeParse(file.data);
  if (!fmResult.success) {
    throw new Error(
      "Frontmatter inválido: " +
        fmResult.error.issues.map((i: z.ZodIssue) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  const sections = splitSections(file.content);

  const wordCountPt = sections.contentPt ? countWords(sections.contentPt) : null;
  const wordCountZh =
    sections.contentOriginalZh || sections.contentModernZh
      ? countChinese(sections.contentOriginalZh ?? sections.contentModernZh)
      : null;

  let estimatedReadingTime: number | null = null;
  if (wordCountPt && wordCountPt > 0) {
    estimatedReadingTime = Math.max(1, Math.round(wordCountPt / 220));
  } else if (wordCountZh && wordCountZh > 0) {
    estimatedReadingTime = Math.max(1, Math.round(wordCountZh / 350));
  }

  return {
    frontmatter: fmResult.data,
    sections,
    derived: { wordCountPt, wordCountZh, estimatedReadingTime },
  };
}
