"""Sincroniza o acompanhamento de SCs e OCs do Tecnicon com o DevFlow.

O conector consulta o Firebird exclusivamente com SELECT e grava somente o
resultado da integracao nos documentos existentes da colecao ``projetos``.
Ele nunca altera dados no ERP nem movimenta etapas do Kanban.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import threading
import time
from collections import defaultdict
from datetime import date, datetime, time as datetime_time, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable, Iterator


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_DIR = SCRIPT_DIR.parent
DEFAULT_ERP_ENV = Path(
    r"Q:\19. ENGENHARIA DE MÉTODOS E PROCESSO\.BASE DE CONHECIMENTO DE IAs\Banco de dados VieMES e Tecnicon\.env"
)
DEFAULT_FIREBASE_CREDENTIALS = REPO_DIR / "script_estoque" / "firebase-key.json"
SC_NUMBER = re.compile(r"\d+")
ERP_QUERY_BATCH = 80
LOG_FILE = Path(
    os.getenv("DEVFLOW_COMPRAS_LOG_FILE", "")
    or SCRIPT_DIR / "logs" / "compras.log"
)


SC_QUERY = """
select
    sc.solcompra,
    sc.data as data_sc,
    sc.aprovado,
    sc.liberadaprov,
    sc.dtaprov,
    sc.hraprov,
    sc.cusuarioaprovador,
    sc.usuarioaprovador,
    sc.status as status_cabecalho,
    sci.solocitem,
    sci.cancelado as item_cancelado,
    oci.ocitem,
    oci.compra
from solcompra sc
left join solcompraitem sci on sci.solcompra = sc.solcompra
left join ocitem oci on oci.solocitem = sci.solocitem
where sc.solcompra in ({placeholders})
order by sc.solcompra, sci.solocitem, oci.ocitem
"""


OC_HEADER_QUERY = """
select
    oc.compra,
    oc.data as data_oc,
    oc.hora as hora_oc,
    oc.cclifor,
    oc.filialcf,
    cf.nome as fornecedor,
    oc.comprador,
    oc.ccomprador,
    oc.ccusto,
    oc.usuarioaprov,
    oc.dtaprov,
    oc.horaaprovado,
    oc.compraaprov,
    oc.libaprov,
    oc.dtlibaprov,
    oc.envemail,
    oc.dataenvmail,
    oc.cancelado
from ordemcompra oc
left join clifor cf on cf.cclifor = oc.cclifor and cf.cfilial = oc.filialcf
where oc.compra in ({placeholders})
order by oc.compra
"""


OC_ITEM_QUERY = """
with alvo as (
    select
        oci.compra,
        oci.ocitem,
        oci.cproduto,
        oci.descricao,
        oci.qtde as qtde_oc,
        oci.solocitem
    from ocitem oci
    where oci.compra in ({placeholders})
), recebimentos as (
    select
        a.ocitem,
        nfi.nfeitem,
        nfi.qtde as qtde_nf,
        nfi.nfe
    from alvo a
    join nfeitem nfi on nfi.ocitem = a.ocitem

    union

    select
        a.ocitem,
        nfi.nfeitem,
        nfi.qtde as qtde_nf,
        nfi.nfe
    from alvo a
    join ocitembx bx on bx.ocitem = a.ocitem
    join nfeitem nfi on nfi.nfeitem = bx.nfeitem
)
select
    oci.compra,
    oci.ocitem,
    oci.cproduto,
    oci.descricao,
    oci.qtde_oc,
    sci.solcompra,
    nfi.nfeitem,
    nfi.qtde_nf,
    nfi.nfe,
    nf.nf,
    nf.serie,
    nf.data as data_nf,
    nf.dataentrada,
    nf.horaentrada
from alvo oci
left join solcompraitem sci on sci.solocitem = oci.solocitem
left join recebimentos nfi on nfi.ocitem = oci.ocitem
left join nfentrada nf on nf.nfe = nfi.nfe
order by oci.compra, oci.ocitem, nf.dataentrada, nfi.nfeitem
"""


OC_APPROVER_QUERY = """
with alvo as (
    select oc.compra, oc.cfilial, oc.ccusto
    from ordemcompra oc
    where oc.compra in ({placeholders})
), totais as (
    select oci.compra, sum(coalesce(oci.total, 0)) as total_oc
    from ocitem oci
    join alvo a on a.compra = oci.compra
    group by oci.compra
)
select
    a.compra,
    p.parceiro,
    p.cgrusuario,
    p.ccusto as cfg_ccusto,
    p.cfilial as cfg_filial,
    p.sparceiroccfaixaap,
    f.ocini,
    f.ocfin
from alvo a
join totais tot on tot.compra = a.compra
join parceiroccfaixaap p on (p.ccusto = a.ccusto or p.ccusto is null)
    and (p.cfilial = a.cfilial or p.cfilial is null)
join faixaap f on f.cfaixaap = p.cfaixaap
left join tpaprovacao tp on tp.ctpaprovacao = p.ctpaprovacao
where tot.total_oc between coalesce(f.ocini, 0) and coalesce(f.ocfin, 999999999999)
    and (tp.origem = 'T' or tp.origem is null)
order by
    a.compra,
    case when p.ccusto = a.ccusto then 0 else 1 end,
    case when p.cfilial = a.cfilial then 0 else 1 end,
    p.sparceiroccfaixaap
"""


def log(message: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{stamp}] {message}"
    print(line, flush=True)
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as log_file:
            log_file.write(line + "\n")
    except OSError:
        pass


def load_env_file(path: Path) -> None:
    """Carrega um .env sem imprimir ou sobrescrever o ambiente do processo."""
    if not path.is_file():
        raise RuntimeError(f"Arquivo de configuracao do ERP nao encontrado: {path}")
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"').strip("'")
        if name:
            os.environ.setdefault(name, value)


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Variavel obrigatoria ausente: {name}")
    return value


def safe_odbc_value(name: str, value: str) -> str:
    if ";" in value or "\x00" in value:
        raise RuntimeError(f"Valor invalido na configuracao ODBC: {name}")
    return value


def firebird_connection() -> Any:
    try:
        import pyodbc
    except ImportError as exc:
        raise RuntimeError(
            "Dependencia pyodbc ausente. Execute: python -m pip install -r script_compras/requirements.txt"
        ) from exc

    parts = ["DSN=" + safe_odbc_value("TECNICON_FB_DSN", required_env("TECNICON_FB_DSN"))]
    user = os.getenv("TECNICON_FB_USER", "").strip()
    password = os.getenv("TECNICON_FB_PASSWORD", "")
    if user:
        parts.append("UID=" + safe_odbc_value("TECNICON_FB_USER", user))
    if password:
        parts.append("PWD=" + safe_odbc_value("TECNICON_FB_PASSWORD", password))
    timeout = int(os.getenv("DB_CONNECT_TIMEOUT_SECONDS", "15"))
    return pyodbc.connect(";".join(parts) + ";", timeout=timeout, autocommit=False)


def firebase_client() -> Any:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError as exc:
        raise RuntimeError(
            "Dependencia firebase-admin ausente. Execute: python -m pip install -r script_compras/requirements.txt"
        ) from exc

    if not firebase_admin._apps:
        configured = os.getenv("DEVFLOW_FIREBASE_CREDENTIALS", "").strip()
        credential_path = Path(configured) if configured else DEFAULT_FIREBASE_CREDENTIALS
        if credential_path.is_file():
            firebase_admin.initialize_app(credentials.Certificate(str(credential_path)))
        else:
            firebase_admin.initialize_app()
    return firestore.client()


def chunks(values: list[str], size: int) -> Iterator[list[str]]:
    for start in range(0, len(values), size):
        yield values[start : start + size]


def normalize_flag(value: Any) -> str:
    return str(value or "").strip().upper()


def iso_date(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    return text[:10] if text else ""


def iso_datetime(date_value: Any, time_value: Any = None) -> str:
    if date_value is None:
        return ""
    if isinstance(date_value, datetime):
        result = date_value
    elif isinstance(date_value, date):
        if isinstance(time_value, datetime_time):
            result = datetime.combine(date_value, time_value)
        else:
            result = datetime.combine(date_value, datetime_time.min)
    else:
        text = str(date_value).strip()
        if not text:
            return ""
        return text
    return result.isoformat(timespec="seconds")


def decimal_value(value: Any) -> Decimal:
    if value in (None, ""):
        return Decimal("0")
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return Decimal("0")


def json_number(value: Decimal) -> float:
    return round(float(value), 3)


def sc_numbers_from_text(value: Any) -> list[str]:
    return list(dict.fromkeys(SC_NUMBER.findall(str(value or ""))))


def sc_numbers_from_project(project: dict[str, Any]) -> list[str]:
    compras = project.get("compras") or {}
    sc = compras.get("sc") or {}
    raw_values = [sc.get("numero"), project.get("numSC")]
    numbers: list[str] = []
    for raw in raw_values:
        numbers.extend(sc_numbers_from_text(raw))
    return list(dict.fromkeys(numbers))


def oc_numbers_from_project(project: dict[str, Any]) -> list[str]:
    compras = project.get("compras") or {}
    oc = compras.get("oc") or {}
    raw_values = [oc.get("numero"), project.get("numOC")]
    numbers: list[str] = []
    for raw in raw_values:
        numbers.extend(sc_numbers_from_text(raw))
    return list(dict.fromkeys(numbers))


def row_dicts(cursor: Any) -> list[dict[str, Any]]:
    names = [item[0].lower() for item in cursor.description]
    return [dict(zip(names, row)) for row in cursor.fetchall()]


def fetch_sc_rows(connection: Any, sc_numbers: Iterable[str]) -> dict[str, list[dict[str, Any]]]:
    numbers = list(dict.fromkeys(str(number) for number in sc_numbers if str(number).isdigit()))
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    connection.timeout = max(1, int(os.getenv("DB_STATEMENT_TIMEOUT_MS", "15000")) // 1000)
    cursor = connection.cursor()
    for batch in chunks(numbers, ERP_QUERY_BATCH):
        placeholders = ",".join("?" for _ in batch)
        cursor.execute(SC_QUERY.format(placeholders=placeholders), tuple(int(number) for number in batch))
        for row in row_dicts(cursor):
            grouped[str(row["solcompra"])].append(row)
    return grouped


def fetch_oc_data(
    connection: Any, oc_numbers: Iterable[str]
) -> tuple[
    dict[str, dict[str, Any]],
    dict[str, list[dict[str, Any]]],
    dict[str, dict[str, Any]],
]:
    numbers = list(dict.fromkeys(str(number) for number in oc_numbers if str(number).isdigit()))
    headers: dict[str, dict[str, Any]] = {}
    items: dict[str, list[dict[str, Any]]] = defaultdict(list)
    approvers: dict[str, dict[str, Any]] = {}
    connection.timeout = max(1, int(os.getenv("DB_STATEMENT_TIMEOUT_MS", "15000")) // 1000)
    cursor = connection.cursor()
    for batch in chunks(numbers, ERP_QUERY_BATCH):
        placeholders = ",".join("?" for _ in batch)
        parameters = tuple(int(number) for number in batch)

        cursor.execute(OC_HEADER_QUERY.format(placeholders=placeholders), parameters)
        for row in row_dicts(cursor):
            headers[str(row["compra"])] = row

        cursor.execute(OC_ITEM_QUERY.format(placeholders=placeholders), parameters)
        for row in row_dicts(cursor):
            items[str(row["compra"])].append(row)

        cursor.execute(OC_APPROVER_QUERY.format(placeholders=placeholders), parameters)
        for row in row_dicts(cursor):
            approvers.setdefault(str(row["compra"]), row)

    return headers, items, approvers


STATUS_LABELS = {
    "NAO_ENCONTRADA": "SC não encontrada",
    "NAO_LIBERADA": "Não liberada",
    "AGUARDANDO_APROVACAO": "Aguardando aprovação",
    "APROVADA": "Aprovada",
    "PARCIALMENTE_CONVERTIDA": "Parcialmente convertida em OC",
    "CONVERTIDA_EM_OC": "Convertida em OC",
    "RECUSADA": "Recusada",
    "CANCELADA": "Cancelada",
    "EM_PREPARACAO": "Em preparação no ERP",
}


NEXT_ACTIONS = {
    "NAO_ENCONTRADA": "Conferir o número da SC informado no DevFlow.",
    "NAO_LIBERADA": "Solicitar a liberação da SC para aprovação.",
    "AGUARDANDO_APROVACAO": "Acionar o aprovador indicado no ERP.",
    "APROVADA": "Acompanhar o Compras para geração da OC.",
    "PARCIALMENTE_CONVERTIDA": "Acompanhar os itens da SC ainda sem OC.",
    "CONVERTIDA_EM_OC": "SC concluída; acompanhar a aprovação da OC.",
    "RECUSADA": "Verificar o motivo da recusa e corrigir a solicitação.",
    "CANCELADA": "SC encerrada no ERP.",
    "EM_PREPARACAO": "Conferir a liberação e o fluxo de aprovação no ERP.",
}


OC_STATUS_LABELS = {
    "NAO_ENCONTRADA": "OC n\u00e3o encontrada",
    "NAO_LIBERADA": "OC n\u00e3o liberada",
    "AGUARDANDO_APROVACAO": "Aguardando aprova\u00e7\u00e3o da OC",
    "RECUSADA": "OC recusada",
    "AGUARDANDO_ENVIO": "Aprovada, aguardando envio",
    "AGUARDANDO_ENTREGA": "Aguardando entrega",
    "ATRASADA": "Entrega atrasada",
    "RECEBIDA_PARCIAL": "Recebida parcialmente",
    "RECEBIDA": "Recebida",
    "CANCELADA": "OC cancelada",
}


OC_NEXT_ACTIONS = {
    "NAO_ENCONTRADA": "Conferir o n\u00famero da OC informado no DevFlow.",
    "NAO_LIBERADA": "Acionar Compras para liberar a OC para aprova\u00e7\u00e3o.",
    "AGUARDANDO_APROVACAO": "Acionar o aprovador previsto no ERP.",
    "RECUSADA": "Verificar o motivo da recusa e corrigir a OC.",
    "AGUARDANDO_ENVIO": "Acionar Compras para enviar a OC ao fornecedor.",
    "AGUARDANDO_ENTREGA": "Acompanhar o prazo de entrega com o fornecedor.",
    "ATRASADA": "Cobrar o fornecedor e atualizar a previs\u00e3o de entrega.",
    "RECEBIDA_PARCIAL": "Acompanhar o saldo pendente da OC.",
    "RECEBIDA": "OC conclu\u00edda pela entrada da NF.",
    "CANCELADA": "OC encerrada no ERP.",
}


def aggregate_sc(sc_number: str, rows: list[dict[str, Any]], synced_at: str) -> dict[str, Any]:
    if not rows:
        status_code = "NAO_ENCONTRADA"
        return {
            "numero": sc_number,
            "encontrada": False,
            "statusCodigo": status_code,
            "status": STATUS_LABELS[status_code],
            "dataCriacao": "",
            "aprovador": "",
            "dataAprovacao": "",
            "itensTotal": 0,
            "itensConvertidos": 0,
            "ocNumeros": [],
            "proximaAcao": NEXT_ACTIONS[status_code],
            "atualizadoEm": synced_at,
        }

    first = rows[0]
    item_state: dict[str, dict[str, Any]] = {}
    oc_numbers: set[str] = set()
    for row in rows:
        item_id = row.get("solocitem")
        if item_id is None:
            continue
        key = str(item_id)
        state = item_state.setdefault(
            key,
            {"cancelado": normalize_flag(row.get("item_cancelado")) == "S", "convertido": False},
        )
        if row.get("ocitem") is not None:
            state["convertido"] = True
        if row.get("compra") is not None:
            oc_numbers.add(str(row["compra"]))

    active_items = [state for state in item_state.values() if not state["cancelado"]]
    converted_items = [state for state in active_items if state["convertido"]]
    approved = normalize_flag(first.get("aprovado"))
    released = normalize_flag(first.get("liberadaprov"))

    if item_state and not active_items:
        status_code = "CANCELADA"
    elif approved == "C":
        status_code = "RECUSADA"
    elif active_items and len(converted_items) == len(active_items):
        status_code = "CONVERTIDA_EM_OC"
    elif converted_items:
        status_code = "PARCIALMENTE_CONVERTIDA"
    elif approved == "S":
        status_code = "APROVADA"
    elif released == "N":
        status_code = "NAO_LIBERADA"
    elif released == "S":
        status_code = "AGUARDANDO_APROVACAO"
    else:
        status_code = "EM_PREPARACAO"

    approver = str(first.get("usuarioaprovador") or first.get("cusuarioaprovador") or "").strip()
    return {
        "numero": sc_number,
        "encontrada": True,
        "statusCodigo": status_code,
        "status": STATUS_LABELS[status_code],
        "dataCriacao": iso_date(first.get("data_sc")),
        "aprovador": approver,
        "dataAprovacao": iso_datetime(first.get("dtaprov"), first.get("hraprov")),
        "itensTotal": len(active_items),
        "itensConvertidos": len(converted_items),
        "ocNumeros": sorted(oc_numbers, key=lambda value: int(value) if value.isdigit() else value),
        "proximaAcao": NEXT_ACTIONS[status_code],
        "atualizadoEm": synced_at,
    }


def aggregate_oc(
    oc_number: str,
    header: dict[str, Any] | None,
    rows: list[dict[str, Any]],
    approver_rule: dict[str, Any] | None,
    synced_at: str,
    today: date | None = None,
) -> dict[str, Any]:
    if not header:
        code = "NAO_ENCONTRADA"
        return {
            "numero": oc_number,
            "encontrada": False,
            "statusCodigo": code,
            "status": OC_STATUS_LABELS[code],
            "dataEmissao": "",
            "comprador": "",
            "fornecedor": "",
            "aprovador": "",
            "aprovadorPrevisto": "",
            "dataAprovacao": "",
            "enviadaEm": "",
            "recebidaEm": "",
            "percentualRecebido": 0.0,
            "itensTotal": 0,
            "itensRecebidos": 0,
            "quantidadeComprada": 0.0,
            "quantidadeRecebida": 0.0,
            "scNumeros": [],
            "itens": [],
            "notasFiscais": [],
            "proximaAcao": OC_NEXT_ACTIONS[code],
            "atualizadoEm": synced_at,
        }

    today = today or date.today()
    item_state: dict[str, dict[str, Any]] = {}
    notes: dict[str, dict[str, Any]] = {}
    sc_numbers: set[str] = set()
    for row in rows:
        item_id = row.get("ocitem")
        if item_id is None:
            continue
        key = str(item_id)
        state = item_state.setdefault(
            key,
            {
                "numero": key,
                "produto": str(row.get("cproduto") or "").strip(),
                "descricao": str(row.get("descricao") or "").strip(),
                "quantidade": decimal_value(row.get("qtde_oc")),
                "recebida": Decimal("0"),
                "_nfeitems": set(),
            },
        )
        if row.get("solcompra") is not None:
            sc_numbers.add(str(row["solcompra"]))
        nfeitem = row.get("nfeitem")
        if nfeitem is not None and str(nfeitem) not in state["_nfeitems"]:
            state["_nfeitems"].add(str(nfeitem))
            state["recebida"] += decimal_value(row.get("qtde_nf"))
        if row.get("nfe") is not None:
            note_key = str(row["nfe"])
            notes.setdefault(
                note_key,
                {
                    "numero": str(row.get("nf") or "").strip(),
                    "serie": str(row.get("serie") or "").strip(),
                    "entradaEm": iso_datetime(row.get("dataentrada"), row.get("horaentrada"))
                    or iso_date(row.get("data_nf")),
                },
            )

    ordered_total = Decimal("0")
    received_total = Decimal("0")
    received_items = 0
    item_records: list[dict[str, Any]] = []
    for state in item_state.values():
        ordered = max(Decimal("0"), state["quantidade"])
        received = max(Decimal("0"), state["recebida"])
        considered_received = min(received, ordered) if ordered > 0 else received
        complete = ordered > 0 and received >= ordered
        if complete:
            received_items += 1
        ordered_total += ordered
        received_total += considered_received
        item_records.append(
            {
                "numero": state["numero"],
                "produto": state["produto"],
                "descricao": state["descricao"],
                "quantidade": json_number(ordered),
                "quantidadeRecebida": json_number(received),
                "recebido": complete,
            }
        )

    items_total = len(item_records)
    fully_received = items_total > 0 and received_items == items_total
    partially_received = received_total > 0 and not fully_received

    approved = normalize_flag(header.get("compraaprov"))
    released = normalize_flag(header.get("libaprov"))
    sent = normalize_flag(header.get("envemail"))
    canceled = normalize_flag(header.get("cancelado"))
    if canceled == "S":
        code = "CANCELADA"
    elif approved == "R":
        code = "RECUSADA"
    elif fully_received:
        code = "RECEBIDA"
    elif partially_received:
        code = "RECEBIDA_PARCIAL"
    elif approved != "S":
        code = "AGUARDANDO_APROVACAO" if released == "S" else "NAO_LIBERADA"
    elif sent != "S":
        code = "AGUARDANDO_ENVIO"
    else:
        code = "AGUARDANDO_ENTREGA"

    predicted_approver = ""
    if approver_rule:
        predicted_approver = str(approver_rule.get("parceiro") or "").strip()
        if not predicted_approver and approver_rule.get("cgrusuario") is not None:
            predicted_approver = f"Grupo ERP {approver_rule['cgrusuario']}"
    effective_approver = str(header.get("usuarioaprov") or "").strip()
    buyer = str(header.get("comprador") or "").strip()
    action = OC_NEXT_ACTIONS[code]
    if code == "AGUARDANDO_APROVACAO" and predicted_approver:
        action = f"Acionar {predicted_approver} para aprovar a OC."
    elif code in {"NAO_LIBERADA", "AGUARDANDO_ENVIO"} and buyer:
        action = f"Acionar {buyer} em Compras para avan\u00e7ar a OC."

    note_records = sorted(notes.values(), key=lambda item: item.get("entradaEm") or "")
    received_at = max((item.get("entradaEm") or "" for item in note_records), default="")
    percent = float((received_total / ordered_total * 100) if ordered_total > 0 else 0)
    return {
        "numero": oc_number,
        "encontrada": True,
        "statusCodigo": code,
        "status": OC_STATUS_LABELS[code],
        "dataEmissao": iso_datetime(header.get("data_oc"), header.get("hora_oc")),
        "comprador": buyer,
        "fornecedor": str(header.get("fornecedor") or "").strip(),
        "aprovador": effective_approver or predicted_approver,
        "aprovadorPrevisto": predicted_approver,
        "dataAprovacao": iso_datetime(header.get("dtaprov"), header.get("horaaprovado")),
        "enviadaEm": iso_date(header.get("dataenvmail")) if sent == "S" else "",
        "recebidaEm": received_at,
        "percentualRecebido": round(percent, 1),
        "itensTotal": items_total,
        "itensRecebidos": received_items,
        "quantidadeComprada": json_number(ordered_total),
        "quantidadeRecebida": json_number(received_total),
        "scNumeros": sorted(sc_numbers, key=lambda value: int(value) if value.isdigit() else value),
        "itens": item_records,
        "notasFiscais": note_records,
        "proximaAcao": action,
        "atualizadoEm": synced_at,
    }


def summarize_status(records: list[dict[str, Any]]) -> str:
    if not records:
        return "Sem SC informada"
    priority = [
        "RECUSADA",
        "NAO_ENCONTRADA",
        "NAO_LIBERADA",
        "AGUARDANDO_APROVACAO",
        "EM_PREPARACAO",
        "PARCIALMENTE_CONVERTIDA",
        "APROVADA",
        "CONVERTIDA_EM_OC",
        "CANCELADA",
    ]
    for code in priority:
        matches = [record for record in records if record.get("statusCodigo") == code]
        if matches:
            return STATUS_LABELS[code] if len(records) == 1 else f"{len(matches)} de {len(records)}: {STATUS_LABELS[code]}"
    return "Atualizada"


def summarize_oc_status(records: list[dict[str, Any]]) -> str:
    if not records:
        return "Sem OC informada ou gerada"
    priority = [
        "RECUSADA",
        "NAO_ENCONTRADA",
        "NAO_LIBERADA",
        "AGUARDANDO_APROVACAO",
        "AGUARDANDO_ENVIO",
        "ATRASADA",
        "RECEBIDA_PARCIAL",
        "AGUARDANDO_ENTREGA",
        "RECEBIDA",
        "CANCELADA",
    ]
    for code in priority:
        matches = [record for record in records if record.get("statusCodigo") == code]
        if matches:
            label = OC_STATUS_LABELS[code]
            return label if len(records) == 1 else f"{len(matches)} de {len(records)}: {label}"
    return "Atualizada"


def project_needs_requested_sync(project: dict[str, Any]) -> bool:
    integration = ((project.get("compras") or {}).get("integracao") or {})
    requested = str(integration.get("solicitadoEm") or "")
    processed = str(integration.get("processadoEm") or "")
    return bool(requested and requested > processed)


def project_has_erp_numbers(project: dict[str, Any]) -> bool:
    return bool(sc_numbers_from_project(project) or oc_numbers_from_project(project))


def sync_projects(db: Any, project_snapshots: list[Any], only_requested: bool = False) -> int:
    selected: list[tuple[Any, dict[str, Any], list[str], list[str]]] = []
    all_sc_numbers: list[str] = []
    for snapshot in project_snapshots:
        project = snapshot.to_dict() or {}
        sc_numbers = sc_numbers_from_project(project)
        manual_oc_numbers = oc_numbers_from_project(project)
        if not (sc_numbers or manual_oc_numbers) or (
            only_requested and not project_needs_requested_sync(project)
        ):
            continue
        selected.append((snapshot, project, sc_numbers, manual_oc_numbers))
        all_sc_numbers.extend(sc_numbers)
    all_sc_numbers = list(dict.fromkeys(all_sc_numbers))
    if not selected:
        return 0

    synced_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    log(f"Consultando {len(all_sc_numbers)} SC(s) de {len(selected)} desenvolvimento(s).")
    connection = firebird_connection()
    try:
        grouped_sc = fetch_sc_rows(connection, all_sc_numbers)
        sc_records_by_project: dict[str, list[dict[str, Any]]] = {}
        all_oc_numbers: list[str] = []
        for snapshot, _project, sc_numbers, manual_oc_numbers in selected:
            records = [aggregate_sc(number, grouped_sc.get(number, []), synced_at) for number in sc_numbers]
            sc_records_by_project[snapshot.id] = records
            derived_oc_numbers = [
                oc_number
                for record in records
                for oc_number in (record.get("ocNumeros") or [])
            ]
            all_oc_numbers.extend(manual_oc_numbers)
            all_oc_numbers.extend(derived_oc_numbers)
        all_oc_numbers = list(dict.fromkeys(all_oc_numbers))
        log(f"Consultando {len(all_oc_numbers)} OC(s) vinculada(s) ou informada(s).")
        oc_headers, oc_items, oc_approvers = fetch_oc_data(connection, all_oc_numbers)
        connection.rollback()
    finally:
        connection.close()

    for snapshot, _project, _sc_numbers, manual_oc_numbers in selected:
        sc_records = sc_records_by_project[snapshot.id]
        derived_oc_numbers = [
            oc_number
            for record in sc_records
            for oc_number in (record.get("ocNumeros") or [])
        ]
        project_oc_numbers = list(dict.fromkeys(manual_oc_numbers + derived_oc_numbers))
        oc_records = [
            aggregate_oc(
                number,
                oc_headers.get(number),
                oc_items.get(number, []),
                oc_approvers.get(number),
                synced_at,
            )
            for number in project_oc_numbers
        ]
        snapshot.reference.update(
            {
                "compras.integracao.fonte": "erp",
                "compras.integracao.ultimaSincronizacao": synced_at,
                "compras.integracao.processadoEm": synced_at,
                "compras.integracao.statusSincronizacao": "atualizado",
                "compras.integracao.erro": "",
                "compras.integracao.statusSCERP": summarize_status(sc_records),
                "compras.integracao.scERP": sc_records,
                "compras.integracao.statusOCERP": summarize_oc_status(oc_records),
                "compras.integracao.ocERP": oc_records,
            }
        )
    log(f"Sincronizacao concluida para {len(selected)} desenvolvimento(s).")
    return len(selected)


def mark_sync_error(project_snapshots: list[Any], message: str, only_requested: bool = False) -> None:
    failed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    safe_message = str(message).strip()[:500]
    for snapshot in project_snapshots:
        project = snapshot.to_dict() or {}
        if not project_has_erp_numbers(project) or (
            only_requested and not project_needs_requested_sync(project)
        ):
            continue
        try:
            snapshot.reference.update(
                {
                    "compras.integracao.processadoEm": failed_at,
                    "compras.integracao.statusSincronizacao": "erro",
                    "compras.integracao.erro": safe_message,
                }
            )
        except Exception:
            pass


def run_once(db: Any, only_requested: bool = False) -> int:
    collection = db.collection("projetos")
    if only_requested:
        snapshots = list(
            collection.where("compras.integracao.statusSincronizacao", "==", "solicitado").stream()
        )
    else:
        snapshots = list(collection.stream())
    try:
        return sync_projects(db, snapshots, only_requested=only_requested)
    except Exception as exc:
        mark_sync_error(snapshots, str(exc), only_requested=only_requested)
        raise


def run_watch(db: Any, request_poll: int) -> None:
    """Aguarda pedidos dos botoes sem executar varreduras completas."""
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
    except ImportError as exc:
        raise RuntimeError("Versao do google-cloud-firestore sem suporte a FieldFilter") from exc

    log("Monitor sob demanda de SC e OC iniciado. Nenhuma varredura automatica sera executada.")
    query = db.collection("projetos").where(
        filter=FieldFilter("compras.integracao.statusSincronizacao", "==", "solicitado")
    )
    sync_lock = threading.Lock()

    def process_requested(snapshots: list[Any], _changes: list[Any], _read_time: Any) -> None:
        if not snapshots:
            return
        with sync_lock:
            try:
                count = sync_projects(db, list(snapshots), only_requested=True)
                if count:
                    log(f"Pedido dos botoes processado: {count} desenvolvimento(s).")
            except Exception as exc:
                mark_sync_error(list(snapshots), str(exc), only_requested=True)
                log(f"Falha ao processar pedido dos botoes: {exc}")

    watch = query.on_snapshot(process_requested)
    try:
        while True:
            time.sleep(max(30, request_poll))
    finally:
        watch.unsubscribe()


def dry_run(sc_numbers: list[str], manual_oc_numbers: list[str]) -> int:
    synced_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    connection = firebird_connection()
    try:
        grouped = fetch_sc_rows(connection, sc_numbers)
        sc_records = [aggregate_sc(number, grouped.get(number, []), synced_at) for number in sc_numbers]
        derived_oc_numbers = [
            oc_number
            for record in sc_records
            for oc_number in (record.get("ocNumeros") or [])
        ]
        oc_numbers = list(dict.fromkeys(manual_oc_numbers + derived_oc_numbers))
        oc_headers, oc_items, oc_approvers = fetch_oc_data(connection, oc_numbers)
        connection.rollback()
    finally:
        connection.close()
    oc_records = [
        aggregate_oc(
            number,
            oc_headers.get(number),
            oc_items.get(number, []),
            oc_approvers.get(number),
            synced_at,
        )
        for number in oc_numbers
    ]
    print(json.dumps({"scERP": sc_records, "ocERP": oc_records}, ensure_ascii=False, indent=2, default=str))
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--watch", action="store_true", help="mantem o conector em execucao")
    parser.add_argument("--only-requested", action="store_true", help="processa somente solicitacoes dos botoes")
    parser.add_argument("--full-interval", type=int, default=900, help="opcao legada, ignorada no modo sob demanda")
    parser.add_argument("--request-poll", type=int, default=60, help="intervalo do heartbeat do monitor, em segundos")
    parser.add_argument("--dry-run", action="store_true", help="consulta SCs e OCs sem acessar o Firestore")
    parser.add_argument("--sc", action="append", default=[], help="numero de SC para o modo dry-run")
    parser.add_argument("--oc", action="append", default=[], help="numero de OC para o modo dry-run")
    parser.add_argument("--env-file", help="caminho alternativo para o .env autorizado do ERP")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    env_file = Path(args.env_file or os.getenv("DEVFLOW_ERP_ENV_FILE", "") or DEFAULT_ERP_ENV)
    load_env_file(env_file)
    if args.dry_run:
        numbers: list[str] = []
        for value in args.sc:
            numbers.extend(sc_numbers_from_text(value))
        numbers = list(dict.fromkeys(numbers))
        oc_numbers: list[str] = []
        for value in args.oc:
            oc_numbers.extend(sc_numbers_from_text(value))
        oc_numbers = list(dict.fromkeys(oc_numbers))
        if not (numbers or oc_numbers):
            raise RuntimeError("Informe ao menos uma SC com --sc ou uma OC com --oc no modo dry-run")
        return dry_run(numbers, oc_numbers)
    db = firebase_client()
    if args.watch:
        run_watch(db, max(30, args.request_poll))
        return 0
    run_once(db, only_requested=args.only_requested)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        log("Monitor encerrado pelo usuario.")
        raise SystemExit(0)
    except Exception as exc:
        log(f"Erro: {exc}")
        raise SystemExit(1) from exc
