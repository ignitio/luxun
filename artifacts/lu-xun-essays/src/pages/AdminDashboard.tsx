import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { adminApi, type AdminEssayRow } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Upload, Pencil, Trash2, ExternalLink, Download, LogOut, FolderTree } from "lucide-react";

export function AdminDashboard() {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<AdminEssayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminEssayRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/admin");
  }, [isLoading, isAuthenticated, setLocation]);

  const refresh = async () => {
    try {
      const data = await adminApi.list();
      setRows(data);
      setError(null);
      setForbidden(false);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.toLowerCase().includes("acesso negado") || msg.includes("403")) {
        setForbidden(true);
      } else {
        setError(msg);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return <div className="container mx-auto px-4 py-12">Carregando...</div>;
  }

  if (forbidden) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-20 max-w-xl text-center space-y-6">
        <h1 className="font-serif text-3xl font-bold">Acesso negado</h1>
        <p className="text-muted-foreground">
          Sua conta ({user?.email ?? user?.id}) não tem permissão de administrador.
          Peça ao operador do site para adicionar seu ID ao secret{" "}
          <code className="bg-muted px-1 py-0.5 rounded">ADMIN_REPLIT_USER_IDS</code>.
        </p>
        <Button variant="outline" onClick={logout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await adminApi.remove(pendingDelete.essayId);
      toast({ title: "Ensaio excluído", description: pendingDelete.titlePt });
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

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/admin/template.md", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lu-xun-template.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Erro ao baixar modelo",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Painel administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Logado como {user?.firstName ?? user?.email ?? user?.id}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/collections">
            <Button variant="outline" data-testid="button-collections">
              <FolderTree className="w-4 h-4 mr-2" /> Coleções
            </Button>
          </Link>
          <Button variant="outline" onClick={downloadTemplate} data-testid="button-template">
            <Download className="w-4 h-4 mr-2" /> Baixar modelo Markdown
          </Button>
          <Link href="/admin/upload">
            <Button data-testid="button-upload">
              <Upload className="w-4 h-4 mr-2" /> Enviar novo Markdown
            </Button>
          </Link>
          <Button variant="ghost" onClick={logout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive text-destructive">{error}</Card>
      )}

      {!rows ? (
        <p>Carregando ensaios…</p>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ensaio</TableHead>
                <TableHead>Coleção</TableHead>
                <TableHead>Idiomas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.essayId} data-testid={`row-${r.essayId}`}>
                  <TableCell>
                    <div className="font-medium">{r.titlePt}</div>
                    <div className="text-xs text-muted-foreground font-zh">
                      {r.titleZh}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.essayId}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.collectionTitlePt ?? r.collectionSlug}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant={r.hasOriginalZh ? "default" : "outline"}>原</Badge>
                      <Badge variant={r.hasModernZh ? "default" : "outline"}>现</Badge>
                      <Badge variant={r.hasPinyin ? "default" : "outline"}>拼</Badge>
                      <Badge variant={r.hasPt ? "default" : "outline"}>PT</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`/essays/${r.essayId}`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Ver no site"
                          data-testid={`button-view-${r.essayId}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/essays/${r.essayId}/edit`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar metadados"
                          data-testid={`button-edit-${r.essayId}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => setPendingDelete(r)}
                        data-testid={`button-delete-${r.essayId}`}
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

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ensaio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente "{pendingDelete?.titlePt}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
