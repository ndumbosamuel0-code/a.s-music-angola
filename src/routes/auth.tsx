import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";

type AuthMode = "in" | "up" | "forgot" | "recovery";

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
  const [mode, setMode] = useState<AuthMode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"artist" | "user" | "distributor">("artist");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("Enviámos um link de recuperação para o teu email.");
        setMode("in");
        return;
      }

      if (mode === "recovery") {
        if (password.length < 8) throw new Error("A palavra-passe deve ter pelo menos 8 caracteres.");
        if (password !== confirmPassword) throw new Error("As palavras-passe não coincidem.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Palavra-passe actualizada com sucesso.");
        setPassword("");
        setConfirmPassword("");
        navigate({ to: "/painel" });
        return;
      }

      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email ou palavra-passe incorrectos.");
        navigate({ to: "/painel" });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // The database trigger accepts only artist or user; public sign-up can never grant admin.
          data: { full_name: name, account_type: accountType },
        },
      });
      if (error) throw error;
      toast.success("Conta criada! Confirma o teu email para entrar.");
      setMode("in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (r.error) throw r.error;
      if (r.redirected) return;
      navigate({ to: "/painel" });
    } catch {
      toast.error(`Não foi possível entrar com ${provider === "google" ? "Google" : "Lovable"}.`);
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "in" ? "Entrar" : mode === "up" ? "Criar conta" : mode === "forgot" ? "Recuperar acesso" : "Nova palavra-passe";
  const submitLabel = mode === "in" ? "Entrar" : mode === "up" ? "Criar conta" : mode === "forgot" ? "Enviar link de recuperação" : "Guardar palavra-passe";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "recovery" ? "Define uma palavra-passe nova para a tua conta." : "Para ouvintes e artistas."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && (
            <>
              <div className="space-y-1"><Label htmlFor="name">Nome</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1">
                <Label htmlFor="account-type">Tipo de conta</Label>
                <select id="account-type" value={accountType} onChange={(e) => setAccountType(e.target.value as "artist" | "user" | "distributor")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="artist">Artista</option>
                  <option value="user">Ouvinte</option>
                  <option value="distributor">Distribuidora</option>
                </select>
                <p className="text-xs text-muted-foreground">Ao escolher Distribuidora, cria uma conta normal e depois envia a candidatura para aprovação do administrador principal.</p>
              </div>
            </>
          )}
          {mode !== "recovery" && (
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          )}
          {mode !== "forgot" && (
            <div className="space-y-1"><Label htmlFor="pw">Palavra-passe</Label><Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          )}
          {mode === "recovery" && (
            <div className="space-y-1"><Label htmlFor="confirm-pw">Confirmar palavra-passe</Label><Input id="confirm-pw" type="password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          )}
          <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Aguarda…" : submitLabel}</Button>
        </form>

        {mode === "in" && (
          <>
            <button type="button" className="mt-3 w-full text-sm text-muted-foreground hover:text-gold" onClick={() => setMode("forgot")}>
              Esqueceste-te da palavra-passe?
            </button>
            <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
            <div className="space-y-2">
              <Button type="button" variant="silver" className="w-full" disabled={loading} onClick={() => oauth("google")}>Continuar com Google</Button>
              <button type="button" className="lovable-auth-button w-full" disabled={loading} onClick={() => oauth("lovable")}>Continuar com Lovable</button>
            </div>
          </>
        )}

        {mode !== "recovery" && (
          <button type="button" className="mt-6 w-full text-sm text-gold hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Ainda não tens conta? Regista-te" : mode === "up" ? "Já tens conta? Entra" : "Voltar ao início de sessão"}
          </button>
        )}
      </div>
    </div>
  );
}
