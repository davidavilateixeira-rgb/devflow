# Monitor de aprovação de SC

Conector somente leitura entre o Tecnicon Firebird e o Follow-up de Compras do DevFlow.

## Regras de segurança

- O conector executa somente `SELECT` no Tecnicon.
- Credenciais do ERP são carregadas do `.env` autorizado da base de conhecimento.
- A chave do Firebase continua fora do Git e, por padrão, é reutilizada de `script_estoque/firebase-key.json`.
- O conector não movimenta o Kanban e não altera dados manuais de follow-up.

## Instalação

```powershell
python -m pip install -r script_compras\requirements.txt
```

## Teste somente leitura de uma SC

```powershell
python script_compras\sincronizar_compras_sc.py --dry-run --sc 651463
```

## Execução

- `Atualizar_Todas_SC_Agora.bat`: executa uma sincronização completa e encerra.
- `Iniciar_Monitor_SC_DevFlow.bat`: mantém a atualização automática ativa e atende aos botões do sistema.

Para usar caminhos alternativos, configure:

```text
DEVFLOW_ERP_ENV_FILE
DEVFLOW_FIREBASE_CREDENTIALS
```

## Acompanhamento de OC

O conector acompanha SC e OC em uma unica consulta somente leitura. Para a OC,
o report inclui liberacao, aprovacao, aprovador previsto/efetivo, comprador,
fornecedor, envio por e-mail, previsao de entrega e recebimento confirmado pela
entrada da NF. O status manual permanece separado e nunca e sobrescrito.

Teste uma SC e uma OC sem acessar o Firestore:

```powershell
python script_compras\sincronizar_compras_sc.py --dry-run --sc 666993 --oc 1285383
```

No modo de monitoramento, os pedidos dos botoes consultam somente documentos
marcados como `solicitado`; a varredura completa permanece a cada 15 minutos.

O modo monitor faz uma atualização completa a cada 15 minutos e verifica solicitações dos botões a cada 15 segundos.
