# CP — Chat Privado

## Posicionamento

Produto independente do Core Impulsionando para comunicação privada de alta sensibilidade.

Tagline: **A segurança das suas conversas começa aqui — e termina com você.**

Assinatura: **O que é dito no CP fica entre quem foi convidado para estar ali.**

O CP não deve ser vendido como “invisível à lei” nem como serviço destinado a contornar ordens legítimas. A proposta é reduzir tecnicamente a superfície de acesso ao conteúdo por meio de criptografia ponta a ponta, minimização de metadados e retenção controlada pelo usuário.

## Benchmark internacional

Referências de arquitetura e produto:

- Signal: PQXDH, Double Ratchet/ratchets pós-quânticos, forward secrecy e post-compromise security.
- Wire: E2EE obrigatório, verificação de dispositivos, MLS para grupos, opções cloud/on-prem/air-gapped.
- Element/Matrix: E2EE por dispositivo, verificação cruzada, soberania/federação e deployments privados.
- Threema: minimização de identidade e forte foco em metadados mínimos.
- Olvid: autenticação e arquitetura sem diretório social central como referência conceitual.
- SimpleX: referência para minimização de identificadores persistentes e metadados de relacionamento.
- Session: referência para roteamento que reduz exposição direta de origem/destino.

O CP não deve copiar protocolo proprietário ou identidade visual de concorrentes. Deve implementar primitivas e padrões públicos auditáveis.

## Arquitetura alvo

### 1:1
- Handshake pós-quântico baseado em padrão auditado equivalente a PQXDH.
- Ratchet com forward secrecy e post-compromise security.
- Uma chave de mensagem derivada por mensagem.
- Chaves privadas apenas no dispositivo.
- Servidor armazena somente material público necessário ao estabelecimento de sessão.

### Grupos
- Preferência por MLS (RFC 9420) ou implementação equivalente auditada.
- Rotação de epoch/chaves a cada mudança de membros.
- Remoção de membro deve impedir decriptar mensagens futuras.

### Dispositivos
- Cada dispositivo possui identidade criptográfica própria.
- Novo dispositivo exige verificação explícita.
- Revogação imediata de dispositivo perdido.
- Preferir armazenamento de chave em Secure Enclave/StrongBox/TPM quando disponível.
- Passkeys/TOTP/biometria local podem compor 2FA; SMS não deve ser fator preferencial para alto risco.

### Convites
1. Usuário convidante gera convite.
2. Convite é vinculado a destino por hash de telefone/identificador.
3. Convidado conclui autenticação e segundo fator.
4. Convidado aceita.
5. Convidante recebe confirmação final.
6. Só então a relação é ativada.

Nenhum nome civil é exibido na rede; outros usuários veem somente apelido e identificador permitido.

## Retenção e exclusão

Opções previstas: manual, 24h, 48h, 1, 2, 5 e 30 dias, além de políticas futuras parametrizáveis.

Excluir não significa apenas marcar `deleted_at`. Para declarar exclusão definitiva do conteúdo, o CP deve comprovar:

- remoção física do payload do armazenamento primário;
- ausência do payload em backups recuperáveis;
- crypto-shredding quando aplicável;
- invalidação de caches/filas temporárias;
- confirmação transacional do purge;
- observabilidade sem conteúdo.

Por isso, enquanto `cp_messages` permanecer no banco primário sujeito ao regime normal de backup, o recurso deve continuar **em homologação** e não pode afirmar “sem possibilidade de recuperação”.

## Separação legal de dados

### Conteúdo
Objetivo: a Impulsionando não deter chave privada nem capacidade de decriptar mensagens.

### Metadados operacionais
Minimizar ao estritamente necessário: membership, status de dispositivo, entrega, expiração. Evitar grafo social permanente e identificadores globais desnecessários.

### Registros de acesso à aplicação
Manter em armazenamento segregado, com acesso altamente restrito, integridade verificável e política de retenção legal aplicável. Esses registros não devem carregar `conversation_id`, assunto, destinatário ou conteúdo.

### Solicitações legais
Toda solicitação deve ser registrada, validada juridicamente e respondida somente no limite dos dados efetivamente disponíveis e legalmente exigíveis. Se conteúdo E2EE não for acessível ao provedor, a resposta deve documentar essa impossibilidade técnica sem destruir ou alterar dados após ciência de ordem válida de preservação.

## Hospedagem internacional

Hospedar CP em infraestrutura dedicada fora do Brasil pode melhorar segregação, resiliência e soberania técnica, mas **não remove automaticamente a aplicação da LGPD/Marco Civil** quando o serviço é oferecido no Brasil.

Qualquer transferência internacional de dados pessoais deve seguir a LGPD e o Regulamento da ANPD sobre transferências internacionais. Se houver usuários europeus, o GDPR e suas regras de transferência também entram no desenho.

Critérios para país/região:
- lei de proteção de dados madura;
- autoridade independente;
- transparência sobre acesso governamental;
- disponibilidade de infraestrutura dedicada/HSM;
- capacidade de contrato com cláusulas de transferência adequadas;
- baixa exposição a fornecedores com acesso privilegiado ao conteúdo;
- suporte a arquitetura sem backup de payload.

Suíça/EEE podem ser avaliados, mas a escolha final exige DPIA/LIA, análise de transferência internacional e revisão jurídica específica.

VPN não é base de segurança do CP. VPN protege um trecho de transporte; não substitui E2EE, gestão de chaves, autenticação, device trust, minimização de metadados ou retenção.

## Comercial White Label

Faixas mensais canônicas usando salário mínimo de 2026 = R$ 1.621,00:

- 1–10 usuários: 1 SM = R$ 1.621,00/mês
- 11–20: 1,5 SM = R$ 2.431,50/mês
- 21–50: 2 SM = R$ 3.242,00/mês
- 51–100: 3 SM = R$ 4.863,00/mês
- 101–500: 4 SM = R$ 6.484,00/mês
- 501–1.000: 5 SM = R$ 8.105,00/mês
- 1.001+: sob consulta

O CP é produto separado. Não está incluído nos planos Essencial, Ideal ou Full.

## PF

Preços PF históricos aprovados devem ser recuperados antes da publicação. O sistema permanece fail-closed: não derivar, estimar ou reaproveitar preço de outro produto.

## Go-live obrigatório

O CP só pode receber status “homologado” após:

- implementação criptográfica por biblioteca/padrão auditado;
- auditoria externa independente;
- gestão de chaves exclusivamente client-side comprovada;
- E2E de convite + 2FA + duplo aceite;
- revogação de dispositivo testada;
- purge físico/crypto-shredding testado;
- payload fora de backup recuperável;
- testes de recuperação provando que conteúdo expirado não volta;
- pentest mobile/web/API;
- threat model formal;
- DPIA/RIPD e avaliação de transferência internacional;
- runbook de solicitação judicial;
- transparência pública e termos revisados juridicamente.
