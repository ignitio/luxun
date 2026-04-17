import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { adminApi, type AdminEssayDetail } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ArrowLeft } from "lucide-react";

export function AdminEdit() {
  const guard = useAdminGuard();
  const [, params] = useRoute("/admin/essays/:essayId/edit");
  const essayId = params?.essayId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [essay, setEssay] = useState<AdminEssayDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!essayId || !guard.isAdmin) return;
    adminApi
      .get(essayId)
      .then(setEssay)
      .catch((e) => setError((e as Error).message));
  }, [essayId, guard.isAdmin]);

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

  const update = <K extends keyof AdminEssayDetail>(key: K, value: AdminEssayDetail[K]) => {
    setEssay((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSave = async () => {
    if (!essay || !essayId) return;
    setBusy(true);
    try {
      await adminApi.patch(essayId, {
        titlePt: essay.titlePt,
        titleZh: essay.titleZh,
        titlePinyin: essay.titlePinyin,
        collectionSlug: essay.collectionSlug,
        firstPublishedDate: essay.firstPublishedDate,
        firstPublishedVenuePt: essay.firstPublishedVenuePt,
        firstPublishedVenueZh: essay.firstPublishedVenueZh,
        pseudonymUsed: essay.pseudonymUsed,
        pseudonymNotePt: essay.pseudonymNotePt,
        essayType: essay.essayType,
        difficultyLevel: essay.difficultyLevel,
        isFeatured: essay.isFeatured,
        translatorName: essay.translatorName,
        sourceTextEdition: essay.sourceTextEdition,
        genreTagsPt: essay.genreTagsPt,
        themesPt: essay.themesPt,
      });
      toast({ title: "Metadados atualizados" });
      setLocation("/admin/dashboard");
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  if (!essay) {
    return <div className="container mx-auto px-4 py-10">Carregando…</div>;
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl space-y-6">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </Link>
      <h1 className="font-serif text-3xl font-bold">Editar metadados</h1>
      <p className="text-sm text-muted-foreground">{essay.essayId}</p>

      <Card className="p-6 space-y-4">
        <Field label="Título PT">
          <Input
            value={essay.titlePt}
            onChange={(e) => update("titlePt", e.target.value)}
            data-testid="input-titlePt"
          />
        </Field>
        <Field label="Título ZH">
          <Input
            value={essay.titleZh}
            onChange={(e) => update("titleZh", e.target.value)}
          />
        </Field>
        <Field label="Pinyin">
          <Input
            value={essay.titlePinyin ?? ""}
            onChange={(e) => update("titlePinyin", e.target.value || null)}
          />
        </Field>
        <Field label="Coleção (slug)">
          <Input
            value={essay.collectionSlug}
            onChange={(e) => update("collectionSlug", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de ensaio">
            <Input
              value={essay.essayType}
              onChange={(e) => update("essayType", e.target.value)}
            />
          </Field>
          <Field label="Dificuldade">
            <Input
              value={essay.difficultyLevel}
              onChange={(e) => update("difficultyLevel", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Data de publicação (YYYY-MM-DD)">
          <Input
            value={essay.firstPublishedDate ?? ""}
            onChange={(e) => update("firstPublishedDate", e.target.value || null)}
          />
        </Field>
        <Field label="Veículo (PT)">
          <Input
            value={essay.firstPublishedVenuePt ?? ""}
            onChange={(e) =>
              update("firstPublishedVenuePt", e.target.value || null)
            }
          />
        </Field>
        <Field label="Pseudônimo">
          <Input
            value={essay.pseudonymUsed ?? ""}
            onChange={(e) => update("pseudonymUsed", e.target.value || null)}
          />
        </Field>
        <Field label="Tradutor">
          <Input
            value={essay.translatorName ?? ""}
            onChange={(e) => update("translatorName", e.target.value || null)}
          />
        </Field>
        <Field label="Edição-fonte">
          <Input
            value={essay.sourceTextEdition ?? ""}
            onChange={(e) => update("sourceTextEdition", e.target.value || null)}
          />
        </Field>
        <Field label="Tags de gênero (PT, separadas por vírgula)">
          <Textarea
            value={essay.genreTagsPt.join(", ")}
            onChange={(e) =>
              update(
                "genreTagsPt",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <Field label="Temas (PT, separados por vírgula)">
          <Textarea
            value={essay.themesPt.join(", ")}
            onChange={(e) =>
              update(
                "themesPt",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <div className="flex items-center gap-2">
          <Switch
            checked={essay.isFeatured}
            onCheckedChange={(v) => update("isFeatured", v)}
            data-testid="switch-featured"
          />
          <Label>Destaque na home</Label>
        </div>

        <div className="pt-4">
          <Button onClick={onSave} disabled={busy} data-testid="button-save">
            {busy ? "Salvando…" : "Salvar alterações"}
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
