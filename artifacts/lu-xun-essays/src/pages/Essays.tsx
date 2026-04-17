import { useState } from "react";
import { useListEssays, useListCollections } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
function difficultyLabel(level: string | null | undefined): string {
  switch (level) {
    case "beginner": return "iniciante";
    case "intermediate": return "intermediário";
    case "advanced": return "avançado";
    default: return level || "—";
  }
}

export function Essays() {
  const [search, setSearch] = useState("");
  const [collectionSlug, setCollectionSlug] = useState<string>("all");
  const [essayType, setEssayType] = useState<string>("all");

  const { data: collections } = useListCollections();
  
  const queryParams = {
    ...(search ? { search } : {}),
    ...(collectionSlug !== "all" ? { collectionSlug } : {}),
    ...(essayType !== "all" ? { essayType } : {})
  };

  const { data: essays, isLoading } = useListEssays(queryParams, {
    query: { queryKey: ['listEssays', queryParams] }
  });

  const essayTypes = [
    { value: "ensaio", label: "Ensaio" },
    { value: "crônica", label: "Crônica" },
    { value: "poesia em prosa", label: "Poesia em Prosa" },
    { value: "discurso", label: "Discurso" },
    { value: "prefácio/posfácio", label: "Prefácio/Posfácio" },
    { value: "carta aberta", label: "Carta Aberta" },
    { value: "memória", label: "Memória" },
    { value: "sátira", label: "Sátira" },
    { value: "ficção", label: "Ficção" },
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="font-zh text-3xl text-primary mb-2">文章</h1>
        <h2 className="font-serif text-4xl text-foreground">Buscar no Arquivo</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/40 p-4 border border-border/40 rounded-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título, temas ou conteúdo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/60"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={collectionSlug} onValueChange={setCollectionSlug}>
            <SelectTrigger className="w-[180px] bg-background border-border/60">
              <SelectValue placeholder="Todas as Coleções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Coleções</SelectItem>
              {collections?.map(c => (
                <SelectItem key={c.id} value={c.slug}>{c.titlePt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={essayType} onValueChange={setEssayType}>
            <SelectTrigger className="w-[160px] bg-background border-border/60">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {essayTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 border border-border/40 rounded-sm">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : essays?.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum ensaio encontrado com esses critérios.</p>
          </div>
        ) : (
          essays?.map((essay) => (
            <Link
              key={essay.id}
              href={`/essays/${essay.essayId}`}
              className="block p-6 border border-border/40 bg-card/20 rounded-sm hover:border-primary/30 hover:bg-card transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {essay.collectionTitlePt}
                    </span>
                    {essay.firstPublishedDate && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-xs text-muted-foreground">
                          {essay.firstPublishedDate.substring(0, 4)}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-zh text-2xl text-foreground group-hover:text-primary transition-colors mb-1">
                    {essay.titleZh}
                  </h3>
                  <h4 className="font-serif text-lg text-muted-foreground mb-4">
                    {essay.titlePt}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-sm font-normal text-xs bg-secondary/50">
                      {essay.essayType}
                    </Badge>
                    {essay.genreTagsPt.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="rounded-sm font-normal text-xs bg-background/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center md:items-end gap-3 text-xs text-muted-foreground md:flex-col md:justify-start">
                  <span className="flex items-center gap-1">
                    Dificuldade: <span className="capitalize">{difficultyLabel(essay.difficultyLevel)}</span>
                  </span>
                  {essay.estimatedReadingTime && (
                    <span>~{essay.estimatedReadingTime} min de leitura</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
