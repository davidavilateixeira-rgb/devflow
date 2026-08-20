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

## Monitor sob demanda

```powershell
python script_compras\sincronizar_compras_sc.py --watch --request-poll 60
```

No modo `--watch`, o conector abre um listener filtrado e aguarda documentos com
`compras.integracao.statusSincronizacao == solicitado`. Nenhuma consulta completa
da colecao `projetos` e executada em segundo plano.

O fluxo normal e:

1. O usuario clica em `ERP` para um desenvolvimento ou confirma a atualizacao geral.
2. O DevFlow marca somente os documentos escolhidos como `solicitado`.
3. O listener recebe esses documentos e consulta SC/OC no Tecnicon.
4. O conector grava apenas o report ERP e remove o documento da consulta filtrada.

## Dados da OC

O report inclui liberacao, aprovacao, aprovador previsto/efetivo, comprador,
fornecedor, envio por e-mail, previsao de entrega e recebimento confirmado pela
entrada da NF. O status manual permanece separado.

## Caminhos alternativos

```text
DEVFLOW_ERP_ENV_FILE
DEVFLOW_FIREBASE_CREDENTIALS
```

`Atualizar_Todas_SC_Agora.bat` permanece disponivel apenas para uma execucao
manual administrativa. Ele nao e chamado pela tarefa agendada.
