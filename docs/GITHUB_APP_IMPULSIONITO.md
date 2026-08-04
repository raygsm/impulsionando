# Integração GitHub App do Impulsionito

## Arquitetura e limites de confiança

- Autenticação: GitHub App, com JWT de 9 minutos e token de instalação efêmero, limitado ao repositório e às permissões necessárias para cada chamada.
- Leitura: repositórios, pull requests, issues, check runs e GitHub Actions. O MCP oficial roda com `GITHUB_READ_ONLY=1` e toolsets `context,repos,issues,pull_requests,actions`.
- Escrita: somente `issue.create`, `branch.create` e `pull_request.create_draft`. Toda solicitação nasce `pending`, exige decisão da conta cujo e-mail autenticado é exatamente `raygs@hotmail.com` e exige uma segunda chamada master para execução.
- Merge, exclusão, push direto, alteração de workflows, secrets, administração e criação de repositórios não têm método executor e permanecem bloqueados.
- Segredos: somente `GITHUB_APP_PRIVATE_KEY` e `GITHUB_APP_WEBHOOK_SECRET` no Supabase Vault. Banco, aplicação, auditoria e documentação guardam apenas nomes/referências.
- Webhook: HMAC SHA-256 antes do JSON; limite de 2 MiB; eventos em allowlist; persistência apenas do hash e metadados mínimos. O payload integral não é armazenado.
- Auditoria: identidade, operação, repositório, aprovação, resultado e metadados sem payload, corpo, token, chave ou segredo.

## Permissões mínimas da GitHub App

Permissões de repositório: `Actions: Read`, `Checks: Read`, `Contents: Read and write`, `Issues: Read and write`, `Pull requests: Read and write`. `Metadata: Read` é obrigatória pelo GitHub. Todas as demais ficam `No access`. O token é reduzido dinamicamente: leituras usam apenas `read`; cada escrita recebe somente a permissão necessária.

Eventos inscritos: `Installation`, `Installation repositories`, `Push`, `Pull request`, `Issues`, `Check run`, `Check suite`, `Workflow run` e `Workflow job`.

Instale a App somente em `raygsm/impulsionando` (ou acrescente explicitamente um repositório à allowlist revisada antes da instalação). Habilite proteção da branch principal e checks obrigatórios no próprio GitHub.

## Configuração manual

1. GitHub: avatar → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. Defina o Webhook URL como `https://impulsionando.com.br/api/public/hooks/github-app`, crie um segredo aleatório forte e selecione somente os eventos acima.
3. Em **Permissions & events**, aplique exatamente as permissões acima. Em **Install App**, escolha **Only select repositories** e marque `raygsm/impulsionando`.
4. Copie o **App ID** na página **General**. Obtenha o **Installation ID** no número presente na URL depois de abrir **Install App → Configure** (`/settings/installations/INSTALLATION_ID`).
5. Em **General → Private keys → Generate a private key**, baixe a chave uma única vez. Não a cole em chat, commit, `.env` ou painel de logs.
6. Supabase do ambiente correto: **Project Dashboard → Database → Vault → New secret**. Cadastre a chave PEM com nome exato `GITHUB_APP_PRIVATE_KEY` e o segredo HMAC com nome exato `GITHUB_APP_WEBHOOK_SECRET`.
7. Supabase: **SQL Editor → New query** e atualize somente dados não secretos:

```sql
update public.core_integrations
set config = config || jsonb_build_object(
  'app_id', 'APP_ID_NUMERICO',
  'installation_id', 'INSTALLATION_ID_NUMERICO'
), status = 'connected', updated_at = now()
where slug = 'github-app';
```

8. Aplique a migration `supabase/migrations/20260804120000_impulsionito_github_app.sql` somente depois de confirmar que o projeto Supabase selecionado é o de produção e que o histórico local/remoto está reconciliado.

## MCP oficial

Pré-requisitos no host MCP: Docker e as credenciais de bootstrap do Supabase já existentes no runtime (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`). Execute `node scripts/github-mcp-vault-launcher.mjs`. O launcher busca a chave diretamente no Vault, não imprime o valor e inicia a imagem oficial fixada `ghcr.io/github/github-mcp-server:v1.0.5` em modo somente leitura.

Exemplo de configuração do host MCP:

```json
{
  "mcpServers": {
    "github-impulsionito-readonly": {
      "command": "node",
      "args": ["C:/CAMINHO/impulsionando/scripts/github-mcp-vault-launcher.mjs"]
    }
  }
}
```

## Operação

O Impulsionito chama `readGitHubResource` para leitura. Para escrita, chama `requestGitHubWrite`; o master revisa em `listGitHubWriteRequests`, decide em `decideGitHubWrite` e, apenas após aprovação, executa em `executeApprovedGitHubWrite`. Não conectar essas funções à rota pública de chat; elas exigem sessão Supabase autenticada e RLS.

Rotação: gere nova private key no GitHub, substitua o segredo homônimo no Vault, valide o diagnóstico e revogue a chave anterior. Para webhook, troque o segredo no GitHub e no Vault dentro da mesma janela de manutenção.
