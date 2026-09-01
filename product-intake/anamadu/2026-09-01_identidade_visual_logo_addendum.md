# ADDENDUM — IDENTIDADE VISUAL E NOVO LOGO ANA MADÚ

**MODO:** PRODUCT INTAKE — NÃO EXECUTAR AGORA  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**VINCULADO A:** `product-intake/anamadu/2026-09-01_anamadu_master_intake.md`

## 1. LOGO APROVADO COMO NOVA DIREÇÃO VISUAL

Usar como referência visual aprovada o **último logo/rebranding gerado e aprovado neste projeto/conversa**, substituindo a direção visual anterior para a futura implementação.

Conceito aprovado:

- monograma **AM — Ana Madú**;
- foco em **joias autorais/personalizadas**;
- protagonismo de **pedras raras e pedras brasileiras**;
- leveza, natureza brasileira, organicidade e sofisticação;
- linguagem premium sem excesso visual;
- combinação de formas orgânicas inspiradas em pedra/mineral com desenho refinado do monograma;
- direção cromática com dourado quente/champagne e tons minerais verdes/azulados, sobre bases claras ou escuras conforme contraste;
- marca textual **ANA MADÚ**;
- descriptor preferencial a ser validado editorialmente: **JOIAS AUTORAIS & PEDRAS RARAS**.

Evitar retornar à estética anterior de “bijuteria genérica”, excesso de 3D, excesso de brilho, ornamentos gratuitos ou visual de joalheria massificada.

## 2. ASSET CANÔNICO

Na execução futura, Cauã deve receber/exportar o arquivo mestre aprovado e registrá-lo como asset canônico da Ana Madú no repositório/asset storage apropriado, preservando alta resolução e criando derivados técnicos sem alterar o desenho.

Entregáveis de identidade:

- master em alta resolução;
- PNG transparente;
- WebP/AVIF para web;
- SVG/vetor quando houver versão vetorial validada;
- versão horizontal;
- versão vertical;
- símbolo/monograma AM;
- favicon/app icon;
- versão para fundo claro;
- versão para fundo escuro;
- versão monocromática;
- social avatar;
- Open Graph/social preview.

Não vetorizar automaticamente de modo que deforme o monograma ou a pedra. Fazer revisão visual humana dos derivados.

## 3. DESIGN TOKENS

Extrair do logo aprovado e consolidar tokens de marca, sem depender de valores aproximados escolhidos arbitrariamente:

- primary-gold;
- champagne-gold;
- mineral-green;
- mineral-teal;
- ivory/stone background;
- charcoal/black premium;
- text-primary;
- text-secondary;
- border/subtle;
- focus/accessible.

Validar WCAG AA para texto e controles. Cor decorativa não pode prejudicar acessibilidade.

## 4. TIPOGRAFIA

Definir sistema tipográfico premium e legível:

- display/editorial para títulos e marca quando licenciamento permitir;
- sans-serif altamente legível para interface, ERP, CRM, checkout e mobile;
- não usar fonte ornamental em textos operacionais;
- garantir fallback seguro em e-mail.

## 5. FRONT-END

Aplicar a nova identidade em `anamadu.impulsionando.com.br` durante a futura implementação:

- header;
- navegação;
- hero;
- catálogo;
- páginas de produto;
- pedras;
- Ourives;
- presentes;
- Annita;
- área do cliente;
- login;
- checkout;
- footer;
- loading/preloader somente se não prejudicar performance;
- estados vazios e mensagens de sistema.

A marca deve comunicar joalheria autoral contemporânea, pedra rara, origem natural e exclusividade — não simplesmente “acessórios”.

## 6. DASHBOARD / ERP / CRM

Aplicar identidade de forma mais discreta no ambiente operacional:

- logo/monograma;
- tokens de cor;
- ícones e estados consistentes;
- navegação clara;
- dashboards limpos;
- nenhuma textura/foto ornamental atrás de tabelas ou dados;
- preservar máxima legibilidade.

## 7. ANNITA

A interface da Annita deve herdar a nova identidade:

- avatar/símbolo coerente com o monograma AM;
- componentes de chat premium;
- CTAs discretos;
- cards de produto/pedra;
- linguagem elegante e humana;
- identidade Ana Madú, sem parecer chatbot genérico da Impulsionando.

## 8. E-MAIL E MENSAGERIA

Todos os templates futuros devem ser rebrandados:

- logo novo;
- paleta nova;
- cabeçalho/rodapé;
- CTAs;
- cards de produto;
- assinatura;
- identidade da Annita;
- responsividade;
- dark-mode compatibility quando possível.

WhatsApp deve usar linguagem da marca, mas sem sacrificar objetividade.

## 9. DOCUMENTOS E TRANSAÇÕES

Aplicar identidade, quando tecnicamente/fiscalmente apropriado, em:

- propostas;
- orçamentos;
- pedidos;
- comprovantes;
- documentos Ourives;
- PDFs;
- certificados/documentos de pedra quando reais;
- materiais pós-venda;
- NF apenas nos campos/representações permitidos pelo provedor e legislação.

## 10. FOTOGRAFIA E DIREÇÃO DE ARTE

A futura biblioteca visual deve priorizar:

- macro de pedras reais;
- textura mineral;
- luz natural;
- pele e uso real das peças;
- composição arejada;
- Brasil contemporâneo sem clichê tropical;
- protagonismo da singularidade de cada pedra.

Não usar imagens que façam uma peça parecer diferente do produto vendido.

## 11. COPY / POSICIONAMENTO

Direção de posicionamento:

**ANA MADÚ — JOIAS AUTORAIS & PEDRAS RARAS**

Territórios de marca:

- natureza;
- raridade;
- autoria;
- personalização;
- memória;
- origem;
- brasilidade sofisticada;
- peça única;
- história individual.

Evitar promessas místicas, terapêuticas ou medicinais não comprovadas sobre pedras.

## 12. REGRA DE IMPLEMENTAÇÃO

Antes de substituir identidade em produção:

1. inventariar assets atuais;
2. preservar rollback;
3. registrar novo asset canônico;
4. gerar derivados;
5. atualizar design tokens;
6. atualizar front;
7. atualizar dashboard;
8. atualizar Annita;
9. atualizar e-mails/templates;
10. atualizar documentos;
11. validar desktop/mobile;
12. validar contraste/acessibilidade;
13. validar performance;
14. publicar;
15. verificar o domínio real e SHA servido.

**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**