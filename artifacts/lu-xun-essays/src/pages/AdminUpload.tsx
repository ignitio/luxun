import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  adminApi,
  type ParsedMarkdown,
  type BatchPreviewResponse,
} from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ArrowLeft } from "lucide-react";

type Mode = "single" | "batch";

export function AdminUpload() {
  const guard = useAdminGuard();
  const [mode, setMode] = useState<Mode>("single");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedMarkdown | null>(null);
  const [batchPreview, setBatchPreview] = useState<BatchPreviewResponse | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (guard.isLoading || !guard.isAuthenticated) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20">Carregando...</div>
    );
  }
  if (guard.forbidden) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20">
        <h1 className="font-serif text-3xl font-bold">Acesso negado</h1>
        <p className="text-muted-foreground mt-2">
          Sua conta ({guard.user?.email ?? guard.user?.id}) não tem permissão de
          administrador.
        </p>
      </div>
    );
  }

  const resetAll = () => {
    setPreview(null);
    setBatchPreview(null);
    setSelected(new Set());
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setFile(null);
    resetAll();
  };

  const onPreview = async () => {
    if (!file) return;
    setBusy(true);
    try {
      if (mode === "single") {
        const data = await adminApi.preview(file);
        setPreview(data);
        setBatchPreview(null);
      } else {
        const data = await adminApi.batchPreview(file);
        setBatchPreview(data);
        setPreview(null);
        setSelected(
          new Set(
            data.entries
              .filter((e) => e.status !== "invalid")
              .map((e) => e.fileName),
          ),
        );
      }
    } catch (e) {
      toast({
        title: "Erro ao analisar arquivo",
        description: (e as Error).message,
        variant: "destructive",
      });
      resetAll();
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      if (mode === "single") {
        const result = await adminApi.upload(file);
        toast({
          title: result.action === "created" ? "Ensaio criado" : "Ensaio atualizado",
          description: result.essayId,
        });
        setLocation("/admin/dashboard");
      } else {
        const fileNames = Array.from(selected);
        if (fileNames.length === 0) {
          toast({
            title: "Selecione ao menos um arquivo válido",
            variant: "destructive",
          });
          setBusy(false);
          return;
        }
        const result = await adminApi.batchUpload(file, fileNames);
        toast({
          title: "Publicação em lote concluída",
          description: `${result.summary.created} criados, ${result.summary.updated} atualizados, ${result.summary.skipped} ignorados`,
        });
        setLocation("/admin/dashboard");
      }
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

  const toggleSelected = (fileName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  };

  const acceptAttr = mode === "single" ? ".md,text/markdown" : ".zip,application/zip";

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-6 max-w-5xl">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao painel
        </Button>
      </Link>

      <h1 className="font-serif text-3xl font-bold">Enviar Markdown</h1>

      <div className="flex gap-2">
        <Button
          variant={mode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("single")}
          data-testid="button-mode-single"
        >
          Arquivo único (.md)
        </Button>
        <Button
          variant={mode === "batch" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("batch")}
          data-testid="button-mode-batch"
        >
          Lote (.zip)
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">
            {mode === "single" ? "Arquivo .md" : "Arquivo .zip com vários .md"}
          </label>
          <Input
            type="file"
            accept={acceptAttr}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              resetAll();
            }}
            data-testid="input-file"
          />
          {mode === "batch" && (
            <p className="text-xs text-muted-foreground mt-1">
              Cada .md no zip será analisado individualmente. A publicação
              ocorre dentro de uma transação: se algum item falhar ao gravar,
              nenhum será publicado.
            </p>
          )}
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
            disabled={
              !file ||
              busy ||
              (mode === "single"
                ? !preview
                : !batchPreview || selected.size === 0)
            }
            data-testid="button-confirm"
          >
            Confirmar publicação
          </Button>
        </div>
      </Card>

      {mode === "single" && preview && (
        <SingleFilePreview preview={preview} />
      )}

      {mode === "batch" && batchPreview && (
        <BatchPreviewView
          data={batchPreview}
          selected={selected}
          onToggle={toggleSelected}
        />
      )}
    </div>
  );
}

function SingleFilePreview({ preview }: { preview: ParsedMarkdown }) {
  return (
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
  );
}

function statusBadge(status: "create" | "update" | "invalid") {
  if (status === "create")
    return <Badge className="bg-green-600 hover:bg-green-600">Criação</Badge>;
  if (status === "update")
    return <Badge className="bg-blue-600 hover:bg-blue-600">Atualização</Badge>;
  return <Badge variant="destructive">Inválido</Badge>;
}

function BatchPreviewView({
  data,
  selected,
  onToggle,
}: {
  data: BatchPreviewResponse;
  selected: Set<string>;
  onToggle: (fn: string) => void;
}) {
  return (
    <Card className="p-6 space-y-4" data-testid="batch-preview">
      <div className="flex flex-wrap gap-3 text-sm">
        <span>Total: <strong>{data.summary.total}</strong></span>
        <span className="text-green-700">
          A criar: <strong>{data.summary.toCreate}</strong>
        </span>
        <span className="text-blue-700">
          A atualizar: <strong>{data.summary.toUpdate}</strong>
        </span>
        <span className="text-red-700">
          Inválidos: <strong>{data.summary.invalid}</strong>
        </span>
      </div>
      <div className="border rounded divide-y">
        {data.entries.map((e) => {
          const disabled = e.status === "invalid";
          const isChecked = selected.has(e.fileName);
          return (
            <div
              key={e.fileName}
              className="flex items-start gap-3 p-3"
              data-testid={`batch-row-${e.fileName}`}
            >
              <div className="pt-1">
                <Checkbox
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={() => onToggle(e.fileName)}
                  data-testid={`check-${e.fileName}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs truncate">
                    {e.fileName}
                  </span>
                  {statusBadge(e.status)}
                  {e.essayId && (
                    <span className="text-xs text-muted-foreground">
                      {e.essayId}
                    </span>
                  )}
                </div>
                {e.titlePt || e.titleZh ? (
                  <div className="text-sm mt-1">
                    {e.titlePt}
                    {e.titlePt && e.titleZh ? " · " : ""}
                    <span className="font-serif">{e.titleZh}</span>
                  </div>
                ) : null}
                {e.collectionSlug && (
                  <div className="text-xs text-muted-foreground">
                    Coleção: {e.collectionSlug}
                  </div>
                )}
                {e.error && (
                  <div className="text-xs text-red-600 mt-1">{e.error}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
