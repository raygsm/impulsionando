# INTAKE VIVO — CHRISMED — AGENDA, PROFISSIONAIS, PEGAAGENDA E EVENTOS

**Projeto/cliente:** CHRISMED
**Destinatários:** Cauã / K1 / equipe de desenvolvimento
**Natureza:** Intake vivo, único e consolidado.

## ADENDO VIGENTE — CURRÍCULO OBRIGATÓRIO DO PROFISSIONAL

Esta regra passa a integrar obrigatoriamente o cadastro único de profissionais de saúde e os critérios de aprovação do Comitê CHRISMED, sem substituir as demais regras vigentes já consolidadas para Agenda, PegaAgenda e Eventos.

### Regra

Todo profissional de saúde deve obrigatoriamente carregar seu **currículo profissional** durante o processo de cadastro. O cadastro não pode ser considerado completo nem seguir para aprovação final sem o arquivo.

### Formatos aceitos

- PDF (`.pdf`)
- Microsoft Word (`.doc`)
- Microsoft Word Open XML (`.docx`)

### Comportamento esperado

- campo de upload obrigatório;
- validação de extensão e MIME type;
- tamanho máximo configurável;
- armazenamento privado e seguro;
- acesso restrito à Gestão/Comitê CHRISMED e aos perfis expressamente autorizados;
- registro de data/hora e versão do currículo enviado;
- possibilidade de substituição/atualização posterior pelo profissional, preservando trilha de auditoria;
- arquivo deve integrar o dossiê cadastral usado pelo Comitê para aprovação/revisão do profissional;
- currículo não deve ficar publicamente acessível por URL aberta;
- aplicar controles de segurança para upload de arquivos, incluindo bloqueio de conteúdo executável/malicioso e verificação apropriada antes de disponibilização interna.

### Critério de aceite adicional

Um profissional novo não pode alcançar status cadastral **completo/apto para aprovação** sem currículo válido anexado em um dos formatos permitidos.

---

> **IMPORTANTE PARA CAUÃ/K1:** este adendo deve ser incorporado à especificação consolidada anterior do mesmo Intake vivo. Todas as demais regras já registradas para cadastro profissional, Agenda, teleconsulta, presencial, domiciliar, remarcação, cancelamento, carteira, PegaAgenda e Eventos permanecem vigentes. Em implementação, tratar o currículo como atributo obrigatório do cadastro único compartilhado entre Agenda e Eventos, e não como cadastro/documento separado.
