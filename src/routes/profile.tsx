import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logActivity } from "@/lib/activity";
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
  "Programação", "Design", "Marketing", "Negócios",
  "Idiomas", "Ciências", "Artes", "Outro",
];
const GENDERS = ["", "Feminino", "Masculino", "Não-binário", "Prefiro não dizer"];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", username: "", date_of_birth: "", interest_area: INTERESTS[0],
    bio: "", avatar_url: "", phone: "", city: "", country: "", gender: "",
  });
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          username: data.username ?? "",
          date_of_birth: data.date_of_birth ?? "",
          interest_area: data.interest_area || INTERESTS[0],
          bio: data.bio ?? "",
          avatar_url: data.avatar_url ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          gender: data.gender ?? "",
        });
      }
      setFetching(false);
    })();
  }, [user]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: form.full_name.trim(),
        username: form.username.trim() || null,
        date_of_birth: form.date_of_birth || null,
        interest_area: form.interest_area,
        bio: form.bio.trim(),
        avatar_url: form.avatar_url.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        gender: form.gender || null,
      },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
    logActivity(user.id, "profile_updated");
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
          <div className="mb-6 flex items-center gap-4">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <UserCircle2 className="h-14 w-14 text-primary" />
            )}
            <div>
              <h1 className="font-display text-2xl font-semibold">Meu perfil</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={form.full_name} onChange={upd("full_name")} required />
              </div>
              <div className="space-y-2">
                <Label>Nome de usuário</Label>
                <Input value={form.username} onChange={upd("username")} placeholder="ex: joao_silva" />
              </div>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.date_of_birth} onChange={upd("date_of_birth")} max={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <select value={form.gender} onChange={upd("gender")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {GENDERS.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={upd("phone")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Área de maior interesse</Label>
                <select value={form.interest_area} onChange={upd("interest_area")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={upd("city")} />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={form.country} onChange={upd("country")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL do avatar</Label>
              <Input value={form.avatar_url} onChange={upd("avatar_url")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Biografia</Label>
              <Textarea value={form.bio} onChange={upd("bio")} rows={4} maxLength={500} placeholder="Conte um pouco sobre você..." />
              <p className="text-xs text-muted-foreground">{form.bio.length}/500</p>
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
