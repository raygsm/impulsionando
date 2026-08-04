# Runbook universal — Lovable e domínios oficiais

## Configuração única por domínio

1. Confirme o domínio oficial em `companies.domain` ou o subdomínio em `companies.subdomain`.
2. No projeto Lovable que contém o Core, abra `Project → Settings → Domains`.
3. Selecione `Connect existing domain` e informe o domínio oficial completo.
4. Se a zona usa proxy Cloudflare, expanda `Advanced` e habilite `Domain uses Cloudflare or a similar proxy`.
5. Copie o A/CNAME/TXT apresentado naquele momento. Não reutilize valores de outro domínio ou projeto.
6. No DNS autoritativo (Cloudflare, Hostinger ou outro), aplique os registros e remova A/AAAA/CNAME conflitantes.
7. Aguarde o estado `Live` e torne o domínio oficial primário quando aplicável.
8. Valide `https://DOMINIO/api/public/version` e execute manualmente o workflow `Official domains consistency monitor`.

## Segredos

- `CLOUDFLARE_API_TOKEN`: Supabase Dashboard → Database → Vault. Permissões mínimas no Cloudflare: `Zone:Read` e `Cache Purge:Edit`, somente nas zonas da Impulsionando.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: bootstrap server-side já utilizado pelo workflow. Nunca expor em frontend ou logs.
- O monitor busca o token Cloudflare pelo RPC service-role-only `get_deployment_vault_secret`.

## Publicação normal

1. Aguarde os checks obrigatórios do GitHub.
2. No Lovable, clique `Publish → Update`.
3. Abra o domínio oficial. Como ele está ligado ao mesmo projeto, não existe cópia Lovable → Hostinger.
4. Se o monitor detectar cache antigo, ele tenta purge e repete a comparação.

## Diagnóstico

- `invalid_version_contract`: o domínio não está servindo este Core ou a rota de versão foi interceptada.
- `commit_mismatch`: o domínio serve outro snapshot/projeto.
- O fingerprint de assets é registrado por domínio para diagnóstico; landings diferentes podem carregar chunks diferentes sem representar divergência de build.
- `dns_http_*`: falha temporária no DNS-over-HTTPS.
- `reference_unavailable`: nenhum domínio saudável pôde definir a build mais recente.

## Restrições de segurança

- O monitor não muda DNS automaticamente: sem o registro esperado fornecido pelo Lovable, “adivinhar” destino pode sequestrar ou derrubar um domínio.
- Merge, exclusão, alteração de workflows e mudanças DNS permanecem sob aprovação master.
- O self-healing automático limita-se a revalidação, purge de cache autorizado e nova prova.
