# Grupo EVR — Modelo Operacional Full

## Princípio
Cliente independente. Usa apenas o Core universal da Impulsionando e extensões próprias `evr_*`.

## Pool
- Instituto EVR: clínica, consultas, programas e acompanhamento.
- Dr. Responde: serviços e relacionamento em saúde.
- Ative-se Pharma: farmácia/varejo/manipulação, PDV, estoque, compras e fulfillment.
- Dra. Camila Perroni e Dr. Márcio: autoridades médicas em papéis próprios, sem misturar responsabilidades profissionais.

## Jornada econômica
Captação → CRM → qualificação → agenda → consulta → plano/pedido → escolha e autorização do paciente → Ative-se Pharma → validação farmacêutica → orçamento → pagamento → produção/separação → controle de qualidade → dispensação/entrega → recompra/recorrência → BI.

## Agenda
- confirmação imediata;
- lembretes configuráveis;
- cancelamento/remarcação self-service quando permitido;
- fila de antecipação opt-in;
- oferta de vaga por compatibilidade e prazo;
- idempotência para impedir dupla reserva;
- indicadores de ocupação, cancelamento, remarcação, no-show e recuperação de vagas.

## Farmácia
- PDV do Core universal;
- cadastro de produtos e fórmulas;
- estoque e reservas;
- lotes, validade e rastreabilidade;
- compras e fornecedores;
- CMV, margem, desconto e rentabilidade;
- perdas, vencimento, descarte e ruptura;
- pedidos recebidos da clínica somente após autorização do paciente;
- validação do farmacêutico antes de produção/dispensação;
- produção, qualidade, balcão, retirada e entrega;
- recompra e relacionamento farmacêutico.

## Segurança e LGPD
- separação entre prontuário clínico e CRM comercial;
- farmácia não recebe acesso amplo ao prontuário;
- compartilhamento mínimo necessário para cumprir pedido autorizado;
- consentimentos versionados e revogáveis;
- RLS por `company_id`;
- logs e trilha de auditoria;
- nenhum dado fictício em produção.

## BI executivo
Primeira camada: ocupação, no-show, remarcação, consultas, receita clínica, pedidos farmácia, conversão de orçamento, receita farmácia, ticket, margem, perdas, validade, ruptura, recompra, SLA e NPS.

Drill-down: empresa → unidade → profissional → serviço → produto → canal → campanha → período.

## Templates essenciais
### Confirmação de consulta
Assunto: Sua consulta no Grupo EVR está confirmada
Corpo: Olá, {{nome}}. Seu atendimento com {{profissional}} está confirmado para {{data_hora}}. Para confirmar, remarcar ou cancelar, use {{link_agenda}}.

### Lembrete
Olá, {{nome}}. Lembramos que seu atendimento está marcado para {{data_hora}}. Se precisar ajustar o horário, acesse {{link_agenda}}.

### Vaga antecipada disponível
Olá, {{nome}}. Surgiu uma possibilidade de antecipar seu atendimento para {{data_hora}}. Essa vaga fica disponível para você até {{expira_em}}. Aceite em {{link_oferta}}.

### Cancelamento
Olá, {{nome}}. Seu atendimento de {{data_hora}} foi cancelado conforme solicitado. Para escolher um novo horário, acesse {{link_agenda}}.

### Remarcação
Olá, {{nome}}. Seu novo horário está confirmado para {{nova_data_hora}}. Consulte os detalhes em {{link_agenda}}.

### Pedido encaminhado à Ative-se
Olá, {{nome}}. Conforme sua autorização, seu pedido foi encaminhado à Ative-se Pharma para validação farmacêutica e orçamento. Você será avisado quando houver atualização.

### Orçamento pronto
Olá, {{nome}}. Seu orçamento Ative-se Pharma está pronto. Consulte os itens, valores e condições em {{link_orcamento}}. A produção só começa após sua aprovação e, quando aplicável, pagamento.

### Produção iniciada
Olá, {{nome}}. Seu pedido {{pedido}} entrou em produção/separação. Acompanhe em {{link_pedido}}.

### Pronto para retirada/entrega
Olá, {{nome}}. Seu pedido {{pedido}} está pronto. Confira retirada ou entrega em {{link_pedido}}.

### Pós-atendimento/NPS
Olá, {{nome}}. Como foi sua experiência com o Grupo EVR? Sua avaliação leva menos de um minuto: {{link_nps}}.

## Regra comercial
A integração deve reduzir fricção e aumentar conversão e recorrência sem retirar do paciente autonomia de escolha, consentimento e acesso aos próprios documentos.
