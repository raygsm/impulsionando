# Contexto de negócio confirmado

Data da entrevista: 2026-08-28

## Decisões

- Raygs é o proprietário do produto.
- Cauã e Raygs podem autorizar mudanças em produção.
- Apenas Cauã e Raygs administram GitHub, Supabase e serviços relacionados.
- Clientes não possuem acesso técnico à infraestrutura.

## Lançamento

- A plataforma ainda não foi vendida nem possui histórico real de uso.
- Todos os tenants existentes são candidatos a clientes reais em período gratuito de teste.
- Impulsionando, Chrismed, Colors Saúde e WMP devem estar disponíveis até 2026-08-31.
- A ordem de criticidade informada é: Impulsionando, Chrismed, Colors Saúde e WMP.
- O objetivo futuro é adicionar tenants sem gargalo operacional.

O prazo de lançamento não reduz os gates contra perda de dados, vazamento, cobrança incorreta ou mudanças destrutivas. “Estar no ar” e “estar pronto para processar dados sensíveis/pagamentos” são gates diferentes.

## Operação

- Pagamentos, webhooks e automações são as capacidades consideradas mais críticas.
- Não há uma janela de manutenção definida.
- Serviços devem tender a disponibilidade contínua.
- Problemas destrutivos em produção não são aceitáveis.
- Caso haja incidente, a recuperação deve ocorrer o mais rápido possível; RTO/RPO numéricos ainda não foram definidos.
- Não existe catálogo confiável de incidentes anteriores.

## Dados

Há expectativa de dados sensíveis, possivelmente médicos, financeiros, fiscais e pessoais, mas a classificação por produto ainda é desconhecida. A próxima evidência será um inventário estrutural somente leitura do Supabase; nenhum registro de usuário será exportado para este repositório.
