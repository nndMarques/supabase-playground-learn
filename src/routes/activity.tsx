import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Activity as ActivityIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Atividade — Diário de Aprendizado" }] }),
  component: ActivityPage,
});

type Entry = { id: string; action: string; metadata: Record<string, unknown>; created_at: string };

const LABELS: Record<string, string> = {
  login: "Entrou na conta",
  logout: "Saiu da conta",
  note_created: "Criou uma anotação",
  note_updated: "Atualizou uma anotação",
  note_deleted: "Removeu uma anotação",
  profile_updated: "Atualizou o perfil",
};

function ActivityPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, action, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) toast.error(error.message);
      else setEntries((data ?? []) as Entry[]);
      setFetching(false);
    })();
  }, [user]);

  if (loading || fetching) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <ActivityIcon className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-semibold">Histórico de atividade</h1>
            <p className="text-sm text-muted-foreground">Suas últimas {entries.length} ações</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 p-16 text-center text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => {
              const title = typeof e.metadata?.title === "string" ? e.metadata.title : null;
              return (
                <li key={e.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{LABELS[e.action] ?? e.action}</p>
                    {title && <p className="text-xs text-muted-foreground">{title}</p>}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("pt-BR")}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
