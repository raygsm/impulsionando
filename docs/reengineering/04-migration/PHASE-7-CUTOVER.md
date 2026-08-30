# Fase 7 — Cutover e retirada do legado

## Objetivo

Consolidar produção e remover o legado sem perder capacidade de recuperação.

## Trabalho

- migrar tenants e fluxos restantes;
- congelar escritas do legado quando aplicável;
- executar smoke e reconciliação;
- mover DNS/tráfego gradualmente;
- observar a janela de rollback;
- retirar Nginx e runtimes concorrentes;
- arquivar evidências e configurações necessárias;
- remover releases, imagens e volumes somente após aprovação;
- revogar credenciais e acessos antigos.

## Critério de saída

Todo domínio público aponta para a arquitetura nova, nenhum fluxo depende do runtime legado, rollback antigo foi formalmente encerrado e a limpeza possui evidência de backup/restauração.

