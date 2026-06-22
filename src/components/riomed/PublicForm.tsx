import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function PublicFormShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b"><div className="container py-4">
        <p className="text-xs text-muted-foreground">Rio Med · Portal de parceiros</p>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div></header>
      <main className="container py-6 max-w-2xl">{children}</main>
    </div>
  );
}

export function PublicFormCard({
  title, busy, disabled, onSubmit, done, doneText, children,
}: {
  title: string; busy: boolean; disabled?: boolean;
  onSubmit: () => void; done: boolean; doneText: string; children: React.ReactNode;
}) {
  if (done) return (
    <Card><CardContent className="p-8 text-center space-y-2">
      <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
      <h2 className="font-semibold">Recebido!</h2>
      <p className="text-muted-foreground text-sm">{doneText}</p>
    </CardContent></Card>
  );
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button onClick={onSubmit} disabled={busy || disabled} className="w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enviar cadastro
        </Button>
      </CardContent>
    </Card>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
export { Input, Textarea };
