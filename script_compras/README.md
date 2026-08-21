# Monitor SC e OC sob demanda

Conector somente leitura entre o Tecnicon Firebird e o Follow-up de Compras do DevFlow.

## Regras de seguranca

- Executa somente `SELECT` no Tecnicon.
- Carrega as credenciais do ERP do `.env` autorizado.
- Mantem a chave do Firebase fora do Git.
- Nao movimenta o Kanban e nao sobrescreve os dados manuais de follow-up.
- Nao executa varreduras completas automaticas.

## Instalacao

```powershell
python -m pip install -r script_compras\requirements.txt
```

## Teste somente leitura

```powershell
python script_compras\sincronizar_compras_sc.py --dry-run --sc 666993 --oc 1285383
```

## Tarefa sob demanda recomendada

```powershell
powershell -ExecutionPolicy Bypass -File script_compras\Configurar_Tarefa_ERP_DevFlow.ps1 -EnvFile "CAMINHO_AUTORIZADO\.env"
```

A tarefa executa a cada dois minutos, consulta somente documentos com
`compras.integracao.statusSincronizacao == solicitado` e encerra. Esse formato
evita depender de um processo continuo. Se nao houver pedido, o Firebird nao e
aberto e nenhuma consulta ERP e executada.

O fluxo normal e:

1. O usuario clica em `ERP` para um desenvolvimento ou confirma a atualizacao geral.
2. O DevFlow marca somente os documentos escolhidos como `solicitado`.
3. A proxima execucao curta recebe esses documentos e consulta SC/OC no Tecnicon.
4. A tarefa usa o Python sem console, sem abrir janela ou roubar o foco do usuario.
5. O conector grava apenas o report ERP e remove o documento da consulta filtrada.

Execucao manual do mesmo ciclo filtrado:

```powershell
python script_compras\sincronizar_compras_sc.py --only-requested
```

O modo `--watch` permanece disponivel para diagnostico, mas nao deve ser usado
na tarefa agendada do Windows.

## Dados da OC

O report inclui liberacao, aprovacao, aprovador previsto/efetivo, comprador,
fornecedor, envio por e-mail e recebimento confirmado pela entrada da NF.
A previsao de chegada permanece exclusivamente manual no cadastro do DevFlow.

## Caminhos alternativos

```text
DEVFLOW_ERP_ENV_FILE
DEVFLOW_FIREBASE_CREDENTIALS
```

`Atualizar_Todas_SC_Agora.bat` permanece disponivel apenas para uma execucao
manual administrativa. Ele nao e chamado pela tarefa agendada.
