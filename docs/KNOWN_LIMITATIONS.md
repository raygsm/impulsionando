# KNOWN_LIMITATIONS — Impulsionando Core (pós-Onda 3)

## Publicação

- O agente Codex **não publica** a aplicação. A publicação é sempre
  ação humana no editor Lovable (**Publish → Update**).
- Custom domains exigem intervenção manual no provedor DNS do cliente.

## Cortesia Full

- Cortesias sem `full_courtesy_ends_at` aparecem como “ativa” sem
  contador — comportamento esperado até que sejam efetivamente usadas
  em produção.
- Conversão em lote de cortesia → cobrança ainda não existe; o fluxo
  atual é individual, cliente a cliente, pelo Cliente 360.

## Cérebro IA por Cliente

- Base pronta (config + KB + eventos), **sem dispatcher real**. Nenhuma
  mensagem é enviada automaticamente por WhatsApp/e-mail nesta onda.
- Não há geração de embeddings/RAG ainda; a KB é armazenada como
  conteúdo bruto.
- Versionamento por snapshot ficará para a Onda 4.

## Hubs somente-leitura

- `/core/hub-cobranca` e `/core/hub-automacoes` **não** executam ações.
  Botões e links levam para as telas dedicadas onde a ação real e sua
  auditoria já existiam.
- Janela padrão de 30 dias com limite de 50k linhas por tabela agregada;
  para clientes muito ativos pode ser necessário paginar/downsample no
  futuro.

## Integrações externas

- Mercado Pago, N8N e WhatsApp dependem de credenciais reais por
  cliente para funcionar em produção. Sem credenciais, os hubs mostram
  contadores zerados — não é bug.
- Assinatura de webhook MP inválida é apenas contabilizada; bloqueio
  automático não está implementado.

## Analytics / alertas

- Ainda não há geração automática de `core_incidents` a partir dos
  sinais dos hubs (cortesia ≤ 7d, falha N8N > X%, assinatura MP
  inválida).
- Dashboard Master ainda consome fontes próprias — reuso dos agregados
  dos hubs ficará para a Onda 4.

## Segurança

- Rotação de `LOVABLE_API_KEY` só pode ser feita pela ferramenta
  dedicada; nunca manualmente.
- Nenhuma leitura de dados de outro cliente é possível via UI (garantido
  por RLS + `is_impulsionando_staff`), mas endpoints privilegiados
  sempre exigem checagem explícita antes de escritas sensíveis.

## Frontend

- Copy visível deve continuar usando “cliente/empresa”; qualquer
  ocorrência remanescente de “tenant” deve ser tratada como bug.
- Marketplace B2B: usar sempre “Taxa de Intermediação Digital”, nunca
  “comissão”.
