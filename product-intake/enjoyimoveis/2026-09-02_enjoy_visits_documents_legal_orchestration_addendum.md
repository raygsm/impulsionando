# PRODUCT INTAKE — ENJOY IMÓVEIS — JORNADA EXAUSTIVA DE CAPTAÇÃO, DOCUMENTAÇÃO, APROVAÇÃO, AGENDA, VISITA E CHECK-IN

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**VÍNCULO:** complemento obrigatório e de alta prioridade do Superprompt Mestre Enjoy V3  
**TENANT:** Enjoy Imóveis  
**AGENTE:** Lopito  
**NÃO EXECUTAR AGORA.**

---

# 1. PRINCÍPIO

Esta camada deve eliminar idas e vindas desnecessárias entre proprietário, lead, corretor, gestão, jurídico e cartório.

A experiência ideal é:

**CADASTRAR UMA VEZ → LOPITO ENTENDE → DOCUMENTOS SÃO GUIADOS → PENDÊNCIAS SÃO DETECTADAS → COMITÊ RECEBE DOSSIÊ → GESTÃO É COBRADA → APROVAÇÃO LIBERA PRÓXIMA ETAPA → AGENDA REAL É OFERECIDA → VISITA É CONFIRMADA → CHECK-IN É REGISTRADO → PÓS-VISITA ACONTECE AUTOMATICAMENTE → CRM SEGUE A JORNADA.**

---

# 2. PRÉ-CADASTRO DO IMÓVEL

Área do proprietário deve permitir cadastro assistido de:

- endereço completo;
- CEP;
- tipo do imóvel;
- finalidade: venda/locação;
- matrícula/registro quando conhecido;
- inscrição municipal/IPTU;
- área útil;
- área total;
- quartos;
- suítes;
- banheiros;
- vagas;
- andar;
- elevador;
- estado de conservação;
- ocupação atual;
- condomínio;
- IPTU;
- preço pretendido;
- disponibilidade para visita;
- restrições de visita;
- fotos;
- vídeos;
- planta;
- diferenciais;
- observações livres.

Lopito deve orientar e detectar campos críticos ausentes em tempo real.

---

# 3. QUALIFICAÇÃO DO PROPRIETÁRIO

Antes de pedir documentos, Lopito deve entender o perfil jurídico/cadastral do titular.

Perguntas adaptativas:

- pessoa física ou jurídica?;
- o imóvel está em nome de quem?;
- há mais de um proprietário?;
- existe coproprietário?;
- é herança/inventário?;
- existe usufruto?;
- existe procuração?;
- proprietário é casado?;
- solteiro?;
- divorciado?;
- separado?;
- viúvo?;
- união estável?;
- qual regime de bens?;
- houve divórcio/separação?;
- a alteração está averbada?;
- houve partilha?;
- o imóvel foi adquirido antes ou depois do casamento?;
- existe financiamento/alienação fiduciária?;
- existe ônus conhecido?;
- existe ação judicial conhecida relacionada ao imóvel?;

Essas respostas definem o checklist documental subsequente.

---

# 4. REGRA JURÍDICA DE SEGURANÇA

Lopito faz **triagem, organização, extração e sinalização**.

Nunca deve emitir parecer jurídico definitivo, afirmar que um imóvel está livre e desembaraçado, declarar que uma venda pode ser concluída sem revisão humana, ou substituir advogado, tabelião, registrador ou profissional habilitado.

---

# 5. DOCUMENTOS PESSOA FÍSICA

Checklist parametrizável, conforme caso:

- documento de identidade;
- CPF;
- comprovante de endereço;
- certidão de nascimento se solteiro;
- certidão de casamento;
- certidão de casamento com averbação de separação/divórcio quando aplicável;
- sentença/carta de sentença/formal de partilha quando necessário;
- escritura/declaração de união estável quando aplicável;
- pacto antenupcial quando relevante;
- documentos do cônjuge/companheiro quando exigidos;
- procuração quando houver representante.

O CRECI-RJ informa, por exemplo, que para qualificação de vendedores/compradores em escritura são usados RG/CPF, inclusive de cônjuges, certidões de nascimento/casamento e certidão com averbação de separação/divórcio quando aplicável. O sistema deve tratar isso como referência e permitir atualização jurídica posterior.

---

# 6. DOCUMENTOS PESSOA JURÍDICA

Quando o proprietário for PJ:

- CNPJ;
- contrato/estatuto social;
- alterações contratuais;
- ata quando pertinente;
- documentos dos representantes;
- prova de poderes para alienar/locar;
- procurações;
- certidões configuradas pelo jurídico.

---

# 7. DOCUMENTOS DO IMÓVEL

Checklist base parametrizável:

- matrícula atualizada;
- certidão de inteiro teor quando aplicável;
- certidão de ônus reais quando exigida;
- IPTU;
- certidão de situação fiscal municipal quando pertinente;
- planta;
- habite-se quando aplicável;
- convenção/declaração condominial quando necessária;
- declaração de quitação condominial quando pertinente;
- documentos de financiamento/alienação fiduciária;
- documentos de inventário/partilha;
- procuração;
- demais certidões definidas pelo jurídico.

Não tratar esta lista como exaustiva universal.

---

# 8. DOCUMENTOS EM CASO DE DIVÓRCIO/SEPARAÇÃO

Se houver divórcio/separação:

Lopito pergunta:

- existe certidão de casamento já averbada?;
- existe sentença/carta de sentença?;
- houve partilha?;
- o imóvel fez parte da partilha?;
- a partilha foi registrada/averbada na matrícula?;
- há coproprietário remanescente?;

Se houver inconsistência aparente entre estado civil e titularidade, sinalizar para jurídico/comitê.

---

# 9. REGIME DE BENS

Registrar o regime informado:

- comunhão parcial;
- comunhão universal;
- separação convencional;
- separação obrigatória;
- participação final nos aquestos;
- outro/regime histórico.

O sistema não deve inferir automaticamente necessidade de anuência ou efeito jurídico sem regra validada pelo jurídico.

---

# 10. UNIÃO ESTÁVEL

Perguntar se existe união estável, documento formal e regime declarado.

Encaminhar casos relevantes ao jurídico.

---

# 11. INVENTÁRIO / HERANÇA

Se imóvel decorre de herança:

- inventário concluído?;
- formal de partilha/carta de adjudicação disponível?;
- registro já atualizado na matrícula?;
- existem múltiplos herdeiros?;
- existe inventariante?;
- há autorização judicial necessária segundo revisão jurídica?

Nunca permitir publicação/transação como se titularidade estivesse regular sem revisão adequada.

---

# 12. PROCURAÇÃO

Se representante atuar:

- upload da procuração;
- validade;
- poderes aparentes;
- identificação do outorgante/outorgado;
- data;
- necessidade de conferência humana.

---

# 13. FINANCIAMENTO / ALIENAÇÃO FIDUCIÁRIA

Perguntar se imóvel está financiado.

Se sim:

- instituição;
- saldo devedor quando disponível;
- contrato/documento;
- condição para quitação;
- necessidade de fluxo específico.

Lopito apenas organiza; jurídico/financeiro valida procedimento.

---

# 14. MATRÍCULA / RGI — EXTRAÇÃO ASSISTIDA

Lopito pode identificar visualmente/textualmente:

- número da matrícula;
- cartório;
- descrição do imóvel;
- área;
- titularidade aparente;
- registros/averbações;
- ônus aparentes;
- divergências de endereço/área;
- necessidade de revisão.

Nunca declarar situação registral definitiva.

---

# 15. IPTU — EXTRAÇÃO ASSISTIDA

Extrair quando legível:

- inscrição;
- endereço;
- exercício;
- área;
- valor;
- contribuinte indicado;
- divergências aparentes.

---

# 16. QUALIDADE DO ARQUIVO

Detectar:

- ilegível;
- cortado;
- foto ruim;
- página faltante;
- documento vencido quando houver data configurada;
- duplicado;
- arquivo incompatível.

Pedir reenvio específico.

---

# 17. CHECKLIST DINÂMICO

O checklist muda conforme respostas.

Exemplo:

`Divorciado + imóvel adquirido durante casamento + matrícula ainda em nome do casal` → adicionar itens jurídicos específicos para revisão.

Nunca usar checklist único para todos.

---

# 18. SCORE DE COMPLETUDE

Calcular por requisito real:

- cadastro;
- documentação pessoal;
- documentação do imóvel;
- mídia;
- jurídico;
- visita/captação.

Mostrar o que falta, não apenas percentual.

---

# 19. DOSSIÊ DO LOPITO

Gerar resumo para comitê:

- proprietário;
- estado civil/regime declarado;
- coproprietários;
- finalidade;
- imóvel;
- preço;
- características;
- matrícula;
- IPTU;
- documentos recebidos;
- documentos faltantes;
- divergências aparentes;
- risco/atenção sem conclusão jurídica;
- recomendação de próxima etapa.

---

# 20. COMITÊ MULTIDISCIPLINAR

Fila parametrizada por caso:

- gestão;
- captação;
- jurídico;
- financeiro;
- Luxury;
- coordenação comercial.

---

# 21. SLA DO COMITÊ

A gestão também deve ser cobrada.

Configurar:

- prazo para abrir;
- prazo para decidir;
- lembrete preventivo;
- escalonamento;
- substituto;
- resumo diário.

---

# 22. ESTADOS DA APROVAÇÃO

- não lido;
- lido;
- em análise;
- aguardando proprietário;
- aguardando jurídico;
- aguardando documento;
- aprovado;
- aprovado com condição;
- rejeitado;
- pronto para publicação.

---

# 23. COBRANÇA DA GESTÃO

N8N deve dizer exatamente:

`Há 5 imóveis aguardando aprovação. 2 estão há mais de 24h sem leitura.`

Ou:

`Você abriu o dossiê do imóvel X, mas ainda não registrou decisão.`

---

# 24. APROVAÇÃO EM UM CLIQUE

Ações:

- aprovar;
- aprovar com condição;
- pedir documento;
- pedir correção;
- encaminhar jurídico;
- rejeitar;
- atribuir responsável.

Tudo auditado.

---

# 25. AUTORIZAÇÃO DE INTERMEDIAÇÃO

O sistema deve suportar contrato escrito de intermediação/autorização, com dados e cláusulas parametrizadas pelo jurídico. O CRECI-RJ informa que a intermediação imobiliária deve ser contratada por instrumento escrito e publica requisitos como qualificação das partes, individualização do imóvel, preço/condições, dados do título, exclusividade, remuneração e prazo. O jurídico da Enjoy deve validar o template oficial antes de produção.

---

# 26. CONTRATO ELETRÔNICO

Fluxo:

**template jurídico aprovado → preenchimento automático → revisão → assinatura eletrônica homologada → audit trail → armazenamento → acesso das partes.**

---

# 27. PENDÊNCIA ESPECÍFICA AO PROPRIETÁRIO

Nunca mandar “faltam documentos”.

Mandar:

`Para concluir a análise do imóvel, falta a certidão de casamento com averbação do divórcio e a matrícula atualizada.`

---

# 28. REPROCESSAMENTO

Documento novo → Lopito reanalisa → checklist atualiza → comitê recebe somente mudança relevante.

---

# 29. CADASTRO MASTER SEM DUPLICAÇÃO

Pré-cadastro aprovado vira master record.

Não recadastrar imóvel em outro módulo.

---

# 30. AGENDA DOS CORRETORES

Cada corretor possui:

- disponibilidade;
- bloqueios;
- visitas;
- reuniões;
- férias;
- área de atuação;
- unidade;
- especialidade;
- tempo mínimo entre compromissos.

---

# 31. REGRAS DE SLOT

Parametrizar:

- duração da visita;
- buffer antes/depois;
- antecedência mínima;
- janela futura;
- limite diário;
- dias/horários;
- feriados;
- regras do imóvel;
- regras do condomínio;
- regras do proprietário;
- Luxury.

---

# 32. DISPONIBILIDADE COMPOSTA

Um slot só existe se compatível com:

**CORRETOR + IMÓVEL + PROPRIETÁRIO/OCUPANTE + CONDOMÍNIO + REGRAS DA IMOBILIÁRIA + DESLOCAMENTO.**

---

# 33. AGENDAMENTO PELO LEAD

Lead escolhe somente horários reais.

Fluxo:

**imóvel → disponibilidade → slot → confirmação → calendário do corretor → CRM → N8N.**

---

# 34. AGENDAMENTO CONVERSACIONAL PELO LOPITO

Lead:

`Quero visitar sábado à tarde.`

Lopito consulta slots e oferece opções reais.

---

# 35. CONFIRMAÇÃO DO PROPRIETÁRIO/OCUPANTE

Quando exigido:

N8N solicita confirmação antes de tornar o slot definitivo.

Estado:

- solicitado;
- confirmado;
- recusado;
- expirado.

---

# 36. CONFIRMAÇÃO DO CORRETOR

Corretor recebe compromisso automaticamente e, conforme regra, deve confirmar.

---

# 37. LEMBRETES PRÉ-VISITA

Todos parametrizáveis:

- D-1;
- H-2;
- H-1;
- H-0:30;
- outro.

Não hard-code 2h ou 30min.

---

# 38. GEOLOCALIZAÇÃO OPCIONAL

Quando tecnicamente útil, legalmente permitido e consentido, o app pode usar geolocalização para facilitar check-in.

Nunca monitorar continuamente sem necessidade.

Alternativas sempre disponíveis:

- botão manual;
- QR;
- confirmação pelo corretor;
- confirmação pelo cliente.

---

# 39. PERGUNTA DE PRESENÇA AO CORRETOR

Exemplo configurável:

30 minutos após o horário previsto:

`Você já está no imóvel para a visita das 15h?`

Ações:

- Sim, iniciar visita;
- Estou a caminho;
- Cliente não chegou;
- Visita cancelada;
- Reagendar.

---

# 40. CHECK-IN

Se corretor confirmar `Sim`:

- registrar timestamp;
- registrar método;
- registrar geolocalização somente se consentida;
- mudar visita para `EM ANDAMENTO`;
- iniciar nova jornada.

---

# 41. CHECK-IN DO CLIENTE

Opcional:

- QR;
- link;
- app;
- confirmação do corretor.

---

# 42. ESTADOS DA VISITA

- agendada;
- pendente confirmação;
- confirmada;
- corretor a caminho;
- cliente a caminho;
- check-in corretor;
- check-in cliente;
- em andamento;
- concluída;
- no-show cliente;
- no-show corretor;
- cancelada;
- reagendada.

---

# 43. VISITA NÃO INICIADA

Se horário passou e ninguém confirmou:

- perguntar corretor;
- depois perguntar cliente quando apropriado;
- registrar motivo;
- escalar se necessário.

---

# 44. NO-SHOW

Regras específicas:

- registrar quem faltou;
- oferecer reagendamento;
- atualizar score/jornada;
- evitar penalização automática sem política aprovada.

---

# 45. CONCLUSÃO DA VISITA

Após duração prevista ou confirmação manual:

perguntar ao corretor:

`A visita foi concluída?`

---

# 46. PÓS-VISITA DO CORRETOR

Delay parametrizável, por exemplo 2 horas após conclusão.

Perguntar:

- houve visita?;
- interesse percebido?;
- objeção principal?;
- pediu proposta?;
- quer outros imóveis?;
- próxima ação?;
- observações.

---

# 47. COBRANÇA DO FEEDBACK DO CORRETOR

Se não responder:

- lembrete 1;
- lembrete 2;
- escalonamento;
- tarefa vencida.

Tudo parametrizável.

---

# 48. PÓS-VISITA DO CLIENTE

Após delay configurado:

- gostou?;
- preço?;
- tamanho?;
- localização?;
- condomínio?;
- conservação?;
- quer proposta?;
- quer ver similares?;

---

# 49. ATUALIZAÇÃO AUTOMÁTICA DO BRIEFING

Feedback do cliente e corretor alimenta hard/soft preferences e objeções.

---

# 50. PRÓXIMA AÇÃO AUTOMÁTICA

Se:

- alta intenção → proposta;
- baixa intenção por tamanho → novo matching;
- baixa intenção por preço → imóveis mais baratos;
- gostou mas precisa financiamento → jornada financeira;
- indeciso → nurturing;
- no-show → reagendamento.

---

# 51. ROTEIRO DE VISITAS

Se lead visitar múltiplos imóveis:

- agrupar por região;
- respeitar buffers;
- evitar sobreposição;
- considerar trânsito apenas com fonte adequada;
- produzir roteiro.

---

# 52. CONFLITO DE AGENDA

Nunca permitir double booking.

Lock transacional de slot.

---

# 53. EXPIRAÇÃO DE SLOT

Ao selecionar horário, reservar temporariamente por tempo configurável durante confirmação.

---

# 54. REAGENDAMENTO

Atualizar automaticamente:

- corretor;
- proprietário;
- cliente;
- CRM;
- N8N;
- calendário.

Cancelar lembretes antigos.

---

# 55. CANCELAMENTO

Registrar:

- quem cancelou;
- motivo;
- antecedência;
- próxima ação.

---

# 56. AUDITORIA DA VISITA

Guardar:

- criação;
- alterações;
- confirmações;
- lembretes;
- check-in;
- check-out/conclusão;
- feedback;
- reagendamento;
- cancelamento.

---

# 57. PRIVACIDADE DE GEOLOCALIZAÇÃO

Geolocalização deve ser:

- consentida;
- mínima;
- restrita ao evento;
- protegida;
- retida pelo menor prazo necessário;
- nunca usada para vigilância permanente do corretor.

---

# 58. REGRA DE COMUNICAÇÃO

Todos os timers são parametrizáveis.

Nenhuma jornada deve depender de valores fixos impostos pelo código.

---

# 59. MOTOR DE REGRAS

A gestão configura exemplos como:

`30 min após horário sem check-in → perguntar ao corretor.`

`2h após visita concluída sem feedback → lembrar corretor.`

`24h após visita sem próxima ação → escalar gerente.`

---

# 60. TEMPLATES DE VISITA

Pré-definidos:

- visita agendada;
- confirmação;
- lembrete;
- corretor a caminho;
- cliente a caminho;
- check-in;
- no-show;
- reagendamento;
- pós-visita;
- pesquisa;
- proposta.

---

# 61. CONTRATO / REGRAS EXPOSTAS PELO LOPITO

Lopito deve conseguir explicar, em linguagem simples e com base em conteúdo jurídico previamente aprovado:

- etapas da captação;
- quais documentos faltam;
- por que são solicitados;
- diferença entre matrícula, escritura e registro;
- o que significa averbação;
- por que estado civil/regime de bens pode exigir documentos adicionais;
- como funciona autorização de intermediação;
- etapas de proposta/contrato;
- quando haverá revisão jurídica.

Não improvisar interpretação legal.

---

# 62. BASE JURÍDICA VERSIONADA

Conteúdos jurídicos usados pelo Lopito devem registrar:

- fonte;
- data;
- versão;
- aprovador jurídico;
- validade/revisão.

---

# 63. REFERÊNCIAS DE IMPLEMENTAÇÃO

Na implementação, usar como referências verificáveis, entre outras:

- CRECI-RJ — autorização de venda;
- CRECI-RJ — contrato de corretagem;
- CRECI-RJ — escritura de compra e venda;
- legislação aplicável;
- regras do cartório/registro competente;
- jurídico da Enjoy.

A aplicação deve ser atualizável porque requisitos podem variar conforme negócio e situação jurídica.

---

# 64. CONTRATO DE INTERMEDIAÇÃO

Template deve suportar campos como:

- qualificação das partes;
- identificação do imóvel;
- preço/condições;
- título declarado;
- exclusividade;
- remuneração;
- prazo;
- autorização para sinal quando aplicável;
- cláusulas aprovadas pelo jurídico.

---

# 65. ASSINATURA ELETRÔNICA

Assinaturas:

- provider homologado;
- identidade;
- timestamp;
- evidências;
- integridade;
- acesso posterior.

---

# 66. PREVENÇÃO DE IDAS E VINDAS

Antes de enviar ao comitê, Lopito deve perguntar tudo que seja razoavelmente previsível pelo contexto.

Objetivo: evitar ciclos de:

`falta documento → cliente envia → falta outro → cliente envia → falta outro`.

Preferir checklist completo e contextual desde o início.

---

# 67. EXPERIÊNCIA DO PROPRIETÁRIO

Mostrar sempre:

- etapa atual;
- o que já foi concluído;
- o que falta;
- por que falta;
- quem está analisando;
- prazo estimado/configurado;
- próxima ação.

---

# 68. EXPERIÊNCIA DO CORRETOR

Corretor recebe tudo pronto:

- imóvel aprovado;
- documentos relevantes permitidos;
- restrições;
- agenda;
- lead;
- briefing;
- roteiro;
- CTA.

---

# 69. EXPERIÊNCIA DA GESTÃO

Gestão vê:

- imóveis aguardando análise;
- imóveis pendentes;
- SLAs;
- documentos problemáticos;
- visitas;
- no-shows;
- feedbacks faltantes;
- conversão por corretor;
- gargalos.

---

# 70. BI DA CAPTAÇÃO E VISITAS

KPIs:

- pré-cadastros iniciados;
- concluídos;
- abandonados;
- tempo até documentação completa;
- tempo até aprovação;
- pendências mais comuns;
- imóveis aprovados;
- rejeitados;
- agenda oferecida;
- visitas agendadas;
- confirmadas;
- realizadas;
- no-show;
- visita→proposta;
- corretor com feedback no prazo;
- tempo médio até próxima ação.

---

# 71. E2E — CAPTAÇÃO DOCUMENTAL

**proprietário cadastra → estado civil/regime → checklist dinâmico → upload → Lopito analisa → pendência específica → reenvio → dossiê → comitê.**

---

# 72. E2E — APROVAÇÃO

**dossiê → gestão não lê → lembrete → gestão lê sem decidir → nova cobrança → decisão → próxima etapa.**

---

# 73. E2E — AGENDA

**lead → imóvel → slots reais → reserva → confirmação → calendário → CRM.**

---

# 74. E2E — CHECK-IN

**horário aproxima → lembrete → 30min após horário configurado sem status → pergunta corretor → confirma presença → check-in → visita em andamento.**

---

# 75. E2E — PÓS-VISITA

**visita concluída → delay configurado → corretor recebe formulário rápido → cliente recebe pesquisa → briefing atualiza → próxima ação.**

---

# 76. E2E — REAGENDAMENTO

**corretor/cliente muda horário → slot antigo liberado → lembretes antigos cancelados → novo slot → todas as partes atualizadas.**

---

# 77. E2E — DOCUMENTO COM DIVERGÊNCIA

**matrícula e cadastro divergem → Lopito sinaliza → não conclui juridicamente → envia ao comitê/jurídico → decisão humana registrada.**

---

# 78. CRITÉRIO DE ACEITE

PASS somente quando:

- checklist documental é dinâmico;
- estado civil/regime influencia perguntas;
- uploads são seguros;
- Lopito resume sem emitir parecer;
- comitê recebe dossiê;
- gestão é cobrada automaticamente;
- aprovação libera próxima etapa;
- agenda usa disponibilidade real;
- não há double booking;
- check-in funciona;
- geolocalização é opcional/consentida;
- timers são parametrizáveis;
- pós-visita funciona;
- briefing aprende;
- auditoria funciona;
- nenhum dado jurídico fictício é tratado como definitivo.

---

# 79. REGRA FINAL AO CAUÃ

A jornada imobiliária deve parecer simples para o usuário porque toda a complexidade está organizada por trás.

**PROPRIETÁRIO NÃO DEVE DESCOBRIR DOCUMENTOS AOS POUCOS.**

**CORRETOR NÃO DEVE LEMBRAR SOZINHO DA VISITA OU DO FOLLOW-UP.**

**GESTÃO NÃO DEVE ESQUECER IMÓVEL AGUARDANDO APROVAÇÃO.**

**LEAD NÃO DEVE RECEBER HORÁRIO IMPOSSÍVEL.**

**LOPITO NÃO DEVE DAR PARECER JURÍDICO, MAS DEVE ORGANIZAR O CASO DE FORMA TÃO COMPLETA QUE O JURÍDICO RECEBA UM DOSSIÊ PRONTO PARA DECIDIR.**

A excelência está em transformar complexidade registral, documental, logística e comercial em uma experiência guiada, rápida e previsível.

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.**