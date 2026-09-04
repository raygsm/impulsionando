# INTAKE VIVO — CHRISMED — AGENDA, PROFISSIONAIS, PEGAAGENDA E EVENTOS

**Projeto/cliente:** CHRISMED
**Destinatários:** Cauã / K1 / equipe de desenvolvimento
**Natureza:** Intake vivo, único e consolidado. Novas definições desta frente devem atualizar este mesmo documento, substituindo regras anteriores quando houver conflito e evitando documentos concorrentes.
**Execução:** este documento orienta análise e implementação posterior; não alterar código automaticamente sem priorização expressa.

---

## 1. VISÃO EXECUTIVA

A CHRISMED deve ser entendida como uma operação integrada de saúde e relacionamento profissional sustentada por dois módulos centrais do Core Impulsionando:

1. **Agenda/Agendamento**, para pacientes e profissionais de saúde, incluindo teleconsulta, presencial, domiciliar, remarcação, cancelamento, carteira, financeiro e PegaAgenda.
2. **Eventos**, para laboratórios, empresas, sociedades médicas e outros contratantes, incluindo captação, segmentação, convite, aceite, aprovação, QR Code, check-in, no-show, relatórios e BI.

Esses dois módulos compartilham a mesma identidade profissional, mesmas taxonomias, mesmo CRM, mesma camada de comunicação, mesmo ledger/financeiro, mesma auditoria e o agente **Oliver** como instância especializada da CHRISMED.

**Não criar sistemas paralelos. Não duplicar cadastro, agenda, CRM, profissionais ou eventos.** Tudo deve usar Core único e regras por tenant.

---

## 2. ATORES E PERMISSÕES

### 2.1 Gestão CHRISMED

Pode:
- aprovar/reprovar profissionais;
- cadastrar/importar profissionais;
- criar e administrar eventos;
- configurar planos, preços, regras e comunicações;
- acompanhar agenda, PegaAgenda, financeiro, carteiras, check-ins e BI;
- cadastrar contratantes e participantes de gestão;
- intervir operacionalmente quando necessário.

### 2.2 Profissional de saúde

Pode:
- manter cadastro profissional;
- selecionar especialidades/subespecialidades;
- selecionar modalidades de atendimento;
- abrir e fechar agenda;
- definir duração e preço por serviço/modalidade;
- cadastrar consultórios/endereço;
- definir raio de atendimento domiciliar e raio de convites de eventos;
- remarcar compromissos dentro das regras;
- participar do PegaAgenda;
- aceitar convites de eventos;
- solicitar participação orgânica em eventos públicos;
- acompanhar carteira, repasses, multas, bônus e histórico.

### 2.3 Paciente

Pode:
- pesquisar/agendar atendimento;
- escolher modalidade;
- pagar pela CHRISMED;
- remarcar diretamente na agenda;
- cancelar dentro das regras;
- receber links, instruções, rotas e comunicações;
- acompanhar consultas e histórico permitido.

### 2.4 Contratante de evento

Ex.: laboratório, indústria, empresa ou sociedade médica.

Pode acompanhar somente seus próprios eventos e relatórios autorizados.

### 2.5 Participante de gestão do evento

Ex.: propagandista, vendedor, consultor ou gestor do laboratório.

Pode acompanhar o evento e executar check-in conforme permissão. Não tem acesso ao restante da CHRISMED.

---

## 3. CADASTRO ÚNICO DE PROFISSIONAIS DE SAÚDE

A base de profissionais deve crescer continuamente e ser tratada como ativo estratégico da CHRISMED.

Entradas possíveis:
- cadastro orgânico pelo site;
- convite da CHRISMED;
- cadastro manual;
- importação por planilha;
- origem por campanhas/eventos.

### 3.1 Aprovação

Profissional novo que se cadastra organicamente **não entra automaticamente**. O cadastro vai ao Comitê de Gestão CHRISMED.

Após aprovação:
- recebe boas-vindas;
- entra no CRM/base oficial;
- acessa agenda;
- configura modalidades, preços, duração, endereços e disponibilidade;
- passa a receber convites compatíveis;
- pode participar de eventos e do PegaAgenda.

### 3.2 Dados obrigatórios

Cadastro deve contemplar, no mínimo:
- nome completo;
- CPF obrigatório;
- e-mail;
- celular/WhatsApp;
- endereço completo;
- CEP;
- profissão;
- conselho profissional aplicável;
- número/UF do conselho quando aplicável;
- especialidades;
- subespecialidades;
- áreas/nichos de atendimento;
- idiomas;
- modalidades de atendimento;
- raio geográfico para eventos;
- raio/perímetro domiciliar quando aplicável.

### 3.3 Taxonomias

Profissão, conselho, especialidade, subespecialidade, área de atuação e modalidade devem ser **listas estruturadas**, não campos livres.

O profissional pode selecionar múltiplas especialidades/subespecialidades quando fizer sentido.

CPF deve ser validado tecnicamente; eventual confirmação cadastral externa deve usar fonte/serviço autorizado. Não tratar simples validação matemática como consulta oficial à Receita Federal.

---

# PARTE A — AGENDA E AGENDAMENTO

## 4. MODALIDADES DE ATENDIMENTO

Todo profissional aprovado pode habilitar uma ou mais modalidades:
- **Teleconsulta**;
- **Consulta presencial**;
- **Consulta domiciliar**.

A seleção é do próprio profissional. Cada modalidade pode ter agenda, duração, preço e regras específicas, mas todas ocupam **uma única agenda operacional compartilhada**.

---

## 5. TELECONSULTA

Teleconsulta deve estar disponível para todo profissional aprovado que optar por oferecê-la.

A experiência deve acontecer **dentro da CHRISMED**, preferencialmente com player próprio. Pode utilizar tecnologia de terceiro embutida, desde que o paciente e o profissional não precisem abandonar a plataforma.

### 5.1 Duração

A grade-base é de 15 minutos, mas o profissional escolhe a duração real do serviço, por exemplo 15, 30, 45 ou 60 minutos.

Pode haver duração diferente por tipo de consulta, exame, especialidade ou serviço.

### 5.2 Preço

O profissional escolhe o próprio preço.

Oliver exibe **média/faixa sugerida** como referência de mercado, sem impor preço final.

---

## 6. CONSULTA PRESENCIAL

Ao habilitar presencial, o profissional deve cadastrar um ou mais locais de atendimento com:
- nome do local;
- endereço completo;
- bairro;
- cidade/UF;
- CEP;
- complemento;
- coordenadas geográficas.

### 6.1 Rotas e conveniência

Na confirmação, Oliver deve disponibilizar links de rota com destino pronto para:
- Google Maps;
- Waze.

Paciente pode usar localização atual ou informar origem/CEP.

Esses links devem aparecer na plataforma e nas comunicações transacionais por e-mail e WhatsApp.

---

## 7. CONSULTA DOMICILIAR

O profissional define:
- dias/horários;
- preço;
- raio/perímetro de atendimento;
- áreas/CEPs/bairros quando necessário;
- duração clínica estimada.

### 7.1 Regra logística

A comunicação ao paciente pode indicar aproximadamente **1 hora de atendimento clínico**, mas a agenda deve reservar **2 horas operacionais** para considerar deslocamento e margem logística.

Esse período completo bloqueia a agenda para evitar conflito com outros atendimentos.

---

## 8. UMA ÚNICA AGENDA COMPARTILHADA

Teleconsulta, presencial e domiciliar não podem gerar conflito entre si.

Exemplo válido:
- 08:00 teleconsulta;
- 08:30 presencial;
- 10:00 domiciliar, desde que respeitado o bloco logístico.

Qualquer reserva bloqueia o mesmo intervalo para todas as modalidades.

O sistema deve impedir sequências fisicamente impossíveis, especialmente quando houver deslocamento entre locais.

---

## 9. REMARCAÇÃO

**Remarcar não é cancelar.**

Paciente e profissional devem poder mover o compromisso diretamente na agenda, inclusive por interação visual de arrastar/mover horário, desde que exista slot compatível.

Podem remarcar inclusive no próprio dia, conforme disponibilidade operacional.

Ao remarcar, o sistema deve:
- explicar direitos e deveres;
- pedir confirmação;
- atualizar todas as agendas;
- preservar o vínculo financeiro quando aplicável;
- disparar e-mail/WhatsApp;
- registrar trilha de auditoria;
- impedir sobreposição.

A CHRISMED deve incentivar remarcação para reduzir cancelamentos e retrabalho operacional.

---

## 10. CANCELAMENTO DO PACIENTE

Fluxo distinto de remarcação.

Regra vigente:
- até 24h antes: pode cancelar sem penalidade e com devolução conforme política financeira;
- com menos de 24h: não há reembolso; o fluxo deve priorizar remarcação.

A interface precisa mostrar a consequência antes da confirmação do cancelamento.

---

## 11. CANCELAMENTO PELO PROFISSIONAL

Profissional pode remarcar dentro do fluxo de remarcação. Se decidir **cancelar**, aplica-se fluxo específico.

### 11.1 Mais de 24h antes

- sem multa;
- PegaAgenda dispara automaticamente;
- profissionais compatíveis recebem oportunidade sem bônus extra;
- se ninguém assumir, paciente é informado e conduzido para remarcação.

### 11.2 Com 24h ou menos

Penalidade: **10% do valor bruto da consulta**, lançada como débito na carteira do profissional que cancelou.

Distribuição:
- **5% do valor bruto**: bônus para o profissional substituto que assumir o PegaAgenda urgente;
- **5% do valor bruto**: fundo de recuperação do paciente prejudicado.

### 11.3 Fundo de recuperação

Esse segundo 5% **não é receita da CHRISMED**.

Deve ficar contabilizado separadamente para:
- cupom de desconto;
- pedido de desculpas;
- remarketing/reconquista;
- benefício futuro ao paciente impactado.

Exemplo em consulta de R$100:
- multa do profissional: R$10;
- R$5 ao substituto;
- R$5 para recuperação do paciente.

---

## 12. PEGAAGENDA

Todo cancelamento de profissional confirmado deve disparar PegaAgenda automaticamente.

Matching deve considerar:
- profissão;
- especialidade;
- subespecialidade;
- modalidade;
- disponibilidade;
- endereço;
- raio/perímetro;
- idioma;
- demais requisitos do paciente.

### 12.1 Mais de 24h

Oportunidade sem bônus extra.

### 12.2 24h ou menos

Profissional que assumir recebe bônus de 5% do valor bruto da consulta.

### 12.3 Sem substituto

Paciente deve ser informado rapidamente e conduzido a remarcar. Nunca ficar sem atualização.

Oliver acompanha o fluxo inteiro.

---

## 13. PREÇO, SPLIT, CARTEIRA E REPASSE

Regra econômica vigente:
- **60% do valor bruto para o profissional de saúde**;
- **40% para a CHRISMED**.

A interface deve explicar que a CHRISMED suporta tributação na faixa informada atualmente de aproximadamente 16% sobre sua parcela, além dos custos de operação e gestão. Esse percentual tributário deve ser parametrizável/versionado.

A CHRISMED cobra sempre o paciente.

### 13.1 Carteira

Profissional e financeiro CHRISMED devem visualizar:
- saldo futuro;
- saldo disponível;
- créditos;
- débitos;
- multas;
- bônus;
- data prevista de repasse;
- relógio regressivo;
- histórico auditável por atendimento.

### 13.2 Repasse

Regra consolidada neste Intake:
- PIX: D37;
- cartão: D37;
- considerar janela operacional de 7 dias conforme política financeira correspondente.

Se houver futura alteração, deve substituir esta regra neste mesmo documento.

---

# PARTE B — EVENTOS CHRISMED

## 14. OBJETIVO DO MÓDULO EVENTOS

Eventos é vertical estratégica de receita, relacionamento e crescimento da base profissional.

Resolve dificuldade de laboratórios, empresas e sociedades médicas em:
- localizar profissionais adequados;
- convidar;
- confirmar;
- reduzir no-show;
- ocupar vagas limitadas;
- realizar check-in;
- acompanhar resultado em tempo real.

A CHRISMED agrega a rede, a autoridade da Dra. Christiane e a capacidade de segmentação e relacionamento.

---

## 15. PLANOS DE EVENTOS

Existem três planos previstos.

Regra hoje confirmada para o plano mínimo:
- **mínimo de 20 profissionais**;
- **R$49,90 por profissional**;
- contratação mínima de **R$998,00**.

Os dois demais planos permanecem parametrizáveis e não devem ser inventados até definição expressa.

---

## 16. CRIAÇÃO DO EVENTO

Gestão CHRISMED deve criar evento pelo dashboard com:
- contratante;
- nome/título;
- imagem/capa;
- descrição;
- data;
- horário;
- endereço/local;
- capacidade;
- especialidades/subespecialidades-alvo;
- profissão/área-alvo;
- raio geográfico;
- critérios de elegibilidade;
- participantes de gestão autorizados;
- regras do evento;
- status/publicação.

---

## 17. CONTRATANTE E PARTICIPANTES DE GESTÃO

### 17.1 Contratante

Pode ser laboratório, indústria, empresa, sociedade médica ou outra organização autorizada.

### 17.2 Participantes de gestão

São representantes do contratante, diferentes dos convidados.

Ex.: propagandistas, vendedores, consultores, gestores.

Dados mínimos:
- nome;
- celular/WhatsApp;
- e-mail.

O exemplo atual prevê três participantes de gestão, mas a quantidade deve ser parametrizável por plano/evento.

---

## 18. DOIS FLUXOS DE ENTRADA NO EVENTO

### 18.1 Convite ativo CHRISMED

A CHRISMED seleciona profissionais já aprovados usando filtros.

Quando o profissional recebe convite e aceita, **a participação é confirmada imediatamente**, desde que haja vaga. Não passa novamente pelo Comitê.

### 18.2 Solicitação orgânica

Profissional acessa a página pública de Eventos CHRISMED, visualiza eventos e solicita participação.

Nesse caso:
- pode visualizar eventos públicos mesmo fora do filtro de convite;
- a participação não é automática;
- pedido vai ao Comitê de Gestão CHRISMED;
- Comitê aprova ou recusa.

Exemplo: cardiologista pode visualizar evento de gastroenterologia e pedir vaga, mas precisa de aprovação.

---

## 19. FILTROS, ESPECIALIDADE E RAIO

Profissional configura raio, em quilômetros, no qual aceita receber convites proativos.

Exemplo:
- raio do profissional: 5 km;
- evento: 6 km;
- não recebe convite direcionado.

Isso não impede que visualize o evento publicamente e solicite participação.

Matching deve considerar:
- CEP/endereço;
- raio;
- profissão;
- especialidade;
- subespecialidade;
- perfil do evento;
- situação cadastral;
- capacidade/vagas.

---

## 20. CRESCIMENTO DA BASE

CHRISMED deve poder:
- cadastrar manualmente;
- importar planilha;
- convidar leads ainda não cadastrados;
- receber cadastro orgânico.

Importação não significa aprovação automática.

Objetivo estratégico: quanto maior e mais qualificada a base, maior o valor comercial do módulo Eventos.

---

## 21. COMUNICAÇÃO

E-mail é canal nativo obrigatório.

WhatsApp atua como canal adicional quando habilitado.

Jornadas devem cobrir:
- convite;
- confirmação;
- lembrete;
- alteração de data/local;
- QR Code;
- instruções de chegada;
- pós-evento;
- pesquisa/NPS;
- comunicação de ausência/no-show quando aplicável.

---

## 22. QR CODE E CHECK-IN

Após confirmação, cada profissional recebe QR Code individual por evento.

Check-in pode ocorrer por:
1. leitura do QR Code; ou
2. busca pelo **CPF**.

Não usar telefone ou número do conselho como identificador alternativo.

QR deve ser:
- individual;
- específico daquele evento;
- não previsível;
- protegido contra reutilização indevida.

Registrar:
- data/hora;
- operador;
- método de check-in;
- status final.

---

## 23. NO-SHOW E RESPONSABILIDADE

A experiência deve deixar claro que aceitar convite ocupa vaga limitada e cria compromisso.

No-show prejudica contratante, logística e outro profissional interessado.

Registrar histórico de:
- convidado;
- aceitou;
- recusou;
- confirmou;
- compareceu;
- cancelou/desistiu;
- no-show.

Não criar punição financeira automática para no-show sem nova definição expressa.

---

## 24. DASHBOARD E BI DE EVENTOS

CHRISMED tem visão Master.

Contratante e participantes de gestão veem somente seus eventos e dados autorizados.

Indicadores em tempo real:
- capacidade total;
- vagas disponíveis;
- convidados;
- convites enviados;
- entregues;
- aceitos;
- recusados;
- solicitações orgânicas;
- aprovações pendentes;
- aprovados;
- confirmados;
- check-ins;
- no-shows;
- taxa de ocupação;
- taxa de comparecimento;
- origem dos participantes;
- especialidade/subespecialidade;
- desempenho das campanhas.

Relatórios devem ser exportáveis.

---

## 25. OLIVER COMO CAMADA INTELIGENTE

Na Agenda, Oliver deve:
- sugerir faixa de preço;
- explicar split 60/40;
- explicar modalidades;
- orientar remarcação/cancelamento;
- gerar rotas e conveniência;
- acompanhar PegaAgenda;
- sinalizar conflitos e riscos.

Nos Eventos, Oliver deve:
- ajudar a segmentar convidados;
- sugerir profissionais compatíveis;
- acompanhar vagas e confirmações;
- detectar risco de no-show;
- apoiar comunicação e BI.

Oliver não deve tomar decisões clínicas ou regulatórias fora das permissões definidas.

---

## 26. IMPACTO OPERACIONAL ESPERADO

### Para a CHRISMED

- menos atendimento manual de remarcação;
- melhor ocupação de agenda;
- redução de perda por cancelamentos;
- PegaAgenda automatizado;
- crescimento estruturado da base profissional;
- nova receita com eventos;
- maior rastreabilidade financeira e operacional;
- relacionamento mais forte com pacientes, profissionais e laboratórios.

### Para o profissional de saúde

- autonomia de agenda;
- autonomia de preço e duração;
- transparência do split;
- possibilidade de teleconsulta, presencial e domiciliar;
- novas oportunidades via PegaAgenda;
- novos convites e networking via Eventos;
- carteira e repasses claros.

### Para o paciente

- facilidade de agendamento/remarcação;
- melhor comunicação;
- teleconsulta integrada;
- rotas prontas para presencial;
- mais previsibilidade em domiciliar;
- proteção em caso de cancelamento do profissional;
- recuperação/benefício quando sofrer transtorno por cancelamento tardio.

### Para contratantes de eventos

- segmentação qualificada;
- redução de no-show;
- check-in confiável;
- acompanhamento em tempo real;
- relatórios mensuráveis.

---

## 27. CRITÉRIOS DE ACEITE PARA IMPLEMENTAÇÃO

Cauã/K1 só deve considerar esta frente funcional quando houver evidência de que:

1. existe cadastro único de profissional compartilhado por Agenda e Eventos;
2. especialidades/subespecialidades são estruturadas;
3. teleconsulta, presencial e domiciliar compartilham uma única agenda;
4. teleconsulta acontece dentro da experiência CHRISMED;
5. domiciliar bloqueia corretamente a janela operacional;
6. remarcação é distinta de cancelamento;
7. cancelamento profissional dispara PegaAgenda;
8. multa, bônus e fundo do paciente são lançados corretamente;
9. carteira/financeiro mostram saldos, datas e relógios regressivos;
10. eventos diferenciam convite automático de candidatura orgânica;
11. geofiltro e especialidade funcionam no convite;
12. QR Code e CPF funcionam como check-in;
13. contratante/gestores veem apenas o que podem ver;
14. e-mail e WhatsApp disparam as jornadas corretas;
15. dashboards/relatórios refletem dados reais;
16. todas as regras sensíveis a mudança são parametrizáveis e não hardcoded;
17. não há duplicação de cadastro, agenda, CRM ou financeiro entre módulos.

---

## 28. REGRA DE DOCUMENTAÇÃO VIVA

Este arquivo é o **único Intake vivo vigente** para CHRISMED — Agenda + Profissionais + PegaAgenda + Eventos.

Quando Raygs fornecer nova regra:
- atualizar este mesmo arquivo;
- substituir a regra anterior se houver conflito;
- preservar histórico apenas via Git;
- evitar Intakes paralelos;
- não executar código automaticamente sem instrução expressa.

**Status:** Intake oficial CHRISMED consolidado para Cauã/K1.
