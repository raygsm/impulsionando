# Fase 3 — Nova API modular

## Objetivo

Extrair regras do TanStack sem interromper os consumidores atuais.

## Ordem

1. Criar bootstrap do API e módulos base.
2. Implementar o fluxo vertical piloto.
3. Publicar contrato e client tipado.
4. Adaptar uma tela TanStack para consumir o API.
5. Comparar comportamento e telemetria.
6. Migrar módulos por prioridade e dependência.

## Compatibilidade

- Endpoints legados podem delegar ao caso de uso novo.
- Server functions podem ser adapters temporários.
- Contratos externos mantêm versão ou camada de compatibilidade.
- Nenhuma duplicação de escrita sem reconciliação explícita.

## Critério de saída

Módulos prioritários operam no API novo, possuem testes de contrato e podem ser implantados independentemente do frontend.

