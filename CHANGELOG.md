# HistÃ³rico de VersÃµes (Changelog)

---------------------------------------
VERSÃƒO 2.3.7
---------------------------------------

Data:
12/08/2026

Objetivo:
OtimizaÃ§Ã£o do layout de impressÃ£o da pÃ¡gina de projetos.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- Configurado tamanho de pÃ¡gina nativo para `A4 Paisagem` no CSS de impressÃ£o (`@page`), para que a janela de impressÃ£o jÃ¡ venha com as orientaÃ§Ãµes adequadas.
- Aplicado `zoom: 90%` e redimensionamento elegante das fontes apenas no momento da impressÃ£o, para garantir que as 3 colunas principais caibam perfeitamente na mesma folha.
- Adicionadas regras de CSS `break-inside: avoid` nos blocos de conteÃºdo para impedir que os quadros sejam cortados ao meio entre as pÃ¡ginas.
- Ajuste das margens e recuos internos dos relatÃ³rios apenas na impressÃ£o, maximizando o espaÃ§o Ãºtil da folha A4.

---------------------------------------
VERSÃƒO 2.3.6
---------------------------------------

Data:
10/08/2026

Objetivo:
CorreÃ§Ã£o do mapeamento de cores dos status no grÃ¡fico "DistribuiÃ§Ã£o por status" (Dashboard).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- Criada a constante `COR_STATUS_HEX` para definir cores exatas para cada status (ex: "Atrasado" = Vermelho, "ConcluÃ­do" = Verde).
- Modificada a renderizaÃ§Ã£o do grÃ¡fico de status (`gStatus`) para utilizar o mapeamento semÃ¢ntico exato, abandonando a paleta sequencial (que atribuÃ­a cores indesejadas dependendo da ordem dos dados).

---------------------------------------
VERSÃƒO 2.3.5
---------------------------------------

Data:
07/08/2026

Objetivo:
RestauraÃ§Ã£o da rolagem vertical nativa da pÃ¡gina e refinamento da navegaÃ§Ã£o horizontal no Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- Removido o bloqueio/interceptaÃ§Ã£o incondicional da roda vertical do mouse no Kanban, permitindo a rolagem normal para cima e para baixo na pÃ¡gina.
- Mantidas e refinadas as formas ergonÃ´micas de navegaÃ§Ã£o horizontal no Kanban: `Shift + Scroll`, Arraste do fundo com o mouse (Grab & Drag), BotÃµes `Esquerda`/`Direita` e barra de rolagem horizontal inferior.

---------------------------------------
VERSÃƒO 2.3.4
---------------------------------------

Data:
07/08/2026

Objetivo:
InclusÃ£o de nota orientativa de usabilidade e navegaÃ§Ã£o (scroll, arrasto e setas) no cabeÃ§alho do Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- Adicionado banner informativo discreto no cabeÃ§alho do Kanban instruindo os usuÃ¡rios sobre todas as formas de rolagem horizontal disponÃ­veis (Roda do mouse / Scroll, Arraste com cursor e BotÃµes de setas).

---------------------------------------
VERSÃƒO 2.3.3
---------------------------------------

Data:
07/08/2026

Objetivo:
CorreÃ§Ã£o no cÃ¡lculo de diferenÃ§a em dias de prazos e alinhamento dos indicadores visuais no Status Report.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- CriaÃ§Ã£o da funÃ§Ã£o utilitÃ¡ria `diffDiasData()` para cÃ¡lculo exato de dias corridos entre a data atual (zerada Ã  meia-noite) e a data-alvo.
- CorreÃ§Ã£o de cÃ¡lculo no Status Report: prazos de ontem agora sÃ£o identificados corretamente como "1d em atraso", prazos de hoje como "Vence hoje" e prazos de amanhÃ£ como "Vence em 1d".
- Alinhamento dos pontos indicadores de status (SemÃ¡foro da tabela) com o status real do prazo (Atrasado = Vermelho, Vencendo em breve = Amarelo, No prazo = Verde).

---------------------------------------
VERSÃƒO 2.3.2
---------------------------------------

Data:
07/08/2026

Objetivo:
Melhorias ergonÃ´micas e correÃ§Ã£o de usabilidade no scroll horizontal do quadro Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / CorreÃ§Ãµes:
- Suporte a rolagem horizontal via roda do mouse (Mouse Wheel) ao passar o cursor sobre o quadro Kanban.
- BotÃµes de navegaÃ§Ã£o rÃ¡pida "Esquerda" e "Direita" adicionados ao cabeÃ§alho do Kanban.
- Suporte a arraste com o mouse (Grab & Drag to scroll) ao clicar e arrastar em Ã¡reas livres do Kanban.
- Barra de rolagem horizontal com estilo aprimorado e trilha visÃ­vel (#kanbanContainer).

---------------------------------------
VERSÃƒO 2.3.1
---------------------------------------

Data:
06/08/2026

Objetivo:
InclusÃ£o da opÃ§Ã£o "InternalizaÃ§Ã£o" no campo de seleÃ§Ã£o Tipo no formulÃ¡rio de criaÃ§Ã£o e ediÃ§Ã£o de desenvolvimentos.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nova opÃ§Ã£o de classificaÃ§Ã£o "InternalizaÃ§Ã£o" disponibilizada no dropdown `Tipo` (ao lado de Novo, AlteraÃ§Ã£o, Melhoria e BGI).
- Constante global `TIPOS` padronizada na aplicaÃ§Ã£o.

---------------------------------------
VERSÃƒO 2.3.0
---------------------------------------

Data:
04/08/2026

Objetivo:
IntegraÃ§Ã£o da barra de filtros rÃ¡pidos multi-seleÃ§Ã£o (LanÃ§amento, ResponsÃ¡vel, FamÃ­lia e Status) na nova aba de Status Report Executivo, permitindo segmentaÃ§Ãµes dinÃ¢micas e sincronizadas tanto para o mÃ³dulo de Usinagem quanto de Montagem.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- AtivaÃ§Ã£o da barra superior de segmentaÃ§Ã£o multi-seleÃ§Ã£o (`filtros-bar`) na view `Status Report`.
- Suporte a filtros combinados de mÃªs de lanÃ§amento, mÃºltiplos responsÃ¡veis, mÃºltiplas famÃ­lias de produtos e status do desenvolvimento.
- Compatibilidade automÃ¡tica com o mÃ³dulo de Montagem (filtrando os responsÃ¡veis especÃ­ficos e status de montagem).
- BotÃ£o "Limpar filtros" para reset rÃ¡pido de todas as seleÃ§Ãµes ativas.

---------------------------------------
VERSÃƒO 2.2.1
---------------------------------------

Data:
04/08/2026

Objetivo:
Ajustes visuais na aba Status Report Executivo conforme alinhamento com usuÃ¡rio: remoÃ§Ã£o total de emojis nos cards, badges e textos; remoÃ§Ã£o dos botÃµes de exportaÃ§Ã£o rÃ¡pida (WhatsApp/E-mail e PDF) e remoÃ§Ã£o da coluna "AÃ§Ã£o" para maximizar a Ã¡rea Ãºtil da tabela.

Arquivos alterados:
- public/index.html

Funcionalidades alteradas:
- SubstituiÃ§Ã£o de emojis por indicadores de status limpos (dots coloridos padronizados do sistema nos cards superiores e badges profissionais na tabela).
- RemoÃ§Ã£o dos botÃµes "Copiar Resumo (WhatsApp / E-mail)" e "Imprimir / PDF" do cabeÃ§alho da visualizaÃ§Ã£o.
- RemoÃ§Ã£o da coluna redundante "AÃ§Ã£o" da tabela executiva (a navegaÃ§Ã£o para os detalhes do projeto jÃ¡ Ã© feita diretamente clicando em qualquer ponto da linha).
- OtimizaÃ§Ã£o do espaÃ§amento e largura das colunas de Produto/ReferÃªncia e Ãšltima AtualizaÃ§Ã£o.

---------------------------------------
VERSÃƒO 2.2.0
---------------------------------------

Data:
04/08/2026

Objetivo:
ImplementaÃ§Ã£o da nova aba de navegaÃ§Ã£o lateral "Status Report" executivo com acompanhamento rÃ¡pido de prazos, etapas atuais, prÃ³ximas etapas, alertas visuais de atraso e recurso de cÃ³pia rÃ¡pida para WhatsApp/E-mail.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nova aba "Status Report" no menu lateral para visualizaÃ§Ã£o sintÃ©tica e executiva de todos os desenvolvimentos ativos e concluÃ­dos (tanto na Usinagem quanto na Montagem).
- Cards superiores de resumo com filtragem por clique: Total Cadastrado, ðŸ”´ Em Atraso, ðŸŸ¡ Vencendo em Breve, ðŸŸ¢ No Prazo e âœ… ConcluÃ­dos.
- Tabela executiva com colunas de: Status/SemÃ¡foro, Produto/ReferÃªncia, ResponsÃ¡vel com avatar, Mini Barra de Progresso (%) e etapas concluÃ­das, Etapa Atual com contagem de dias parado, Prazo da Etapa Atual com badges destacados e cÃ¡lculo de atraso, PrÃ³xima Etapa do fluxo, Ãšltima AtualizaÃ§Ã£o/ComentÃ¡rio recente e AÃ§Ã£o RÃ¡pida de abertura.
- BotÃ£o "Copiar Resumo (WhatsApp / E-mail)" com geraÃ§Ã£o automÃ¡tica de texto executivo pronto para colar e enviar para a equipe ou gerÃªncia.
- BotÃ£o "Imprimir / PDF" para emissÃ£o e exportaÃ§Ã£o rÃ¡pida de relatÃ³rios de reuniÃ£o.

---------------------------------------
VERSÃƒO 2.1.0
---------------------------------------

Data:
04/08/2026

Objetivo:
Implementar solicitaÃ§Ã£o obrigatÃ³ria de prazo ao avanÃ§ar etapas no checklist, sincronizaÃ§Ã£o bidirecional do card de ferramentas desenvolvidas, gravaÃ§Ã£o de motivos de retrocesso nos comentÃ¡rios e segmentaÃ§Ã£o precisa dos indicadores de desempenho por mÃ³dulo (Montagem vs Usinagem).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- SolicitaÃ§Ã£o interativa de prazo limite para a prÃ³xima etapa em cada conclusÃ£o de item do checklist (tanto na Usinagem quanto na Montagem), armazenando os prazos por etapa em `prazosEtapas`.
- CÃ¡lculo e segmentaÃ§Ã£o dedicada de indicadores de tempo para a Montagem (`diasNaEtapaMontagem`, `leadTimeMontagem`, `diasAtrasoMontagem`).
- ExibiÃ§Ã£o de prazos individuais por etapa no checklist de Montagem e Usinagem.

Funcionalidades alteradas:
- Registro automÃ¡tico nos comentÃ¡rios (do mÃ³dulo correspondente) ao avanÃ§ar ou retroceder etapas, incluindo o motivo informado no retrocesso.
- VinculaÃ§Ã£o correta do card "Ferramentas desenvolvidas" ao array do mÃ³dulo ativo (`p.montagem.ferramentas` na Montagem e `p.ferramentas` na Usinagem).
- Roteamento modular de comentÃ¡rios, anexos e ferramentas para garantir total independÃªncia entre Montagem e Usinagem.

---------------------------------------
VERSÃƒO 2.0.6
---------------------------------------

Data:
03/08/2026

Objetivo:
Corrigir o retrocesso de etapas no mÃ³dulo de Montagem (tanto pelo clique na etapa anterior do checklist quanto pelo botÃ£o "Voltar etapa").

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- FunÃ§Ã£o utilitÃ¡ria `limparEtapasDesfeitasMontagem` para redefinir campos e prazos ao retroceder etapas da montagem.

Funcionalidades alteradas:
- Ajuste na funÃ§Ã£o `reabrirEtapa` para identificar o mÃ³dulo atual (Montagem vs Usinagem), solicitar o motivo do retrocesso e atualizar corretamente o fluxo, histÃ³rico e dados da montagem.
- Ajuste na funÃ§Ã£o `voltarEtapa` para suportar limpeza de campos e reabertura de projetos concluÃ­dos na montagem.

---------------------------------------
VERSÃƒO 2.0.5
---------------------------------------

Data:
03/08/2026

Objetivo:
Permitir que tÃ©cnicos de montagem assumam tarefas independentemente da usinagem, exibir dados cadastrais completos e indicadores no mÃ³dulo de montagem, e suportar retorno de etapa na montagem.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Suporte dedicado para tÃ©cnicos de montagem assumirem o desenvolvimento na Montagem (`p.montagem.responsavel`), informando prazo de anÃ¡lise e avanÃ§ando a etapa de Recebido para AnÃ¡lise na Montagem de forma 100% independente da Usinagem.
- ExibiÃ§Ã£o completa de todos os dados do produto (componentes, referÃªncias de alojamento, pino, forjados, NP usinagem, cliente, famÃ­lia, tipo, prioridade, responsÃ¡vel de usinagem e montagem, datas) na tela de detalhes da Montagem.
- ExibiÃ§Ã£o de todos os 5 indicadores principais no cabeÃ§alho da Montagem (Dias desde o cadastro, Dias na etapa, Lead Time, Prazo restante e Dias em atraso).
- Suporte a "Voltar etapa" e "Direcionar a um tÃ©cnico" (Admin) no mÃ³dulo de Montagem.

Funcionalidades alteradas:
- Cards do Kanban e linhas da Lista agora refletem o responsÃ¡vel, dias na etapa e status do mÃ³dulo de Montagem quando visualizados no mÃ³dulo de Montagem.

---------------------------------------
VERSÃƒO 2.0.4
---------------------------------------

Data:
03/08/2026

Objetivo:
Ocultar automaticamente itens do tipo PistÃ£o / PistÃ£o de Freio do mÃ³dulo de Montagem (Kanban, Listas e Dashboard).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- FunÃ§Ã£o utilitÃ¡ria `isPistao` para identificaÃ§Ã£o precisa de componentes e famÃ­lias de pistÃ£o.

Funcionalidades alteradas:
- Filtragem automÃ¡tica em todas as telas e indicadores do mÃ³dulo de Montagem para excluir pistÃµes, mantendo o Kanban e mÃ©tricas limpas e focadas exclusivamente em conjuntos montados.
- PreservaÃ§Ã£o integral do ciclo de desenvolvimento de pistÃµes no mÃ³dulo de Usinagem.

---------------------------------------
VERSÃƒO 2.0.3
---------------------------------------

Data:
03/08/2026

Objetivo:
InclusÃ£o explÃ­cita das opÃ§Ãµes "TÃ©cnico Usinagem" e "TÃ©cnico Montagem" no cadastro e ediÃ§Ã£o de usuÃ¡rios.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- OpÃ§Ã£o explÃ­cita de perfil "TÃ©cnico Montagem" (`tecnico_montagem`) no cadastro e na ediÃ§Ã£o de usuÃ¡rios.
- RenomeaÃ§Ã£o da opÃ§Ã£o "TÃ©cnico" para "TÃ©cnico Usinagem" (`tecnico`) para clareza na distinÃ§Ã£o dos papÃ©is.

Funcionalidades alteradas:
- AtualizaÃ§Ã£o visual dos badges de usuÃ¡rios para exibir o rÃ³tulo preciso de acordo com a Ã¡rea do tÃ©cnico (Usinagem vs Montagem).

---------------------------------------
VERSÃƒO 2.0.2
---------------------------------------

Data:
01/08/2026

Objetivo:
CorreÃ§Ã£o de bug crÃ­tico no Dashboard principal (ReferenceError: moduloAtual is not defined).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nenhuma

Funcionalidades alteradas:
- Refatorado todas as referÃªncias diretas de moduloAtual para apontar corretamente para o estado global estado.moduloAtual.
- Removidos os emojis dos botÃµes de mÃ³dulo ("Usinagem" e "Montagem") conforme solicitado.


---------------------------------------
VERSÃƒO 2.0.1
---------------------------------------

Data:
01/08/2026

Objetivo:
Ajuste da visÃ£o Dashboard principal.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nenhuma

Funcionalidades alteradas:
- Atualizada a funÃ§Ã£o renderDashboard para contemplar adequadamente os KPIs e grÃ¡ficos quando o mÃ³dulo ativo for 'Montagem'.


---------------------------------------
VERSÃƒO 2.0.0
---------------------------------------

Data:
01/08/2026

Objetivo:
ImplementaÃ§Ã£o do mÃ³dulo de Montagem (OpÃ§Ã£o C).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Estrutura de dados unificada para suportar Montagem.
- Seletor de mÃ³dulos (Usinagem/Montagem) na interface principal.
- LÃ³gica de permissÃ£o de visualizaÃ§Ã£o e ediÃ§Ã£o para 'tecnico_montagem'.
- RefatoraÃ§Ã£o da UI de Projeto, abas separadas, exclusÃ£o lÃ³gica do 'PistÃ£o'.
- AdaptaÃ§Ã£o do modal FO050 para Linhas de Montagem e processos especÃ­ficos.
- Dashboard Gerencial adaptado para consolidar dados da Montagem.
- VisÃµes Kanban e Lista exibindo os projetos aplicÃ¡veis dependendo do mÃ³dulo ativo.

Funcionalidades alteradas:
- renderProjeto, renderLista, renderKanban, renderGerencial.
- Status e indicadores de dias na etapa e atraso refatorados.


---------------------------------------
VERSÃƒO 1.0.0
---------------------------------------

Data:
19/07/2026

Objetivo:
Estabelecer a versÃ£o base do sistema ("DESENVOLVIMENTOS") com o novo padrÃ£o de versionamento profissional e histÃ³rico controlado.

Arquivos alterados:
Nenhum (VersÃ£o Base)

Funcionalidades adicionadas:
âœ” ImplantaÃ§Ã£o da polÃ­tica de versionamento e regras `.agents/AGENTS.md`.

Funcionalidades alteradas:
Nenhuma

CorreÃ§Ãµes realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrÃ£o)

ObservaÃ§Ãµes:
Este marco consolida as atualizaÃ§Ãµes recentes (Dashboard KPIs, fluxo simplificado de FO050, tag BGI, aba MovimentaÃ§Ãµes) como a versÃ£o estÃ¡vel 1.0.0.
---------------------------------------

---------------------------------------
VERSï¿½O 1.0.1
---------------------------------------

Data:
19/07/2026

Objetivo:
Exibir a versï¿½o atual na interface do sistema.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Tag de versï¿½o visual no painel de login e na barra lateral (sidebar).

Funcionalidades alteradas:
Nenhuma

Correï¿½ï¿½es realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrï¿½o)

Observaï¿½ï¿½es:
Alteraï¿½ï¿½o puramente visual para facilitar o controle de versï¿½o pelos usuï¿½rios.
---------------------------------------

---------------------------------------
VERSï¿½O 1.0.2
---------------------------------------

Data:
19/07/2026

Objetivo:
Substituir o logotipo genï¿½rico pelo logotipo oficial da Viemar.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Inclusï¿½o do logotipo oficial (logo_viemar.png) na tela de login e barra lateral.

Funcionalidades alteradas:
Nenhuma

Correï¿½ï¿½es realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrï¿½o)

Observaï¿½ï¿½es:
Melhoria de identidade visual (Branding).
---------------------------------------

---------------------------------------
VERSï¿½O 1.0.3
---------------------------------------

Data:
19/07/2026

Objetivo:
Permitir atalho de teclado (ESC) para fechar telas e modais.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Pressionar a tecla ESC agora fecha modais abertos e volta para a tela anterior (Kanban ou Lista) ao visualizar a capa de um projeto.

Funcionalidades alteradas:
? O botï¿½o de 'Voltar' na capa do projeto agora retorna dinamicamente para a tela em que o usuï¿½rio estava (Kanban ou Lista), em vez de voltar obrigatoriamente para o Kanban.
? Atualizaï¿½ï¿½o da tag de versï¿½o na interface para v1.0.3.

Correï¿½ï¿½es realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrï¿½o)

Observaï¿½ï¿½es:
Melhoria de UX solicitada.
---------------------------------------

---------------------------------------
VERSï¿½O 1.0.4
---------------------------------------

Data:
20/07/2026

Objetivo:
Corrigir a invisibilidade de projetos da etapa Programa CNC no Kanban e em Grï¿½ficos.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
Nenhuma.

Funcionalidades alteradas:
? Atualizaï¿½ï¿½o da tag visual na interface para v1.0.4.

Correï¿½ï¿½es realizadas:
? Criada a constante estrutural TODAS_ETAPAS contendo o mapeamento de ambos os fluxos.
? Ajustado o renderKanban para processar todas as etapas conjuntas, garantindo que projetos no fluxo simplificado na etapa Programa CNC nï¿½o fiquem mais presos no limbo.
? Grï¿½ficos do Dashboard e Filtros da Movimentaï¿½ï¿½o atualizados para considerar a matriz completa.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrï¿½o).

Observaï¿½ï¿½es:
Resoluï¿½ï¿½o de bug relatado na tela de Kanban.
---------------------------------------

---------------------------------------
VERSï¿½O 1.1.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar ID de Cadastro (DEV-XXX) e lï¿½gica de ordenaï¿½ï¿½o de filas por FIFO (First-In, First-Out).

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? ID Sequencial de Cadastro visï¿½vel na interface para todos os projetos (formato DEV-XXX).
? Identificaï¿½ï¿½o retroativa no banco de dados para todos os projetos antigos seguindo a data exata de criaï¿½ï¿½o.
? Nova lï¿½gica de renderizaï¿½ï¿½o automï¿½tica na tela de Kanban e Lista que empata a Previsï¿½o de Lanï¿½amento desempatando pela Data de Inï¿½cio (projetos mais antigos ficam no topo).

Funcionalidades alteradas:
? Tag de versï¿½o visual na interface para v1.1.0.

Correï¿½ï¿½es realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrï¿½o).

Observaï¿½ï¿½es:
Melhoria estrutural na forma como a equipe prioriza seus desenvolvimentos com base no histï¿½rico de chegada (FIFO).
---------------------------------------

---------------------------------------
VERSï¿½O 1.1.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de inicializaï¿½ï¿½o.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Inserida trava lï¿½gica para impedir loop infinito gerado pelo script retroativo de migraï¿½ï¿½o, liberando a interface.
---------------------------------------

---------------------------------------
VERSï¿½O 1.1.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de renderizaï¿½ï¿½o.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Correï¿½ï¿½o de sintaxe que impedia o carregamento do Kanban, restaurando o acesso normal ao aplicativo.
---------------------------------------

---------------------------------------
VERSï¿½O 1.1.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix visual: adicionar ID ï¿½ tela de lista.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Adicionado selo de DEV-XXX ao lado da Referï¿½ncia do Produto na visualizaï¿½ï¿½o em grade (Lista) a pedido do usuï¿½rio.
---------------------------------------

---------------------------------------
VERSï¿½O 1.1.4
---------------------------------------

Data:
21/07/2026

Objetivo:
Permitir busca por ID DEV-XXX.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Adicionada capacidade de buscar projetos diretamente pelo ID sequencial (DEV-XXX) usando a barra de busca global do sistema.
---------------------------------------

---------------------------------------
VERSï¿½O 1.2.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar filtro mï¿½ltiplo por status.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Adicionada nova opï¿½ï¿½o 'Status' na barra de filtros avanï¿½ados (ao lado de Lanï¿½amento, Responsï¿½vel e Famï¿½lia), permitindo filtrar visualmente por status como 'No Prazo', 'Atenï¿½ï¿½o', 'Atrasado' e 'Concluï¿½do'.
---------------------------------------

---------------------------------------
VERSï¿½O 1.2.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de filtro de Status.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Correï¿½ï¿½o do bug de case-sensitivity no filtro de Status. O sistema nï¿½o estava reconhecendo a opï¿½ï¿½o 'No prazo' com p minï¿½sculo, nem 'Aguardando Tï¿½cnico'. As opï¿½ï¿½es foram sincronizadas com o banco de dados.
---------------------------------------

---------------------------------------
VERSï¿½O 1.2.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do dropdown de Status.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Corrigido bug visual em que clicar na caixa de seleï¿½ï¿½o de Status mantinha a caixa de Famï¿½lia aberta ou com comportamento anï¿½malo devido ï¿½ gestï¿½o de IDs de dropdown.
---------------------------------------

---------------------------------------
VERSï¿½O 1.2.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do filtro de Status.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Sincronizada a lista de filtros de status na barra de buscas para corresponder exatamente ï¿½ rï¿½gua de status real de negï¿½cio retornada pelo sistema (Em Andamento, Atrasado, Em Validaï¿½ï¿½o, etc.), no lugar dos antigos marcadores de prazo.
---------------------------------------

---------------------------------------
VERSï¿½O 1.2.4
---------------------------------------

Data:
22/07/2026

Objetivo:
Hotfix de avanï¿½o automï¿½tico da etapa Liberaï¿½ï¿½o.

Arquivos alterados:
public/index.html

Correï¿½ï¿½es realizadas:
? Corrigido o bug onde concluir a etapa 'Validaï¿½ï¿½o/FO050' concluï¿½a automaticamente a etapa 'Liberaï¿½ï¿½o' em seguida.
? Corrigido o comportamento do botï¿½o de desmarcar etapa, que agora reverte corretamente a caixa selecionada de volta ao seu estado pendente (como atual).
? Migraï¿½ï¿½o transparente de projetos antigos que jï¿½ estavam 100% concluï¿½dos.
---------------------------------------

---------------------------------------
VERSï¿½O 1.3.0
---------------------------------------

Data:
22/07/2026

Objetivo:
Suporte a mï¿½ltiplos processos na etapa de Validaï¿½ï¿½o/FO050.

Arquivos alterados:
public/index.html

Novidades e Alteraï¿½ï¿½es:
? Adicionada a capacidade de inserir mï¿½ltiplos processos de fabricaï¿½ï¿½o dentro dos dados da FO050.
? Implementada lista prï¿½-definida de processos (USI CAIXA, USI PINO, FR EQUIPTOP, etc).
? Cada processo possui sua prï¿½pria mï¿½quina, tempo de usinagem, tempo de troca, nï¿½mero de OP e data de execuï¿½ï¿½o.
? O painel de Detalhes do Projeto e o painel de ediï¿½ï¿½o foram refeitos para listar e somar automaticamente todos os processos parciais.
? Realizada migraï¿½ï¿½o retroativa transparente, onde itens mais antigos com estrutura de mï¿½quina ï¿½nica foram convertidos para o novo formato preservando os dados originais.
---------------------------------------


- PATCH: Correï¿½ï¿½o na exibiï¿½ï¿½o dos processos FO050 no detalhamento do projeto e ajuste de foco nos campos de input ao editar a FO050 (bugfix).


- PATCH: Tratamento de erros ao tentar retroceder etapas (Voltar/Desmarcar) em projetos sem histï¿½rico ou comentï¿½rios prï¿½vios iniciados (bugfix).


- PATCH: Corrigido problema estrutural onde retroceder etapas em desenvolvimentos com histï¿½rico irregular (ex: pulos manuais) nï¿½o alterava o estado na tela, pois o histï¿½rico era lido via ï¿½ndice em vez do nome da etapa.

---------------------------------------
VERSï¿½O 1.4.0
---------------------------------------

Data:
24/07/2026

Objetivo:
Permitir que qualquer tï¿½cnico possa manipular desenvolvimentos/atividades, mesmo que assumidos por outro tï¿½cnico.

Arquivos alterados:
public/index.html

Novidades e Alteraï¿½ï¿½es:
- Atualizada a regra de gerenciamento (podeGerenciar) para conceder permissï¿½o de ediï¿½ï¿½o e movimentaï¿½ï¿½o de etapas a todos os tï¿½cnicos e administradores.
- Removidas restriï¿½ï¿½es que travavam o checklist e o programa CNC apenas para o tï¿½cnico responsï¿½vel direto.
- Perfil Engenharia de Produto permanece restrito a visualizaï¿½ï¿½o e cadastro.
---------------------------------------


- PATCH: Ocultada a tag de prazo visual em etapas que nï¿½o estï¿½o concluï¿½das e adicionada limpeza automï¿½tica de prazoAnalise e prazos pendentes ao retroceder ou voltar etapas.


- PATCH: Preservaï¿½ï¿½o da posiï¿½ï¿½o de rolagem horizontal (scrollLeft) no Kanban ao navegar entre visï¿½es, abrir projetos ou utilizar a tecla ESC ou botï¿½o voltar.


---------------------------------------
VERSï¿½O 1.5.0
---------------------------------------

Data:
27/07/2026

Objetivo:
Criar modo e perfil de acesso de Visitante sem senha, permitindo apenas visualizaï¿½ï¿½o de desenvolvimentos e status sem alterar nada.

Arquivos alterados:
public/index.html

Novidades e Alteraï¿½ï¿½es:
- Adicionado o botï¿½o '??? Entrar como Visitante (sem senha)' na tela inicial de login.
- Criado o perfil de usuï¿½rio Visitante em modo estritamente de leitura (sem permissï¿½o para alterar, criar ou movimentar itens).
- Adicionada opï¿½ï¿½o de papel Visitante no painel de gestï¿½o de usuï¿½rios.
---------------------------------------


- PATCH: Ajustado o texto do botï¿½o de acesso visitante para 'Entrar como visitante' (removidos emoji e sufixo).


- PATCH: Configuraï¿½ï¿½o da tag favicon (<link rel="icon">) vinculada ao logotipo do sistema para substituir o ï¿½cone genï¿½rico do navegador na aba.


- PATCH: Atualizado o ï¿½cone favicon da aba do navegador para a nova imagem 3D metï¿½lica com circuitos da Viemar (public/favicon.png).


- PATCH: Recorte ajustado (cropping 1:1) e geraï¿½ï¿½o de ï¿½cones multi-resoluï¿½ï¿½o (.ico e .png 256x256) do favicon 3D da Viemar para garantir nitidez mï¿½xima na aba do navegador.


- PATCH: Atualizado o favicon para a imagem oficial fornecida (favicon_oficial.png), gerando os arquivos de ï¿½cone favicon.png e favicon.ico otimizados.


- PATCH: Remoï¿½ï¿½o do fundo escuro do favicon oficial com suavizaï¿½ï¿½o de bordas alpha (transparï¿½ncia transparente .png e .ico).





---------------------------------------
VERSÃO 2.4.0
---------------------------------------

Data:
12/08/2026

Objetivo:
Integração em tempo real de saldo de estoque do ERP via Firebase.

Arquivos alterados:
public/index.html
script_estoque/sincronizar_estoque.py (Novo)

Novidades e Alterações:
- Criado script Python sincronizar_estoque.py que consulta a planilha de saldo do ERP, dispara atualização no Power Query invisivelmente e sobe os saldos para o Firebase (coleção estoque).
- Front-end do DevFlow atualizado para assinar a coleção estoque em tempo real.
- Na aba de Detalhes do Projeto, os componentes (Produto Final, Alojamento, Pino, Forjados) agora exibem um selo informando se há saldo no ERP ("Em Estoque" verde ou "Sem Estoque" vermelho).
---------------------------------------

---------------------------------------
VERSÃO 2.4.1
---------------------------------------

Data:
12/08/2026

Objetivo:
Melhorias visuais no selo de estoque.

Arquivos alterados:
public/index.html

Correções realizadas:
- Formatação dos números de estoque com separador de milhar (ex: 7.080 pçs).
- Inserido status "Não Encontrado" (cinza) para referências cadastradas no sistema do projeto que não constam na planilha do ERP.
---------------------------------------

---------------------------------------
VERSÃO 2.4.2
---------------------------------------

Data:
12/08/2026

Objetivo:
Omitir cobrança de prazo na etapa de Validação/FO050.

Arquivos alterados:
public/index.html

Correções realizadas:
- O sistema não exige mais que o técnico informe um prazo ao avançar para a etapa "Validação/FO050". Em vez disso, ele avança a etapa de forma automática e silenciosa, gerando a anotação padrão "Aguardando data do PCP" no histórico, visto que o cronograma dessa fase é regido externamente.
---------------------------------------

---------------------------------------
VERSÃO 2.4.3
---------------------------------------

Data:
12/08/2026

Objetivo:
Visualização do prazo 'Aguardando PCP' no Status Report.

Arquivos alterados:
public/index.html

Correções realizadas:
- O painel executivo (Status Report) e o checklist interno do projeto agora exibem explicitamente a mensagem 'Aguardando PCP' com ícone de relógio quando um desenvolvimento atinge a etapa de Validação/FO050, substituindo o antigo cálculo de dias até o lançamento.
---------------------------------------

---------------------------------------
VERSÃO 2.4.4
---------------------------------------

Data:
12/08/2026

Objetivo:
Pacote de melhorias visuais e funcionais para a aba de Montagem.

Arquivos alterados:
public/index.html

Correções realizadas:
- O painel global de 'Movimentações e Notificações' agora exibe também todo o histórico de avanço de etapas, comentários, reaberturas e atribuições feitos exclusivamente no fluxo de Montagem.
- O Kanban da Montagem passou a priorizar (colocar no topo das colunas) os desenvolvimentos que já tiveram sua Usinagem 100% concluída, facilitando a identificação do que já está fisicamente pronto para montar.
- Adicionada uma badge verde 'Usinado' nos cards da Montagem sempre que a peça já passou por todo o processo de usinagem.
- Adicionados os filtros 'Somente Usinados' e 'Aguardando Usinagem' na barra superior quando o módulo de montagem está ativo.
- A barra de pesquisa global passou a encontrar os nomes de ferramentas cadastradas no fluxo de montagem.
---------------------------------------

---------------------------------------
VERSÃO 2.4.5
---------------------------------------

Data:
13/08/2026

Objetivo:
Segundo pacote de melhorias visuais e funcionais para o fluxo de Montagem.

Arquivos alterados:
public/index.html

Correções realizadas:
- O quadro Kanban (Usinagem e Montagem) ganhou uma nova coluna 'Concluído', impedindo que itens finalizados desapareçam da visão.
- O Status Report da Montagem recebeu um novo filtro rápido 'Movimentados', agrupando os itens que já saíram do zero.
- A tabela do Status Report da Montagem agora prioriza automaticamente no topo todos os itens com histórico de movimentação.
- Adicionado botão 'Editar Dados da Montagem' na view do projeto, permitindo alterar responsável, desenho de conjunto e OP facilmente.
- Modal da etapa FO050 da Montagem simplificado: remoção da exigência de máquina e unificação dos campos Data de Execução e OP (informados apenas uma vez por FO).
---------------------------------------

---------------------------------------
VERSÃO 2.4.6
---------------------------------------

Data:
13/08/2026

Objetivo:
Correção de alinhamento visual no Status Report.

Arquivos alterados:
public/index.html

Correções realizadas:
- Ajuste de espaçamento (gap) entre o ícone (ponto de cor) e os textos 'No Prazo' e 'Movimentados' nos cartões de filtro do Status Report.
---------------------------------------

---------------------------------------
VERSÃO 2.4.7
---------------------------------------

Data:
13/08/2026

Objetivo:
Implementação do sistema de alerta automático de novas versões.

Arquivos alterados:
public/index.html
public/version.json

Correções realizadas:
- O sistema agora verifica automaticamente (em plano de fundo e a cada vez que a janela é focada) se existe uma versão mais atualizada disponível no servidor.
- Caso uma nova versão seja detectada, um banner não-intrusivo é exibido no topo da tela sugerindo o recarregamento rápido.
---------------------------------------

---------------------------------------
VERSÃO 2.4.8
---------------------------------------

Data:
13/08/2026

Objetivo:
Reestruturação total da arquitetura de inteligência e usabilidade dos Dashboards (Operacional e Gerencial).

Arquivos alterados:
public/index.html
public/version.json

Correções realizadas:
- Dashboard Operacional: Foco total em fila e ação imediata.
- Dashboard Operacional: Adicionado Tabela Acionável "Top 10 Projetos Críticos" (ordenada por atraso com botão rápido para ir até o projeto).
- Dashboard Operacional: Gráfico de Roscas substituído por Barra Empilhada mostrando o volume da fila por responsável (cruzamento com o que está no prazo vs atrasado).
- Dashboard Gerencial: Limpeza de métricas redundantes que já existiam no operacional (Foco transferido para análise histórica).
- Dashboard Gerencial: Adicionado gráfico temporal "Evolução do Lead Time Histórico" (Evolução média de performance mês a mês).
- Dashboard Gerencial: Gráfico de Responsáveis convertido para Gráfico de Barras Horizontais para melhor visualização e comparação quantitativa.
---------------------------------------

---------------------------------------
VERSÃO 2.4.9
---------------------------------------

Data:
14/08/2026

Objetivo:
Implementação do Plano Analítico (Fase 2) nos Dashboards Operacional e Gerencial para maior qualidade de diagnóstico.

Arquivos alterados:
public/index.html
public/version.json

Correções realizadas:
- Função Mediana: Substituição de médias puras por cálculo de Mediana de Lead Time para desconsiderar distorções e refletir o comportamento típico.
- Proteção contra dados vazios (zero vs null): Gráficos e indicadores agora demonstram claramente 'Dados insuficientes' no lugar de desenhar informações não-existentes.
- Dashboard Operacional: Adicionado WIP (Carteira Ativa) por etapa (ao invés de gargalo histórico).
- Dashboard Operacional: Adicionado Gráfico de Distribuição de 'Aging' para visualizar tempo de paralisia na etapa atual (0-3d, 4-7d, etc).
- Dashboard Operacional: KPI de alerta para percentual da carteira com a flag 'Sem Responsável'.
- Dashboard Operacional: Tabela de Top 10 expandida para incluir Código/Cliente e Etapa/Responsável juntos para melhor uso do espaço.
- Dashboard Gerencial: Gráfico de 'Tempo Médio por Etapa' transformado em barras horizontais ordenadas da etapa mais crítica para a mais rápida.
- Dashboard Gerencial: Adição do indicador de Throughput (entregas realizadas no mês vs mês anterior).
- Dashboard Gerencial: Gráfico de 'Projetos por Cliente' convertido para exibir ranking ordenado com base no volume da carteira.
---------------------------------------
VERSÃO 2.4.10
---------------------------------------

Data:
17/08/2026

Objetivo:
Otimizações de scripts backend e controle de versionamento.

Arquivos alterados:
- .agents/AGENTS.md
- script_estoque/sincronizar_estoque.py
- script_estoque/Atualizar_Estoque_DevFlow.bat
- .gitignore

Funcionalidades adicionadas / Correções:
- Correção do cálculo de total de itens atualizados no script de sincronização de estoque (total_atualizados separado).
- Inclusão do arquivo firebase-key.json no .gitignore.
- Formalização das regras de deploy no arquivo de agentes.
---------------------------------------

