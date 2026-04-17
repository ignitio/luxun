import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  adminApi,
  type AdminCollection,
  type AdminCollectionInput,
} from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

const EMPTY: AdminCollectionInput = {
  slug: "",
  titleZh: "",
  titlePt: "",
  titleEn: "",
  year: new Date().getFullYear(),
  volumeNumber: 1,
  characteristics: "",
  isPoeticCollection: false,
  sortOrder: 0,
};

export function AdminCollections() {
  const guard = useAdminGuard();
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminCollection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCollection | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCollection | null>(null);

  const refresh = async () => {
    try {
      const data = await adminApi.listCollections();
      setRows(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (guard.isAdmin) void refresh();
  }, [guard.isAdmin]);

  if (guard.isLoading || !guard.isAuthenticated) {
    return <div className="container mx-auto px-4 md:px-8 py-20">Carregando...</div>;
  }
  if (guard.forbidden) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20">
        <h1 className="font-serif text-3xl font-bold">Acesso negado</h1>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await adminApi.deleteCollection(pendingDelete.slug);
      toast({ title: "Coleção excluída", description: pendingDelete.titlePt });
      setPendingDelete(null);
      await refresh();
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-6">
      <Link href="/admin/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao painel
        </Button>
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-serif text-3xl font-bold">Coleções</h1>
        <Button onClick={() => setEditing("new")} data-testid="button-new-collection">
          <Plus className="w-4 h-4 mr-2" /> Nova coleção
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive text-destructive">{error}</Card>
      )}

      {!rows ? (
        <p>Carregando coleções…</p>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coleção</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Vol.</TableHead>
                <TableHead className="text-right">Ano</TableHead>
                <TableHead className="text-right">Ordem</TableHead>
                <TableHead className="text-right">Ensaios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.slug} data-testid={`row-collection-${c.slug}`}>
                  <TableCell>
                    <div className="font-medium">{c.titlePt}</div>
                    <div className="text-xs text-muted-foreground font-zh">
                      {c.titleZh}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{c.slug}</TableCell>
                  <TableCell className="text-right">{c.volumeNumber}</TableCell>
                  <TableCell className="text-right">{c.year}</TableCell>
                  <TableCell className="text-right">{c.sortOrder}</TableCell>
                  <TableCell className="text-right">{c.essayCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setEditing(c)}
                        data-testid={`button-edit-collection-${c.slug}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => setPendingDelete(c)}
                        data-testid={`button-delete-collection-${c.slug}`}
                        disabled={c.essayCount > 0}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CollectionFormDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente "{pendingDelete?.titlePt}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="button-confirm-delete-collection"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CollectionFormDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: AdminCollection | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<AdminCollectionInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing === "new") {
      setForm(EMPTY);
    } else if (editing) {
      setForm({
        slug: editing.slug,
        titleZh: editing.titleZh,
        titlePt: editing.titlePt,
        titleEn: editing.titleEn ?? "",
        year: editing.year,
        volumeNumber: editing.volumeNumber,
        characteristics: editing.characteristics,
        isPoeticCollection: editing.isPoeticCollection,
        sortOrder: editing.sortOrder,
      });
    }
  }, [editing]);

  const isNew = editing === "new";
  const open = editing !== null;

  const onSave = async () => {
    if (editing === null) return;
    setBusy(true);
    try {
      if (editing === "new") {
        await adminApi.createCollection({
          ...form,
          titleEn: form.titleEn || null,
        });
        toast({ title: "Coleção criada", description: form.slug });
      } else {
        const { slug: _slug, ...rest } = form;
        await adminApi.updateCollection(editing.slug, {
          ...rest,
          titleEn: rest.titleEn || null,
        });
        toast({ title: "Coleção atualizada", description: editing.slug });
      }
      onSaved();
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Nova coleção" : `Editar ${form.slug}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Slug (única, kebab-case)">
            <Input
              value={form.slug}
              disabled={!isNew}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="hua-gai-ji-xu-bian"
              data-testid="input-collection-slug"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título PT">
              <Input
                value={form.titlePt}
                onChange={(e) => setForm({ ...form, titlePt: e.target.value })}
                data-testid="input-collection-titlePt"
              />
            </Field>
            <Field label="Título ZH">
              <Input
                value={form.titleZh}
                onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                data-testid="input-collection-titleZh"
              />
            </Field>
          </div>
          <Field label="Título EN (opcional)">
            <Input
              value={form.titleEn ?? ""}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Ano">
              <Input
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: parseInt(e.target.value) || 0 })
                }
                data-testid="input-collection-year"
              />
            </Field>
            <Field label="Volume">
              <Input
                type="number"
                value={form.volumeNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    volumeNumber: parseInt(e.target.value) || 0,
                  })
                }
                data-testid="input-collection-volume"
              />
            </Field>
            <Field label="Ordem">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                data-testid="input-collection-sortOrder"
              />
            </Field>
          </div>
          <Field label="Características">
            <Textarea
              value={form.characteristics}
              onChange={(e) =>
                setForm({ ...form, characteristics: e.target.value })
              }
              rows={3}
              data-testid="input-collection-characteristics"
            />
          </Field>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.isPoeticCollection}
              onCheckedChange={(v) => setForm({ ...form, isPoeticCollection: v })}
              data-testid="switch-collection-poetic"
            />
            <Label>Coleção poética</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={busy}
            data-testid="button-save-collection"
          >
            {busy ? "Salvando…" : isNew ? "Criar coleção" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
