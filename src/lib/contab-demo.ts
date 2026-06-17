// Seed e limpeza dos dados de demonstração "Contabilidade Horizonte".
// Roda no cliente autenticado — todas as tabelas têm RLS por company_id.
import { supabase } from "@/integrations/supabase/client";

const DEMO_TAG = "[demo:horizonte]";

const DEMO_CLIENTS = [
  { legal_name: "Padaria Pão Dourado Ltda", trade_name: "Pão Dourado", tax_regime: "simples_nacional", monthly_fee: 480, document: "12.345.678/0001-01" },
  { legal_name: "Clínica Sorriso Saudável EIRELI", trade_name: "Sorriso Saudável", tax_regime: "lucro_presumido", monthly_fee: 980, document: "23.456.789/0001-12" },
  { legal_name: "TechWave Soluções S.A.", trade_name: "TechWave", tax_regime: "lucro_real", monthly_fee: 2400, document: "34.567.890/0001-23" },
  { legal_name: "Boutique Estilo & Cia Ltda", trade_name: "Boutique Estilo", tax_regime: "simples_nacional", monthly_fee: 620, document: "45.678.901/0001-34" },
  { legal_name: "Mercado Bom Preço Ltda", trade_name: "Bom Preço", tax_regime: "lucro_presumido", monthly_fee: 1450, document: "56.789.012/0001-45" },
];

const DAY = 86400000;
const offset = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const offsetMonths = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

export async function seedHorizonteDemo(companyId: string) {
  // Limpa antes para tornar idempotente
  await purgeHorizonteDemo(companyId);

  // 1) Clientes (created_at espalhado nos últimos 6 meses para gráficos de MRR)
  const clientRows = DEMO_CLIENTS.map((c, i) => ({
    company_id: companyId,
    legal_name: c.legal_name,
    trade_name: c.trade_name,
    document: c.document,
    document_type: "cnpj",
    tax_regime: c.tax_regime,
    monthly_fee: c.monthly_fee,
    status: "active",
    notes: `${DEMO_TAG} cliente fictício ${i + 1}`,
  }));
  const { data: clients, error: cErr } = await supabase
    .from("contab_clients").insert(clientRows).select("id");
  if (cErr) throw cErr;

  // Atualiza created_at em cascata (clientes mais antigos primeiro)
  for (let i = 0; i < clients!.length; i++) {
    await supabase.from("contab_clients")
      .update({ created_at: offsetMonths(-(clients!.length - i)) })
      .eq("id", clients![i].id);
  }

  const ids = clients!.map((c) => c.id);

  // 2) Documentos (mistura de status)
  const docRows = ids.flatMap((id, i) => [
    { company_id: companyId, client_id: id, name: `NF entrada ${i + 1}.pdf`, file_path: `${companyId}/demo/nf-${i}.pdf`, status: "pending", notes: DEMO_TAG, kind: "fiscal" },
    { company_id: companyId, client_id: id, name: `Balancete ${i + 1}.pdf`, file_path: `${companyId}/demo/bal-${i}.pdf`, status: "received", notes: DEMO_TAG, kind: "contabil" },
  ]);
  await supabase.from("contab_documents").insert(docRows);

  // 3) Obrigações (algumas atrasadas, próximas, futuras)
  const oblRows = ids.flatMap((id, i) => [
    { company_id: companyId, client_id: id, title: `DAS ${i + 1}`, kind: "DAS", due_date: offset(-3 - i), amount: 320 + i * 50, status: "open", notes: DEMO_TAG },
    { company_id: companyId, client_id: id, title: `DCTFWeb ${i + 1}`, kind: "DCTFWeb", due_date: offset(5 + i), amount: 180 + i * 30, status: "open", notes: DEMO_TAG },
    { company_id: companyId, client_id: id, title: `INSS ${i + 1}`, kind: "INSS", due_date: offset(20 + i), amount: 850 + i * 80, status: "open", notes: DEMO_TAG },
    { company_id: companyId, client_id: id, title: `ISS competência ${i + 1}`, kind: "ISS", due_date: offset(-15), amount: 220, status: "paid", notes: DEMO_TAG },
  ]);
  await supabase.from("contab_obligations").insert(oblRows);

  // 4) Tarefas
  const taskRows = ids.flatMap((id, i) => [
    { company_id: companyId, client_id: id, title: `Conferir folha ${i + 1}`, priority: i === 0 ? "urgent" : "medium", status: "todo", due_date: offset(2 + i), description: DEMO_TAG },
    { company_id: companyId, client_id: id, title: `Enviar guias ${i + 1}`, priority: "high", status: i % 2 ? "done" : "in_progress", due_date: offset(-1 + i), description: DEMO_TAG },
  ]);
  await supabase.from("contab_tasks").insert(taskRows);

  // 5) IRPF jornadas (trigger cria as 14 etapas automaticamente)
  const irpfRows = ids.slice(0, 3).map((id, i) => ({
    company_id: companyId, client_id: id,
    taxpayer_name: `Contribuinte Demo ${i + 1}`,
    taxpayer_cpf: `000.000.00${i}-0${i}`,
    base_year: new Date().getFullYear() - 1,
    current_step: [4, 9, 14][i],
    status: i === 2 ? "concluida" : "em_andamento",
    fee_amount: 380 + i * 120,
    fee_paid: i === 2,
    notes: DEMO_TAG,
  }));
  await supabase.from("contab_irpf_journeys").insert(irpfRows);

  // 6) Financeiro do escritório
  const finRows = ids.flatMap((id, i) => [
    { company_id: companyId, client_id: id, kind: "receita", category: "Honorário", description: `Honorário ${DEMO_CLIENTS[i].trade_name}`, amount: DEMO_CLIENTS[i].monthly_fee, status: i % 2 ? "pago" : "pendente", due_date: offset(-5 + i * 3), paid_at: i % 2 ? new Date().toISOString() : null, notes: DEMO_TAG },
  ]).concat([
    { company_id: companyId, client_id: null, kind: "despesa", category: "Aluguel", description: "Aluguel sede", amount: 3200, status: "pago", due_date: offset(-10), paid_at: new Date().toISOString(), notes: DEMO_TAG },
    { company_id: companyId, client_id: null, kind: "despesa", category: "Software", description: "Sistema contábil", amount: 890, status: "pendente", due_date: offset(8), paid_at: null, notes: DEMO_TAG },
    { company_id: companyId, client_id: null, kind: "despesa", category: "Folha", description: "Folha equipe", amount: 12500, status: "pago", due_date: offset(-2), paid_at: new Date().toISOString(), notes: DEMO_TAG },
  ]);
  await supabase.from("contab_office_finance").insert(finRows);

  // 7) Contratos
  const contractRows = ids.map((id, i) => ({
    company_id: companyId, client_id: id,
    title: `Contrato ${DEMO_CLIENTS[i].trade_name}`,
    status: i === 0 ? "rascunho" : "assinado",
    monthly_fee: DEMO_CLIENTS[i].monthly_fee,
    start_date: offset(-90 + i * 15),
    signed_at: i === 0 ? null : new Date(Date.now() - (60 - i * 5) * DAY).toISOString(),
    notes: DEMO_TAG,
  }));
  await supabase.from("contab_contracts").insert(contractRows);

  return { clients: ids.length };
}

export async function purgeHorizonteDemo(companyId: string) {
  const tables = [
    "contab_office_finance", "contab_contracts", "contab_irpf_journeys",
    "contab_tasks", "contab_obligations", "contab_documents",
  ] as const;
  for (const t of tables) {
    await supabase.from(t).delete()
      .eq("company_id", companyId)
      .or(`notes.ilike.%${DEMO_TAG}%,description.ilike.%${DEMO_TAG}%`);
  }
  // Clientes por último (cascata limparia, mas alguns têm SET NULL)
  await supabase.from("contab_clients").delete()
    .eq("company_id", companyId)
    .ilike("notes", `%${DEMO_TAG}%`);
}
