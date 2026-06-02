import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diário de Aprendizado" },
      { name: "description", content: "Registre o que você aprende todos os dias." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-semibold">Diário</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost">Entrar</Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Seu espaço de estudos
          </span>
          <h1 className="mt-6 text-5xl font-semibold md:text-7xl">
            Aprenda hoje.<br />
            <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Lembre amanhã.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Um diário simples para anotar tudo o que você está aprendendo no seu curso de Lovable + backend.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" style={{ boxShadow: "var(--shadow-soft)" }}>
                Começar agora
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Anotações", desc: "Escreva o que aprendeu." },
            { icon: Sparkles, title: "Categorias", desc: "Organize por tema." },
            { icon: Lock, title: "Privado", desc: "Só você vê suas anotações." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
