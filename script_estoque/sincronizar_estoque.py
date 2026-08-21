import os
import time
import pandas as pd
import win32com.client
import firebase_admin
from firebase_admin import credentials, firestore

# ==========================================
# CONFIGURAÇÕES
# ==========================================
ARQUIVO_EXCEL = r"Q:\02 ENGENHARIA DE USINAGEM\Produtos vs componentes vs saldo.xlsx"
ARQUIVO_CREDENCIAIS_FIREBASE = "firebase-key.json"
ABA_DADOS = "BANCO DE DADOS ENGENHARIA"

ETAPAS_COMPLETAS = [
    "Recebido", "Análise", "Projeto da Fixação", "Orçamento",
    "Solicitação de Compra", "Aprovação SC", "Ordem de Compra",
    "Aprovação OC", "Fornecedor", "Recebimento", "Validação/FO050",
    "Revisar/Atualizar cadastro no ERP", "Aprovar cadastro no sistema ERP",
    "Liberação",
]
ETAPAS_SIMPLES = [
    "Recebido", "Análise", "Programa CNC", "Validação/FO050",
    "Revisar/Atualizar cadastro no ERP", "Aprovar cadastro no sistema ERP",
    "Liberação",
]
CAMPOS_COMPONENTES = (
    "alojamento", "forjadoAlojamento", "pino", "forjadoPino",
)


def normalizar_codigo(valor):
    if pd.isna(valor):
        return ""
    codigo = str(valor).strip().upper()
    return "" if codigo in ("", "0") else codigo


def projeto_ate_fo050(projeto):
    necessita = projeto.get("necessita") or {}
    etapas = ETAPAS_COMPLETAS if necessita.get("fixacao") else ETAPAS_SIMPLES
    indice_fo050 = etapas.index("Validação/FO050")
    try:
        etapa_atual = int(float(projeto.get("etapaAtual", 0) or 0))
    except (TypeError, ValueError):
        etapa_atual = 0
    return etapa_atual <= indice_fo050


def componentes_do_projeto(projeto):
    referencias = projeto.get("refs") or {}
    return {
        codigo
        for campo in CAMPOS_COMPONENTES
        if (codigo := normalizar_codigo(referencias.get(campo)))
    }


def buscar_componentes_ativos(db):
    codigos = set()
    total_projetos = 0
    projetos_ativos = 0

    for documento in db.collection("projetos").stream():
        total_projetos += 1
        projeto = documento.to_dict() or {}
        if not projeto_ate_fo050(projeto):
            continue
        projetos_ativos += 1
        codigos.update(componentes_do_projeto(projeto))

    return codigos, projetos_ativos, total_projetos


def saldos_relevantes_da_planilha(df, codigos_ativos):
    saldos = {}
    colunas = (
        ("CAIXA", "SALDO CAIXA"),
        ("PINO", "SALDO PINO"),
        ("FORJ_CAIXA", "SALDO FORJ_CAIXA"),
        ("FORJ_PINO", "SALDO FORJ_PINO"),
    )

    for _, linha in df.iterrows():
        for coluna_codigo, coluna_saldo in colunas:
            codigo = normalizar_codigo(linha.get(coluna_codigo))
            if not codigo or codigo not in codigos_ativos:
                continue
            try:
                saldo = int(float(str(linha.get(coluna_saldo, 0)).replace(",", ".")))
            except (TypeError, ValueError):
                saldo = 0
            saldos[codigo] = saldo

    return saldos


def carregar_saldos_atuais(db, estoque_ref, codigos):
    saldos = {}
    referencias = [estoque_ref.document(codigo) for codigo in sorted(codigos)]
    for inicio in range(0, len(referencias), 500):
        for documento in db.get_all(referencias[inicio:inicio + 500]):
            if documento.exists:
                saldos[documento.id] = (documento.to_dict() or {}).get("saldo", 0)
    return saldos

def atualizar_planilha(caminho_arquivo):
    print("Iniciando o Excel invisível...")
    xlapp = win32com.client.DispatchEx("Excel.Application")
    xlapp.DisplayAlerts = False
    xlapp.Visible = False

    try:
        print(f"Abrindo a planilha: {caminho_arquivo}")
        wb = xlapp.Workbooks.Open(caminho_arquivo)
        
        # Desabilita atualização em segundo plano para garantir que o script espere terminar
        for conn in wb.Connections:
            if conn.Type == 1 or conn.Type == 2: # OLEDB / ODBC
                conn.OLEDBConnection.BackgroundQuery = False
        
        print("Atualizando conexões de dados (Power Query/ERP)...")
        wb.RefreshAll()
        xlapp.CalculateUntilAsyncQueriesDone()
        
        print("Salvando a planilha com os dados novos...")
        wb.Save()
        wb.Close()
        print("Planilha atualizada com sucesso!")
    except Exception as e:
        print(f"Erro ao atualizar planilha: {e}")
    finally:
        xlapp.Quit()

def ler_e_enviar_para_firebase():
    print("Lendo a planilha atualizada...")
    # Lê a planilha atualizada pelo Excel
    df = pd.read_excel(ARQUIVO_EXCEL, sheet_name=ABA_DADOS, dtype=str)
    
    # Substitui NaN por '0' ou vazio
    df = df.fillna('0')

    print("Conectando ao Firebase...")
    cred = credentials.Certificate(ARQUIVO_CREDENCIAIS_FIREBASE)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("Localizando desenvolvimentos até a etapa Validação/FO050...")
    try:
        codigos_ativos, projetos_ativos, total_projetos = buscar_componentes_ativos(db)
    except Exception as e:
        print(f"Erro ao consultar os projetos no Firebase: {e}")
        return

    print(
        f"{projetos_ativos} de {total_projetos} desenvolvimento(s) estão até a FO050; "
        f"{len(codigos_ativos)} componente(s) único(s) serão verificados."
    )
    if not codigos_ativos:
        print("Nenhum componente elegível. Nada será lido ou alterado na coleção de estoque.")
        return

    saldos_planilha = saldos_relevantes_da_planilha(df, codigos_ativos)
    codigos_nao_encontrados = codigos_ativos - set(saldos_planilha)
    if codigos_nao_encontrados:
        print(
            f"Aviso: {len(codigos_nao_encontrados)} componente(s) ativo(s) não foram encontrados "
            "na planilha e não serão alterados."
        )

    estoque_ref = db.collection("estoque")
    print("Lendo no Firebase somente os saldos dos componentes elegíveis...")
    try:
        estoque_atual = carregar_saldos_atuais(db, estoque_ref, saldos_planilha)
    except Exception as e:
        print(f"Erro ao ler os saldos atuais no Firebase: {e}")
        return

    alteracoes = [
        (codigo, saldo)
        for codigo, saldo in sorted(saldos_planilha.items())
        if estoque_atual.get(codigo) != saldo
    ]
    itens_ignorados = len(saldos_planilha) - len(alteracoes)
    if not alteracoes:
        print("Sincronização concluída! Todos os componentes elegíveis já estão atualizados.")
        print(f"{itens_ignorados} item(ns) permaneceram com o saldo correto.")
        return

    total_atualizados = 0
    lotes_enviados = 0
    for inicio in range(0, len(alteracoes), 400):
        lote = alteracoes[inicio:inicio + 400]
        batch = db.batch()
        for codigo, saldo in lote:
            batch.set(estoque_ref.document(codigo), {
                "saldo": saldo,
                "ultima_atualizacao": firestore.SERVER_TIMESTAMP,
            })
        print(f"Enviando lote {lotes_enviados + 1} ({len(lote)} itens no lote)...")
        try:
            batch.commit()
        except Exception as e:
            print(f"Erro ao enviar lote (cota pode estar excedida): {e}")
            return
        total_atualizados += len(lote)
        lotes_enviados += 1

    print(f"Sincronização concluída! {total_atualizados} itens atualizados.")
    print(f"{itens_ignorados} itens não precisaram ser atualizados (já estavam com o saldo correto).")

if __name__ == "__main__":
    if not os.path.exists(ARQUIVO_CREDENCIAIS_FIREBASE):
        print(f"ERRO: Arquivo {ARQUIVO_CREDENCIAIS_FIREBASE} não encontrado!")
        print("Por favor, coloque a chave do Firebase na mesma pasta do script.")
        exit(1)
        
    print("=== INICIANDO INTEGRAÇÃO ERP -> FIREBASE ===")
    atualizar_planilha(ARQUIVO_EXCEL)
    ler_e_enviar_para_firebase()
    print("=== FINALIZADO ===")
    time.sleep(3)
