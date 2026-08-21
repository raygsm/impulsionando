# DEPLOY — Impulsionando Core

## Plataforma canônica

A produção do Ecossistema Impulsionando é publicada a partir do repositório canônico `raygsm/impulsionando`, branch `main`, pelo workflow `.github/workflows/production-front.yml`, com build imutável e promoção para a VPS Hostinger.

A autoridade de frontend é única: **Production Front**. Publicadores paralelos, serviços de frontend legados, redirects externos não autorizados e plataformas antigas não fazem parte da arquitetura de produção.

## Ambientes / URLs

- Produção principal: `https://impulsionando.com.br`
- `www`: `https://www.impulsionando.com.br`
- Tenants: `https://<subdominio>.impulsionando.com.br`
- Fonte dos tenants ativos: `core_tenant_identity` no Supabase

Exemplos: WMP, CHRISMED, Rio Med, Marocas e demais tenants ativos cadastrados no Core.

## Pipeline canônico de frontend

O workflow `Production Front` executa:

1. checkout do SHA exato de `main`;
2. instalação limpa de dependências;
3. testes de subdomínio;
4. descoberta dos tenants ativos via Supabase;
5. build único e imutável;
6. geração de `impulsionando-front-sha.txt` e `impulsionando-release.json`;
7. upload por SSH para a VPS Hostinger;
8. criação/promocao do release canônico;
9. remoção de containers de frontend concorrentes conhecidos;
10. validação externa de HTTP + SHA no apex e em todos os tenants;
11. persistência da evidência de deploy no Supabase.

## Regra de verdade

Commit, push ou build não significam produção.

Um frontend somente é considerado publicado quando o domínio público retorna HTTP 200 e o marcador `impulsionando-front-sha.txt` corresponde exatamente ao SHA esperado do release.

## Isolamento de tenants

Todos os tenants devem ser servidos exclusivamente pela autoridade canônica de frontend. É proibido manter publicadores específicos antigos capazes de sobrescrever ou competir com o `Production Front`.

Qualquer container, workflow, router, proxy, redirect, serviço ou cache que consiga entregar um frontend diferente do release canônico deve ser removido da cadeia ativa.

## Rollback

O workflow preserva uma referência de rollback do container anterior antes da promoção do novo release. Rollback deve ser explícito, auditável e nunca ocorrer por automação concorrente ou restauração silenciosa de artefato antigo.

## Segurança

- secrets somente em GitHub Secrets/ambiente seguro;
- nenhum secret no bundle client;
- SSH da VPS via chave;
- releases identificados por SHA;
- nenhuma plataforma legada pode ser fallback de produção;
- DNS, proxy e routers devem apontar exclusivamente para a infraestrutura canônica autorizada.

## Política Zero-Legacy

A cadeia de produção não pode depender de repositórios paralelos, publicadores históricos, arquivos de build antigos, DNS órfãos, service workers antigos ou serviços externos descontinuados. Referências legadas eventualmente mantidas apenas para histórico documental não podem participar de build, deploy, runtime, DNS, proxy ou roteamento.
