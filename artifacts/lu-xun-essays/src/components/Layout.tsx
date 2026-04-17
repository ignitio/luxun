import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isReader = location.startsWith("/essays/") && location.split("/").length === 3;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {!isReader && (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <span className="font-zh text-xl font-bold tracking-wider text-primary">鲁迅</span>
              <span className="font-serif text-lg text-foreground/80 italic">Ensaios</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/collections" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.startsWith("/collections") ? "text-primary" : "text-muted-foreground"
                )}
              >
                Coleções
              </Link>
              <Link 
                href="/essays" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === "/essays" ? "text-primary" : "text-muted-foreground"
                )}
              >
                Todos os Ensaios
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {!isReader && (
        <footer className="border-t border-border/40 bg-card/50 mt-20">
          <div className="container mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <span className="font-zh font-medium">鲁迅</span>
              <span>— Arquivo Digital</span>
            </div>
            <p>Ensaios Críticos e Poemas em Prosa (1918–1936)</p>
          </div>
        </footer>
      )}
    </div>
  );
}
