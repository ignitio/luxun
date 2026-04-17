import { useGetCollection, useListEssaysByCollection } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BookOpen, Clock, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function CollectionDetail() {
  const [, params] = useRoute("/collections/:slug");
  const slug = params?.slug || "";

  const { data: collection, isLoading: isCollectionLoading } = useGetCollection(slug, {
    query: { enabled: !!slug, queryKey: ['getCollection', slug] }
  });
  
  const { data: essays, isLoading: isEssaysLoading } = useListEssaysByCollection(slug, {
    query: { enabled: !!slug, queryKey: ['listEssaysByCollection', slug] }
  });

  if (isCollectionLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-16 w-3/4 mb-4" />
        <Skeleton className="h-8 w-1/2 mb-12" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-card/40 border-b border-border/40 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar às Coleções
          </Link>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-primary">
              <span>{collection.year}</span>
              <span className="w-1 h-1 rounded-full bg-primary/50" />
              <span className="uppercase tracking-wider">Volume {collection.volumeNumber}</span>
              {collection.isPoeticCollection && (
                <>
                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                  <span className="bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20 text-xs">Coleção Poética</span>
                </>
              )}
            </div>
            
            <h1 className="font-zh text-5xl md:text-6xl text-foreground mt-2">{collection.titleZh}</h1>
            <h2 className="font-serif text-3xl md:text-4xl text-muted-foreground mt-2">{collection.titlePt}</h2>
            {collection.titleEn && (
              <h3 className="text-xl text-muted-foreground/60 italic">{collection.titleEn}</h3>
            )}
            
            <div className="mt-8 pt-8 border-t border-border/40 text-foreground/80 leading-relaxed max-w-2xl text-lg">
              {collection.characteristics}
            </div>
          </div>
        </div>
      </div>

      {/* Essays List */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 max-w-4xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
          <h3 className="font-serif text-2xl text-foreground">Sumário</h3>
          <span className="text-sm text-muted-foreground font-medium">{collection.essayCount} textos</span>
        </div>

        <div className="flex flex-col gap-2">
          {isEssaysLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : (
            essays?.map((essay, index) => (
              <Link
                key={essay.id}
                href={`/essays/${essay.essayId}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 -mx-4 rounded-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="font-serif text-muted-foreground/40 text-sm mt-1 w-6 text-right">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-zh text-lg text-foreground group-hover:text-primary transition-colors">
                      {essay.titleZh}
                    </span>
                    <span className="font-serif text-muted-foreground">
                      {essay.titlePt}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 pl-10 sm:pl-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>{essay.firstPublishedDate?.substring(0, 4) || '—'}</span>
                  </div>
                  <div className="w-24 flex justify-end">
                    <Badge variant="outline" className="rounded-sm font-normal text-[10px] bg-background/50">
                      {essay.essayType}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
