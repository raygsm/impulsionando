"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function CreateTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, description, type: "question", priority: "medium" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error?.message || `HTTP ${res.status}`);
      setBusy(false);
      return;
    }
    setSubject("");
    setDescription("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="grid max-w-lg gap-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} minLength={3} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} minLength={5} required />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Enviando…" : "Abrir ticket"}
      </Button>
    </form>
  );
}
