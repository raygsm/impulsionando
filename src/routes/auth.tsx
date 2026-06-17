import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, Layers, Zap } from "lucide-react";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acessar — Impulsionando Tecnologia" },
      { name: "description", content: "Plataforma SaaS multiempresa, multinicho e modular." },
      { property: "og:url", content: "https://impulsionando.com.br/auth" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Falha no login com Google. Tente novamente.");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser redireciona para Google
      // Token recebido e sessão setada
      toast.success("Bem-vindo!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada. Verifique seu e-mail se necessário e faça login.");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const target = (resetEmail || email).trim();
    if (!target) return toast.error("Informe o e-mail para recuperação.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(target)) {
      return toast.error("Informe um endereço de e-mail válido.");
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return toast.error("Não foi possível processar a solicitação. Verifique o e-mail e tente novamente.");
      }
      setResetOpen(false);
      navigate({ to: "/reset-password-sent" });
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <LogoImpulsionando variant="dark" size="xl" />
          </div>
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Uma plataforma. Todos os nichos. Total controle.</h1>
          <p className="text-white/80 text-base leading-relaxed">
            SaaS multiempresa, modular e parametrizável para clínicas, bares, cervejarias, serviços e varejo.
          </p>
          <div className="grid gap-3 pt-2">
            {[
              { icon: ShieldCheck, t: "Dados isolados por empresa", d: "Row Level Security em todas as tabelas" },
              { icon: Layers, t: "Modular", d: "Ative só o que cada cliente precisa" },
              { icon: Zap, t: "Pronto para escalar", d: "Edge Functions, automações e BI" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t}</div>
                  <div className="text-xs text-white/70">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/60">© Impulsionando Tecnologia</div>
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="flex items-center justify-center mb-6 lg:hidden">
            <img src={logoAsset.url} alt="Impulsionando Tecnologia" className="h-16 sm:h-20 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Acesse sua conta</h2>
          <p className="text-sm text-muted-foreground mt-1">Use seu e-mail corporativo para continuar.</p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            {/* Google sign-in (compartilhado entre login e signup) */}
            <div className="mt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continuar com Google
              </Button>
              <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>

            <TabsContent value="login">
              <form className="space-y-4 mt-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="li-email">E-mail</Label>
                  <Input id="li-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="li-pw">Senha</Label>
                    <Dialog open={resetOpen} onOpenChange={(o) => { setResetOpen(o); if (o) setResetEmail(email); }}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs text-primary hover:underline">
                          Esqueci a senha
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Recuperar senha</DialogTitle>
                          <DialogDescription>
                            Enviaremos um link para redefinição no e-mail informado.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">E-mail</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              required
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="voce@empresa.com"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={resetLoading} className="bg-gradient-primary">
                              {resetLoading ? "Enviando..." : "Enviar link"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input id="li-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 mt-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nome</Label>
                  <Input id="su-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">E-mail</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw">Senha</Label>
                  <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Entre em contato com o administrador para obter acesso completo após o cadastro.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
