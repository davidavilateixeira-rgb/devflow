# Regras de Versionamento e Backup (Obrigatórias)

A partir deste momento, o projeto "DevFlow" adota uma **Estratégia de Versionamento Profissional** integrando Git e backups locais.

## FLUXO OBRIGATÓRIO PARA QUALQUER ALTERAÇÃO FUTURA:

1. **Ler estas regras** antes de agir.
2. **Entender completamente** a solicitação.
3. **Identificar** quais arquivos serão alterados.
4. **Identificar a versão atual** do sistema.
5. **Criar backup da versão atual** na pasta `backups/`, sem sobrescrever backups antigos.
   - Exemplo: `backups/index_v1.0.2.html`
6. **Incrementar a versão** conforme SemVer modificado:
   - **PATCH**: correções pequenas, ajustes visuais, bugs simples (ex: 1.0.2 -> 1.0.3).
   - **MINOR**: novas funcionalidades, novas abas, novos campos ou melhorias relevantes (ex: 1.0.2 -> 1.1.0).
   - **MAJOR**: mudanças estruturais grandes ou reformulação importante (ex: 1.1.0 -> 2.0.0).
7. **Atualizar o número da versão** visível no sistema (UI).
8. **Atualizar CHANGELOG.md** seguindo o padrão já existente.
9. **Realizar a alteração solicitada** com o menor impacto possível.
10. **Testar/validar localmente** o funcionamento básico.
11. **Fazer commit Git** com mensagem clara contendo a nova versão.
    - Exemplo: `git commit -m "Versao 1.0.3 - ajuste visual no login"`
12. **Criar tag Git** correspondente.
    - Exemplo: `git tag v1.0.3`
13. **NUNCA apagar** backups antigos.
14. **NUNCA alterar** arquivos fora do escopo da solicitação.
15. Se houver risco de quebrar funcionalidades existentes, **avisar antes** e sugerir alternativa segura.

## Formato de Entrega ao Usuário
Ao final da execução, o Agente DEVE apresentar:
1. Confirmação de que nenhuma funcionalidade foi quebrada.
2. Comandos Git executados / Status Final.
3. Changelog completo da versão.
4. Lista de arquivos alterados (com links).
5. Orientação resumida ou passos para rollback se necessário.

## Regras de Deploy e Controle de Vers�o (Nova Melhoria):
A partir da vers�o 2.4.6, o sistema possui um alerta autom�tico de atualiza��o para os usu�rios em tempo real. Sempre que houver uma evolu��o de vers�o, o agente **DEVE**:
1. Atualizar a constante VERSAO_ATUAL no topo do bloco de script no arquivo public/index.html.
2. Atualizar o valor no arquivo public/version.json para refletir exatamente a mesma vers�o.
3. Isso garante que a notifica��o autom�tica na interface seja engatilhada corretamente para todos os clientes logados no momento do deploy.
