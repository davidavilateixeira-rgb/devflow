## [2.18.0] - 2026-09-04

### Adicionado
- Conclui automaticamente a etapa "Fornecedor" quando o ERP confirma a entrada da NF, e avanca o desenvolvimento para "Recebimento", onde o tecnico confirma que a ferramenta esta ok.
- Carimba a etapa com a data da entrada da NF informada pelo ERP, e nao com a data do dia.
- Registra o avanco nos comentarios do desenvolvimento e marca a OC como "Recebida" no follow-up.
- Adiciona teste de regressao em `scripts/test_entrada_nf.mjs`.

### Regras adotadas
- So avanca quando TODAS as OCs do desenvolvimento registram entrada de NF. Entrega parcial mantem a etapa em "Fornecedor".
- A data usada e a da ultima entrada entre as OCs.
- So avanca a partir da propria etapa "Fornecedor": nunca pula etapas intermediarias.
- Vale apenas para o fluxo com fixacao, unico em que a etapa "Fornecedor" existe.

### Seguranca e dados
- O avanco acontece como continuacao do clique em "Atualizar" no follow-up: somente o navegador que pediu a consulta grava, e uma unica vez por pedido.
- Carregar o app continua sem gravar no banco, conforme a v2.17.0.
- Respeita a permissao de gerenciar a Usinagem e o modo somente consulta do Firestore.

### Validacao
- 7 cenarios cobertos pelo novo teste: entrada completa, entrega parcial, sem OC no ERP, desenvolvimento em outra etapa, fluxo simples, resposta do ERP ainda pendente e a funcao de data isolada.
- Sintaxe JavaScript validada sem erros.
- Versao `2.18.0` consistente entre interface, `VERSAO_ATUAL` e `public/version.json`.
- Teste de regressao do relatorio FO050 aprovado.
- Tela de login renderizada no servidor local sem erros de console.

### Backup
- Backup exato anterior: `backups/index_v2.17.0.html`.
- SHA-256: `4AD9568A110563A57C5FCE5A78C8944491041D27A828DE61D55151F49B222855`.

## [2.17.0] - 2026-09-04

### Alterado
- Carregar o app deixa de gravar no banco. As normalizacoes de `normalizarProjeto` passam a valer somente em memoria.
- Remove a gravacao automatica da migracao de cadastro no ERP disparada pelo `onSnapshot` dos projetos.
- Remove a migracao retroativa que atribuia `DEV-XXX` durante a inicializacao. Os 87 desenvolvimentos ja possuem `devId` e o cadastro de novos continua atribuindo o proximo numero.
- Migracao de dados passa a ser rotina de manutencao conferida, e nao efeito colateral de abrir a tela.

### Seguranca e dados
- Alterar "necessita nova fixacao" no cadastro de um desenvolvimento em andamento agora exige confirmacao, com a lista das etapas que serao descartadas do historico.
- Registra nos comentarios do desenvolvimento a troca de fluxo e as etapas removidas.
- O comportamento de recuar para a Analise permanece o mesmo; apenas deixa de acontecer em silencio.

### Validacao
- Sintaxe JavaScript validada sem erros.
- Versao `2.17.0` consistente entre interface, `VERSAO_ATUAL` e `public/version.json`.
- Teste de regressao do relatorio FO050 aprovado.
- Cenarios da migracao de cadastro no ERP reexecutados sem alteracao de comportamento.
- Tela de login renderizada no servidor local sem erros de console.
- Levantamento no Firestore confirmou 87 de 87 desenvolvimentos com `devId` antes da remocao da migracao retroativa.

### Backup
- Backup exato anterior: `backups/index_v2.16.2.html`.
- SHA-256: `9AAC8C43B3EA8C618B0031405277363E3E4E90315A1CB514321B2BF4C8FD987D`.

## [2.16.2] - 2026-09-04

### Alterado
- A migracao de etapas de cadastro no ERP (v2.5.0) deixa de mover o desenvolvimento em aberto para tras.
- Ela passa a apenas completar o historico dos desenvolvimentos ja concluidos que nao registram as duas etapas de cadastro no ERP.
- Motivo: o ramo removido nunca atendeu um caso legitimo. As tres vezes que executou, corrompeu o historico de desenvolvimentos que percorriam o fluxo novo. O unico caso legitimo observado (DEV-030, 21/08) usou o ramo que insere as etapas sem apagar nada.
- Levantamento no Firestore: nenhum dos 58 desenvolvimentos ainda sem o marcador de migracao esta parado em "Liberacao", entao o ramo removido nao tinha mais destinatario.

### Validacao
- Cenarios da migracao verificados: fluxo novo intacto, legado em aberto intacto, legado concluido ainda recebe as duas etapas, migracao ja aplicada permanece inerte.
- Sintaxe JavaScript validada sem erros.
- Versao `2.16.2` consistente entre interface, `VERSAO_ATUAL` e `public/version.json`.
- Teste de regressao do relatorio FO050 aprovado.
- 16 testes unitarios da integracao de compras aprovados.
- 5 testes unitarios da integracao de estoque aprovados.

### Backup
- Backup exato anterior: `backups/index_v2.16.1.html`.
- SHA-256: `0D3223846235CE6C6DE427AA347E51CCA6AEDDD07F5401E5E965EB0A3194AB21`.

## [2.16.1] - 2026-09-04

### Corrigido
- Corrige o retrocesso automatico do desenvolvimento que avancava para a etapa "Liberacao".
- A migracao de etapas de cadastro no ERP (v2.5.0) apagava do historico as etapas "Revisar/Atualizar cadastro no ERP", "Aprovar cadastro no sistema ERP" e "Liberacao" e devolvia o projeto para a primeira etapa de ERP, com a tela piscando durante a regravacao.
- A migracao passa a ser aplicada somente aos projetos legados, que chegaram a "Liberacao" sem nenhuma das duas etapas de cadastro no ERP no historico.
- Vale para os modulos Usinagem e Montagem, que compartilham a mesma rotina de migracao.

### Validacao
- Cenarios da migracao verificados na v2.16.0 e na v2.16.1: fluxo novo preservado apos a correcao, migracao legada em aberto e legada concluida mantidas, migracao ja aplicada permanece inerte.
- Sintaxe JavaScript validada sem erros.
- Versao `2.16.1` consistente entre interface, `VERSAO_ATUAL` e `public/version.json`.
- Teste de regressao do relatorio FO050 aprovado.
- 16 testes unitarios da integracao de compras aprovados.
- 5 testes unitarios da integracao de estoque aprovados.

### Backup
- Backup exato anterior: `backups/index_v2.16.0.html`.
- SHA-256: `3107139388EBF620D57DDFFCC658E9655DCE036BAB38A6F5C4BF6352CF4D9396`.

## [2.16.0] - 2026-08-27

### Adicionado
- Inclui o botão `Imprimir FO050` nos dados FO050 do desenvolvimento, disponível nos módulos Usinagem e Montagem.
- Gera uma aba exclusiva com documento A4 pronto para impressão ou salvamento em PDF.
- Preenche automaticamente identificação do desenvolvimento, componentes, referências, ferramentas, responsável, processos, células ou linhas, máquinas ou postos, tempos, data de execução e OP.
- Inclui no documento a tabela para assinatura manual das áreas Qualidade, Produção, Preset, Engenharia de Produto e Engenharia de Processo.
- Adiciona o campo `Observações da FO050` aos formulários de Usinagem e Montagem.
- Adiciona teste de regressão do relatório em `scripts/test_relatorio_fo050.mjs`.

### Segurança e dados
- Escapa os dados do cadastro antes de inseri-los no documento de impressão.
- Mantém as assinaturas fora do banco nesta etapa; os campos permanecem em branco para preenchimento manual após a impressão.
- Aguarda a confirmação do Firestore antes de fechar o formulário FO050 de Usinagem e restaura os dados anteriores se a gravação falhar.
- Preserva os dados existentes: o único campo persistente novo é a observação específica da FO050.

### Validação
- Sintaxe JavaScript validada sem erros.
- Versão `2.16.0` consistente entre interface, `VERSAO_ATUAL` e `public/version.json`.
- 16 testes unitários da integração de compras aprovados.
- 5 testes unitários da integração de estoque aprovados.
- Relatórios de Usinagem e Montagem validados pelo novo teste automatizado.
- Prévia de Usinagem renderizada em HTML e PDF A4 sem sobreposição, com todos os blocos e assinaturas em uma página no cenário de teste.

### Backup
- Backup exato anterior: `backups/index_v2.15.1.html`.
- SHA-256: `FC321BF6A66F31E37473AE00103DDE0F6F450BF257DA6B78CE631ABD277C8EAC`.

## [2.15.1] - 2026-08-24

### Corrigido
- Reconhece entradas de NF vinculadas diretamente ao item da OC ou por meio da tabela de baixa `OCITEMBX`.
- Corrige OCs recebidas que permaneciam como "Aguardando entrega" e "Sem NF" no Follow-up de Compras.
- Mantém a deduplicação por item de NF para evitar soma duplicada quando os dois vínculos existirem.

### Observabilidade
- Registra as execuções relevantes e os erros do conector em `script_compras/logs/compras.log`.
- Mantém a execução invisível pelo Agendador de Tarefas, agora com histórico persistente para diagnóstico.

### Validação
- SQL validada no ERP com a OC 1288813, localizando a NF 5265 e sua entrada em 21/08/2026.
- Testes unitários da integração de SC/OC aprovados, incluindo cobertura dos dois caminhos de recebimento.
- Sintaxe Python e JavaScript validadas sem erros.
- Versão da interface e do arquivo de atualização validadas.

### Backup
- Backup exato anterior: `backups/index_v2.15.0.html`.
- SHA-256: `80553E20E986E4C5FECBFBD7F0539A5D4FCBB28DEED1C3945E46A5376B546D7C`.

## [2.15.0] - 2026-08-21

### Alterado
- Limita a consulta e a atualização de saldos aos componentes de desenvolvimentos que estejam até a etapa Validação/FO050, inclusive.
- Aplica o limite corretamente tanto ao fluxo completo quanto ao fluxo simplificado, usando a posição da FO050 em cada fluxo.
- Considera somente as referências de alojamento, forjado do alojamento, pino e forjado do pino.
- Preserva no Firestore os saldos históricos dos projetos que já passaram da FO050, sem novas leituras ou alterações nesses documentos.
- Exibe no cadastro que o saldo deixou de ser monitorado quando o desenvolvimento já passou da FO050.

### Otimização de cota
- Substitui a assinatura da coleção inteira de estoque por consultas em lotes contendo somente os códigos atualmente necessários.
- Faz o sincronizador consultar os projetos primeiro e ler no estoque apenas os documentos dos componentes elegíveis.
- Mantém a regra de gravar somente quando o saldo efetivamente mudou.

### Validação
- 5 testes unitários aprovados para os fluxos completo e simplificado, seleção das referências e filtragem da planilha.
- Sintaxe Python e JavaScript validadas sem erros.
- Versão da interface e do arquivo de atualização validadas.

### Backup
- Backup exato anterior: `backups/index_v2.14.1.html`.
- SHA-256: `9342D83B6439798E38732EFE8F726000BB717CDD5AB996B6904ED043659B9704`.

## [2.14.1] - 2026-08-21

### Corrigido
- Corrige o botao Gravar Dados da FO050 de Montagem, que era interrompido ao tentar acessar campos inexistentes.
- Inclui Data de Execucao e Numero da OP no modal da FO050 de Montagem.
- Aplica a Data de Execucao e a OP a todos os processos de Montagem e Embalagem.
- Permite gravar no modo livre sem exigir os campos obrigatorios da conclusao da etapa.
- Fecha o modal somente depois da confirmacao de gravacao no Firestore.
- Restaura os dados anteriores se a gravacao falhar e preserva o cadastro ao cancelar.

### Validacao
- Sintaxe JavaScript, versao e estrutura do modal validadas.
- 15 testes unitarios da integracao de compras aprovados.

### Backup
- Backup exato anterior: `backups/index_v2.14.0.html`.
- SHA-256: `AE48B601AAADED77188D57FC1D847FA0C24F97E097D256F3BC6A0B0A08FB818D`.

## [2.14.0] - 2026-08-21

### Adicionado
- Permite editar a previsao manual de chegada diretamente na tabela de Follow-up de Compras.
- Registra a alteracao no historico do follow-up e nos comentarios do desenvolvimento.
- Oferece Salvar, Cancelar, Enter para confirmar e Esc para cancelar.

### Alterado
- Move Compras / ERP para abaixo dos dados FO050 no cadastro do desenvolvimento.
- Mantem a secao Compras / ERP recolhida por padrao e abre sob demanda.
- Ajusta os cards de SC e OC para ocupar o espaco disponivel de forma adaptativa.
- Amplia a coluna de previsao para acomodar a edicao sem sobreposicao.
- Mantem a atualizacao do ERP separada da edicao da previsao do fornecedor.

### Seguranca e dados
- Mantem a previsao do fornecedor como dado manual, sem substituicao pela consulta ao ERP.
- Restringe a edicao aos perfis com acesso ao Follow-up de Compras.
- Reverte a alteracao local se a gravacao no Firestore falhar.

### Validacao
- 15 testes unitarios da integracao de compras aprovados.
- Versao e sintaxe JavaScript validadas sem erros.
- Estrutura e alinhamentos revisados estaticamente; a automacao visual ficou indisponivel no caminho de rede.

### Backup
- Backup exato anterior: `backups/index_v2.13.0.html`.
- SHA-256: `AAF6D21F58344A3C4701C7D7BB3772ED9419CE82F687E6A18B4B16DDCCC4BACC`.

## [2.13.0] - 2026-08-21

### Alterado
- Simplifica a tabela do Follow-up de Compras para item, ferramentas, SC, OC, etapa da compra, NF/data e previsao manual de chegada.
- Move o report detalhado de SC/OC para o cadastro do desenvolvimento.
- Mantem na lista somente o botao de atualizacao individual e o acesso ao cadastro pelo clique da linha.

### Integracao ERP
- Remove a previsao de entrega do ERP do retorno e da interface.
- Torna a previsao informada pelo fornecedor a unica fonte para prazo e atraso.
- Preserva a previsao manual em sincronizacoes e retrocessos de etapa.
- Mantem NF, data de entrada e status de recebimento como dados automaticos do ERP.
- Executa a tarefa recorrente com `pythonw.exe`, sem abrir janela para o usuario.

### Corrigido
- Reprocessa o P360225 e carrega a OC 1291023 como aguardando entrega.
- Preserva a previsao manual de 03/09/2026 durante a correcao do item.

### Validacao
- 15 testes unitarios aprovados.
- Versao, JavaScript e PowerShell validados sem erros.
- Layout validado em navegador a 1600 px, sem transbordamento horizontal do corpo.
- Cadastro validado com o report completo e a lista com somente os campos aprovados.

### Backup
- Backup exato anterior: `backups/index_v2.12.3.html`.
- SHA-256: `C3BB5116D5309E665943C4B2A43A8F26C5D1127DDEBB999CAD7F26DA7F6D9C38`.
## [2.12.3] - 2026-08-21

### Corrigido
- Substitui o processo continuo do conector por execucoes curtas a cada dois minutos.
- Cada ciclo consulta somente documentos marcados como solicitado e encerra com retorno controlado.
- O Firebird somente e aberto quando existe uma solicitacao pendente.
- Adiciona alerta visual quando o conector leva cinco minutos ou mais para responder.

### Operacao
- Adiciona `Configurar_Tarefa_ERP_DevFlow.ps1` para instalar ou atualizar o agendamento.
- Mantem o modo `--watch` apenas para diagnostico, fora da tarefa agendada.
- P360228 reprocessado com sucesso: SC convertida em OC e OC aguardando entrega.
- Recorrencia real validada em ciclos consecutivos, ambos com codigo de retorno zero.

### Backup
- Backup exato anterior: `backups/index_v2.12.2.html`.
- SHA-256: `4B948EEA612D79E4A5BB159DF110A62BA4A50D590252AF610FF8D435155A2838`.
## [2.12.2] - 2026-08-21

### Alterado
- O botao principal do ERP atualiza somente desenvolvimentos anteriores a FO050 com follow-up necessario.
- A confirmacao informa a quantidade exata de desenvolvimentos que serao consultados.
- A atualizacao geral permanece separada e disponivel apenas para administradores.

### Interface
- Reorganiza a tabela de compras horizontalmente, com SC e OC em colunas independentes.
- Remove as colunas redundantes de status manual da tabela e prioriza o report oficial do ERP.
- Agrupa ferramentas com o desenvolvimento e responsavel com o proximo follow-up.
- Compacta as larguras para exibir todas as acoes em telas desktop e manter rolagem interna em telas menores.

### Validacao
- Regra seletiva validada com itens antes e depois da FO050.
- Layout validado em 1600 px sem rolagem e em 1366 px com rolagem restrita a tabela.

### Backup
- Backup exato anterior: `backups/index_v2.12.1.html`.
- SHA-256: `19F689A7703D527A76252BB499808BD2023AFBC07D118C5EED7D78C9AFAF7FA6`.
## [2.12.1] - 2026-08-20

### Alterado
- Remove todas as varreduras automaticas do conector SC/OC.
- O monitor passa a reagir somente aos documentos solicitados pelos botoes ERP.
- Mantem a atualizacao geral apenas como acao manual confirmada pelo usuario.

### Protecao
- Adiciona modo somente consulta quando o Firestore retorna cota esgotada ou indisponibilidade.
- Exibe alerta global, bloqueia gravacoes e tenta reconectar a cada cinco minutos.
- Adiciona confirmacao visual de sucesso nas gravacoes.

### Corrigido
- Atualiza comentarios, anexos e ferramentas imediatamente apos salvar, sem depender apenas do listener.
- Torna o botao Gravar Alteracoes da Montagem independente do evento global do navegador.

### Backup
- Backup exato anterior: `backups/index_v2.12.0.html`.
- SHA-256: `21CCF6189917778A13B78CF3C8EB0B734E724FF485487E910B6E5FF3BE75A984`.
## [2.12.0] - 2026-08-20

### Adicionado
- Integra o acompanhamento de OC ao Tecnicon em modo somente leitura.
- Exibe aprovador previsto/efetivo, comprador, fornecedor, envio, prazo, entrada de NF e percentual recebido.
- Adiciona indicadores e filtros de aprovacao, envio, entrega, atraso e recebimento.
- Mantem o cadastro manual separado do report oficial do ERP.

### Corrigido
- O monitor consulta somente documentos marcados como `solicitado` nos ciclos de 15 segundos, evitando releitura completa e consumo excessivo da cota do Firestore.
- O recebimento automatico somente e concluido quando existe entrada de NF no ERP.

### Validacao
- 14 testes unitarios aprovados.
- Consultas reais validadas para OC pendente de aprovacao, aguardando entrega, atrasada e recebida.
- Interface e modal validados em navegador, sem sobreposicao no corpo e com rolagem interna.

### Backup
- Backup exato anterior: `backups/index_v2.11.2.html`.
- SHA-256: `29263E374878C91EEDF7B4CD34ECAC0A49EBA6A650B499EDE8F30962F8003440`.
## [2.11.2] - 2026-08-20

### Corrigido
- Adapta o hook `predeploy` para executar o validador por meio do caminho absoluto `$PROJECT_DIR`, compatível com o `cmd.exe` quando o repositório está em uma unidade UNC.
- A versão `2.11.1` foi preservada no histórico, mas não chegou à produção porque o próprio predeploy interrompeu o deploy antes do upload.

### Validação
- O comando foi executado com sucesso pelo mesmo `cross-env-shell` usado pela Firebase CLI, partindo de uma pasta local e acessando o script pela UNC.

### Backup
- Backup exato anterior ao ajuste: `backups/index_v2.11.1.html`.
- SHA-256: `7F3099F61FB97CC932A88818C1C7F654083A142DFCBB0F350E55D01A16B29AD1`.
## [2.11.1] - 2026-08-20

### Corrigido
- Corrige o aviso de nova versão que reaparecia a cada 5 minutos e ao retornar para a aba porque `VERSAO_ATUAL` permanecia em `2.10.2` após o deploy da `2.11.0`.
- O banner agora também é ocultado explicitamente quando `version.json` e a versão carregada são iguais.

### Segurança de release
- Adiciona `scripts/validar_versao.py` para validar `version.json`, `VERSAO_ATUAL` e os badges exibidos.
- O Firebase Hosting executa a validação automaticamente antes de cada deploy e interrompe a publicação se houver divergência.

### Backup
- Backup exato anterior ao hotfix: `backups/index_v2.11.0.html`.
- SHA-256: `83E6DDEF980F9C4DDFC2B8B5486A2B7A0010F86B14275F8A32988ED23F9390AD`.
VERSÃO 2.11.0
---------------------------------------

Data:
20/08/2026

Objetivo:
Integrar o Follow-up de Compras ao Tecnicon para consultar, em modo somente leitura, o andamento da aprovação das Solicitações de Compra (SC).

Arquivos alterados / adicionados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.10.2.html
- script_compras/sincronizar_compras_sc.py
- script_compras/test_sincronizar_compras_sc.py
- script_compras/requirements.txt
- script_compras/README.md
- script_compras/Iniciar_Monitor_SC_DevFlow.bat
- script_compras/Atualizar_Todas_SC_Agora.bat

Funcionalidades adicionadas:
- Criado conector Python entre Tecnicon Firebird e Firestore, com consultas exclusivamente SELECT e parâmetros ODBC.
- A sincronização identifica SC não liberada, aguardando aprovação, aprovada, parcialmente convertida, convertida em OC, recusada, cancelada ou não encontrada.
- O report exibe criação da SC, aprovador informado no ERP, data e hora da aprovação, quantidade de itens convertidos, OCs geradas e próxima ação sugerida.
- Adicionado botão individual "Atualizar no ERP" e botão global "Atualizar SCs no ERP".
- Adicionada atualização automática completa a cada 15 minutos e atendimento das solicitações dos botões a cada 15 segundos.
- Incluídos indicadores e filtros específicos para aprovação de SC no ERP.
- O relatório do ERP foi adicionado à tabela e ao modal de Follow-up de Compras, preservando alinhamento e rolagem horizontal.
- Resultados e erros são gravados apenas na área de integração do desenvolvimento, sem sobrescrever responsável, observação, próxima ação ou demais campos manuais.
- A integração não movimenta automaticamente etapas do Kanban e não executa nenhuma escrita no Tecnicon.
- Criados testes unitários para extração de múltiplas SCs e regras de status.

Validação:
- Consulta somente leitura validada no Tecnicon com SCs reais, retornando aprovador, datas de aprovação e números de OC.
- Backup da versão 2.10.2 validado por SHA-256 antes da implementação.

---------------------------------------

VERSÃO 2.10.2
---------------------------------------

Data:
19/08/2026

Objetivo:
Exibir os códigos das ferramentas no Follow-up de Compras e impedir que compras já recebidas permaneçam no indicador de follow-up necessário por atraso em etapas posteriores.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.10.1.html

Funcionalidades adicionadas / Correções:
- Adicionada coluna "Ferramentas" na tabela principal do Follow-up de Compras.
- Os códigos de ferramentas são exibidos em etiquetas, com limite visual e contador para itens adicionais.
- Adicionado bloco "Ferramentas relacionadas" no modal, exibindo todos os códigos cadastrados na etapa Projeto da Fixação.
- Incluída pesquisa por código de ferramenta na busca da central de compras.
- Os códigos permanecem somente para leitura no Follow-up e continuam sendo mantidos no desenvolvimento, evitando dados duplicados.
- Corrigida a regra de "Follow-up necessário" para considerar tempo parado somente enquanto SC ou OC estiver aberta.
- Compras com SC convertida e OC recebida passam a exibir o alerta verde "Compra concluída".
- Compras encerradas deixam de aparecer no filtro e no indicador de follow-up necessário, permanecendo disponíveis em "Todos, inclusive encerrados".
- Alertas de etapa parada, follow-up vencido e fornecedor atrasado continuam ativos para compras em aberto.

---------------------------------------

VERSÃO 2.10.1
---------------------------------------

Data:
19/08/2026

Objetivo:
Corrigir a proporção do modal de Follow-up de Compras e garantir sincronização consistente dos dados entre Kanban, cadastro e a central de compras.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.10.0.html

Funcionalidades adicionadas / Correções:
- Adicionado espaçamento interno ao modal de Follow-up de Compras para impedir que títulos, cards e botões fiquem encostados nas bordas.
- Reduzida a largura máxima do modal e aplicadas margens mínimas proporcionais à janela.
- Ajustada a altura máxima para preservar espaço superior e inferior, mantendo rolagem interna quando necessária.
- Criada função central de sincronização para os dados de SC, OC e prazo do fornecedor.
- O avanço pelo Kanban agora atualiza imediatamente números, status e datas correspondentes na central de compras.
- As datas de abertura/aprovação da SC e emissão/aprovação da OC passam a ser registradas automaticamente conforme as etapas são concluídas.
- Alterações feitas pelo cadastro agora substituem também os dados da central, inclusive quando um valor é apagado.
- Alterações feitas pelo Follow-up continuam atualizando os campos utilizados pelo cadastro e pelo Kanban.
- O retrocesso de etapas agora recalcula os status e remove números, prazos e datas que pertencem a etapas posteriores.
- Um fornecedor isolado não mantém na central um desenvolvimento retrocedido para antes do fluxo de compras.
- A atualização entre as telas continua sendo refletida em tempo real pelo listener do Firebase.

---------------------------------------

VERSÃO 2.10.0
---------------------------------------

Data:
18/08/2026

Objetivo:
Criar uma central de follow-up de compras para acompanhar SC, OC, fornecedores e pendências sem abrir cada desenvolvimento individualmente, mantendo a base preparada para futura integração com o ERP.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.9.0.html

Funcionalidades adicionadas / Correções:
- Adicionada a nova aba "Follow-up Compras", visível somente para administradores e técnicos de Usinagem ou Montagem.
- Criada visão global independente do módulo ativo, reunindo todos os desenvolvimentos que passaram pelo fluxo de compras.
- Adicionados indicadores de SC abertas, OC abertas, follow-ups necessários e fornecedores com entrega atrasada.
- Incluídos filtros por situação, responsável e fornecedor, além de pesquisa por desenvolvimento, SC e OC.
- Adicionada tabela consolidada com etapa atual, dias parados, status de SC/OC, fornecedor, prazo, próxima ação, responsável e origem dos dados.
- Criado formulário para registrar e atualizar números, status e datas de SC/OC, fornecedor, prazo de entrega, responsável, próxima ação, data do próximo follow-up e observações.
- Implementados alertas para follow-up não programado, vencido, item parado além do limite configurado e prazo de fornecedor ultrapassado.
- Mantida compatibilidade com os campos já existentes de SC, OC e prazo do fornecedor, com sincronização entre a estrutura antiga e a nova.
- Adicionado histórico próprio de follow-up e registro da atualização nos comentários do módulo de Usinagem.
- Preparada estrutura de integração com fonte, identificador ERP, status sincronizados e data da última sincronização, permanecendo em modo manual nesta versão.
- A OC permanece aberta durante a etapa "Recebimento" e só é inferida como recebida após o avanço dessa etapa.

---------------------------------------
VERSÃO 2.9.0
---------------------------------------

Data:
18/08/2026

Objetivo:
Adicionar indicador mensal de produtividade por técnico no Dashboard Operacional.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.8.0.html

Funcionalidades adicionadas / Correções:
- Adicionado gráfico mensal de desenvolvimentos concluídos ou movimentados por técnico.
- Incluído seletor entre os modos Concluídos e Movimentados.
- A contagem evita duplicidade do mesmo desenvolvimento para o mesmo técnico no mesmo mês.
- Eventos automáticos do sistema e da migração são excluídos do indicador.
- O indicador acompanha o módulo ativo de Usinagem ou Montagem e os filtros aplicados.

---------------------------------------
VERSÃO 2.8.0
---------------------------------------

Data:
18/08/2026

Objetivo:
Separar comentários e atividades de Usinagem e Montagem na tela do projeto.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md
- backups/index_v2.7.0.html

Funcionalidades adicionadas / Correções:
- A aba de comentários agora exibe somente os registros do módulo ativo.
- Novos comentários manuais passam a registrar explicitamente sua origem como Usinagem ou Montagem.
- Registros antigos de Montagem que ficaram na lista legada de Usinagem são filtrados e reaproveitados na visão correta, sem apagar o histórico.
- A aba Movimentações continua consolidada, mas evita duplicidade causada por registros legados misturados.
- O Status Report passa a considerar o comentário mais recente do módulo ativo.

---------------------------------------
# Histórico de Versões (Changelog)
---------------------------------------
VERSÃO 2.7.0
---------------------------------------

Data:
18/08/2026

Objetivo:
Corrigir a migração das etapas ERP para ocorrer uma única vez e não gerar movimentações repetidas.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md

Funcionalidades adicionadas / Correções:
- A migração agora grava o marcador cadastroERP25 no projeto e se torna idempotente.
- Os projetos afetados são atualizados uma única vez no Firestore.
- Eventos criados automaticamente pela migração recebem origem de migração e deixam de aparecer em Movimentações.
- Projetos concluídos continuam concluídos e projetos pendentes permanecem na primeira etapa ERP.
- Eventos automáticos antigos sem marcador também são identificados e corrigidos.

---------------------------------------
VERSÃO 2.6.0
---------------------------------------

Data:
18/08/2026

Objetivo:
Permitir ocultar e reabrir a barra lateral conforme a prefer?ncia do usuário.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md

Funcionalidades adicionadas / Correções:
- Adicionado botão para ocultar o menu lateral e ampliar a área principal.
- Adicionado botão flutuante para reabrir o menu sem sobrepor os controles da tela.
- A preferência de exibição é salva no navegador e restaurada no próximo acesso.
- Ajustes responsivos de espaçamento e alinhamento para evitar sobreposições.

---------------------------------------
VERSÃO 2.5.0
---------------------------------------

Data:
17/08/2026

Objetivo:
Inclusão de duas etapas obrigatórias de cadastro no ERP antes da Liberação.

Arquivos alterados:
- public/index.html
- public/version.json
- CHANGELOG.md

Funcionalidades adicionadas / Correções:
- Adicionadas as etapas "Revisar/Atualizar cadastro no ERP" e "Aprovar cadastro no sistema ERP" nos fluxos completo e simplificado de Usinagem e Montagem.
- As etapas pertencem ao grupo PCP, mas podem ser concluídas pelos técnicos responsáveis.
- Projetos já concluídos permanecem com todas as etapas marcadas como concluídas.
- Projetos antigos ainda não concluídos e que estavam em Liberação retornam para a primeira nova etapa.
- Incluída proteção contra o envio acidental de script_estoque/firebase-key.json ao Git.


---------------------------------------
VERSÃO 2.3.7
---------------------------------------

Data:
12/08/2026

Objetivo:
Otimização do layout de impressão da página de projetos.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Configurado tamanho de página nativo para `A4 Paisagem` no CSS de impressão (`@page`), para que a janela de impressão já venha com as orientações adequadas.
- Aplicado `zoom: 90%` e redimensionamento elegante das fontes apenas no momento da impressão, para garantir que as 3 colunas principais caibam perfeitamente na mesma folha.
- Adicionadas regras de CSS `break-inside: avoid` nos blocos de conteúdo para impedir que os quadros sejam cortados ao meio entre as páginas.
- Ajuste das margens e recuos internos dos relatórios apenas na impressão, maximizando o espaço útil da folha A4.

---------------------------------------
VERSÃO 2.3.6
---------------------------------------

Data:
10/08/2026

Objetivo:
Correção do mapeamento de cores dos status no gráfico "Distribuição por status" (Dashboard).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Criada a constante `COR_STATUS_HEX` para definir cores exatas para cada status (ex: "Atrasado" = Vermelho, "Concluído" = Verde).
- Modificada a renderização do gráfico de status (`gStatus`) para utilizar o mapeamento semântico exato, abandonando a paleta sequencial (que atribuía cores indesejadas dependendo da ordem dos dados).

---------------------------------------
VERSÃO 2.3.5
---------------------------------------

Data:
07/08/2026

Objetivo:
Restauração da rolagem vertical nativa da página e refinamento da navegação horizontal no Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Removido o bloqueio/interceptação incondicional da roda vertical do mouse no Kanban, permitindo a rolagem normal para cima e para baixo na página.
- Mantidas e refinadas as formas ergonômicas de navegação horizontal no Kanban: `Shift + Scroll`, Arraste do fundo com o mouse (Grab & Drag), Botões `Esquerda`/`Direita` e barra de rolagem horizontal inferior.

---------------------------------------
VERSÃO 2.3.4
---------------------------------------

Data:
07/08/2026

Objetivo:
Inclusão de nota orientativa de usabilidade e navegação (scroll, arrasto e setas) no cabeçalho do Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Adicionado banner informativo discreto no cabeçalho do Kanban instruindo os usuários sobre todas as formas de rolagem horizontal disponíveis (Roda do mouse / Scroll, Arraste com cursor e Botões de setas).

---------------------------------------
VERSÃO 2.3.3
---------------------------------------

Data:
07/08/2026

Objetivo:
Correção no cálculo de diferença em dias de prazos e alinhamento dos indicadores visuais no Status Report.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Criação da função utilitária `diffDiasData()` para cálculo exato de dias corridos entre a data atual (zerada à meia-noite) e a data-alvo.
- Correção de cálculo no Status Report: prazos de ontem agora são identificados corretamente como "1d em atraso", prazos de hoje como "Vence hoje" e prazos de amanhã como "Vence em 1d".
- Alinhamento dos pontos indicadores de status (Semáforo da tabela) com o status real do prazo (Atrasado = Vermelho, Vencendo em breve = Amarelo, No prazo = Verde).

---------------------------------------
VERSÃO 2.3.2
---------------------------------------

Data:
07/08/2026

Objetivo:
Melhorias ergonômicas e correção de usabilidade no scroll horizontal do quadro Kanban.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas / Correções:
- Suporte a rolagem horizontal via roda do mouse (Mouse Wheel) ao passar o cursor sobre o quadro Kanban.
- Botões de navegação rápida "Esquerda" e "Direita" adicionados ao cabeçalho do Kanban.
- Suporte a arraste com o mouse (Grab & Drag to scroll) ao clicar e arrastar em áreas livres do Kanban.
- Barra de rolagem horizontal com estilo aprimorado e trilha visível (#kanbanContainer).

---------------------------------------
VERSÃO 2.3.1
---------------------------------------

Data:
06/08/2026

Objetivo:
Inclusão da opção "Internalização" no campo de seleção Tipo no formulário de criação e edição de desenvolvimentos.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nova opção de classificação "Internalização" disponibilizada no dropdown `Tipo` (ao lado de Novo, Alteração, Melhoria e BGI).
- Constante global `TIPOS` padronizada na aplicação.

---------------------------------------
VERSÃO 2.3.0
---------------------------------------

Data:
04/08/2026

Objetivo:
Integração da barra de filtros rápidos multi-seleção (Lançamento, Responsável, Família e Status) na nova aba de Status Report Executivo, permitindo segmentações dinâmicas e sincronizadas tanto para o módulo de Usinagem quanto de Montagem.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Ativação da barra superior de segmentação multi-seleção (`filtros-bar`) na view `Status Report`.
- Suporte a filtros combinados de mês de lançamento, múltiplos responsáveis, múltiplas famílias de produtos e status do desenvolvimento.
- Compatibilidade automática com o módulo de Montagem (filtrando os responsáveis específicos e status de montagem).
- Botão "Limpar filtros" para reset rápido de todas as seleções ativas.

---------------------------------------
VERSÃO 2.2.1
---------------------------------------

Data:
04/08/2026

Objetivo:
Ajustes visuais na aba Status Report Executivo conforme alinhamento com usuário: remoção total de emojis nos cards, badges e textos; remoção dos botões de exportação rápida (WhatsApp/E-mail e PDF) e remoção da coluna "Ação" para maximizar a área útil da tabela.

Arquivos alterados:
- public/index.html

Funcionalidades alteradas:
- Substituição de emojis por indicadores de status limpos (dots coloridos padronizados do sistema nos cards superiores e badges profissionais na tabela).
- Remoção dos botões "Copiar Resumo (WhatsApp / E-mail)" e "Imprimir / PDF" do cabeçalho da visualização.
- Remoção da coluna redundante "Ação" da tabela executiva (a navegação para os detalhes do projeto já é feita diretamente clicando em qualquer ponto da linha).
- Otimização do espaçamento e largura das colunas de Produto/Referência e Última Atualização.

---------------------------------------
VERSÃO 2.2.0
---------------------------------------

Data:
04/08/2026

Objetivo:
Implementação da nova aba de navegação lateral "Status Report" executivo com acompanhamento rápido de prazos, etapas atuais, próximas etapas, alertas visuais de atraso e recurso de cópia rápida para WhatsApp/E-mail.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nova aba "Status Report" no menu lateral para visualização sintética e executiva de todos os desenvolvimentos ativos e concluídos (tanto na Usinagem quanto na Montagem).
- Cards superiores de resumo com filtragem por clique: Total Cadastrado, 🔴 Em Atraso, 🟡 Vencendo em Breve, 🟢 No Prazo e ✅ Concluídos.
- Tabela executiva com colunas de: Status/Semáforo, Produto/Referência, Responsável com avatar, Mini Barra de Progresso (%) e etapas concluídas, Etapa Atual com contagem de dias parado, Prazo da Etapa Atual com badges destacados e cálculo de atraso, Próxima Etapa do fluxo, Última Atualização/Comentário recente e Ação Rápida de abertura.
- Botão "Copiar Resumo (WhatsApp / E-mail)" com geração automática de texto executivo pronto para colar e enviar para a equipe ou gerência.
- Botão "Imprimir / PDF" para emissão e exportação rápida de relatórios de reunião.

---------------------------------------
VERSÃO 2.1.0
---------------------------------------

Data:
04/08/2026

Objetivo:
Implementar solicitação obrigatória de prazo ao avançar etapas no checklist, sincronização bidirecional do card de ferramentas desenvolvidas, gravação de motivos de retrocesso nos comentários e segmentação precisa dos indicadores de desempenho por módulo (Montagem vs Usinagem).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Solicitação interativa de prazo limite para a próxima etapa em cada conclusão de item do checklist (tanto na Usinagem quanto na Montagem), armazenando os prazos por etapa em `prazosEtapas`.
- Cálculo e segmentação dedicada de indicadores de tempo para a Montagem (`diasNaEtapaMontagem`, `leadTimeMontagem`, `diasAtrasoMontagem`).
- Exibição de prazos individuais por etapa no checklist de Montagem e Usinagem.

Funcionalidades alteradas:
- Registro automático nos comentários (do módulo correspondente) ao avançar ou retroceder etapas, incluindo o motivo informado no retrocesso.
- Vinculação correta do card "Ferramentas desenvolvidas" ao array do módulo ativo (`p.montagem.ferramentas` na Montagem e `p.ferramentas` na Usinagem).
- Roteamento modular de comentários, anexos e ferramentas para garantir total independência entre Montagem e Usinagem.

---------------------------------------
VERSÃO 2.0.6
---------------------------------------

Data:
03/08/2026

Objetivo:
Corrigir o retrocesso de etapas no módulo de Montagem (tanto pelo clique na etapa anterior do checklist quanto pelo botão "Voltar etapa").

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Função utilitária `limparEtapasDesfeitasMontagem` para redefinir campos e prazos ao retroceder etapas da montagem.

Funcionalidades alteradas:
- Ajuste na função `reabrirEtapa` para identificar o módulo atual (Montagem vs Usinagem), solicitar o motivo do retrocesso e atualizar corretamente o fluxo, histórico e dados da montagem.
- Ajuste na função `voltarEtapa` para suportar limpeza de campos e reabertura de projetos concluídos na montagem.

---------------------------------------
VERSÃO 2.0.5
---------------------------------------

Data:
03/08/2026

Objetivo:
Permitir que técnicos de montagem assumam tarefas independentemente da usinagem, exibir dados cadastrais completos e indicadores no módulo de montagem, e suportar retorno de etapa na montagem.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Suporte dedicado para técnicos de montagem assumirem o desenvolvimento na Montagem (`p.montagem.responsavel`), informando prazo de análise e avançando a etapa de Recebido para Análise na Montagem de forma 100% independente da Usinagem.
- Exibição completa de todos os dados do produto (componentes, referências de alojamento, pino, forjados, NP usinagem, cliente, família, tipo, prioridade, responsável de usinagem e montagem, datas) na tela de detalhes da Montagem.
- Exibição de todos os 5 indicadores principais no cabeçalho da Montagem (Dias desde o cadastro, Dias na etapa, Lead Time, Prazo restante e Dias em atraso).
- Suporte a "Voltar etapa" e "Direcionar a um técnico" (Admin) no módulo de Montagem.

Funcionalidades alteradas:
- Cards do Kanban e linhas da Lista agora refletem o responsável, dias na etapa e status do módulo de Montagem quando visualizados no módulo de Montagem.

---------------------------------------
VERSÃO 2.0.4
---------------------------------------

Data:
03/08/2026

Objetivo:
Ocultar automaticamente itens do tipo Pistão / Pistão de Freio do módulo de Montagem (Kanban, Listas e Dashboard).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Função utilitária `isPistao` para identificação precisa de componentes e famílias de pistão.

Funcionalidades alteradas:
- Filtragem automática em todas as telas e indicadores do módulo de Montagem para excluir pistões, mantendo o Kanban e métricas limpas e focadas exclusivamente em conjuntos montados.
- Preservação integral do ciclo de desenvolvimento de pistões no módulo de Usinagem.

---------------------------------------
VERSÃO 2.0.3
---------------------------------------

Data:
03/08/2026

Objetivo:
Inclusão explícita das opções "Técnico Usinagem" e "Técnico Montagem" no cadastro e edição de usuários.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Opção explícita de perfil "Técnico Montagem" (`tecnico_montagem`) no cadastro e na edição de usuários.
- Renomeação da opção "Técnico" para "Técnico Usinagem" (`tecnico`) para clareza na distinção dos papéis.

Funcionalidades alteradas:
- Atualização visual dos badges de usuários para exibir o rótulo preciso de acordo com a área do técnico (Usinagem vs Montagem).

---------------------------------------
VERSÃO 2.0.2
---------------------------------------

Data:
01/08/2026

Objetivo:
Correção de bug crítico no Dashboard principal (ReferenceError: moduloAtual is not defined).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nenhuma

Funcionalidades alteradas:
- Refatorado todas as referências diretas de moduloAtual para apontar corretamente para o estado global estado.moduloAtual.
- Removidos os emojis dos botões de módulo ("Usinagem" e "Montagem") conforme solicitado.


---------------------------------------
VERSÃO 2.0.1
---------------------------------------

Data:
01/08/2026

Objetivo:
Ajuste da visão Dashboard principal.

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Nenhuma

Funcionalidades alteradas:
- Atualizada a função renderDashboard para contemplar adequadamente os KPIs e gráficos quando o módulo ativo for 'Montagem'.


---------------------------------------
VERSÃO 2.0.0
---------------------------------------

Data:
01/08/2026

Objetivo:
Implementação do módulo de Montagem (Opção C).

Arquivos alterados:
- public/index.html

Funcionalidades adicionadas:
- Estrutura de dados unificada para suportar Montagem.
- Seletor de módulos (Usinagem/Montagem) na interface principal.
- Lógica de permissão de visualização e edição para 'tecnico_montagem'.
- Refatoração da UI de Projeto, abas separadas, exclusão lógica do 'Pistão'.
- Adaptação do modal FO050 para Linhas de Montagem e processos específicos.
- Dashboard Gerencial adaptado para consolidar dados da Montagem.
- Visões Kanban e Lista exibindo os projetos aplicáveis dependendo do módulo ativo.

Funcionalidades alteradas:
- renderProjeto, renderLista, renderKanban, renderGerencial.
- Status e indicadores de dias na etapa e atraso refatorados.


---------------------------------------
VERSÃO 1.0.0
---------------------------------------

Data:
19/07/2026

Objetivo:
Estabelecer a versão base do sistema ("DESENVOLVIMENTOS") com o novo padrão de versionamento profissional e histórico controlado.

Arquivos alterados:
Nenhum (Versão Base)

Funcionalidades adicionadas:
✔ Implantação da política de versionamento e regras `.agents/AGENTS.md`.

Funcionalidades alteradas:
Nenhuma

Correções realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padrão)

Observações:
Este marco consolida as atualizações recentes (Dashboard KPIs, fluxo simplificado de FO050, tag BGI, aba Movimentações) como a versão estável 1.0.0.
---------------------------------------

---------------------------------------
VERS�O 1.0.1
---------------------------------------

Data:
19/07/2026

Objetivo:
Exibir a vers�o atual na interface do sistema.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Tag de vers�o visual no painel de login e na barra lateral (sidebar).

Funcionalidades alteradas:
Nenhuma

Corre��es realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padr�o)

Observa��es:
Altera��o puramente visual para facilitar o controle de vers�o pelos usu�rios.
---------------------------------------

---------------------------------------
VERS�O 1.0.2
---------------------------------------

Data:
19/07/2026

Objetivo:
Substituir o logotipo gen�rico pelo logotipo oficial da Viemar.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Inclus�o do logotipo oficial (logo_viemar.png) na tela de login e barra lateral.

Funcionalidades alteradas:
Nenhuma

Corre��es realizadas:
Nenhuma

Problemas conhecidos:
Nenhum

Compatibilidade:
Web, Mobile (responsivo padr�o)

Observa��es:
Melhoria de identidade visual (Branding).
---------------------------------------

---------------------------------------
VERS�O 1.0.3
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
? O bot�o de 'Voltar' na capa do projeto agora retorna dinamicamente para a tela em que o usu�rio estava (Kanban ou Lista), em vez de voltar obrigatoriamente para o Kanban.
? Atualiza��o da tag de vers�o na interface para v1.0.3.

Corre��es realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padr�o)

Observa��es:
Melhoria de UX solicitada.
---------------------------------------

---------------------------------------
VERS�O 1.0.4
---------------------------------------

Data:
20/07/2026

Objetivo:
Corrigir a invisibilidade de projetos da etapa Programa CNC no Kanban e em Gr�ficos.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
Nenhuma.

Funcionalidades alteradas:
? Atualiza��o da tag visual na interface para v1.0.4.

Corre��es realizadas:
? Criada a constante estrutural TODAS_ETAPAS contendo o mapeamento de ambos os fluxos.
? Ajustado o renderKanban para processar todas as etapas conjuntas, garantindo que projetos no fluxo simplificado na etapa Programa CNC n�o fiquem mais presos no limbo.
? Gr�ficos do Dashboard e Filtros da Movimenta��o atualizados para considerar a matriz completa.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padr�o).

Observa��es:
Resolu��o de bug relatado na tela de Kanban.
---------------------------------------

---------------------------------------
VERS�O 1.1.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar ID de Cadastro (DEV-XXX) e l�gica de ordena��o de filas por FIFO (First-In, First-Out).

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? ID Sequencial de Cadastro vis�vel na interface para todos os projetos (formato DEV-XXX).
? Identifica��o retroativa no banco de dados para todos os projetos antigos seguindo a data exata de cria��o.
? Nova l�gica de renderiza��o autom�tica na tela de Kanban e Lista que empata a Previs�o de Lan�amento desempatando pela Data de In�cio (projetos mais antigos ficam no topo).

Funcionalidades alteradas:
? Tag de vers�o visual na interface para v1.1.0.

Corre��es realizadas:
Nenhuma.

Problemas conhecidos:
Nenhum.

Compatibilidade:
Web, Mobile (responsivo padr�o).

Observa��es:
Melhoria estrutural na forma como a equipe prioriza seus desenvolvimentos com base no hist�rico de chegada (FIFO).
---------------------------------------

---------------------------------------
VERS�O 1.1.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de inicializa��o.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Inserida trava l�gica para impedir loop infinito gerado pelo script retroativo de migra��o, liberando a interface.
---------------------------------------

---------------------------------------
VERS�O 1.1.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de renderiza��o.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Corre��o de sintaxe que impedia o carregamento do Kanban, restaurando o acesso normal ao aplicativo.
---------------------------------------

---------------------------------------
VERS�O 1.1.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix visual: adicionar ID � tela de lista.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Adicionado selo de DEV-XXX ao lado da Refer�ncia do Produto na visualiza��o em grade (Lista) a pedido do usu�rio.
---------------------------------------

---------------------------------------
VERS�O 1.1.4
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
VERS�O 1.2.0
---------------------------------------

Data:
21/07/2026

Objetivo:
Adicionar filtro m�ltiplo por status.

Arquivos alterados:
public/index.html

Funcionalidades adicionadas:
? Adicionada nova op��o 'Status' na barra de filtros avan�ados (ao lado de Lan�amento, Respons�vel e Fam�lia), permitindo filtrar visualmente por status como 'No Prazo', 'Aten��o', 'Atrasado' e 'Conclu�do'.
---------------------------------------

---------------------------------------
VERS�O 1.2.1
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix de filtro de Status.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Corre��o do bug de case-sensitivity no filtro de Status. O sistema n�o estava reconhecendo a op��o 'No prazo' com p min�sculo, nem 'Aguardando T�cnico'. As op��es foram sincronizadas com o banco de dados.
---------------------------------------

---------------------------------------
VERS�O 1.2.2
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do dropdown de Status.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Corrigido bug visual em que clicar na caixa de sele��o de Status mantinha a caixa de Fam�lia aberta ou com comportamento an�malo devido � gest�o de IDs de dropdown.
---------------------------------------

---------------------------------------
VERS�O 1.2.3
---------------------------------------

Data:
21/07/2026

Objetivo:
Hotfix do filtro de Status.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Sincronizada a lista de filtros de status na barra de buscas para corresponder exatamente � r�gua de status real de neg�cio retornada pelo sistema (Em Andamento, Atrasado, Em Valida��o, etc.), no lugar dos antigos marcadores de prazo.
---------------------------------------

---------------------------------------
VERS�O 1.2.4
---------------------------------------

Data:
22/07/2026

Objetivo:
Hotfix de avan�o autom�tico da etapa Libera��o.

Arquivos alterados:
public/index.html

Corre��es realizadas:
? Corrigido o bug onde concluir a etapa 'Valida��o/FO050' conclu�a automaticamente a etapa 'Libera��o' em seguida.
? Corrigido o comportamento do bot�o de desmarcar etapa, que agora reverte corretamente a caixa selecionada de volta ao seu estado pendente (como atual).
? Migra��o transparente de projetos antigos que j� estavam 100% conclu�dos.
---------------------------------------

---------------------------------------
VERS�O 1.3.0
---------------------------------------

Data:
22/07/2026

Objetivo:
Suporte a m�ltiplos processos na etapa de Valida��o/FO050.

Arquivos alterados:
public/index.html

Novidades e Altera��es:
? Adicionada a capacidade de inserir m�ltiplos processos de fabrica��o dentro dos dados da FO050.
? Implementada lista pr�-definida de processos (USI CAIXA, USI PINO, FR EQUIPTOP, etc).
? Cada processo possui sua pr�pria m�quina, tempo de usinagem, tempo de troca, n�mero de OP e data de execu��o.
? O painel de Detalhes do Projeto e o painel de edi��o foram refeitos para listar e somar automaticamente todos os processos parciais.
? Realizada migra��o retroativa transparente, onde itens mais antigos com estrutura de m�quina �nica foram convertidos para o novo formato preservando os dados originais.
---------------------------------------


- PATCH: Corre��o na exibi��o dos processos FO050 no detalhamento do projeto e ajuste de foco nos campos de input ao editar a FO050 (bugfix).


- PATCH: Tratamento de erros ao tentar retroceder etapas (Voltar/Desmarcar) em projetos sem hist�rico ou coment�rios pr�vios iniciados (bugfix).


- PATCH: Corrigido problema estrutural onde retroceder etapas em desenvolvimentos com hist�rico irregular (ex: pulos manuais) n�o alterava o estado na tela, pois o hist�rico era lido via �ndice em vez do nome da etapa.

---------------------------------------
VERS�O 1.4.0
---------------------------------------

Data:
24/07/2026

Objetivo:
Permitir que qualquer t�cnico possa manipular desenvolvimentos/atividades, mesmo que assumidos por outro t�cnico.

Arquivos alterados:
public/index.html

Novidades e Altera��es:
- Atualizada a regra de gerenciamento (podeGerenciar) para conceder permiss�o de edi��o e movimenta��o de etapas a todos os t�cnicos e administradores.
- Removidas restri��es que travavam o checklist e o programa CNC apenas para o t�cnico respons�vel direto.
- Perfil Engenharia de Produto permanece restrito a visualiza��o e cadastro.
---------------------------------------


- PATCH: Ocultada a tag de prazo visual em etapas que n�o est�o conclu�das e adicionada limpeza autom�tica de prazoAnalise e prazos pendentes ao retroceder ou voltar etapas.


- PATCH: Preserva��o da posi��o de rolagem horizontal (scrollLeft) no Kanban ao navegar entre vis�es, abrir projetos ou utilizar a tecla ESC ou bot�o voltar.


---------------------------------------
VERS�O 1.5.0
---------------------------------------

Data:
27/07/2026

Objetivo:
Criar modo e perfil de acesso de Visitante sem senha, permitindo apenas visualiza��o de desenvolvimentos e status sem alterar nada.

Arquivos alterados:
public/index.html

Novidades e Altera��es:
- Adicionado o bot�o '??? Entrar como Visitante (sem senha)' na tela inicial de login.
- Criado o perfil de usu�rio Visitante em modo estritamente de leitura (sem permiss�o para alterar, criar ou movimentar itens).
- Adicionada op��o de papel Visitante no painel de gest�o de usu�rios.
---------------------------------------


- PATCH: Ajustado o texto do bot�o de acesso visitante para 'Entrar como visitante' (removidos emoji e sufixo).


- PATCH: Configura��o da tag favicon (<link rel="icon">) vinculada ao logotipo do sistema para substituir o �cone gen�rico do navegador na aba.


- PATCH: Atualizado o �cone favicon da aba do navegador para a nova imagem 3D met�lica com circuitos da Viemar (public/favicon.png).


- PATCH: Recorte ajustado (cropping 1:1) e gera��o de �cones multi-resolu��o (.ico e .png 256x256) do favicon 3D da Viemar para garantir nitidez m�xima na aba do navegador.


- PATCH: Atualizado o favicon para a imagem oficial fornecida (favicon_oficial.png), gerando os arquivos de �cone favicon.png e favicon.ico otimizados.


- PATCH: Remo��o do fundo escuro do favicon oficial com suaviza��o de bordas alpha (transpar�ncia transparente .png e .ico).





---------------------------------------
VERS�O 2.4.0
---------------------------------------

Data:
12/08/2026

Objetivo:
Integra��o em tempo real de saldo de estoque do ERP via Firebase.

Arquivos alterados:
public/index.html
script_estoque/sincronizar_estoque.py (Novo)

Novidades e Altera��es:
- Criado script Python sincronizar_estoque.py que consulta a planilha de saldo do ERP, dispara atualiza��o no Power Query invisivelmente e sobe os saldos para o Firebase (cole��o estoque).
- Front-end do DevFlow atualizado para assinar a cole��o estoque em tempo real.
- Na aba de Detalhes do Projeto, os componentes (Produto Final, Alojamento, Pino, Forjados) agora exibem um selo informando se h� saldo no ERP ("Em Estoque" verde ou "Sem Estoque" vermelho).
---------------------------------------

---------------------------------------
VERS�O 2.4.1
---------------------------------------

Data:
12/08/2026

Objetivo:
Melhorias visuais no selo de estoque.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- Formata��o dos n�meros de estoque com separador de milhar (ex: 7.080 p�s).
- Inserido status "N�o Encontrado" (cinza) para refer�ncias cadastradas no sistema do projeto que n�o constam na planilha do ERP.
---------------------------------------

---------------------------------------
VERS�O 2.4.2
---------------------------------------

Data:
12/08/2026

Objetivo:
Omitir cobran�a de prazo na etapa de Valida��o/FO050.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- O sistema n�o exige mais que o t�cnico informe um prazo ao avan�ar para a etapa "Valida��o/FO050". Em vez disso, ele avan�a a etapa de forma autom�tica e silenciosa, gerando a anota��o padr�o "Aguardando data do PCP" no hist�rico, visto que o cronograma dessa fase � regido externamente.
---------------------------------------

---------------------------------------
VERS�O 2.4.3
---------------------------------------

Data:
12/08/2026

Objetivo:
Visualiza��o do prazo 'Aguardando PCP' no Status Report.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- O painel executivo (Status Report) e o checklist interno do projeto agora exibem explicitamente a mensagem 'Aguardando PCP' com �cone de rel�gio quando um desenvolvimento atinge a etapa de Valida��o/FO050, substituindo o antigo c�lculo de dias at� o lan�amento.
---------------------------------------

---------------------------------------
VERS�O 2.4.4
---------------------------------------

Data:
12/08/2026

Objetivo:
Pacote de melhorias visuais e funcionais para a aba de Montagem.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- O painel global de 'Movimenta��es e Notifica��es' agora exibe tamb�m todo o hist�rico de avan�o de etapas, coment�rios, reaberturas e atribui��es feitos exclusivamente no fluxo de Montagem.
- O Kanban da Montagem passou a priorizar (colocar no topo das colunas) os desenvolvimentos que j� tiveram sua Usinagem 100% conclu�da, facilitando a identifica��o do que j� est� fisicamente pronto para montar.
- Adicionada uma badge verde 'Usinado' nos cards da Montagem sempre que a pe�a j� passou por todo o processo de usinagem.
- Adicionados os filtros 'Somente Usinados' e 'Aguardando Usinagem' na barra superior quando o m�dulo de montagem est� ativo.
- A barra de pesquisa global passou a encontrar os nomes de ferramentas cadastradas no fluxo de montagem.
---------------------------------------

---------------------------------------
VERS�O 2.4.5
---------------------------------------

Data:
13/08/2026

Objetivo:
Segundo pacote de melhorias visuais e funcionais para o fluxo de Montagem.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- O quadro Kanban (Usinagem e Montagem) ganhou uma nova coluna 'Conclu�do', impedindo que itens finalizados desapare�am da vis�o.
- O Status Report da Montagem recebeu um novo filtro r�pido 'Movimentados', agrupando os itens que j� sa�ram do zero.
- A tabela do Status Report da Montagem agora prioriza automaticamente no topo todos os itens com hist�rico de movimenta��o.
- Adicionado bot�o 'Editar Dados da Montagem' na view do projeto, permitindo alterar respons�vel, desenho de conjunto e OP facilmente.
- Modal da etapa FO050 da Montagem simplificado: remo��o da exig�ncia de m�quina e unifica��o dos campos Data de Execu��o e OP (informados apenas uma vez por FO).
---------------------------------------

---------------------------------------
VERS�O 2.4.6
---------------------------------------

Data:
13/08/2026

Objetivo:
Corre��o de alinhamento visual no Status Report.

Arquivos alterados:
public/index.html

Corre��es realizadas:
- Ajuste de espa�amento (gap) entre o �cone (ponto de cor) e os textos 'No Prazo' e 'Movimentados' nos cart�es de filtro do Status Report.
---------------------------------------

---------------------------------------
VERS�O 2.4.7
---------------------------------------

Data:
13/08/2026

Objetivo:
Implementa��o do sistema de alerta autom�tico de novas vers�es.

Arquivos alterados:
public/index.html
public/version.json

Corre��es realizadas:
- O sistema agora verifica automaticamente (em plano de fundo e a cada vez que a janela � focada) se existe uma vers�o mais atualizada dispon�vel no servidor.
- Caso uma nova vers�o seja detectada, um banner n�o-intrusivo � exibido no topo da tela sugerindo o recarregamento r�pido.
---------------------------------------

---------------------------------------
VERS�O 2.4.8
---------------------------------------

Data:
13/08/2026

Objetivo:
Reestrutura��o total da arquitetura de intelig�ncia e usabilidade dos Dashboards (Operacional e Gerencial).

Arquivos alterados:
public/index.html
public/version.json

Corre��es realizadas:
- Dashboard Operacional: Foco total em fila e a��o imediata.
- Dashboard Operacional: Adicionado Tabela Acion�vel "Top 10 Projetos Cr�ticos" (ordenada por atraso com bot�o r�pido para ir at� o projeto).
- Dashboard Operacional: Gr�fico de Roscas substitu�do por Barra Empilhada mostrando o volume da fila por respons�vel (cruzamento com o que est� no prazo vs atrasado).
- Dashboard Gerencial: Limpeza de m�tricas redundantes que j� existiam no operacional (Foco transferido para an�lise hist�rica).
- Dashboard Gerencial: Adicionado gr�fico temporal "Evolu��o do Lead Time Hist�rico" (Evolu��o m�dia de performance m�s a m�s).
- Dashboard Gerencial: Gr�fico de Respons�veis convertido para Gr�fico de Barras Horizontais para melhor visualiza��o e compara��o quantitativa.
---------------------------------------

---------------------------------------
VERS�O 2.4.9
---------------------------------------

Data:
14/08/2026

Objetivo:
Implementa��o do Plano Anal�tico (Fase 2) nos Dashboards Operacional e Gerencial para maior qualidade de diagn�stico.

Arquivos alterados:
public/index.html
public/version.json

Corre��es realizadas:
- Fun��o Mediana: Substitui��o de m�dias puras por c�lculo de Mediana de Lead Time para desconsiderar distor��es e refletir o comportamento t�pico.
- Prote��o contra dados vazios (zero vs null): Gr�ficos e indicadores agora demonstram claramente 'Dados insuficientes' no lugar de desenhar informa��es n�o-existentes.
- Dashboard Operacional: Adicionado WIP (Carteira Ativa) por etapa (ao inv�s de gargalo hist�rico).
- Dashboard Operacional: Adicionado Gr�fico de Distribui��o de 'Aging' para visualizar tempo de paralisia na etapa atual (0-3d, 4-7d, etc).
- Dashboard Operacional: KPI de alerta para percentual da carteira com a flag 'Sem Respons�vel'.
- Dashboard Operacional: Tabela de Top 10 expandida para incluir C�digo/Cliente e Etapa/Respons�vel juntos para melhor uso do espa�o.
- Dashboard Gerencial: Gr�fico de 'Tempo M�dio por Etapa' transformado em barras horizontais ordenadas da etapa mais cr�tica para a mais r�pida.
- Dashboard Gerencial: Adi��o do indicador de Throughput (entregas realizadas no m�s vs m�s anterior).
- Dashboard Gerencial: Gr�fico de 'Projetos por Cliente' convertido para exibir ranking ordenado com base no volume da carteira.
---------------------------------------
VERS�O 2.4.10
---------------------------------------

Data:
17/08/2026

Objetivo:
Otimiza��es de scripts backend e controle de versionamento.

Arquivos alterados:
- .agents/AGENTS.md
- script_estoque/sincronizar_estoque.py
- script_estoque/Atualizar_Estoque_DevFlow.bat
- .gitignore

Funcionalidades adicionadas / Corre��es:
- Corre��o do c�lculo de total de itens atualizados no script de sincroniza��o de estoque (total_atualizados separado).
- Inclus�o do arquivo firebase-key.json no .gitignore.
- Formaliza��o das regras de deploy no arquivo de agentes.
---------------------------------------

