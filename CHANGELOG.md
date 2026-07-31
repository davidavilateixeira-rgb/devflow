# HistÃ³rico de VersÃµes (Changelog)

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
VERSÃO 1.0.1
---------------------------------------

Data:
19/07/2026

Objetivo:
Exibir a versão atual na interface do sistema.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Tag de versão visual no painel de login e na barra lateral (sidebar).

Funcionalidades alteradas:
Nenhuma

Correções realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrão)

Observações:
Alteração puramente visual para facilitar o controle de versão pelos usuários.
---------------------------------------

---------------------------------------
VERSÃO 1.0.2
---------------------------------------

Data:
19/07/2026

Objetivo:
Substituir o logotipo genérico pelo logotipo oficial da Viemar.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Inclusão do logotipo oficial (logo_viemar.png) na tela de login e barra lateral.

Funcionalidades alteradas:
Nenhuma

Correções realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrão)

Observações:
Melhoria de identidade visual (Branding).
---------------------------------------

---------------------------------------
VERSÃO 1.0.3
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
? O botão de 'Voltar' na capa do projeto agora retorna dinamicamente para a tela em que o usuário estava (Kanban ou Lista), em vez de voltar obrigatoriamente para o Kanban.
? Atualização da tag de versão na interface para v1.0.3.

Correções realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrão)

Observações:
Melhoria de UX solicitada.
---------------------------------------

---------------------------------------
VERSÃO 1.0.4
---------------------------------------

Data:
20/07/2026

Objetivo:
Corrigir a invisibilidade de projetos da etapa Programa CNC no Kanban e em Gráficos.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
Nenhuma.

Funcionalidades alteradas:
? Atualização da tag visual na interface para v1.0.4.

Correções realizadas:
? Criada a constante estrutural TODAS_ETAPAS contendo o mapeamento de ambos os fluxos.
? Ajustado o renderKanban para processar todas as etapas conjuntas, garantindo que projetos no fluxo simplificado na etapa Programa CNC não fiquem mais presos no limbo.
? Gráficos do Dashboard e Filtros da Movimentação atualizados para considerar a matriz completa.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrão).

Observações:
Resolução de bug relatado na tela de Kanban.
---------------------------------------

---------------------------------------
VERSÃO 1.1.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar ID de Cadastro (DEV-XXX) e lógica de ordenação de filas por FIFO (First-In, First-Out).

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? ID Sequencial de Cadastro visível na interface para todos os projetos (formato DEV-XXX).
? Identificação retroativa no banco de dados para todos os projetos antigos seguindo a data exata de criação.
? Nova lógica de renderização automática na tela de Kanban e Lista que empata a Previsão de Lançamento desempatando pela Data de Início (projetos mais antigos ficam no topo).

Funcionalidades alteradas:
? Tag de versão visual na interface para v1.1.0.

Correções realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padrão).

Observações:
Melhoria estrutural na forma como a equipe prioriza seus desenvolvimentos com base no histórico de chegada (FIFO).
---------------------------------------

---------------------------------------
VERSÃO 1.1.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de inicialização.

Arquivos alterados:
public/index.html

Correções realizadas:
? Inserida trava lógica para impedir loop infinito gerado pelo script retroativo de migração, liberando a interface.
---------------------------------------

---------------------------------------
VERSÃO 1.1.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de renderização.

Arquivos alterados:
public/index.html

Correções realizadas:
? Correção de sintaxe que impedia o carregamento do Kanban, restaurando o acesso normal ao aplicativo.
---------------------------------------

---------------------------------------
VERSÃO 1.1.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix visual: adicionar ID à tela de lista.

Arquivos alterados:
public/index.html

Correções realizadas:
? Adicionado selo de DEV-XXX ao lado da Referência do Produto na visualização em grade (Lista) a pedido do usuário.
---------------------------------------

---------------------------------------
VERSÃO 1.1.4
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
VERSÃO 1.2.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar filtro múltiplo por status.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Adicionada nova opção 'Status' na barra de filtros avançados (ao lado de Lançamento, Responsável e Família), permitindo filtrar visualmente por status como 'No Prazo', 'Atenção', 'Atrasado' e 'Concluído'.
---------------------------------------

---------------------------------------
VERSÃO 1.2.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de filtro de Status.

Arquivos alterados:
public/index.html

Correções realizadas:
? Correção do bug de case-sensitivity no filtro de Status. O sistema não estava reconhecendo a opção 'No prazo' com p minúsculo, nem 'Aguardando Técnico'. As opções foram sincronizadas com o banco de dados.
---------------------------------------

---------------------------------------
VERSÃO 1.2.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do dropdown de Status.

Arquivos alterados:
public/index.html

Correções realizadas:
? Corrigido bug visual em que clicar na caixa de seleção de Status mantinha a caixa de Família aberta ou com comportamento anômalo devido à gestão de IDs de dropdown.
---------------------------------------

---------------------------------------
VERSÃO 1.2.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do filtro de Status.

Arquivos alterados:
public/index.html

Correções realizadas:
? Sincronizada a lista de filtros de status na barra de buscas para corresponder exatamente à régua de status real de negócio retornada pelo sistema (Em Andamento, Atrasado, Em Validação, etc.), no lugar dos antigos marcadores de prazo.
---------------------------------------

---------------------------------------
VERSÃO 1.2.4
---------------------------------------

Data:
22/07/2026

Objetivo:
Hotfix de avanço automático da etapa Liberação.

Arquivos alterados:
public/index.html

Correções realizadas:
? Corrigido o bug onde concluir a etapa 'Validação/FO050' concluía automaticamente a etapa 'Liberação' em seguida.
? Corrigido o comportamento do botão de desmarcar etapa, que agora reverte corretamente a caixa selecionada de volta ao seu estado pendente (como atual).
? Migração transparente de projetos antigos que já estavam 100% concluídos.
---------------------------------------

---------------------------------------
VERSÃO 1.3.0
---------------------------------------

Data:
22/07/2026

Objetivo:
Suporte a múltiplos processos na etapa de Validação/FO050.

Arquivos alterados:
public/index.html

Novidades e Alterações:
? Adicionada a capacidade de inserir múltiplos processos de fabricação dentro dos dados da FO050.
? Implementada lista pré-definida de processos (USI CAIXA, USI PINO, FR EQUIPTOP, etc).
? Cada processo possui sua própria máquina, tempo de usinagem, tempo de troca, número de OP e data de execução.
? O painel de Detalhes do Projeto e o painel de edição foram refeitos para listar e somar automaticamente todos os processos parciais.
? Realizada migração retroativa transparente, onde itens mais antigos com estrutura de máquina única foram convertidos para o novo formato preservando os dados originais.
---------------------------------------


- PATCH: Correção na exibição dos processos FO050 no detalhamento do projeto e ajuste de foco nos campos de input ao editar a FO050 (bugfix).


- PATCH: Tratamento de erros ao tentar retroceder etapas (Voltar/Desmarcar) em projetos sem histórico ou comentários prévios iniciados (bugfix).


- PATCH: Corrigido problema estrutural onde retroceder etapas em desenvolvimentos com histórico irregular (ex: pulos manuais) não alterava o estado na tela, pois o histórico era lido via índice em vez do nome da etapa.

---------------------------------------
VERSÃO 1.4.0
---------------------------------------

Data:
24/07/2026

Objetivo:
Permitir que qualquer técnico possa manipular desenvolvimentos/atividades, mesmo que assumidos por outro técnico.

Arquivos alterados:
public/index.html

Novidades e Alterações:
- Atualizada a regra de gerenciamento (podeGerenciar) para conceder permissão de edição e movimentação de etapas a todos os técnicos e administradores.
- Removidas restrições que travavam o checklist e o programa CNC apenas para o técnico responsável direto.
- Perfil Engenharia de Produto permanece restrito a visualização e cadastro.
---------------------------------------


- PATCH: Ocultada a tag de prazo visual em etapas que não estão concluídas e adicionada limpeza automática de prazoAnalise e prazos pendentes ao retroceder ou voltar etapas.


- PATCH: Preservação da posição de rolagem horizontal (scrollLeft) no Kanban ao navegar entre visões, abrir projetos ou utilizar a tecla ESC ou botão voltar.


---------------------------------------
VERSÃO 1.5.0
---------------------------------------

Data:
27/07/2026

Objetivo:
Criar modo e perfil de acesso de Visitante sem senha, permitindo apenas visualização de desenvolvimentos e status sem alterar nada.

Arquivos alterados:
public/index.html

Novidades e Alterações:
- Adicionado o botão '??? Entrar como Visitante (sem senha)' na tela inicial de login.
- Criado o perfil de usuário Visitante em modo estritamente de leitura (sem permissão para alterar, criar ou movimentar itens).
- Adicionada opção de papel Visitante no painel de gestão de usuários.
---------------------------------------


- PATCH: Ajustado o texto do botão de acesso visitante para 'Entrar como visitante' (removidos emoji e sufixo).


- PATCH: Configuração da tag favicon (<link rel="icon">) vinculada ao logotipo do sistema para substituir o ícone genérico do navegador na aba.


- PATCH: Atualizado o ícone favicon da aba do navegador para a nova imagem 3D metálica com circuitos da Viemar (public/favicon.png).


- PATCH: Recorte ajustado (cropping 1:1) e geração de ícones multi-resolução (.ico e .png 256x256) do favicon 3D da Viemar para garantir nitidez máxima na aba do navegador.


- PATCH: Atualizado o favicon para a imagem oficial fornecida (favicon_oficial.png), gerando os arquivos de ícone favicon.png e favicon.ico otimizados.


- PATCH: Remoção do fundo escuro do favicon oficial com suavização de bordas alpha (transparência transparente .png e .ico).

