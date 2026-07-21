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
