import { useState } from "react";
import { Link, useLocation } from "wouter";
import { adminApi, type ParsedMarkdown } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ArrowLeft } from "lucide-react";

export function AdminUpload() {
  const guard = useAdminGuard();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedMarkdown | null>(null);
  const [busy, setBusy] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const onPreview = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const data = await adminApi.preview(file);
      setPreview(data);
    } catch (e) {
      toast({
        title: "Erro ao analisar arquivo",
        description: (e as Error).message,
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await adminApi.upload(file);
      toast({
        title: result.action === "created" ? "Ensaio criado" : "Ensaio atualizado",
        description: result.essayId,
      });
      setLocation("/admin/dashboard");
    } catch (e) {
      toast({
        title: "Erro ao publicar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-6 max-w-5xl">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao painel
        </Button>
      </Link>

      <h1 className="font-serif text-3xl font-bold">Enviar novo Markdown</h1>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Arquivo .md</label>
          <Input
            type="file"
            accept=".md,text/markdown"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
            }}
            data-testid="input-file"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onPreview}
            disabled={!file || busy}
            variant="outline"
            data-testid="button-preview"
          >
            Pré-visualizar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!file || busy || !preview}
            data-testid="button-confirm"
          >
            Confirmar publicação
          </Button>
        </div>
      </Card>

      {preview && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Frontmatter (metadados)</h2>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(preview.frontmatter, null, 2)}
            </pre>
            <h3 className="font-semibold mt-4 mb-2">Calculado</h3>
            <pre className="text-xs bg-muted p-3 rounded">
              {JSON.stringify(preview.derived, null, 2)}
            </pre>
          </Card>
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Seções de conteúdo</h2>
            {(
              [
                ["historicalContextPt", "Contexto histórico (PT)"],
                ["contentOriginalZh", "原文 (zh-original)"],
                ["contentModernZh", "现代汉语 (zh-modern)"],
                ["contentPinyin", "Pinyin"],
                ["contentPt", "Português"],
                ["translationNotesPt", "Notas do tradutor (PT)"],
              ] as const
            ).map(([key, label]) => {
              const text = preview.sections[key];
              if (!text) {
                return (
                  <div key={key}>
                    <div className="text-xs uppercase text-muted-foreground">
                      {label}
                    </div>
                    <div className="text-xs italic text-muted-foreground">
                      (não presente)
                    </div>
                  </div>
                );
              }
              return (
                <div key={key}>
                  <div className="text-xs uppercase text-muted-foreground mb-1">
                    {label}
                  </div>
                  <div className="text-sm whitespace-pre-wrap bg-muted/40 p-3 rounded max-h-56 overflow-auto">
                    {text.length > 600 ? text.slice(0, 600) + "…" : text}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
