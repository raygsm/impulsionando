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

A CHRISMED é uma operação **high ticket**. O objetivo não é simplesmente aceitar profissionais que possuam um número de conselho válido. O objetivo é formar uma rede de profissionais de ponta, experientes, reconhecidos, comprometidos, responsáveis e confiáveis, com capacidade real de atender pacientes e participar de eventos sem comprometer a reputação da CHRISMED.

---

## 2. ATORES E PERMISSÕES

### 2.1 Gestão/Comitê CHRISMED

Pode:
- aprovar, reprovar, colocar em pendência ou solicitar complementação de cadastro;
- validar documentos e referências;
- cadastrar/importar profissionais;
- criar e administrar eventos;
- configurar planos, preços, regras e comunicações;
- acompanhar agenda, PegaAgenda, financeiro, carteiras, check-ins e BI;
- cadastrar contratantes e participantes de gestão;
- intervir operacionalmente quando necessário;
- suspender ou reavaliar profissionais quando houver perda de requisito, inconsistência documental ou comportamento incompatível com o padrão CHRISMED.

### 2.2 Profissional de saúde

Pode:
- manter cadastro profissional;
- carregar e atualizar currículo;
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

### 3.1 Regra de aprovação

Profissional novo **não entra automaticamente** apenas porque preencheu formulário ou apresentou número de conselho.

Fluxo obrigatório:

**cadastro -> validações técnicas -> análise documental -> checagem de conselho -> análise de currículo/experiência -> referências/verificações públicas e profissionais -> Comitê CHRISMED -> aprovado / pendente / reprovado.**

Após aprovação:
- recebe boas-vindas;
- entra no CRM/base oficial;
- acessa agenda;
- configura modalidades, preços, duração, endereços e disponibilidade;
- passa a receber convites compatíveis;
- pode participar de eventos e do PegaAgenda.

### 3.2 Dados e documentos obrigatórios

Cadastro deve contemplar, no mínimo:
- nome completo;
- CPF obrigatório;
- documento oficial de identidade quando aplicável ao fluxo de KYC;
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
- raio/perímetro domiciliar quando aplicável;
- **currículo profissional obrigatório**;
- dados adicionais necessários à validação de experiência e identidade.

### 3.3 Currículo obrigatório

Todo profissional de saúde deve obrigatoriamente carregar currículo profissional durante o cadastro.

Formatos aceitos:
- PDF (`.pdf`);
- Word (`.doc`);
- Word Open XML (`.docx`).

Sem currículo válido, o cadastro não pode chegar a status **completo/apto para aprovação**.

O upload deve ter:
- validação de extensão e MIME type;
- tamanho máximo configurável;
- armazenamento privado;
- controle de acesso;
- antimalware/verificação de segurança;
- versionamento;
- data/hora do envio;
- possibilidade de substituição posterior;
- trilha de auditoria.

O currículo faz parte do dossiê do profissional e não pode ficar publicamente acessível por URL aberta.

### 3.4 Taxonomias estruturadas

Profissão, conselho, especialidade, subespecialidade, área de atuação e modalidade devem ser **listas estruturadas**, não campos livres.

O profissional pode selecionar múltiplas especialidades/subespecialidades quando fizer sentido.

---

## 4. KYC, IDENTIDADE E VALIDAÇÃO TÉCNICA

A CHRISMED precisa confirmar que o profissional **é quem diz ser** e que os dados apresentados são consistentes.

### 4.1 CPF e identidade

Implementar validações em camadas:
- validação estrutural/sintática do CPF;
- consistência de nome, data de nascimento e demais dados cadastrais quando houver fonte autorizada;
- validação de documento de identidade por mecanismo oficial/licenciado quando disponível;
- detecção de duplicidade, fraude ou inconsistência cadastral.

Quando houver consulta externa à Receita Federal ou bases oficiais, utilizar apenas integrações legalmente autorizadas/licenciadas. Não tratar uma simples validação matemática de CPF como confirmação oficial de identidade.

### 4.2 Conselho profissional

Para cada profissão regulamentada, validar:
- conselho correto;
- número de registro;
- UF/jurisdição quando aplicável;
- situação ativa/regular quando a fonte permitir;
- nome correspondente ao cadastro;
- especialidade/qualificação registrada quando disponível publicamente ou por serviço autorizado.

Exemplos incluem CRM, CRP e demais conselhos da área da saúde.

O sistema deve guardar evidência da consulta: fonte, data, resultado e operador/processo que realizou a validação.

### 4.3 Dados bancários e repasse

Se houver validação de titularidade de conta/Pix para repasses, usar provedores financeiros, PSPs, Open Finance ou instituições reguladas/autorizadas compatíveis com a legislação aplicável.

Não presumir que exista uma API pública genérica do Banco Central que valide toda identidade profissional. O requisito é **validar titularidade e consistência financeira por meios autorizados**, e não criar dependência técnica fictícia.

### 4.4 Estados de validação

Cada atributo relevante deve ter estado próprio, por exemplo:
- não informado;
- informado;
- validando;
- validado;
- inconsistente;
- expirado;
- requer revisão manual.

O Comitê deve enxergar claramente o que foi apenas declarado e o que foi efetivamente verificado.

---

## 5. QUALIFICAÇÃO, EXPERIÊNCIA E DUE DILIGENCE DO PROFISSIONAL

A CHRISMED não deve operar como diretório aberto. O Comitê precisa avaliar qualidade real.

### 5.1 Análise de experiência

O dossiê deve permitir avaliar:
- tempo de formação;
- tempo de exercício profissional;
- residência, especialização, pós-graduação, mestrado, doutorado ou títulos relevantes;
- hospitais, clínicas, universidades ou empresas onde atuou;
- experiência específica nas áreas selecionadas;
- experiência com atendimento presencial, teleconsulta e domiciliar quando aplicável;
- participação em sociedades médicas/profissionais;
- produção acadêmica, docência, pesquisa ou atuação de referência quando houver;
- histórico profissional consistente com o posicionamento high ticket da CHRISMED.

A CHRISMED poderá definir **critérios mínimos configuráveis por profissão/especialidade**, inclusive anos mínimos de experiência, sem hardcode universal.

### 5.2 Referências profissionais

Cadastro deve permitir solicitar referências quando necessário, por exemplo:
- nome da referência;
- instituição/empresa;
- cargo/relação profissional;
- e-mail/telefone profissional;
- autorização do candidato para contato quando aplicável.

O Comitê pode marcar referência como:
- não checada;
- contato solicitado;
- confirmada;
- inconclusiva;
- negativa.

### 5.3 Verificações externas e reputacionais

O Comitê pode pesquisar fontes públicas e profissionais legítimas para verificar coerência da trajetória, por exemplo:
- página institucional;
- conselho profissional;
- currículo acadêmico/profissional público;
- sociedades profissionais;
- publicações;
- instituições onde declara atuar;
- presença profissional pública compatível.

Essas verificações devem servir à confirmação de identidade, experiência e reputação profissional, respeitando LGPD e evitando coleta excessiva ou irrelevante.

### 5.4 Critérios de decisão

O Comitê deve poder registrar, de forma estruturada:
- identidade confirmada;
- conselho regular;
- currículo compatível;
- experiência mínima atendida;
- especialidades coerentes;
- referências satisfatórias;
- reputação profissional compatível;
- compromisso operacional aceito;
- risco identificado;
- parecer final.

Resultados possíveis:
- **Aprovado**;
- **Aprovado com pendência controlada**;
- **Pendente de documentos/referências**;
- **Reprovado**;
- **Suspenso para reavaliação**.

A decisão final é do Comitê CHRISMED, não de uma automação isolada.

---

## 6. PADRÃO HIGH TICKET E COMPROMISSO OPERACIONAL

A rede CHRISMED deve privilegiar profissionais:
- tecnicamente sólidos;
- experientes;
- reconhecidos ou com trajetória consistente;
- pontuais;
- responsáveis;
- comprometidos;
- com boa comunicação;
- com comportamento compatível com atendimento premium.

A adesão deve exigir aceite explícito das regras de responsabilidade.

Princípio operacional:

**uma consulta confirmada deve ser realizada.**

A CHRISMED deve tratar cancelamento de profissional como exceção, não rotina.

O profissional precisa compreender antes da ativação:
- impacto de cancelamento sobre paciente;
- regras de remarcação;
- PegaAgenda;
- penalidades financeiras por cancelamento tardio;
- impacto reputacional e possível reavaliação do cadastro em caso de recorrência.

### 6.1 Índice de confiabilidade

O sistema deve estar preparado para acompanhar indicadores internos como:
- consultas confirmadas;
- comparecimento;
- remarcações;
- cancelamentos;
- cancelamentos tardios;
- PegaAgenda acionado por sua responsabilidade;
- avaliações de pacientes;
- pontualidade;
- participação/no-show em eventos;
- incidentes operacionais.

Não é necessário expor um “score” público ao profissional/paciente sem definição futura, mas a CHRISMED deve possuir histórico para revisão periódica e governança da rede.

---

# PARTE A — AGENDA E AGENDAMENTO

## 7. MODALIDADES DE ATENDIMENTO

Todo profissional aprovado pode habilitar uma ou mais modalidades:
- **Teleconsulta**;
- **Consulta presencial**;
- **Consulta domiciliar**.

A seleção é do próprio profissional. Cada modalidade pode ter agenda, duração, preço e regras específicas, mas todas ocupam **uma única agenda operacional compartilhada**.

---

## 8. TELECONSULTA

Teleconsulta deve estar disponível para todo profissional aprovado que optar por oferecê-la.

A experiência deve acontecer **dentro da CHRISMED**, preferencialmente com player próprio. Pode utilizar tecnologia de terceiro embutida, desde que o paciente e o profissional não precisem abandonar a plataforma.

### 8.1 Duração

A grade-base é de 15 minutos, mas o profissional escolhe a duração real do serviço, por exemplo 15, 30, 45 ou 60 minutos.

Pode haver duração diferente por tipo de consulta, exame, especialidade ou serviço.

### 8.2 Preço

O profissional escolhe o próprio preço.

Oliver exibe **média/faixa sugerida** como referência de mercado, sem impor preço final.

---

## 9. CONSULTA PRESENCIAL

Ao habilitar presencial, o profissional deve cadastrar um ou mais locais de atendimento com:
- nome do local;
- endereço completo;
- bairro;
- cidade/UF;
- CEP;
- complemento;
- coordenadas geográficas.

### 9.1 Rotas e conveniência

Na confirmação, Oliver deve disponibilizar links de rota com destino pronto para:
- Google Maps;
- Waze.

Paciente pode usar localização atual ou informar origem/CEP.

Esses links devem aparecer na plataforma e nas comunicações transacionais por e-mail e WhatsApp.

---

## 10. CONSULTA DOMICILIAR

O profissional define:
- dias/horários;
- preço;
- raio/perímetro de atendimento;
- áreas/CEPs/bairros quando necessário;
- duração clínica estimada.

### 10.1 Regra logística

A comunicação ao paciente pode indicar aproximadamente **1 hora de atendimento clínico**, mas a agenda deve reservar **2 horas operacionais** para considerar deslocamento e margem logística.

Esse período completo bloqueia a agenda para evitar conflito com outros atendimentos.

---

## 11. UMA ÚNICA AGENDA COMPARTILHADA

Teleconsulta, presencial e domiciliar não podem gerar conflito entre si.

Exemplo válido:
- 08:00 teleconsulta;
- 08:30 presencial;
- 10:00 domiciliar, desde que respeitado o bloco logístico.

Qualquer reserva bloqueia o mesmo intervalo para todas as modalidades.

O sistema deve impedir sequências fisicamente impossíveis, especialmente quando houver deslocamento entre locais.

---

## 12. REMARCAÇÃO

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

## 13. CANCELAMENTO DO PACIENTE

Fluxo distinto de remarcação.

Regra vigente:
- até 24h antes: pode cancelar sem penalidade e com devolução conforme política financeira;
- com menos de 24h: não há reembolso; o fluxo deve priorizar remarcação.

A interface precisa mostrar a consequência antes da confirmação do cancelamento.

---

## 14. CANCELAMENTO PELO PROFISSIONAL

Profissional pode remarcar dentro do fluxo de remarcação. Se decidir **cancelar**, aplica-se fluxo específico.

### 14.1 Mais de 24h antes

- sem multa;
- PegaAgenda dispara automaticamente;
- profissionais compatíveis recebem oportunidade sem bônus extra;
- se ninguém assumir, paciente é informado e conduzido para remarcação.

### 14.2 Com 24h ou menos

Penalidade: **10% do valor bruto da consulta**, lançada como débito na carteira do profissional que cancelou.

Distribuição:
- **5% do valor bruto**: bônus para o profissional substituto que assumir o PegaAgenda urgente;
- **5% do valor bruto**: fundo de recuperação do paciente prejudicado.

### 14.3 Fundo de recuperação

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

## 15. PEGAAGENDA

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

### 15.1 Mais de 24h

Oportunidade sem bônus extra.

### 15.2 24h ou menos

Profissional que assumir recebe bônus de 5% do valor bruto da consulta.

### 15.3 Sem substituto

Paciente deve ser informado rapidamente e conduzido a remarcar. Nunca ficar sem atualização.

Oliver acompanha o fluxo inteiro.

---

## 16. PREÇO, SPLIT, CARTEIRA E REPASSE

Regra econômica vigente:
- **60% do valor bruto para o profissional de saúde**;
- **40% para a CHRISMED**.

A interface deve explicar que a CHRISMED suporta tributação na faixa informada atualmente de aproximadamente 16% sobre sua parcela, além dos custos de operação e gestão. Esse percentual tributário deve ser parametrizável/versionado.

A CHRISMED cobra sempre o paciente.

### 16.1 Carteira

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

### 16.2 Repasse

Regra consolidada neste Intake:
- PIX: D37;
- cartão: D37;
- considerar janela operacional de 7 dias conforme política financeira correspondente.

Se houver futura alteração, deve substituir esta regra neste mesmo documento.

---

# PARTE B — EVENTOS CHRISMED

## 17. OBJETIVO DO MÓDULO EVENTOS

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

## 18. PLANOS DE EVENTOS

Existem três planos previstos.

Regra hoje confirmada para o plano mínimo:
- **mínimo de 20 profissionais**;
- **R$49,90 por profissional**;
- contratação mínima de **R$998,00**.

Os dois demais planos permanecem parametrizáveis e não devem ser inventados até definição expressa.

---

## 19. CRIAÇÃO DO EVENTO

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

## 20. CONTRATANTE E PARTICIPANTES DE GESTÃO

### 20.1 Contratante

Pode ser laboratório, indústria, empresa, sociedade médica ou outra organização autorizada.

### 20.2 Participantes de gestão

São representantes do contratante, diferentes dos convidados.

Ex.: propagandistas, vendedores, consultores, gestores.

Dados mínimos:
- nome;
- celular/WhatsApp;
- e-mail.

O exemplo atual prevê três participantes de gestão, mas a quantidade deve ser parametrizável por plano/evento.

---

## 21. DOIS FLUXOS DE ENTRADA NO EVENTO

### 21.1 Convite ativo CHRISMED

A CHRISMED seleciona profissionais já aprovados usando filtros.

Quando o profissional recebe convite e aceita, **a participação é confirmada imediatamente**, desde que haja vaga. Não passa novamente pelo Comitê.

### 21.2 Solicitação orgânica

Profissional acessa a página pública de Eventos CHRISMED, visualiza eventos e solicita participação.

Nesse caso:
- pode visualizar eventos públicos mesmo fora do filtro de convite;
- a participação não é automática;
- pedido vai ao Comitê de Gestão CHRISMED;
- Comitê aprova ou recusa.

Exemplo: cardiologista pode visualizar evento de gastroenterologia e pedir vaga, mas precisa de aprovação.

---

## 22. FILTROS, ESPECIALIDADE E RAIO

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

## 23. CRESCIMENTO DA BASE

CHRISMED deve poder:
- cadastrar manualmente;
- importar planilha;
- convidar leads ainda não cadastrados;
- receber cadastro orgânico.

Importação não significa aprovação automática.

Objetivo estratégico: quanto maior e mais qualificada a base, maior o valor comercial do módulo Eventos.

---

## 24. COMUNICAÇÃO

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

## 25. QR CODE E CHECK-IN

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

## 26. NO-SHOW E RESPONSABILIDADE

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

## 27. DASHBOARD E BI DE EVENTOS

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

## 28. OLIVER COMO CAMADA INTELIGENTE

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

No credenciamento, Oliver pode ajudar a:
- identificar campos incompletos;
- apontar inconsistências documentais;
- organizar dossiê;
- resumir currículo;
- destacar experiência e pendências;
- apoiar o Comitê com sinais objetivos.

**Oliver não aprova sozinho.** A decisão final de credenciamento é humana, do Comitê CHRISMED.

---

## 29. IMPACTO OPERACIONAL ESPERADO

### Para a CHRISMED

- rede mais seletiva e confiável;
- menor risco reputacional;
- menos atendimento manual de remarcação;
- melhor ocupação de agenda;
- redução de perda por cancelamentos;
- PegaAgenda automatizado;
- crescimento estruturado da base profissional;
- nova receita com eventos;
- maior rastreabilidade financeira e operacional.

### Para o profissional de saúde

- processo de entrada claro e profissional;
- valorização de experiência e reputação;
- autonomia de agenda;
- autonomia de preço e duração;
- transparência do split;
- possibilidade de teleconsulta, presencial e domiciliar;
- novas oportunidades via PegaAgenda;
- novos convites e networking via Eventos;
- carteira e repasses claros.

### Para o paciente

- maior confiança de que o profissional foi previamente validado;
- facilidade de agendamento/remarcação;
- melhor comunicação;
- teleconsulta integrada;
- rotas prontas para presencial;
- mais previsibilidade em domiciliar;
- proteção em caso de cancelamento do profissional.

### Para contratantes de eventos

- base profissional qualificada;
- segmentação mais confiável;
- redução de no-show;
- check-in confiável;
- acompanhamento em tempo real;
- relatórios mensuráveis.

---

## 30. CRITÉRIOS DE ACEITE PARA IMPLEMENTAÇÃO

Cauã/K1 só deve considerar esta frente funcional quando houver evidência de que:

1. existe cadastro único de profissional compartilhado por Agenda e Eventos;
2. currículo é obrigatório e privado;
3. CPF/identidade possuem estados claros de validação;
4. conselho profissional pode ser verificado por fonte autorizada e evidencia o resultado;
5. o Comitê possui tela/dossiê para avaliar currículo, experiência, referências e inconsistências;
6. aprovação não é automática apenas por número de conselho válido;
7. existem estados aprovado/pendente/reprovado/suspenso;
8. especialidades/subespecialidades são estruturadas;
9. teleconsulta, presencial e domiciliar compartilham uma única agenda;
10. teleconsulta acontece dentro da experiência CHRISMED;
11. domiciliar bloqueia corretamente a janela operacional;
12. remarcação é distinta de cancelamento;
13. cancelamento profissional dispara PegaAgenda;
14. multa, bônus e fundo do paciente são lançados corretamente;
15. carteira/financeiro mostram saldos, datas e relógios regressivos;
16. eventos diferenciam convite automático de candidatura orgânica;
17. geofiltro e especialidade funcionam no convite;
18. QR Code e CPF funcionam como check-in;
19. contratante/gestores veem apenas o que podem ver;
20. e-mail e WhatsApp disparam as jornadas corretas;
21. dashboards/relatórios refletem dados reais;
22. todas as regras sensíveis a mudança são parametrizáveis e não hardcoded;
23. não há duplicação de cadastro, agenda, CRM ou financeiro entre módulos;
24. existe histórico de confiabilidade/comportamento operacional do profissional para governança interna;
25. o sistema permite reavaliação/suspensão quando o padrão high ticket deixar de ser atendido.

---

## 31. REGRA DE DOCUMENTAÇÃO VIVA

Este arquivo é o **único Intake vivo vigente** para CHRISMED — Credenciamento + Agenda + Profissionais + PegaAgenda + Eventos.

Quando Raygs fornecer nova regra:
- atualizar este mesmo arquivo;
- substituir a regra anterior se houver conflito;
- preservar histórico apenas via Git;
- evitar Intakes paralelos;
- não executar código automaticamente sem instrução expressa.

**Status:** Intake oficial CHRISMED consolidado para Cauã/K1.
