# Onda 1 — Fundação Rio Med (Form Builder + Bolívia + Implantação)

Esta onda destrava todas as próximas: nada da Rio Med fica hardcoded, tudo é editável pela própria equipe.

## O que entra no banco

| Tabela | Para que serve |
|--------|----------------|
| `core_field_definitions` | Definição de campos (rótulo, tipo, seção, validação, visibilidade) por entidade e por empresa. |
| `core_field_options` | Opções de campos `select` / `multiselect`, totalmente editáveis. |
| `core_field_values` | Valores dos campos dinâmicos quando o registro é de uma entidade que usa o motor (futuras ondas). |
| `geo_bo_departments` | 9 departamentos bolivianos. |
| `geo_bo_cities` | Cidades por departamento (sementes principais). |
| `core_implantation_tasks` | Checklist de implantação da empresa (Rio Med vem com 19 itens). |

Todas as tabelas:

- usam `company_id` + RLS para isolar por tenant;
- têm GRANT correto para `anon` (apenas leitura pública nos campos marcados `visibility = 'public'` e na geo bolívia);
- têm trigger automático de `updated_at`.

Os 27 tipos de campo suportados estão em `src/hooks/use-field-definitions.ts` (`FIELD_TYPE_LABELS`).

## O que entra no app

### Rotas novas (cockpit Core)

- `/admin/clientes/riomed/configuracoes-campos` — Form Builder
  - Tabs por entidade: Produto, Cliente, Fornecedor, Técnico, Candidato, Hospital, Ordem de serviço.
  - Criar / editar / excluir / desativar / reordenar campos.
  - Configurar rótulo, chave técnica, tipo, seção, visibilidade, obrigatoriedade, placeholder, ajuda e exemplo.
  - Gerenciar opções de campos `select` / `multiselect` num diálogo dedicado.
  - Campos do sistema (semeados) ficam bloqueados contra exclusão e mudança de tipo, mas continuam editáveis em rótulo, ordem, ajuda, visibilidade e obrigatoriedade.
- `/admin/clientes/riomed/implantacao` — Painel de Pendências
  - 19 tarefas pré-carregadas, agrupadas por área (Comunicação, Equipe, Estoque, Configuração, Financeiro, Plataforma, Qualidade).
  - Status: pendente, em andamento, concluído, bloqueado, não se aplica.
  - Notas livres por item.
  - Barra de progresso macro.

### Componentes reutilizáveis (Bolívia + DynamicForm)

- `<AddressBO />` — endereço boliviano completo (país, departamento, cidade, zona, rua, número, complemento, referência, link de mapa) com listas vindas de `geo_bo_*`.
- `<PhoneBO />` — telefone boliviano com máscara automática `+591 7000-0000`.
- `<DocumentBO />` — CI, CI Extranjería, NIT, Pasaporte ou Outro, com complemento.
- `<DynamicField />` e `<DynamicForm />` — renderizador genérico que olha `core_field_definitions` e desenha o campo certo. Suporta agrupamento por seção e respeita obrigatoriedade.

Esses componentes ficam em `src/components/forms/` e vão ser usados nas Ondas 2 (catálogo), 4 (CRM), 5 (marketing) e 6 (B2B).

## Seeds aplicados na empresa Rio Med

- 9 departamentos + cidades-chave da Bolívia.
- 19 pendências de implantação (WhatsApp oficial, vendedores, fornecedores, técnicos, importar inventário, revisar produtos sem foto/preço, mesclar duplicados, validar categorias, validar obrigatórios, gateway, domínio, testes de busca, agente virtual, CRM, orçamento, carrinho, baixa de estoque).
- 27 campos base do produto, já marcados como “do sistema”, divididos em seções Identificação, Classificação, Marca, Estoque, Preço, Mídia, Observações.

## Próximas ondas

- **Onda 2** — Catálogo & Importador. Usa o Form Builder para deixar a Rio Med editar todos os campos do produto; cria `riomed_product_variants` e estoque multi-almoxarifado; importador inteligente que sugere mapeamento de colunas com IA.
- **Onda 3** — Busca com IA (pgvector + multimodal por foto).
- **Onda 4** — CRM e funil comercial sobre o catálogo.
- **Onda 5** — Engine de divulgação automática (campanha gerada a partir do estoque parado).
- **Onda 6** — Marketplace B2B + CMMS de manutenção.
