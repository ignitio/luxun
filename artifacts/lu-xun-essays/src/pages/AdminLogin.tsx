import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminLogin() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/admin/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="container mx-auto px-4 md:px-8 py-20 flex justify-center">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Apenas curadores autorizados podem acessar esta área.
          </p>
        </div>
        <Button
          onClick={() => login("/admin/dashboard")}
          disabled={isLoading}
          className="w-full"
          data-testid="button-login"
        >
          {isLoading ? "Carregando..." : "Entrar com Replit"}
        </Button>
      </Card>
    </div>
  );
}
