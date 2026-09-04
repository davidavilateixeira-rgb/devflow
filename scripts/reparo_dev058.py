# Repara o historico de Usinagem do DEV-058, destruido pela migracao v2.5.0 em 04/09.
# As datas vem dos comentarios do proprio desenvolvimento, que sobreviveram intactos.
import sys, io, json, copy, firebase_admin
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from firebase_admin import credentials, firestore

cred = credentials.Certificate(r"H:\DESENVOLVIMENTOS\script_estoque\firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

DOC = "W8zDrDl4dwuU3PYmz8Nx"
JON = "Jonathann Dylan Machado Souza"
ref = db.collection("projetos").document(DOC)
p = ref.get().to_dict()

# Backup completo antes de qualquer escrita
bkp = r"C:\Users\DTEIXE~1\AppData\Local\Temp\claude\H--DESENVOLVIMENTOS\0a938f3a-cf12-46d1-bf5a-fad088905937\scratchpad\DEV-058_antes.json"
with io.open(bkp, "w", encoding="utf-8") as f:
    json.dump(p, f, ensure_ascii=False, indent=2, default=str)
print("backup:", bkp)

hist = copy.deepcopy(p["historico"])
assert len(hist) == 5, f"esperava 5 entradas, achei {len(hist)}"
assert hist[4]["usuario"] == "Sistema \u00b7 Migra\u00e7\u00e3o v2.5.0", hist[4]
assert p["etapaAtual"] == 4, p["etapaAtual"]

hist[4] = {"etapa": "Revisar/Atualizar cadastro no ERP",
           "data": "2026-09-01T14:03:32.248Z", "usuario": JON}
hist.append({"etapa": "Aprovar cadastro no sistema ERP",
             "data": "2026-09-01T14:06:27.432Z", "usuario": JON})
hist.append({"etapa": "Libera\u00e7\u00e3o",
             "data": "2026-09-04T15:52:50.521Z", "usuario": "David"})

print("\n-- HISTORICO NOVO --")
for i, h in enumerate(hist):
    print(f"  [{i}] {h['etapa']} @ {h['data']} por {h['usuario']}")
print("  etapaAtual: 4 -> 6")

ref.update({"historico": hist, "etapaAtual": 6})
print("\ngravado.")

d = ref.get().to_dict()
print("confirmado -> etapaAtual:", d["etapaAtual"], "| ultima etapa:", d["historico"][-1]["etapa"], "| total:", len(d["historico"]))
