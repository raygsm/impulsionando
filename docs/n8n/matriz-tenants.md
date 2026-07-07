# Matriz de Habilitação por Tenant

Documento operacional: cada tenant real precisa passar por este mapa antes
de qualquer workflow ir para produção. Fonte de verdade final vive na UI
`/core/automacao/modelos-tenant` (Onda 3).

## Estrutura por tenant

```yaml
tenant:
  slug: chrismed
  plan: pro
  niche: clinica_medica
  responsavel_automacao: "Nome do responsável"
  canais:
    whatsapp:
      provedor: z-api
      status: aguardando_credencial   # ok | aguardando_credencial | desabilitado
      numero: null
    email:
      provedor: resend
      status: ok
      remetente: "no-reply@chrismed.com.br"
    impulsionito:
      status: ok
  workflows_habilitados:
    - lead-captado
    - clinica-consulta-confirmada
    - pagamento-aprovado
    # ... (subset do CATALOGO.md conforme plano+nicho)
  modo_padrao: demo
  aprovacoes:
    lgpd_revisada: false
    templates_aprovados: false
    responsavel_designado: false
    teste_executado: false
    aprovacao_manual: false
```

## Tenants iniciais (rascunho — sem ativação real)

| Tenant           | Plano   | Nicho             | Modo atual | Bloqueios                                              |
| ---------------- | ------- | ----------------- | ---------- | ------------------------------------------------------ |
| core             | —       | —                 | demo       | usar para testes internos                              |
| demo             | —       | multi             | demo       | dados fictícios; nunca vai a produção                  |
| chrismed         | Pro     | clinica_medica    | demo       | credenciais Z-API pendentes, templates não aprovados   |
| riomed           | Pro     | b2b_medico        | demo       | ver `RIOMED_README.md`; workflows 01–09 já em rascunho |
| marocas          | Essenc. | bar_restaurante   | demo       | canal WhatsApp pendente                                |
| garrido          | Pro     | juridico          | demo       | LGPD sob revisão                                       |

## Ciclo de habilitação

1. Cadastrar tenant + plano + nicho no admin.
2. Conectar canais (Z-API, SMTP/Resend).
3. Selecionar subset de workflows aplicáveis (auto-filtrado por matriz).
4. Rodar cada workflow em `modo: demo` e conferir log.
5. Aprovar templates (WhatsApp precisa homologação Meta).
6. Preencher checklist `checklist-ativacao.md`.
7. Alternar `modo_padrao` para `producao` (ação manual, exige backend).
