# Objetivo e limites

## Missão

Reengenheirar a plataforma Impulsionando de forma incremental para que uma equipe técnica consiga desenvolver, operar, observar e evoluir o produto com segurança.

## Problema que estamos resolvendo

O sistema atual concentra frontend, SSR, endpoints HTTP, server functions, workers, integrações e roteamento multi-tenant em um único pacote e, em produção, distribui versões diferentes por múltiplos mecanismos de runtime.

O problema central não é TanStack Start, Docker, Nginx ou o tamanho do repositório isoladamente. É a ausência de limites e de uma autoridade única para:

- regras de negócio;
- identidade e autorização;
- roteamento de tenants;
- builds e releases;
- processamento assíncrono;
- integração com sistemas externos;
- observabilidade e rollback.

## Resultados esperados

- Cada commit promovido corresponde a uma imagem imutável identificável.
- Cada domínio possui um destino conhecido e testável.
- Cada tenant executa a mesma versão do produto, com diferenças declaradas em configuração.
- Regras de negócio vivem fora dos componentes React.
- API e workers escalam independentemente dos frontends.
- Falhas de integração não derrubam SSR ou páginas públicas.
- Toda ação sensível é autorizada, idempotente e auditável.
- Recursos de IA obedecem aos mesmos limites de tenant e permissão do produto.

## Fora de escopo inicial

- Kubernetes.
- Microserviço por domínio de negócio.
- Self-host do Supabase.
- Reescrita simultânea de todas as rotas.
- Troca completa do frontend apenas por preferência tecnológica.
- Limpeza destrutiva da VPS antes do cutover comprovado.

## Indicadores de sucesso

- deploy de staging reproduzível a partir de um SHA;
- rollback testado;
- nenhum secret em bundle ou repositório;
- testes de isolamento tenant cobrindo allow e deny;
- health/readiness checks por serviço;
- correlação de requests e jobs;
- primeiro tenant migrado sem lógica especial no proxy;
- produção sem containers manuais, releases órfãos ou builds locais.

