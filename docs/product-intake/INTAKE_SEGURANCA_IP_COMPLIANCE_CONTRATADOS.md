# INTAKE — SEGURANÇA DE PROPRIEDADE INTELECTUAL, CONFIDENCIALIDADE E COMPLIANCE DE CONTRATADOS

**Projeto:** Ecossistema Impulsionando
**Prioridade:** P0
**Objetivo:** proteger código-fonte, arquitetura, dados, segredos, Intakes, documentos e know-how da Impulsionando contra vazamento, uso indevido, cópia não autorizada, compartilhamento com terceiros ou alteração fora da governança, preservando ao mesmo tempo o acesso legítimo necessário a contratados autorizados.

## 1. PRINCÍPIO

Contratados autorizados podem acessar e modificar o repositório somente dentro do escopo necessário ao trabalho contratado e das permissões concedidas.

O acesso técnico não transfere propriedade intelectual, não autoriza distribuição externa e não substitui obrigações contratuais de confidencialidade, sigilo, compliance e cessão/licenciamento já pactuadas.

Este Intake não cria vigilância clandestina. Os controles devem ser técnicos, auditáveis, proporcionais e compatíveis com a legislação e com os contratos aplicáveis.

## 2. CONTROLES OBRIGATÓRIOS DE REPOSITÓRIO

- branch protection/rulesets nas branches críticas;
- impedir force-push e deleção não autorizada;
- PR obrigatório para mudanças sensíveis;
- revisão obrigatória/CODEOWNERS para segurança, pagamentos, autenticação, infraestrutura, banco, secrets, CI/CD e contratos;
- checks de CI obrigatórios antes de merge;
- histórico Git preservado;
- commits e merges rastreáveis por identidade individual;
- proibir contas compartilhadas;
- least privilege por usuário/equipe;
- revisão periódica e revogação imediata de acesso ao fim do contrato ou mudança de função.

## 3. PROTEÇÃO DE SEGREDOS E CREDENCIAIS

- nenhum secret em código, issue, PR, comentário, log ou frontend;
- usar Vault/secret manager/server-side;
- secret scanning/pre-commit/CI;
- rotação imediata de segredo exposto;
- credenciais individuais quando possível;
- tokens de curta duração/escopo mínimo;
- bloquear compartilhamento de credenciais entre contratados;
- manter trilha de criação, uso, rotação e revogação.

## 4. PROTEÇÃO DA PROPRIEDADE INTELECTUAL

- manter evidência imutável/versionada do código e autoria corporativa;
- preservar workflow de evidence bundle já existente no repositório;
- registrar hashes/SHAs e releases oficiais;
- manter inventário de dependências/licenças e origem de componentes de terceiros;
- exigir THIRD_PARTY_NOTICES/licenças quando houver importação de código externo;
- impedir incorporação de código incompatível com a licença/compliance da Impulsionando;
- não publicar repositório privado, patches, dumps, diagramas internos ou trechos substanciais em serviços públicos sem autorização formal.

## 5. CONTROLE DE EXFILTRAÇÃO E USO EXTERNO

Definir política técnica/operacional para impedir ou detectar compartilhamento não autorizado de código e dados em serviços externos, respeitando privacidade e legislação:

- lista de serviços aprovados para desenvolvimento/IA;
- proibição de envio de secrets, dados pessoais, dumps de banco ou código confidencial a ferramentas não aprovadas;
- revisão de configuração de retenção/treinamento de ferramentas externas usadas pela equipe;
- DLP/controles corporativos quando disponíveis;
- alertas para publicação acidental de repositório, gist ou pacote;
- varredura de secrets e artefatos sensíveis em PRs/releases;
- inventário de integrações GitHub Apps/OAuth com acesso ao repositório.

Não usar spyware, keylogger, captura clandestina de tela ou monitoramento pessoal oculto.

## 6. AUDITORIA DE ALTERAÇÕES

Cada alteração relevante deve ser atribuível a:

- usuário GitHub;
- data/hora;
- branch;
- commit SHA;
- PR/Issue/Intake relacionado;
- arquivos/escopo alterado;
- revisão/aprovação;
- CI;
- deploy/staging/produção quando houver;
- evidência do gate `IMPLEMENTADO → TESTADO → DEPLOYED → VERIFIED`.

O painel `/mind-map` e `/sticky-notes` deve poder exibir o vínculo de evidência sem expor segredos.

## 7. MUDANÇAS SENSÍVEIS

Exigir revisão adicional para:

- auth/RBAC/RLS;
- secrets/Vault;
- pagamentos/checkout/split/payout;
- banco/migrations;
- CI/CD/deploy;
- Cloudflare/DNS/VPS;
- logs/auditoria;
- dados pessoais/LGPD;
- contratos/aceites;
- criptografia/E2EE;
- exportação/download em massa;
- permissões de administradores.

## 8. OFFBOARDING DE CONTRATADO

Ao término ou suspensão do vínculo:

1. revogar GitHub e demais acessos;
2. revogar/rotacionar tokens, SSH keys e secrets acessíveis;
3. revisar GitHub Apps/OAuth e sessões;
4. confirmar devolução/eliminação de cópias locais conforme contrato e política aplicável;
5. preservar evidências e logs corporativos;
6. reatribuir issues/PRs;
7. registrar data/hora do offboarding;
8. realizar revisão de risco pós-acesso quando necessário.

## 9. CONTRATO E COMPLIANCE

O sistema deve registrar que acesso ao repositório está subordinado aos contratos e políticas vigentes de:

- confidencialidade/sigilo;
- proteção de dados;
- propriedade intelectual;
- não compartilhamento com terceiros não autorizados;
- uso aceitável de ferramentas externas;
- segurança da informação;
- devolução/eliminação de materiais após término, quando previsto.

Não reproduzir cláusulas jurídicas inexistentes nem presumir penalidades não verificadas. Vincular à versão do contrato/política efetivamente assinada e vigente.

## 10. ALERTAS P0

Gerar alerta de segurança para eventos como:

- secret detectado em commit/PR;
- alteração de ruleset/proteção de branch;
- force-push/deleção de branch crítica;
- novo GitHub App/OAuth com acesso relevante;
- tentativa de publicar pacote/repositório inesperado;
- mudança sensível sem PR/revisão quando exigida;
- alteração de CI para desabilitar checks;
- alteração de logs/auditoria;
- mudança de permissões de colaboradores;
- exportação ou exposição pública detectável de artefato confidencial.

## 11. CRITÉRIO DE ACEITE

Não considerar este Intake concluído sem evidência de:

- proteção de branches críticas;
- CODEOWNERS/revisões sensíveis;
- identidade individual e least privilege;
- secret scanning;
- auditoria por commit/PR;
- inventário de apps/integradores;
- política de ferramentas externas;
- processo de offboarding;
- vínculo aos contratos/políticas vigentes;
- alertas P0;
- testes dos controles;
- documentação de owner e resposta a incidente.

**Regra:** segurança deve resguardar a Impulsionando sem impedir o desenvolvimento legítimo e sem recorrer a vigilância clandestina do contratado.
