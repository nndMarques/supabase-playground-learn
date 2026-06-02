import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — Diário de Aprendizado" }] }),
  component: ProfilePage,
});

const INTERESTS = [
  "Programação",
  "Design",
  "Marketing",
  "Negócios",
  "Idiomas",
  "Ciências",
  "Artes",
  "Outro",
];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setFullName(data.full_name ?? "");
        setDob(data.date_of_birth ?? "");
        setInterest(data.interest_area || INTERESTS[0]);
        setBio(data.bio ?? "");
      }
      setFetching(false);
    })();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: fullName.trim(),
        date_of_birth: dob || null,
        interest_area: interest,
        bio: bio.trim(),
      },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado!");
  };

  if (loading || fetching) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para o diário
        </Link>

        <div className="rounded-2xl border bg-card p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="mb-6 flex items-center gap-3">
            <UserCircle2 className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-semibold">Meu perfil</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Área de maior interesse</Label>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {INTERESTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Biografia</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Conte um pouco sobre você..." />
              <p className="text-xs text-muted-foreground">{bio.length}/500</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
