import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, LogOut, Plus, Trash2, Pencil, X, UserCircle2, Activity } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
  category_id: string | null;
  created_at: string;
};

type Category = { id: string; name: string; color: string };

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Meu Diário" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const load = async () => {
    const [notesRes, catsRes] = await Promise.all([
      supabase.from("learning_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, color").order("name"),
    ]);
    if (notesRes.error) toast.error(notesRes.error.message);
    else setNotes(notesRes.data as Note[]);
    if (catsRes.error) toast.error(catsRes.error.message);
    else setCategories(catsRes.data as Category[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const reset = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategoryId("");
    setOpen(false);
  };

  const categoryNameFromId = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Geral";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const catName = categoryId ? categoryNameFromId(categoryId) : "Geral";
    if (editing) {
      const { error } = await supabase
        .from("learning_notes")
        .update({ title, content, category: catName, category_id: categoryId || null })
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Anotação atualizada");
      logActivity(user.id, "note_updated", { note_id: editing.id, title });
    } else {
      const { data, error } = await supabase
        .from("learning_notes")
        .insert({ title, content, category: catName, category_id: categoryId || null, user_id: user.id })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      toast.success("Anotação criada");
      if (data) logActivity(user.id, "note_created", { note_id: data.id, title });
    }
    reset();
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("learning_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Anotação removida");
    if (user) logActivity(user.id, "note_deleted", { note_id: id });
    load();
  };

  const edit = (n: Note) => {
    setEditing(n);
    setTitle(n.title);
    setContent(n.content);
    setCategoryId(n.category_id ?? "");
    setOpen(true);
  };

  const addCategory = async () => {
    if (!user || !newCatName.trim()) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: newCatName.trim() })
      .select("id, name, color")
      .single();
    if (error) return toast.error(error.message);
    if (data) {
      setCategories((c) => [...c, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(data.id);
    }
    setNewCatName("");
    setAddingCat(false);
  };

  const signOut = async () => {
    if (user) await logActivity(user.id, "logout");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">Meu Diário</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Button asChild variant="ghost" size="sm">
              <Link to="/activity"><Activity className="mr-2 h-4 w-4" /> Atividade</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile"><UserCircle2 className="mr-2 h-4 w-4" /> Perfil</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Suas anotações</h1>
            <p className="text-muted-foreground">{notes.length} {notes.length === 1 ? "anotação" : "anotações"}</p>
          </div>
          <Button onClick={() => { reset(); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova
          </Button>
        </div>

        {open && (
          <div className="mb-8 rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Editar" : "Nova anotação"}</h2>
              <Button variant="ghost" size="icon" onClick={reset}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que você aprendeu?" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  {addingCat ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nome da categoria"
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={addCategory}>Salvar</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingCat(false); setNewCatName(""); }}>X</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Geral</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAddingCat(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detalhes, exemplos, links..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>
                <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
              </div>
            </form>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 p-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Nenhuma anotação ainda. Crie a primeira!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <article key={n.id} className="group rounded-xl border bg-card p-5 transition hover:shadow-md">
                <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {n.category}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold">{n.title}</h3>
                {n.content && <p className="mt-2 line-clamp-4 text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>}
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <time className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString("pt-BR")}
                  </time>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => edit(n)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(n.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
