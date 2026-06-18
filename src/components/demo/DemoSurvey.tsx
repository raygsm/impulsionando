/**
 * DemoSurvey — pesquisa rápida de preferências dentro da demo Bar & Restaurante.
 * Aceita nome (curto) e últimos 4 dígitos do WhatsApp; o backend mascara antes de
 * persistir. Nenhum dado real é exigido — campos de identificação são opcionais.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Send } from "lucide-react";

export type SurveyValues = {
  displayName?: string;
  whatsappLast4?: string;
  favoriteCategory: "chopp" | "petiscos" | "drinks" | "massas" | "sobremesas";
  visitFrequency: "primeira" | "mensal" | "quinzenal" | "semanal";
  comesWith: "sozinho" | "casal" | "amigos" | "familia" | "trabalho";
  interestedIn: Array<"eventos" | "clube" | "delivery" | "happy_hour" | "private">;
};

type Props = {
  loading?: boolean;
  onSubmit: (values: SurveyValues) => void;
};

const CATEGORIES: Array<[SurveyValues["favoriteCategory"], string]> = [
  ["chopp", "Chopp & cervejas"],
  ["petiscos", "Petiscos"],
  ["drinks", "Drinks autorais"],
  ["massas", "Massas"],
  ["sobremesas", "Sobremesas"],
];
const FREQ: Array<[SurveyValues["visitFrequency"], string]> = [
  ["primeira", "Primeira vez"],
  ["mensal", "1× por mês"],
  ["quinzenal", "A cada 15 dias"],
  ["semanal", "Toda semana"],
];
const COMPANY: Array<[SurveyValues["comesWith"], string]> = [
  ["sozinho", "Sozinho"],
  ["casal", "Casal"],
  ["amigos", "Amigos"],
  ["familia", "Família"],
  ["trabalho", "Trabalho"],
];
const INTEREST: Array<[SurveyValues["interestedIn"][number], string]> = [
  ["eventos", "Eventos"],
  ["clube", "Clube de assinatura"],
  ["delivery", "Delivery"],
  ["happy_hour", "Happy hour"],
  ["private", "Evento privado"],
];

export function DemoSurvey({ loading, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [favoriteCategory, setFav] = useState<SurveyValues["favoriteCategory"]>("chopp");
  const [visitFrequency, setFreq] = useState<SurveyValues["visitFrequency"]>("primeira");
  const [comesWith, setCompany] = useState<SurveyValues["comesWith"]>("amigos");
  const [interestedIn, setInterest] = useState<SurveyValues["interestedIn"]>(["happy_hour"]);

  const toggleInterest = (key: SurveyValues["interestedIn"][number]) => {
    setInterest((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const submit = () => {
    onSubmit({
      displayName: name.trim() || undefined,
      whatsappLast4: last4.replace(/\D/g, "").slice(0, 4) || undefined,
      favoriteCategory,
      visitFrequency,
      comesWith,
      interestedIn,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Conte para o Boteco como você curte sair</h2>
        <p className="text-xs text-muted-foreground">
          Em 30 segundos a casa libera um voucher de retorno. Pesquisa simulada — nada é enviado a quem não deveria ver.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-2 text-[11px] text-amber-900 dark:text-amber-100">
        <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
        <p>Use dados fictícios. Salvamos apenas iniciais e os 4 últimos dígitos para ilustrar o CRM.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Como te chamar?</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Bia" maxLength={40} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">4 últimos do WhatsApp</Label>
          <Input
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
          />
        </div>
      </div>

      <Group label="O que você mais gosta?" options={CATEGORIES} value={favoriteCategory} onChange={setFav} />
      <Group label="Quantas vezes vem por mês?" options={FREQ} value={visitFrequency} onChange={setFreq} />
      <Group label="Vem normalmente com" options={COMPANY} value={comesWith} onChange={setCompany} />

      <div className="space-y-1.5">
        <Label className="text-xs">Tem interesse em (pode marcar mais de um)</Label>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST.map(([key, label]) => {
            const active = interestedIn.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleInterest(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={submit} disabled={loading} size="lg" className="w-full">
        <Send className="w-4 h-4 mr-2" />
        {loading ? "Enviando…" : "Quero meu voucher"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        <Badge variant="outline" className="mr-1 text-[10px]">demo</Badge>
        Voucher é fictício e serve para ilustrar a jornada de retorno.
      </p>
    </Card>
  );
}

function Group<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([key, l]) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
