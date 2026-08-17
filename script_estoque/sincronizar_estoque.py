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
    
    print("Iniciando envio para o Firebase (Lote)...")
    batch = db.batch()
    estoque_ref = db.collection('estoque')
    
    print("Baixando saldos atuais do Firebase para poupar limite diário de gravação...")
    # Isso gasta leituras (limite 50.000) mas poupa gravações (limite 20.000)
    estoque_atual = {}
    try:
        for doc in estoque_ref.stream():
            estoque_atual[doc.id] = doc.to_dict().get('saldo', 0)
    except Exception as e:
        print(f"Aviso ao ler estoque atual: {e}")

    total_atualizados = 0
    contador = 0
    lotes_enviados = 0
    itens_ignorados = 0
    
    # Um Batch no Firebase aceita até 500 operações por vez. 
    # Vamos processar linha a linha da planilha e extrair o saldo dos 4 tipos de componentes.
    for index, row in df.iterrows():
        componentes = {
            row.get('CAIXA'): row.get('SALDO CAIXA'),
            row.get('PINO'): row.get('SALDO PINO'),
            row.get('FORJ_CAIXA'): row.get('SALDO FORJ_CAIXA'),
            row.get('FORJ_PINO'): row.get('SALDO FORJ_PINO')
        }
        
        for codigo_peca, saldo in componentes.items():
            if pd.isna(codigo_peca) or str(codigo_peca).strip() == '' or str(codigo_peca) == '0':
                continue
                
            codigo_peca_str = str(codigo_peca).strip().upper()

            try:
                # Converte o saldo para número inteiro, removendo .0 se houver
                saldo_limpo = int(float(str(saldo).replace(',', '.')))
            except:
                saldo_limpo = 0
                
            # OTIMIZAÇÃO DE COTA: Só grava se o saldo for diferente do que já está lá
            if estoque_atual.get(codigo_peca_str) == saldo_limpo:
                itens_ignorados += 1
                continue

            doc_ref = estoque_ref.document(codigo_peca_str)
            batch.set(doc_ref, {
                'saldo': saldo_limpo,
                'ultima_atualizacao': firestore.SERVER_TIMESTAMP
            })
            contador += 1
            total_atualizados += 1
            
            # Se chegou em 400 registros, envia o lote e cria um novo
            if contador >= 400:
                print(f"Enviando lote {lotes_enviados + 1} ({contador} itens no lote)...")
                try:
                    batch.commit()
                except Exception as e:
                    print(f"Erro ao enviar lote (Cota pode estar excedida): {e}")
                    return
                lotes_enviados += 1
                batch = db.batch()
                contador = 0

    # Envia os que sobraram no último lote
    if contador > 0:
        print(f"Enviando lote final {lotes_enviados + 1} ({contador} itens no lote)...")
        try:
            batch.commit()
        except Exception as e:
            print(f"Erro ao enviar lote final (Cota pode estar excedida): {e}")
            return
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
