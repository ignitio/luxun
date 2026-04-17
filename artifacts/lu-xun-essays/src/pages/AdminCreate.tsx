import { useState } from "react";
import { Link, useLocation } from "wouter";
import { adminApi, type AdminEssayCreate } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ArrowLeft } from "lucide-react";

const EMPTY: AdminEssayCreate = {
  essayId: "",
  titlePt: "",
  titleZh: "",
  collectionSlug: "",
  titlePinyin: null,
  firstPublishedDate: null,
  firstPublishedVenuePt: null,
  firstPublishedVenueZh: null,
  pseudonymUsed: null,
  pseudonymNotePt: null,
  essayType: "ensaio",
  difficultyLevel: "intermediate",
  isFeatured: false,
  translatorName: null,
  sourceTextEdition: null,
  genreTagsPt: [],
  themesPt: [],
  historicalContextPt: null,
  contentOriginalZh: null,
  contentModernZh: null,
  contentPinyin: null,
  contentPt: null,
  translationNotesPt: null,
};

export function AdminCreate() {
  const guard = useAdminGuard();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<AdminEssayCreate>({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  if (guard.isLoading || !guard.isAuthenticated) {
    return <div className="container mx-auto px-4 md:px-8 py-20">Carregando...</div>;
  }
  if (guard.forbidden) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20">
        <h1 className="font-serif text-3xl font-bold">Acesso negado</h1>
        <p className="text-muted-foreground mt-2">
          Sua conta ({guard.user?.email ?? guard.user?.id}) não tem permissão de administrador.
        </p>
      </div>
    );
  }

  const update = <K extends keyof AdminEssayCreate>(key: K, value: AdminEssayCreate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!form.essayId || !form.titlePt || !form.titleZh || !form.collectionSlug) {
      toast({
        title: "Campos obrigatórios",
        description: "ID do ensaio, Título PT, Título ZH e Coleção são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      await adminApi.create(form);
      toast({ title: "Ensaio criado com sucesso" });
      setLocation("/admin/dashboard");
    } catch (e) {
      toast({
        title: "Erro ao criar ensaio",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl space-y-6">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </Link>
      <h1 className="font-serif text-3xl font-bold">Novo ensaio</h1>

      <Card className="p-6 space-y-4">
        <Field label="ID do ensaio *">
          <Input
            value={form.essayId}
            onChange={(e) => update("essayId", e.target.value)}
            placeholder="lx_YYYYMMDD_001"
          />
        </Field>
        <Field label="Título PT *">
          <Input
            value={form.titlePt}
            onChange={(e) => update("titlePt", e.target.value)}
          />
        </Field>
        <Field label="Título ZH *">
          <Input
            className="font-zh"
            value={form.titleZh}
            onChange={(e) => update("titleZh", e.target.value)}
          />
        </Field>
        <Field label="Pinyin">
          <Input
            value={form.titlePinyin ?? ""}
            onChange={(e) => update("titlePinyin", e.target.value || null)}
          />
        </Field>
        <Field label="Coleção (slug) *">
          <Input
            value={form.collectionSlug}
            onChange={(e) => update("collectionSlug", e.target.value)}
            placeholder="hua-gai-ji-xu-bian"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de ensaio">
            <Input
              value={form.essayType ?? ""}
              onChange={(e) => update("essayType", e.target.value || "ensaio")}
            />
          </Field>
          <Field label="Dificuldade">
            <Input
              value={form.difficultyLevel ?? ""}
              onChange={(e) => update("difficultyLevel", e.target.value || "intermediate")}
            />
          </Field>
        </div>
        <Field label="Data de publicação (YYYY-MM-DD)">
          <Input
            value={form.firstPublishedDate ?? ""}
            onChange={(e) => update("firstPublishedDate", e.target.value || null)}
          />
        </Field>
        <Field label="Veículo (PT)">
          <Input
            value={form.firstPublishedVenuePt ?? ""}
            onChange={(e) => update("firstPublishedVenuePt", e.target.value || null)}
          />
        </Field>
        <Field label="Pseudônimo">
          <Input
            value={form.pseudonymUsed ?? ""}
            onChange={(e) => update("pseudonymUsed", e.target.value || null)}
          />
        </Field>
        <Field label="Nota sobre o pseudônimo (PT)">
          <Textarea
            value={form.pseudonymNotePt ?? ""}
            onChange={(e) => update("pseudonymNotePt", e.target.value || null)}
            rows={3}
          />
        </Field>
        <Field label="Tradutor">
          <Input
            value={form.translatorName ?? ""}
            onChange={(e) => update("translatorName", e.target.value || null)}
          />
        </Field>
        <Field label="Edição-fonte">
          <Input
            value={form.sourceTextEdition ?? ""}
            onChange={(e) => update("sourceTextEdition", e.target.value || null)}
          />
        </Field>
        <Field label="Tags de gênero (PT, separadas por vírgula)">
          <Textarea
            value={(form.genreTagsPt ?? []).join(", ")}
            onChange={(e) =>
              update(
                "genreTagsPt",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </Field>
        <Field label="Temas (PT, separados por vírgula)">
          <Textarea
            value={(form.themesPt ?? []).join(", ")}
            onChange={(e) =>
              update(
                "themesPt",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </Field>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isFeatured ?? false}
            onCheckedChange={(v) => update("isFeatured", v)}
          />
          <Label>Destaque na home</Label>
        </div>

        <div className="pt-4">
          <Button onClick={onSave} disabled={busy}>
            {busy ? "Criando…" : "Criar ensaio"}
          </Button>
        </div>
      </Card>

      <h2 className="font-serif text-xl font-semibold pt-2">Conteúdo</h2>

      <Card className="p-6 space-y-4">
        <Field label="Contexto histórico (PT)">
          <Textarea
            value={form.historicalContextPt ?? ""}
            onChange={(e) => update("historicalContextPt", e.target.value || null)}
            rows={5}
          />
        </Field>
        <Field label="Texto original (ZH clássico)">
          <Textarea
            className="font-zh"
            value={form.contentOriginalZh ?? ""}
            onChange={(e) => update("contentOriginalZh", e.target.value || null)}
            rows={10}
          />
        </Field>
        <Field label="Tradução moderna (ZH)">
          <Textarea
            className="font-zh"
            value={form.contentModernZh ?? ""}
            onChange={(e) => update("contentModernZh", e.target.value || null)}
            rows={10}
          />
        </Field>
        <Field label="Pinyin">
          <Textarea
            value={form.contentPinyin ?? ""}
            onChange={(e) => update("contentPinyin", e.target.value || null)}
            rows={10}
          />
        </Field>
        <Field label="Tradução em português (PT)">
          <Textarea
            value={form.contentPt ?? ""}
            onChange={(e) => update("contentPt", e.target.value || null)}
            rows={10}
          />
        </Field>
        <Field label="Notas do tradutor (PT)">
          <Textarea
            value={form.translationNotesPt ?? ""}
            onChange={(e) => update("translationNotesPt", e.target.value || null)}
            rows={5}
          />
        </Field>

        <div className="pt-4">
          <Button onClick={onSave} disabled={busy}>
            {busy ? "Criando…" : "Criar ensaio"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
