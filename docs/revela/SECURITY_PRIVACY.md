# REVELA — Segurança, privacidade e governança

## Objetivo
Definir controles mínimos antes de qualquer promoção do REVELA para produção.

## Regras
1. Tenant isolation obrigatório em todas as tabelas e operações.
2. RBAC e RLS são cumulativos; interface nunca substitui autorização server-side.
3. Dados individuais são minimizados por finalidade.
4. Dados sensíveis ou de alto impacto não entram em logs de aplicação sem necessidade operacional explícita.
5. Consentimentos e autorizações devem possuir versão, finalidade, ator, data e histórico de revogação.
6. Revogação interrompe compartilhamentos futuros conforme política aplicável, preservando somente registros que devam existir por obrigação/auditoria legítima.
7. Empresa não recebe perfil integral do aluno por padrão.
8. Matching e recomendações não executam decisões finais automáticas.
9. Toda alteração metodológica relevante é versionada.
10. Ações administrativas sensíveis geram trilha de auditoria.

## Menores e contexto educacional
Fluxos devem ser configuráveis para idade, papel do responsável, política da instituição e base jurídica aplicável. O produto não presume um único regime de consentimento para todos os cenários.

## Minimização
Preferir identificadores internos e dados estritamente necessários. Dashboards agregados de escola/rede não devem permitir reidentificação trivial de indivíduos.

## Compartilhamento com empresas
Deve registrar:
- finalidade;
- oportunidade associada;
- conjunto de dados autorizado;
- início e expiração quando aplicável;
- revogação;
- auditoria de acesso.

## IA e inferências
- IA pode organizar evidências e recomendar investigação/experiências;
- não diagnostica saúde mental, capacidade intelectual ou personalidade clínica;
- não determina profissão, contratação, demissão, aprovação ou reprovação;
- deve expor confiança e evidências utilizadas;
- baixa confiança precisa ser visível ao usuário habilitado.

## Gates antes de produção
- Security Baseline verde;
- tenant isolation verde;
- RLS verde;
- testes de acesso negativo por papel;
- E2E dos fluxos de consentimento e compartilhamento;
- auditoria e rollback validados;
- Core estável e política oficial reconhecendo REVELA como tenant antes de qualquer deploy.

## Regra operacional atual
Enquanto o Core universal estiver em reconciliação, esta branch não deve alterar `main`, DNS, deploy, política global de tenant, N8N compartilhado ou infraestrutura. A integração global ocorrerá somente após revalidação da base canônica.
