/**
 * /clube — Hub do membro do Clube Impulsionando.
 *
 * Mostra:
 *  - nível de gamificação + progresso pra próximo
 *  - economia, pontos, cashback, visitas, alertas ativos, indicações
 *  - faturas (membership)
 *  - perfil + localização + interesses
 *  - alertas inteligentes (CRUD)
 *  - indicações (programa "Indique e ganhe")
 *  - favoritos
 *  - call-to-action de upgrade pra Premium
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getMyConsumerArea, upsertConsumerProfile, cancelPremium,
} from "@/lib/consumer.functions";
import {
  getMyClubeOverview, updateClubeLocation, updateClubeInterests,
  listMyClubeAlerts, upsertClubeAlert, deleteClubeAlert,
  getMyReferralInfo, inviteReferral, createClubeVisit,
  listClubePartners, listMyClubeConsumption, recordClubeConsumption, votePoll,
} from "@/lib/clube.functions";
import {
  Crown, Sparkles, Heart, Receipt, Copy, AlertCircle, Building2,
  MapPin, Bell, Trophy, Gift, Plus, Trash2, Share2, Send, BellRing, Compass, History, Search,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/clube")({
  component: ClubePage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ALERT_KIND_LABEL: Record<string, string> = {
  food: "Comida", drink: "Bebida", event: "Evento", ambience: "Ambiente", music: "Música", promo: "Promoção",
};
const INTEREST_SUGGESTIONS = [
  "ipa", "stout", "pilsen", "weiss", "vinho", "gin", "whisky", "drinks",
  "churrasco", "hamburguer", "pizza", "japonesa", "italiana", "mexicana",
  "rock", "blues", "jazz", "mpb", "sertanejo", "eletronica",
  "familiar", "romantico", "pet_friendly", "rooftop",
];

function ClubePage() {
  const qc = useQueryClient();
  const fetchArea = useServerFn(getMyConsumerArea);
  const fetchOverview = useServerFn(getMyClubeOverview);
  const fetchAlerts = useServerFn(listMyClubeAlerts);
  const fetchReferrals = useServerFn(getMyReferralInfo);
  const upsertFn = useServerFn(upsertConsumerProfile);
  const updateLoc = useServerFn(updateClubeLocation);
  const updateInts = useServerFn(updateClubeInterests);
  const cancelFn = useServerFn(cancelPremium);
  const upsertAlert = useServerFn(upsertClubeAlert);
  const delAlert = useServerFn(deleteClubeAlert);
  const inviteFn = useServerFn(inviteReferral);
  const checkinFn = useServerFn(createClubeVisit);
  const partnersFn = useServerFn(listClubePartners);
  const consumptionFn = useServerFn(listMyClubeConsumption);
  const recordFn = useServerFn(recordClubeConsumption);
  const voteFn = useServerFn(votePoll);

  const area = useQuery({ queryKey: ["consumer-area"], queryFn: () => fetchArea() });
  const overview = useQuery({ queryKey: ["clube-overview"], queryFn: () => fetchOverview() });
  const alerts = useQuery({ queryKey: ["clube-alerts"], queryFn: () => fetchAlerts() });
  const referrals = useQuery({ queryKey: ["clube-referrals"], queryFn: () => fetchReferrals() });
  const consumption = useQuery({ queryKey: ["clube-consumption"], queryFn: () => consumptionFn() });


  const isPremium = overview.data?.isPremium ?? false;
  const isPending = area.data?.membership?.plan === "premium" && area.data?.membership?.status === "pending";

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <ClubeHeader isPremium={isPremium} level={overview.data?.gamification?.levelLabel} />

      <ClubeStats overview={overview.data} />

      {!isPremium && <UpgradeBanner isPending={isPending} />}

      <Tabs defaultValue="visao" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="descobrir">Descobrir</TabsTrigger>
          <TabsTrigger value="perfil">Perfil e localização</TabsTrigger>
          <TabsTrigger value="alertas">Alertas <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{alerts.data?.length ?? 0}</Badge></TabsTrigger>
          <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
          <TabsTrigger value="historico">Histórico {isPremium ? "" : "🔒"}</TabsTrigger>
          <TabsTrigger value="plano">Plano e faturas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-6 space-y-6">
          <LevelCard gamification={overview.data?.gamification} />
          <div className="grid gap-6 md:grid-cols-2">
            <RecentVisitsCard visits={overview.data?.recentVisits ?? []} onCheckin={async () => {
              try { await checkinFn({ data: { source: "self_checkin" } as any }); toast.success("Check-in registrado! +10 pontos"); qc.invalidateQueries({ queryKey: ["clube-overview"] }); }
              catch (e: any) { toast.error(e.message); }
            }} />
            <PollsCard polls={overview.data?.polls ?? []} onVote={async (poll_id, option_id) => {
              try { await voteFn({ data: { poll_id, option_id } }); toast.success("Voto registrado"); qc.invalidateQueries({ queryKey: ["clube-overview"] }); }
              catch (e: any) { toast.error(e.message); }
            }} />
          </div>
        </TabsContent>

        <TabsContent value="descobrir" className="mt-6">
          <DiscoverTab
            defaultCity={area.data?.profile?.city ?? ""}
            fetchPartners={(args) => partnersFn({ data: args })}
          />
        </TabsContent>



        <TabsContent value="perfil" className="mt-6">
          <ProfileTab
            profile={area.data?.profile}
            onSaveProfile={async (form) => { await upsertFn({ data: form }); toast.success("Perfil salvo"); qc.invalidateQueries({ queryKey: ["consumer-area"] }); }}
            onSaveLocation={async (loc) => { await updateLoc({ data: loc }); toast.success("Localização atualizada"); qc.invalidateQueries({ queryKey: ["consumer-area"] }); qc.invalidateQueries({ queryKey: ["clube-overview"] }); }}
            onSaveInterests={async (tags) => { await updateInts({ data: { interests_tags: tags } }); toast.success("Interesses atualizados"); qc.invalidateQueries({ queryKey: ["consumer-area"] }); }}
          />
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <AlertsTab
            alerts={alerts.data ?? []}
            onAdd={async (a) => { try { await upsertAlert({ data: a }); toast.success("Alerta salvo"); qc.invalidateQueries({ queryKey: ["clube-alerts"] }); } catch (e: any) { toast.error(e.message); } }}
            onDelete={async (id) => { try { await delAlert({ data: { id } }); toast.success("Alerta removido"); qc.invalidateQueries({ queryKey: ["clube-alerts"] }); } catch (e: any) { toast.error(e.message); } }}
          />
        </TabsContent>

        <TabsContent value="indicacoes" className="mt-6">
          <ReferralsTab
            code={referrals.data?.code ?? ""}
            referrals={referrals.data?.referrals ?? []}
            onInvite={async (email) => { try { await inviteFn({ data: { email } }); toast.success("Convite registrado"); qc.invalidateQueries({ queryKey: ["clube-referrals"] }); } catch (e: any) { toast.error(e.message); } }}
          />
        </TabsContent>

        <TabsContent value="favoritos" className="mt-6">
          <FavoritesTab favorites={area.data?.favorites ?? []} />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <HistoryTab
            isPremium={isPremium}
            items={consumption.data ?? []}
            onAdd={async (payload) => {
              try { await recordFn({ data: payload }); toast.success("Consumo registrado"); qc.invalidateQueries({ queryKey: ["clube-consumption"] }); }
              catch (e: any) { toast.error(e.message); }
            }}
          />


        <TabsContent value="plano" className="mt-6">
          <PlanTab
            membership={area.data?.membership}
            invoices={area.data?.invoices ?? []}
            isPremium={isPremium}
            onCancel={async () => {
              if (!confirm("Cancelar renovação ao fim do período atual?")) return;
              try { await cancelFn(); toast.success("Cancelamento agendado"); qc.invalidateQueries({ queryKey: ["consumer-area"] }); }
              catch (e: any) { toast.error(e.message); }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------
function ClubeHeader({ isPremium, level }: { isPremium: boolean; level?: string }) {
  return (
    <header className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <Badge className={isPremium ? "bg-gradient-primary mb-2" : "mb-2"}>
          {isPremium ? <><Crown className="w-3 h-3 mr-1" /> Premium ativo</> : <><Sparkles className="w-3 h-3 mr-1" /> Clube Free</>}
          {level && <span className="ml-2 opacity-90">· {level}</span>}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clube Impulsionando</h1>
        <p className="text-sm text-muted-foreground">Descubra lugares, acumule benefícios e viva experiências exclusivas.</p>
      </div>
      <Button asChild variant="outline" size="sm"><Link to="/vitrine">Explorar parceiros →</Link></Button>
    </header>
  );
}

function ClubeStats({ overview }: { overview: any }) {
  const stats = overview?.stats ?? { totalVisits: 0, pointsBalance: 0, cashbackCents: 0, savingsCents: 0, alertsActive: 0, referrals: 0 };
  const items = [
    { icon: Trophy,    label: "Visitas",       value: stats.totalVisits },
    { icon: Sparkles,  label: "Pontos",        value: stats.pointsBalance },
    { icon: Gift,      label: "Cashback",      value: BRL(stats.cashbackCents) },
    { icon: Receipt,   label: "Economia",      value: BRL(stats.savingsCents) },
    { icon: BellRing,  label: "Alertas ativos",value: stats.alertsActive },
    { icon: Share2,    label: "Indicações",    value: stats.referrals },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <Card key={label} className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {label}</div>
          <div className="text-xl font-bold mt-1">{value}</div>
        </Card>
      ))}
    </div>
  );
}

function UpgradeBanner({ isPending }: { isPending: boolean }) {
  return (
    <Card className="p-6 bg-gradient-primary text-primary-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Crown className="w-12 h-12 shrink-0" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Vire Premium por R$ 9,99/mês</h2>
          <p className="text-sm text-white/90 mt-1">Histórico completo, alertas inteligentes, biblioteca pessoal e cashback ampliado.</p>
          {isPending && <p className="text-xs mt-2 bg-white/15 inline-block px-2 py-1 rounded">Aguardando pagamento da 1ª fatura.</p>}
        </div>
        {!isPending && (
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/checkout/$plano" params={{ plano: "clube_premium" }}>Assinar Premium</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

function LevelCard({ gamification }: { gamification: any }) {
  if (!gamification) return null;
  const { levelLabel, nextLevelAt, visitsToNext, progressPct } = gamification;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">Seu nível: {levelLabel}</h2>
      </div>
      <Progress value={progressPct} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        {nextLevelAt ? `Faltam ${visitsToNext} visitas pro próximo nível.` : "Você atingiu o nível máximo do Clube! 🏆"}
      </p>
    </Card>
  );
}

function RecentVisitsCard({ visits, onCheckin }: { visits: any[]; onCheckin: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Visitas recentes</h2>
        <Button size="sm" variant="outline" onClick={onCheckin}><Plus className="w-3 h-3 mr-1" /> Check-in</Button>
      </div>
      {visits.length === 0 ? (
        <p className="text-sm text-muted-foreground">Faça seu primeiro check-in e comece a acumular pontos no Clube.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center justify-between text-sm border rounded-lg p-2">
              <span className="truncate">{v.company?.name ?? "Check-in"}</span>
              <span className="text-xs text-muted-foreground">{new Date(v.when).toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PollsCard({ polls }: { polls: any[] }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4" /> Sua opinião conta</h2>
      {polls.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma enquete ativa no momento. Os parceiros vão te chamar pra votar em bandas, pratos e eventos em breve.</p>
      ) : (
        <ul className="space-y-3">
          {polls.map((p) => (
            <li key={p.id} className="border rounded-lg p-3">
              <p className="text-sm font-medium">{p.question}</p>
              <p className="text-xs text-muted-foreground mt-1">{Array.isArray(p.options) ? p.options.length : 0} opções</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------
function ProfileTab({ profile, onSaveProfile, onSaveLocation, onSaveInterests }: {
  profile: any;
  onSaveProfile: (f: any) => Promise<void>;
  onSaveLocation: (l: any) => Promise<void>;
  onSaveInterests: (t: string[]) => Promise<void>;
}) {
  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "", city: "", state: "" });
  const [loc, setLoc] = useState({ cep: "", neighborhood: "", default_radius_km: 10 });
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
    });
    setLoc({ cep: profile.cep ?? "", neighborhood: profile.neighborhood ?? "", default_radius_km: profile.default_radius_km ?? 10 });
    setInterests(profile.interests_tags ?? []);
  }, [profile?.user_id]);

  function toggleTag(t: string) {
    setInterests((cur) => cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]);
  }
  function addCustomTag() {
    const t = interestInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (t && !interests.includes(t)) setInterests([...interests, t]);
    setInterestInput("");
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Meus dados</h2>
        <div className="space-y-3">
          <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
          </div>
          <Button className="w-full" onClick={() => onSaveProfile({ ...form, marketing_optin: true })}>Salvar dados</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>CEP</Label><Input value={loc.cep} onChange={(e) => setLoc({ ...loc, cep: e.target.value })} placeholder="00000-000" /></div>
            <div><Label>Bairro</Label><Input value={loc.neighborhood} onChange={(e) => setLoc({ ...loc, neighborhood: e.target.value })} /></div>
          </div>
          <div>
            <Label>Raio de busca padrão: {loc.default_radius_km} km</Label>
            <input type="range" min={1} max={100} value={loc.default_radius_km} onChange={(e) => setLoc({ ...loc, default_radius_km: Number(e.target.value) })} className="w-full" />
          </div>
          <Button className="w-full" variant="outline" onClick={() => {
            if (!navigator.geolocation) { toast.error("Geolocalização indisponível"); return; }
            navigator.geolocation.getCurrentPosition(
              (pos) => onSaveLocation({ ...loc, lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => toast.error("Não foi possível obter sua localização"),
            );
          }}>Usar GPS</Button>
          <Button className="w-full" onClick={() => onSaveLocation(loc)}>Salvar localização</Button>
        </div>
      </Card>

      <Card className="p-5 md:col-span-2">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Meus interesses</h2>
        <p className="text-xs text-muted-foreground mb-3">Selecione o que você curte. Usamos isso pra recomendar parceiros e gerar alertas inteligentes.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {INTEREST_SUGGESTIONS.map((t) => (
            <button key={t} type="button" onClick={() => toggleTag(t)}
              className={`px-3 py-1 rounded-full text-xs border transition ${interests.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              {t}
            </button>
          ))}
          {interests.filter(t => !INTEREST_SUGGESTIONS.includes(t)).map((t) => (
            <button key={t} type="button" onClick={() => toggleTag(t)}
              className="px-3 py-1 rounded-full text-xs border bg-primary text-primary-foreground border-primary">
              {t} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Adicionar interesse personalizado" value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())} />
          <Button variant="outline" onClick={addCustomTag}>Adicionar</Button>
          <Button onClick={() => onSaveInterests(interests)}>Salvar interesses</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
function AlertsTab({ alerts, onAdd, onDelete }: { alerts: any[]; onAdd: (a: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [kind, setKind] = useState<"food" | "drink" | "event" | "ambience" | "music" | "promo">("drink");
  const [tag, setTag] = useState("");
  const [channels, setChannels] = useState<string[]>(["email"]);

  function toggleChannel(c: string) {
    setChannels((cur) => cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Meus alertas inteligentes</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não tem alertas. Cadastre um ao lado: ex. "me avise quando rolar IPA" ou "festival de hambúrguer".</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{ALERT_KIND_LABEL[a.kind] ?? a.kind}: <span className="text-primary">{a.tag}</span></div>
                  <div className="text-xs text-muted-foreground">{(a.channels ?? []).join(", ")} · raio {a.radius_km} km {a.city ? `· ${a.city}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!a.active && <Badge variant="secondary">pausado</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Novo alerta</h2>
        <div className="space-y-3">
          <div>
            <Label>Categoria</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {Object.entries(ALERT_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div><Label>O que avisar</Label><Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="ex.: ipa, blues, festival_de_hamburguer" /></div>
          <div>
            <Label className="mb-2 block">Canais</Label>
            <div className="flex gap-2">
              {["email", "whatsapp", "push"].map((c) => (
                <button key={c} type="button" onClick={() => toggleChannel(c)}
                  className={`px-3 py-1 rounded-full text-xs border ${channels.includes(c) ? "bg-primary text-primary-foreground border-primary" : ""}`}>{c}</button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!tag.trim()} onClick={async () => {
            await onAdd({ kind, tag: tag.trim().toLowerCase().replace(/\s+/g, "_"), channels, radius_km: 25, active: true });
            setTag("");
          }}>Criar alerta</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
function ReferralsTab({ code, referrals, onInvite }: { code: string; referrals: any[]; onInvite: (email?: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const inviteUrl = useMemo(() => code ? `${typeof window !== "undefined" ? window.location.origin : ""}/consumidor?ref=${code}` : "", [code]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4" /> Indique e ganhe</h2>
        <p className="text-sm text-muted-foreground mb-3">Cada amigo que entrar pelo seu link te rende <strong>50 pontos</strong>. Se ele virar Premium, você ganha bônus em cashback.</p>
        <div className="space-y-3">
          <div>
            <Label>Seu link</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Link copiado"); }}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label>Convidar por email</Label>
            <div className="flex gap-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amigo@email.com" />
              <Button onClick={async () => { await onInvite(email || undefined); setEmail(""); }}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Histórico de indicações</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu link!</p>
        ) : (
          <ul className="space-y-2">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                <span className="truncate">{r.referred_email ?? "Convite via link"}</span>
                <Badge variant={r.status === "converted" ? "default" : "secondary"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
function FavoritesTab({ favorites }: { favorites: any[] }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4" /> Parceiros favoritos</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted-foreground">Você ainda não favoritou nenhum parceiro. <Link to="/vitrine" className="text-primary underline">Ver vitrine →</Link></p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f: any) => (
            <Link key={f.id} to="/vitrine/$slug" params={{ slug: f.public_slug }}>
              <Card className="p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  {f.logo_url
                    ? <img src={f.logo_url} alt={f.name} className="w-10 h-10 rounded-lg object-cover" />
                    : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{f.trade_name || f.name}</div>
                    {f.segment && <div className="text-xs text-muted-foreground">{f.segment}</div>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------
function PlanTab({ membership, invoices, isPremium, onCancel }: { membership: any; invoices: any[]; isPremium: boolean; onCancel: () => Promise<void> }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4" /> Plano e faturas</h2>
      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Você ainda está no Clube Free. Assine o Premium pra desbloquear histórico, alertas e mais.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="font-medium text-sm">{BRL(inv.amount_cents)}</div>
                <div className="text-xs text-muted-foreground">Vence em {new Date(inv.due_date).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>{inv.status}</Badge>
                {inv.status === "open" && inv.pix_copy_paste && (
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(inv.pix_copy_paste); toast.success("PIX copiado"); }}>
                    <Copy className="w-3 h-3 mr-1" /> PIX
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {isPremium && !membership?.cancel_at_period_end && (
        <Button onClick={onCancel} variant="ghost" size="sm" className="w-full mt-3 text-destructive">
          <AlertCircle className="w-3 h-3 mr-1" /> Cancelar renovação
        </Button>
      )}
      {membership?.cancel_at_period_end && (
        <p className="text-xs text-amber-600 mt-3 text-center">Renovação cancelada. Acesso até {membership.current_period_end && new Date(membership.current_period_end).toLocaleDateString("pt-BR")}.</p>
      )}
    </Card>
  );
}
