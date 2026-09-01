# MAROCAS — MASTER PRODUCT INTAKE

**Data:** 2026-09-01  
**Tenant:** Marocas  
**Plano:** Impulsionando Full  
**Agente central:** Impulsionito  
**Agente especializado:** MAROQUITO  
**Executor futuro:** Cauã / programador  
**Modo:** EXCLUSIVAMENTE PRODUCT INTAKE  

> NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO. NÃO ALTERAR BANCO. NÃO PUBLICAR. Este documento é o Livro de Anotações para execução posterior pelo programador.

## 1. Regra de continuidade

Executar futuramente a partir do estado real da Marocas. Não reconstruir o que estiver correto. Fluxo obrigatório: **AUDITAR → PRESERVAR → CORRIGIR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR**.

Critério de pronto: funcionalidade implementada + backend + banco + integrações + testes + publicação real no domínio/subdomínio correto. Commit isolado não significa concluído.

## 2. Posicionamento

A Marocas deve funcionar como plataforma de gestão integral do imóvel. Promessa central: **“Você não precisa estar no apartamento. A Marocas cuida.”**

A operação deve integrar limpeza, controle de qualidade, reposições, manutenção, profissionais, agenda/pega-agenda, anfitriões, imóveis, estoque, contratos, financeiro, notas fiscais, CRM, ERP, BI, comunicação e MAROQUITO.

## 3. Identidade visual e frontend

Usar exclusivamente o logo oficial mais recente da Marocas. Corrigir integralmente o front atual, incluindo contraste inadequado entre fundo e fonte, legibilidade, hierarquia, responsividade, WCAG AA, menus, cards, campos, estados e identidade visual.

Aplicar UX/UI, design instrucional, copywriting e design system coerente. O front não pode parecer software genérico. Deve transmitir confiança, cuidado, organização e tranquilidade.

Menu público recomendado por intenção: **Como funciona / Para anfitriões / Serviços / Planos / Loja / Faça parte do time Marocas / Entrar**.

## 4. MAROQUITO

MAROQUITO é a instância especializada do Impulsionito e o cérebro vivo da Marocas. Deve compreender usuários, imóveis, reservas, agenda, limpeza, profissionais, reposições, estoque, chamados, manutenções, fornecedores, ocorrências, fotos, contratos, pagamentos e histórico.

Nunca inventar status. Sempre consultar o Core antes de responder. Se não houver evidência, informar que ainda não há confirmação operacional e acionar o responsável quando aplicável.

## 5. Usuários internos e permissionamento

### Francisca Mara — Operação de Limpeza e Qualidade
Responsável pela ponta da operação de limpeza.

Pode: visualizar todas as limpezas; agenda diária/semanal; atribuir/trocar profissional; cancelar atribuição; reabrir pega-agenda; confirmar presença; registrar ausência; acompanhar check-in; checklist; fotos; aprovar/reprovar qualidade; pedir retrabalho; registrar ocorrência; assumir limpeza se necessário; cadastrar e convidar profissionais de limpeza; gerenciar disponibilidade; avaliar desempenho; controlar reposições operacionais e estoque crítico.

Não pode: alterar financeiro global, preços, regras fiscais, emitir NF, movimentar contas ou administrar configurações master.

### Paola — Administrativo / Financeiro / ERP
Responsável pelo backoffice administrativo e financeiro.

Pode: cadastrar clientes, anfitriões, proprietários e apartamentos; revisar cadastro de imóveis; confirmar cadastros profissionais no âmbito documental; gerenciar documentos, ERP, financeiro, contas a pagar/receber, notas fiscais, pagamentos, contratos, fornecedores, relatórios e dashboards administrativos.

Não substitui a supervisão operacional diária de Francisca Mara.

### Joel — Manutenção
Responsável integral pela vertical de manutenção, separada da limpeza.

Pode: cadastrar/convidar/validar profissionais técnicos; receber e classificar chamados; definir prioridade; solicitar orçamento; atribuir técnico; acompanhar execução; registrar materiais e mão de obra; gerir SLA; concluir manutenção; registrar fotos; gerir planos mensais de manutenção e consumo de franquia/mão de obra incluída.

Não administra limpeza nem financeiro global.

### Marocas Master
Acesso total ao tenant Marocas, inclusive usuários, permissões, auditoria, dashboards e regras operacionais.

### Master Impulsionando
Acesso transversal técnico/administrativo do ecossistema com tenant isolation, auditoria e mínimo privilégio.

### Profissional de limpeza
Acesso somente a serviços próprios, horários, endereços necessários, checklists, regras operacionais, histórico próprio, avaliações e pagamentos próprios quando aplicável.

### Profissional de manutenção
Acesso somente a chamados atribuídos, endereço necessário, categoria, descrição, agenda, orçamento, status e evidências.

### Anfitrião / proprietário
Acesso somente aos próprios imóveis, limpezas, manutenções, reposições, aprovações, despesas, relatórios, contratos e suporte.

## 6. Matriz RBAC/RLS

Implementar RBAC + RLS reais, com leitura/criação/edição/aprovação/cancelamento/exportação segregados.

Regras mínimas: Mara não acessa financeiro global; Joel não altera limpeza; profissional não vê outro profissional ou imóvel alheio; proprietário não acessa outro proprietário; Paola não altera configurações master; somente Master administra usuários globais.

## 7. “Faça parte do time Marocas”

CTA público no frontend para cadastro de profissionais.

Fluxo: **Escolha profissão → cadastro → documentos → região → disponibilidade → aceite → análise → aprovação**.

Permitir convite pelo dashboard: individual, lista, planilha, link compartilhável e QR Code quando útil.

Mara convida profissionais de limpeza/reposição. Joel convida técnicos de manutenção. Paola acompanha documentação e validação administrativa.

## 8. Cadastros estruturados

Evitar texto livre. Usar listas, dropdowns e multiseleção para profissão, especialidade, região, tipo de manutenção, status, motivo, categoria e serviço.

Profissional pode possuir múltiplas especialidades.

Catálogo técnico deve incluir, no mínimo: eletricista, bombeiro hidráulico, pintor, gesseiro, marceneiro, chaveiro, técnico de ar-condicionado, técnico de eletrodomésticos, vidraceiro, pedreiro, azulejista, instalador, técnico de internet, técnico de TV, impermeabilização, serralheiro, montador de móveis, limpeza de caixa d’água e dedetização.

## 9. Jornada do anfitrião

**Conhecer Marocas → cadastrar-se → cadastrar imóvel → necessidades → plano → contrato/aceite → pagamento/ativação → onboarding → operação contínua**.

Permitir múltiplos imóveis por proprietário.

Cadastro de imóvel deve incluir endereço, condomínio, unidade, metragem, quartos, banheiros, capacidade, portaria, contatos, acessos, fechaduras, chaves, cofres, Wi-Fi, eletrodomésticos, utensílios, inventário, enxoval, amenities, fotos e documentos.

## 10. Agenda e pega-agenda de limpeza

Agenda por dia, semana, mês, imóvel, profissional, serviço e região.

Pega-agenda: **limpeza aberta → profissionais elegíveis → aviso → aceite → atribuição → bloqueio de agenda**.

Critérios: especialidade, região, disponibilidade, avaliação, deslocamento e conflito.

Ao aceitar, profissional assume compromisso formal. Registrar cancelamentos com motivo estruturado. Cancelamento reabre pega-agenda e alerta Mara. Se ninguém aceitar, gerar alerta operacional prioritário.

## 11. Contingência

Ausência sem aviso: **SLA vencido → alerta Mara → contato → pega-agenda emergencial → registro → eventual suspensão**.

Hierarquia: profissional originalmente alocado → pega-agenda → profissional reserva → intervenção direta de Francisca Mara quando operacionalmente possível.

Reserva de última hora deve ser classificada como urgente.

## 12. Check-in e checklist

Registrar chegada, início, horário, localização quando autorizada e responsável.

Checklist por imóvel e ambiente, com estados: **OK / requer atenção / faltando / danificado**.

Fotos obrigatórias quando aplicável: antes, depois, avaria, item faltante, manutenção e reposição.

Controle de qualidade por Francisca Mara com estados: aguardando, em execução, concluído, em conferência, aprovado e retrabalho.

## 13. Reposições

Módulo específico para papel higiênico, sabonete, shampoo, café, açúcar, água, detergente, esponja, saco de lixo, amenities, enxoval e outros itens estruturados.

Separar estoque central Marocas, estoque por imóvel, estoque técnico/manutenção e em trânsito.

Fluxo: **estoque baixo → alerta Mara → solicitação → Paola/ERP → compra → entrada → imóvel → consumo**.

## 14. Joel e manutenção

Manutenção é serviço separado da limpeza.

Fluxo: **problema → chamado → categoria → prioridade → Joel → técnico → orçamento → autorização → execução → evidência → conclusão**.

Categorias estruturadas: elétrica, hidráulica, ar-condicionado, fechadura, pintura, marcenaria, eletrodoméstico, internet, mobiliário, estrutural e emergência.

Prioridades: P0 risco à pessoa/patrimônio; P1 impede hospedagem/operação; P2 impacta experiência; P3 preventivo/estético.

Criar histórico técnico por imóvel, manutenção preventiva e inteligência para recorrência de problemas.

## 15. Planos mensais de manutenção

Preservar e implementar os planos já definidos. Podem incluir mão de obra de manutenção, prioridade, visitas preventivas e descontos.

Separar claramente mão de obra incluída de materiais e peças cobrados à parte quando essa for a regra.

Parametrizar quantidade de chamadas, horas incluídas, limite por ocorrência, categorias, emergências e excedentes.

Dashboard do proprietário deve mostrar franquia disponível, utilizada, serviços e renovação.

## 16. Contratos e termos

Contrato digital para anfitrião, profissionais e planos de manutenção.

Registrar versão, data, hora, usuário, IP quando permitido e evidência de aceite. Nunca sobrescrever histórico.

Revisão jurídica posterior deve contemplar Código Civil, CDC quando aplicável, LGPD, Marco Civil, assinatura eletrônica, prestação de serviços, responsabilidade e relação com prestadores.

Não presumir vínculo empregatício; validar o modelo jurídico real com assessoria competente antes do go-live.

## 17. ERP Marocas

ERP Full do Impulsionando deve controlar clientes, imóveis, estoque, compras, fornecedores, serviços, despesas, receitas, contas, pagamentos, repasses, materiais, manutenção e notas fiscais.

Paola é principal usuária do ERP.

Toda despesa deve estar vinculada a contexto real: imóvel, chamado, fornecedor, serviço, proprietário e data.

## 18. Nota fiscal

Fluxo: **serviço/cobrança → regra fiscal → NF → autorização → armazenamento → envio**.

Paola controla emissão e falhas. Retry não pode duplicar NF.

## 19. CRM

Pipeline anfitrião: **lead → contato → interessado → imóvel cadastrado → proposta → plano → contrato → ativo**.

Pipeline profissional: **lead → convite → cadastro → análise → aprovado → ativo → inativo/bloqueado**.

Registrar origem e UTMs: source, medium, campaign, content e term.

## 20. Loja e galeria

Reaproveitar e integrar a loja virtual real já existente. Não duplicar catálogo nem criar produtos fictícios.

Galeria deve puxar produtos reais, categorizados em enxoval, amenities, limpeza, manutenção, utilidades e reposições.

Compra deve permitir vincular produto → imóvel → quantidade → autorização → entrega.

## 21. Dashboards por perfil

### Mara
Limpezas hoje, atrasos, profissionais, faltas, pega-agenda, retrabalhos, estoque crítico e imóveis aguardando conferência.

### Paola
Clientes, imóveis, receita, despesas, margem, NF, contas, contratos, cadastros pendentes e indicadores administrativos.

### Joel
Chamados, emergências, técnicos, orçamentos, planos, SLA, materiais e manutenção preventiva.

### Proprietário
Imóveis, próximas reservas, próxima limpeza, status “pronto”, pendências, manutenção, estoque, gastos, fotos e relatórios.

## 22. MAROQUITO por perfil

Mara: “Quais limpezas estão atrasadas?”  
Paola: “Quais notas fiscais estão pendentes?”  
Joel: “Quais chamados urgentes estão abertos?”  
Anfitrião: “Meu apartamento está pronto?”

Respostas sempre derivadas do Core e do permissionamento do usuário.

## 23. UX/UI e design instrucional

Cada tela deve responder: **Onde estou? O que preciso fazer? Qual é o próximo passo?**

Formulários progressivos, salvar progresso, validação imediata, máscaras, listas padronizadas e mínimo texto livre.

Mobile-first, especialmente para profissionais: **aceitar → chegar → checklist → fotos → concluir**.

## 24. Growth, captação, conversão e retenção

Anfitriões: **visita → interesse → cadastro → imóvel → plano → contrato**.

Profissionais: **visita → Faça parte → cadastro → aprovação → primeiro serviço → recorrência**.

Copy baseada em dor real: distância, falta de tempo, improviso, manutenção, confiança e visibilidade operacional.

CTA principal: **Cadastrar meu imóvel**. Secundário: **Conhecer os planos**.

Retenção baseada em previsibilidade, transparência, relatórios, SLA, confiança e resolução rápida.

## 25. N8N / automações

Validar fluxos: reserva → agenda; check-out → limpeza; cancelamento → pega-agenda; falta → Mara; limpeza concluída → qualidade; estoque baixo → reposição; avaria → Joel; manutenção concluída → proprietário; NF → Paola; NPS → pesquisa.

Toda automação deve ter idempotência, log, retry, tratamento de erro e alerta humano.

## 26. Central de pendências

Fila “PRECISA DE ATENÇÃO” com: limpeza sem profissional, atraso, ausência, retrabalho, estoque baixo, NF com erro, pagamento divergente, manutenção atrasada, orçamento aguardando e contrato pendente.

## 27. BI

Global: imóveis ativos, clientes, receita, custos, margem, limpezas, manutenção, profissionais, SLA, NPS, cancelamentos.

Mara: previstas, concluídas, atrasadas, canceladas, sem profissional, retrabalho, qualidade média.

Paola: faturamento, despesas, margem, NF, inadimplência, contratos, imóveis e clientes novos.

Joel: chamados, urgências, SLA, custo médio, manutenção por imóvel, técnicos e orçamento pendente.

## 28. Segurança e privacidade

Aplicar RLS, RBAC, tenant isolation, princípio do menor privilégio, auditoria, proteção de documentos/fotos e secrets fora do frontend.

Códigos de acesso, chaves digitais e senhas de fechadura/cofre devem ser criptografados, auditados e liberados somente ao profissional atribuído durante a janela necessária.

## 29. Auditoria

Registrar usuário, papel, ação, data/hora, entidade, valor anterior e novo, especialmente em pagamentos, NF, cancelamentos, profissionais, orçamentos, manutenção e permissões.

## 30. Testes obrigatórios por persona

### Francisca Mara
Limpeza criada → profissional aceita → cancela → pega-agenda → novo profissional → execução → fotos → conferência → aprovação.

### Paola
Novo anfitrião → imóvel → contrato → cobrança → NF → ERP → relatório.

### Joel
Vazamento → chamado → hidráulico → orçamento → aprovação → execução → conclusão.

### Profissional
Faça parte → cadastro → aprovação → pega-agenda → aceite → check-in → checklist → foto → conclusão.

### Proprietário
Cadastro → imóvel → plano → contrato → limpeza → manutenção → relatório → consulta pelo MAROQUITO.

## 31. Testes de exceção

Simular atraso, ausência, chave indisponível, avaria, falta de material, reserva urgente, agenda conflitante, manutenção emergencial, falha de comunicação, NF duplicável, tentativa de acesso indevido e indisponibilidade de integração.

## 32. Teste de permissões

Mara tenta alterar NF → NEGADO.  
Joel tenta financeiro global → NEGADO.  
Profissional tenta imóvel alheio → NEGADO.  
Proprietário tenta outro proprietário → NEGADO.  
Paola tenta configuração master → NEGADO.

## 33. Zero mock

No go-live: zero dados operacionais fictícios. Demonstração somente em ambiente explicitamente identificado como demo.

## 34. Publicação

Após execução futura pelo Cauã: **commit → main → testes → build → deploy → validação no domínio real**.

Regra absoluta do ecossistema: **SHA aprovado da main = SHA servido no domínio da Marocas**. Sem isso, não concluir.

## 35. Critério final de go-live

Somente liberar com P0 = zero, P1 impeditivo = zero, segurança = PASS, RBAC = PASS, RLS = PASS, jornadas críticas = PASS, integrações = PASS e publicação = PASS.

## 36. Aceite final por persona

Francisca Mara: consigo controlar todas as limpezas de hoje?  
Paola: consigo administrar financeiramente a Marocas sem planilhas paralelas?  
Joel: consigo resolver manutenção do chamado ao encerramento?  
Profissional: consigo executar meu trabalho inteiro pelo celular?  
Anfitrião: consigo saber se meu imóvel está cuidado sem precisar ligar?  
Master: consigo auditar tudo?

Se qualquer resposta for “não”, o módulo permanece aberto.

## 37. Resultado esperado

Três centros operacionais integrados:

**FRANCISCA MARA — Limpeza + profissionais + qualidade + reposição operacional**  
**PAOLA — Clientes + imóveis + contratos + ERP + financeiro + NF + administração**  
**JOEL — Manutenção + técnicos + planos + SLA + materiais técnicos**

Todos conectados por **MAROQUITO → IMPULSIONITO → CORE → CRM → ERP → AGENDA → N8N → BI**.

Para o anfitrião, o resultado final deve ser simples: **“Meu imóvel está cuidado. Eu consigo ver e confiar.”**

---

**STATUS DESTE DOCUMENTO:** SALVO COMO INTAKE.  
**EXECUÇÃO:** POSTERIOR PELO CAUÃ.  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE REGISTRO.**
