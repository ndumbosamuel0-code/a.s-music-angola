import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — A.S MUSIC" },
      { name: "description", content: "Entra ou cria a tua conta de ouvinte ou artista na A.S MUSIC." },
      { property: "og:title", content: "Entrar — A.S MUSIC" },
      { property: "og:description", content: "Conta A.S MUSIC." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("Email ou palavra-passe incorretos.");
      navigate({ to: "/painel" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Confirma o teu email para entrar.");
      setMode("in");
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return toast.error("Não foi possível entrar com Google.");
    if (r.redirected) return;
    navigate({ to: "/painel" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Para ouvintes e artistas.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && (
            <div className="space-y-1"><Label htmlFor="name">Nome</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          )}
          <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pw">Palavra-passe</Label><Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Aguarda…" : mode === "in" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
        <Button type="button" variant="silver" className="w-full" onClick={google}>Continuar com Google</Button>
        <button className="mt-6 w-full text-sm text-gold hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Ainda não tens conta? Regista-te" : "Já tens conta? Entra"}
        </button>
      </div>
    </div>
  );
}
