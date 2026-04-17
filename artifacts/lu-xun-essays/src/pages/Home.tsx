import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";
import { useGetFeaturedEssays, useGetArchiveStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Home() {
  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedEssays();
  const { data: stats, isLoading: isLoadingStats } = useGetArchiveStats();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4 md:px-8 relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="font-zh text-7xl md:text-8xl lg:text-9xl text-primary leading-none tracking-widest font-light opacity-90">
              鲁迅
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-normal tracking-tight mt-4">
              Lu Xun <span className="italic text-muted-foreground font-light">Ensaios</span>
            </h1>
          </div>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Um arquivo digital de ensaios críticos e poemas em prosa (1918–1936). 
            Edições bilíngues em português e chinês, anotadas para leitura acadêmica.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link 
              href="/collections" 
              className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Explorar Coleções
            </Link>
            <Link 
              href="/essays" 
              className="inline-flex h-12 items-center justify-center rounded-sm border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Buscar no Arquivo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 border-y border-border/40 py-12">
          {isLoadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : stats ? (
            <>
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl md:text-5xl font-serif text-primary">{stats.totalEssays}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ensaios</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl md:text-5xl font-serif text-primary">{stats.totalCollections}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Coleções</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl md:text-5xl font-serif text-primary">{stats.yearRange}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Anos de Atividade</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl md:text-5xl font-serif text-primary">{stats.totalPseudonyms}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pseudônimos</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Featured Essays */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-zh text-2xl text-primary mb-2">精选篇目</h2>
            <h3 className="font-serif text-3xl">Leituras em Destaque</h3>
          </div>
          <Link href="/essays" className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Ver todos os ensaios <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingFeatured ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-sm border-border/50">
                <CardContent className="p-6 flex flex-col gap-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : featured?.map((essay, i) => (
            <Link 
              key={essay.id} 
              href={`/essays/${essay.essayId}`}
              className="group block"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Card className="h-full rounded-sm border-border/60 bg-card/40 transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="truncate">{essay.collectionTitlePt}</span>
                    {essay.firstPublishedDate && (
                      <>
                        <span>•</span>
                        <span>{essay.firstPublishedDate.substring(0, 4)}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-6 flex-1">
                    <h4 className="font-zh text-xl text-foreground group-hover:text-primary transition-colors">
                      {essay.titleZh}
                    </h4>
                    <h5 className="font-serif text-lg leading-snug text-muted-foreground">
                      {essay.titlePt}
                    </h5>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-border/40">
                    <Badge variant="outline" className="rounded-sm font-normal bg-background">
                      {essay.essayType}
                    </Badge>
                    {essay.estimatedReadingTime && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        ~{essay.estimatedReadingTime} min de leitura
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 md:hidden flex justify-center">
          <Link href="/essays" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Ver todos os ensaios <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
