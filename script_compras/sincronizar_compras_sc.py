"""Sincroniza o status de aprovacao das SCs do Tecnicon com o DevFlow.

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
import time
from collections import defaultdict
from datetime import date, datetime, time as datetime_time, timezone
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


def log(message: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {message}", flush=True)


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


def project_needs_requested_sync(project: dict[str, Any]) -> bool:
    integration = ((project.get("compras") or {}).get("integracao") or {})
    requested = str(integration.get("solicitadoEm") or "")
    processed = str(integration.get("processadoEm") or "")
    return bool(requested and requested > processed)


def sync_projects(db: Any, project_snapshots: list[Any], only_requested: bool = False) -> int:
    selected: list[tuple[Any, dict[str, Any], list[str]]] = []
    all_numbers: list[str] = []
    for snapshot in project_snapshots:
        project = snapshot.to_dict() or {}
        numbers = sc_numbers_from_project(project)
        if not numbers or (only_requested and not project_needs_requested_sync(project)):
            continue
        selected.append((snapshot, project, numbers))
        all_numbers.extend(numbers)
    all_numbers = list(dict.fromkeys(all_numbers))
    if not selected:
        return 0

    synced_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    log(f"Consultando {len(all_numbers)} SC(s) de {len(selected)} desenvolvimento(s).")
    connection = firebird_connection()
    try:
        grouped = fetch_sc_rows(connection, all_numbers)
        connection.rollback()
    finally:
        connection.close()

    for snapshot, _project, numbers in selected:
        records = [aggregate_sc(number, grouped.get(number, []), synced_at) for number in numbers]
        snapshot.reference.update(
            {
                "compras.integracao.fonte": "erp",
                "compras.integracao.ultimaSincronizacao": synced_at,
                "compras.integracao.processadoEm": synced_at,
                "compras.integracao.statusSincronizacao": "atualizado",
                "compras.integracao.erro": "",
                "compras.integracao.statusSCERP": summarize_status(records),
                "compras.integracao.scERP": records,
            }
        )
    log(f"Sincronizacao concluida para {len(selected)} desenvolvimento(s).")
    return len(selected)


def mark_sync_error(project_snapshots: list[Any], message: str, only_requested: bool = False) -> None:
    failed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    safe_message = str(message).strip()[:500]
    for snapshot in project_snapshots:
        project = snapshot.to_dict() or {}
        if not sc_numbers_from_project(project) or (only_requested and not project_needs_requested_sync(project)):
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
    snapshots = list(db.collection("projetos").stream())
    try:
        return sync_projects(db, snapshots, only_requested=only_requested)
    except Exception as exc:
        mark_sync_error(snapshots, str(exc), only_requested=only_requested)
        raise


def run_watch(db: Any, full_interval: int, request_poll: int) -> None:
    log("Monitor de SC iniciado. Pressione Ctrl+C para encerrar.")
    last_full_sync = 0.0
    while True:
        now = time.monotonic()
        full_sync = now - last_full_sync >= full_interval
        try:
            count = run_once(db, only_requested=not full_sync)
            if full_sync:
                last_full_sync = now
            if count:
                log(f"Ciclo processado: {count} desenvolvimento(s).")
        except Exception as exc:
            log(f"Falha no ciclo de sincronizacao: {exc}")
        time.sleep(request_poll)


def dry_run(sc_numbers: list[str]) -> int:
    synced_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    connection = firebird_connection()
    try:
        grouped = fetch_sc_rows(connection, sc_numbers)
        connection.rollback()
    finally:
        connection.close()
    records = [aggregate_sc(number, grouped.get(number, []), synced_at) for number in sc_numbers]
    print(json.dumps(records, ensure_ascii=False, indent=2, default=str))
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--watch", action="store_true", help="mantem o conector em execucao")
    parser.add_argument("--only-requested", action="store_true", help="processa somente solicitacoes dos botoes")
    parser.add_argument("--full-interval", type=int, default=900, help="intervalo da atualizacao completa, em segundos")
    parser.add_argument("--request-poll", type=int, default=15, help="intervalo para procurar solicitacoes, em segundos")
    parser.add_argument("--dry-run", action="store_true", help="consulta SCs informadas sem acessar o Firestore")
    parser.add_argument("--sc", action="append", default=[], help="numero de SC para o modo dry-run")
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
        if not numbers:
            raise RuntimeError("Informe ao menos uma SC com --sc no modo dry-run")
        return dry_run(numbers)
    db = firebase_client()
    if args.watch:
        run_watch(db, max(60, args.full_interval), max(5, args.request_poll))
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
