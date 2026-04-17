const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export interface AdminMe {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  isAdmin: boolean;
}

export interface AdminEssayRow {
  essayId: string;
  titlePt: string;
  titleZh: string;
  titlePinyin: string | null;
  collectionSlug: string;
  collectionTitlePt: string | null;
  firstPublishedDate: string | null;
  essayType: string;
  difficultyLevel: string;
  isFeatured: boolean;
  hasOriginalZh: boolean;
  hasModernZh: boolean;
  hasPinyin: boolean;
  hasPt: boolean;
}

export interface AdminEssayDetail {
  essayId: string;
  titlePt: string;
  titleZh: string;
  titlePinyin: string | null;
  collectionSlug: string;
  firstPublishedDate: string | null;
  firstPublishedVenuePt: string | null;
  firstPublishedVenueZh: string | null;
  pseudonymUsed: string | null;
  pseudonymNotePt: string | null;
  essayType: string;
  difficultyLevel: string;
  isFeatured: boolean;
  translatorName: string | null;
  sourceTextEdition: string | null;
  genreTagsPt: string[];
  themesPt: string[];
  historicalContextPt: string | null;
  contentOriginalZh: string | null;
  contentModernZh: string | null;
  contentPinyin: string | null;
  contentPt: string | null;
  translationNotesPt: string | null;
}

export interface AdminEssayCreate {
  essayId: string;
  titlePt: string;
  titleZh: string;
  collectionSlug: string;
  titlePinyin?: string | null;
  firstPublishedDate?: string | null;
  firstPublishedVenuePt?: string | null;
  firstPublishedVenueZh?: string | null;
  pseudonymUsed?: string | null;
  pseudonymNotePt?: string | null;
  essayType?: string;
  difficultyLevel?: string;
  isFeatured?: boolean;
  translatorName?: string | null;
  sourceTextEdition?: string | null;
  genreTagsPt?: string[];
  themesPt?: string[];
  historicalContextPt?: string | null;
  contentOriginalZh?: string | null;
  contentModernZh?: string | null;
  contentPinyin?: string | null;
  contentPt?: string | null;
  translationNotesPt?: string | null;
}

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  sections: {
    historicalContextPt?: string;
    contentOriginalZh?: string;
    contentModernZh?: string;
    contentPinyin?: string;
    contentPt?: string;
    translationNotesPt?: string;
  };
  derived: {
    wordCountPt: number | null;
    wordCountZh: number | null;
    estimatedReadingTime: number | null;
  };
}

export interface AdminCollection {
  id: number;
  slug: string;
  titleZh: string;
  titlePt: string;
  titleEn: string | null;
  year: number;
  volumeNumber: number;
  essayCount: number;
  characteristics: string;
  isPoeticCollection: boolean;
  sortOrder: number;
}

export interface AdminCollectionInput {
  slug: string;
  titleZh: string;
  titlePt: string;
  titleEn?: string | null;
  year: number;
  volumeNumber: number;
  characteristics: string;
  isPoeticCollection?: boolean;
  sortOrder: number;
}

export type AdminCollectionPatch = Partial<Omit<AdminCollectionInput, "slug">>;

export const adminApi = {
  me: () => request<AdminMe>("/admin/me"),
  list: () => request<AdminEssayRow[]>("/admin/essays"),
  get: (essayId: string) =>
    request<AdminEssayDetail>(`/admin/essays/${encodeURIComponent(essayId)}`),
  create: (body: AdminEssayCreate) =>
    request<AdminEssayDetail>("/admin/essays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  patch: (essayId: string, body: Partial<AdminEssayDetail>) =>
    request<AdminEssayDetail>(`/admin/essays/${encodeURIComponent(essayId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  remove: (essayId: string) =>
    request<{ success: boolean }>(`/admin/essays/${encodeURIComponent(essayId)}`, {
      method: "DELETE",
    }),
  preview: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<ParsedMarkdown>("/admin/essays/preview", {
      method: "POST",
      body: fd,
    });
  },
  listCollections: () => request<AdminCollection[]>("/admin/collections"),
  getCollection: (slug: string) =>
    request<AdminCollection>(`/admin/collections/${encodeURIComponent(slug)}`),
  createCollection: (body: AdminCollectionInput) =>
    request<AdminCollection>("/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateCollection: (slug: string, body: AdminCollectionPatch) =>
    request<AdminCollection>(`/admin/collections/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteCollection: (slug: string) =>
    request<{ success: boolean }>(
      `/admin/collections/${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    ),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ action: "created" | "updated"; essayId: string }>(
      "/admin/essays/upload",
      { method: "POST", body: fd },
    );
  },
  batchPreview: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<BatchPreviewResponse>("/admin/essays/batch-preview", {
      method: "POST",
      body: fd,
    });
  },
  batchUpload: (file: File, fileNames: string[]) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileNames", JSON.stringify(fileNames));
    return request<BatchUploadResponse>("/admin/essays/batch-upload", {
      method: "POST",
      body: fd,
    });
  },
};

export interface BatchEntry {
  fileName: string;
  status: "create" | "update" | "invalid";
  essayId: string | null;
  titlePt: string | null;
  titleZh: string | null;
  collectionSlug: string | null;
  error: string | null;
}

export interface BatchPreviewResponse {
  entries: BatchEntry[];
  summary: {
    total: number;
    toCreate: number;
    toUpdate: number;
    invalid: number;
  };
}

export interface BatchUploadResponse {
  applied: {
    fileName: string;
    action: "created" | "updated";
    essayId: string;
  }[];
  summary: { created: number; updated: number; skipped: number };
  entries: BatchEntry[];
}
