import { useListCollections } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export function Collections() {
  const { data: collections, isLoading } = useListCollections();

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 max-w-5xl">
      <div className="mb-16 text-center">
        <h1 className="font-zh text-3xl text-primary mb-4">文集</h1>
        <h2 className="font-serif text-4xl md:text-5xl text-foreground">Coleções</h2>
        <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
          Lu Xun publicou 17 grandes coleções de ensaios ao longo de sua vida. 
          Elas estão apresentadas aqui em ordem cronológica de publicação.
        </p>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 p-6 border border-border/40 rounded-sm">
              <div className="md:w-1/4">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : (
          collections?.map((collection, i) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group block"
            >
              <div 
                className="flex flex-col md:flex-row gap-6 p-6 md:p-8 border border-border/40 bg-card/20 rounded-sm transition-all hover:bg-card hover:border-primary/30 hover:shadow-sm animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="md:w-1/4 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-border/40 pb-4 md:pb-0 md:pr-6">
                  <span className="text-3xl font-serif text-primary/80 group-hover:text-primary transition-colors">
                    {collection.year}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Volume {collection.volumeNumber}
                  </span>
                  <span className="mt-auto pt-4 text-xs text-muted-foreground">
                    {collection.essayCount} Ensaios
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-zh text-2xl text-foreground group-hover:text-primary transition-colors mb-1">
                    {collection.titleZh}
                  </h3>
                  <h4 className="font-serif text-xl text-muted-foreground mb-4">
                    {collection.titlePt}
                    {collection.titleEn && <span className="text-sm ml-2 opacity-60">/ {collection.titleEn}</span>}
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl">
                    {collection.characteristics}
                  </p>
                  
                  {collection.isPoeticCollection && (
                    <div className="mt-4">
                      <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-sm border border-primary/20">
                        Poesia em Prosa
                      </span>
                    </div>
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
