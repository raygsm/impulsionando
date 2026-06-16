# Imobiliária Garrido — Checklist de Ativação Completa

Empresa: **Imobiliária Garrido** (`id: 8e90a584-a5f6-40b3-8975-dad968db39ba`, subdomain `garrido`)
Nicho: `imobiliaria`

## Status atual — ativo neste round

### Empresa & contexto
- ✅ Empresa ativa, vinculada ao nicho **Imobiliárias**
- ✅ Unidade **Matriz Garrido** (RJ) criada
- ✅ Aparece corretamente no seletor de empresa e em "Acessar como"
- ✅ A página `/units` agora respeita o contexto: ao acessar como Garrido, só aparecem as unidades da Garrido (bug do CHRISMED × Garrido corrigido)

### Módulos habilitados em `company_modules` (todos `is_enabled = true`)
`administracao`, `area_cliente`, `auditoria`, `automacao`, `configuracoes`, `crm`, `dashboard`,
`empresas`, `financeiro`, `imobiliaria_crm`, `imobiliaria_erp`, `imobiliaria_vitrine`,
`perfis`, `setores`, `unidades`, `usuarios`

### Seeds de teste (idempotentes — rotulados `[SEED-GARRIDO]`)
- **3 imóveis** publicados:
  - `GAR-FLM-203` Apartamento 3qts Flamengo — venda R$ 1.800.000
  - `GAR-BOT-118` Apartamento 2qts mobiliado Botafogo — locação R$ 4.500/mês
  - `GAR-BRR-044` Casa 4qts c/ piscina Barra — venda R$ 3.200.000
- **2 perfis de busca** ativos (Mariana Costa, Carlos Eduardo) — alimentam o motor de matching em `realestate_run_match_for_property`
- **4 leads** no CRM imobiliário (Mariana, Carlos, Família Andrade, Investidor Silva) com status válidos (`new`, `working`, `qualified`, `converted`)

### Demos
- ✅ Página pública rica em `/demo/nicho/imobiliaria` (carteira, leads/SLA, app do corretor, BI)
- ✅ Demo Eventos / WMP continua em `/demo/nicho/eventos`
- ✅ Demos novas: `saude`, `bar`, `comercio`, `servicos`, `comunidade`

## Como o cliente Garrido pode testar agora

1. Logar com usuário vinculado à Garrido (ou super admin "Acessar como Garrido" em `/core/clientes`)
2. Abrir `/units` → ver Matriz Garrido (e somente ela)
3. Abrir `/customers`, `/crm/leads` → ver os 4 leads-teste
4. Abrir páginas de gestão imobiliária quando os módulos `imobiliaria_*` estiverem mapeados em rotas (próximo round)
5. Receber e-mails de teste: o cadastro de novo lead já dispara `tg_notify_new_lead` (in-app + e-mail via outbox)

## O que NÃO está construído (roadmap)

O prompt mestre descreve uma plataforma completa de ~38 áreas (pré-cadastro por voz, agente IA WhatsApp, motor de filas e SLA, administração de aluguel com boletos+repasse, área do proprietário/inquilino, Power BI etc.). Hoje existem as tabelas (`realestate_properties`, `realestate_search_intents`, `realestate_property_matches`) + função de matching + notificações. UI dedicada para corretor mobile-first, voz, IA conversacional, contratos de locação, boletos e repasses ainda não foram implementados.

Ver `docs/IMOBILIARIA_ROADMAP.md` para o plano por entrega.
