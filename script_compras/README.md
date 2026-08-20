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

O modo monitor faz uma atualização completa a cada 15 minutos e verifica solicitações dos botões a cada 15 segundos.
