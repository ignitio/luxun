import { useGetEssay } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BookOpen, Clock, FileText, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function EssayReader() {
  const [, params] = useRoute("/essays/:essayId");
  const essayId = params?.essayId || "";

  const { data: essay, isLoading } = useGetEssay(essayId, {
    query: { enabled: !!essayId, queryKey: ['getEssay', essayId] }
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FAF8F5] dark:bg-[#1A1A1A]">
        <div className="flex flex-col items-center gap-4">
          <BookOpen className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm font-serif text-muted-foreground animate-pulse">Retrieving manuscript...</p>
        </div>
      </div>
    );
  }

  if (!essay) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 h-14 flex items-center justify-between">
        <Link href="/essays" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Archive</span>
        </Link>
        <div className="text-sm font-medium opacity-50 truncate max-w-[50%]">
          {essay.collectionTitlePt} • Vol {essay.volumeNumber}
        </div>
        <div className="w-20" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar - Metadata */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border/40 bg-card/20 p-6 lg:p-10 flex flex-col h-auto md:h-[calc(100vh-3.5rem)] md:sticky md:top-14 overflow-y-auto">
          <div className="mb-8">
            <h1 className="font-zh text-4xl lg:text-5xl text-primary leading-tight mb-4">{essay.titleZh}</h1>
            <h2 className="font-serif text-2xl lg:text-3xl text-foreground leading-snug mb-2">{essay.titlePt}</h2>
            {essay.titlePinyin && (
              <h3 className="text-sm text-muted-foreground/80 font-mono tracking-wide">{essay.titlePinyin}</h3>
            )}
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Publication Context</h4>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="w-20 text-muted-foreground/70">Date</span>
                  <span className="flex-1">{essay.firstPublishedDate || 'Unknown'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-20 text-muted-foreground/70">Venue</span>
                  <span className="flex-1">{essay.firstPublishedVenuePt || essay.firstPublishedVenueZh || 'Unknown'}</span>
                </li>
                {essay.pseudonymUsed && (
                  <li className="flex gap-2">
                    <span className="w-20 text-muted-foreground/70">Pseudonym</span>
                    <span className="flex-1 font-zh">{essay.pseudonymUsed}</span>
                  </li>
                )}
              </ul>
              {essay.pseudonymNotePt && (
                <p className="mt-2 text-xs italic text-muted-foreground border-l-2 border-primary/20 pl-3">
                  {essay.pseudonymNotePt}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Classification</h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="rounded-sm bg-background/50 font-normal">{essay.essayType}</Badge>
                {essay.genreTagsPt.map(tag => (
                  <Badge key={tag} variant="secondary" className="rounded-sm bg-secondary/30 font-normal text-muted-foreground">{tag}</Badge>
                ))}
              </div>
            </div>

            {essay.themesPt && essay.themesPt.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Themes</h4>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
                  {essay.themesPt.join(" • ")}
                </div>
              </div>
            )}

            {essay.historicalContextPt && (
              <div className="pt-4 border-t border-border/40">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Historical Context
                </h4>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {essay.historicalContextPt}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content - Reader */}
        <main className="flex-1 p-0 flex flex-col h-auto md:h-[calc(100vh-3.5rem)] overflow-hidden">
          <Tabs defaultValue="pt" className="flex-1 flex flex-col h-full w-full">
            <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-10 px-4 sm:px-10 py-3 flex items-center justify-between">
              <TabsList className="h-9 bg-accent/50 p-1">
                <TabsTrigger value="pt" className="text-xs sm:text-sm px-3">Português</TabsTrigger>
                <TabsTrigger value="zh" className="text-xs sm:text-sm px-3 font-zh">原文 (Original)</TabsTrigger>
                {essay.contentModernZh && <TabsTrigger value="zh-mod" className="text-xs sm:text-sm px-3 font-zh hidden sm:inline-flex">现代汉语</TabsTrigger>}
                {essay.contentPinyin && <TabsTrigger value="pinyin" className="text-xs sm:text-sm px-3 hidden md:inline-flex">Pinyin</TabsTrigger>}
              </TabsList>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground hidden sm:flex">
                {essay.wordCountPt && <span>{essay.wordCountPt} words</span>}
                {essay.estimatedReadingTime && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{essay.estimatedReadingTime}m</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
              <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20 w-full">
                <TabsContent value="pt" className="m-0 focus-visible:outline-none">
                  <div className="prose prose-stone dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-foreground/90">
                    {essay.contentPt ? (
                      <div dangerouslySetContent={{ __html: essay.contentPt.replace(/\n/g, '<br/><br/>') }} />
                    ) : (
                      <p className="italic text-muted-foreground">Translation not available.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="zh" className="m-0 focus-visible:outline-none">
                  <div className="prose prose-stone dark:prose-invert max-w-none font-zh text-xl leading-loose tracking-wide text-foreground/90">
                    {essay.contentOriginalZh ? (
                      <div dangerouslySetContent={{ __html: essay.contentOriginalZh.replace(/\n/g, '<br/><br/>') }} />
                    ) : (
                      <p className="font-sans italic text-muted-foreground">Original text not available.</p>
                    )}
                  </div>
                </TabsContent>

                {essay.contentModernZh && (
                  <TabsContent value="zh-mod" className="m-0 focus-visible:outline-none">
                    <div className="prose prose-stone dark:prose-invert max-w-none font-zh text-xl leading-loose tracking-wide text-foreground/90">
                      <div dangerouslySetContent={{ __html: essay.contentModernZh.replace(/\n/g, '<br/><br/>') }} />
                    </div>
                  </TabsContent>
                )}

                {essay.contentPinyin && (
                  <TabsContent value="pinyin" className="m-0 focus-visible:outline-none">
                    <div className="prose prose-stone dark:prose-invert max-w-none font-mono text-base leading-loose text-foreground/80">
                      <div dangerouslySetContent={{ __html: essay.contentPinyin.replace(/\n/g, '<br/><br/>') }} />
                    </div>
                  </TabsContent>
                )}

                {/* Footer Notes */}
                <div className="mt-20 pt-8 border-t border-border/40 text-sm text-muted-foreground/80 space-y-4">
                  {essay.translatorName && (
                    <p><strong>Translator:</strong> {essay.translatorName}</p>
                  )}
                  {essay.sourceTextEdition && (
                    <p><strong>Source text:</strong> {essay.sourceTextEdition}</p>
                  )}
                  {essay.translationNotesPt && (
                    <div className="bg-card/30 p-4 rounded-sm border border-border/20 mt-4">
                      <strong className="block mb-2 text-foreground/70">Translation Notes:</strong>
                      <p className="leading-relaxed">{essay.translationNotesPt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// React 18 / DOM warning fix: dangerouslySetInnerHTML is correct React prop name
function dangerouslySetContent(props: {__html: string}) {
  return <div dangerouslySetInnerHTML={props} />;
}
