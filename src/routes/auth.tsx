import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Diário de Aprendizado" }] }),
  component: AuthPage,
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

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Informe seu nome completo.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName.trim(),
          date_of_birth: dob || null,
          interest_area: interest,
          bio: bio.trim(),
        },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Verifique seu email para confirmar.");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
    else if (!result.redirected) navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-semibold">Diário</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full">Entrar</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como devemos te chamar" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
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
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." rows={3} maxLength={500} />
                </div>
                <Button type="submit" disabled={busy} className="w-full">Criar conta</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            Continuar com Google
          </Button>
        </div>
      </div>
    </div>
  );
}
