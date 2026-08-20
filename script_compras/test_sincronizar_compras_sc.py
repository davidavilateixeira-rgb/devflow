import unittest
from datetime import date
from unittest.mock import patch

from sincronizar_compras_sc import (
    aggregate_oc,
    aggregate_sc,
    oc_numbers_from_project,
    sc_numbers_from_text,
    run_watch,
    summarize_oc_status,
    summarize_status,
)


NOW = "2026-08-20T12:00:00+00:00"


def row(**overrides):
    base = {
        "solcompra": 100,
        "data_sc": date(2026, 8, 1),
        "aprovado": None,
        "liberadaprov": "S",
        "dtaprov": None,
        "hraprov": None,
        "cusuarioaprovador": None,
        "usuarioaprovador": "APROVADOR TESTE",
        "status_cabecalho": None,
        "solocitem": 1,
        "item_cancelado": "N",
        "ocitem": None,
        "compra": None,
    }
    base.update(overrides)
    return base


def oc_header(**overrides):
    base = {
        "compra": 200,
        "data_oc": date(2026, 8, 1),
        "hora_oc": None,
        "fornecedor": "FORNECEDOR TESTE",
        "comprador": "COMPRADOR TESTE",
        "usuarioaprov": None,
        "dtaprov": None,
        "horaaprovado": None,
        "compraaprov": "S",
        "libaprov": "S",
        "envemail": "S",
        "dataenvmail": date(2026, 8, 2),
        "cancelado": "N",
    }
    base.update(overrides)
    return base


def oc_item(**overrides):
    base = {
        "compra": 200,
        "ocitem": 10,
        "cproduto": "MAT-01",
        "descricao": "Material de teste",
        "qtde_oc": 10,
        "prevdt": date(2026, 8, 25),
        "solcompra": 100,
        "nfeitem": None,
        "qtde_nf": None,
        "nfe": None,
        "nf": None,
        "serie": None,
        "data_nf": None,
        "dataentrada": None,
        "horaentrada": None,
    }
    base.update(overrides)
    return base


class ScAggregationTests(unittest.TestCase):
    def test_extracts_multiple_sc_numbers(self):
        self.assertEqual(sc_numbers_from_text("666993 / 667043-667053"), ["666993", "667043", "667053"])

    def test_pending_approval(self):
        result = aggregate_sc("100", [row()], NOW)
        self.assertEqual(result["statusCodigo"], "AGUARDANDO_APROVACAO")
        self.assertEqual(result["aprovador"], "APROVADOR TESTE")

    def test_approved(self):
        result = aggregate_sc("100", [row(aprovado="S")], NOW)
        self.assertEqual(result["statusCodigo"], "APROVADA")

    def test_partial_conversion(self):
        rows = [
            row(solocitem=1, ocitem=10, compra=200),
            row(solocitem=2, ocitem=None, compra=None),
        ]
        result = aggregate_sc("100", rows, NOW)
        self.assertEqual(result["statusCodigo"], "PARCIALMENTE_CONVERTIDA")
        self.assertEqual(result["itensConvertidos"], 1)

    def test_complete_conversion(self):
        rows = [
            row(solocitem=1, ocitem=10, compra=200),
            row(solocitem=2, ocitem=11, compra=201),
        ]
        result = aggregate_sc("100", rows, NOW)
        self.assertEqual(result["statusCodigo"], "CONVERTIDA_EM_OC")
        self.assertEqual(result["ocNumeros"], ["200", "201"])

    def test_not_found(self):
        result = aggregate_sc("999", [], NOW)
        self.assertEqual(result["statusCodigo"], "NAO_ENCONTRADA")
        self.assertFalse(result["encontrada"])

    def test_summary_prioritizes_pending(self):
        approved = aggregate_sc("100", [row(aprovado="S")], NOW)
        pending = aggregate_sc("101", [row(solcompra=101)], NOW)
        self.assertIn("Aguardando aprovação", summarize_status([approved, pending]))


class OcAggregationTests(unittest.TestCase):
    def aggregate(self, header=None, rows=None, rule=None):
        return aggregate_oc(
            "200",
            oc_header() if header is None else header,
            [oc_item()] if rows is None else rows,
            rule,
            NOW,
            today=date(2026, 8, 20),
        )

    def test_extracts_manual_oc_numbers(self):
        project = {"compras": {"oc": {"numero": "1285333 / 1285343"}}, "numOC": "1285383"}
        self.assertEqual(oc_numbers_from_project(project), ["1285333", "1285343", "1285383"])

    def test_pending_approval_uses_predicted_approver(self):
        result = self.aggregate(
            header=oc_header(compraaprov="N", usuarioaprov=None),
            rule={"parceiro": "EMASSON"},
        )
        self.assertEqual(result["statusCodigo"], "AGUARDANDO_APROVACAO")
        self.assertEqual(result["aprovador"], "EMASSON")
        self.assertIn("EMASSON", result["proximaAcao"])

    def test_approved_waiting_email(self):
        result = self.aggregate(header=oc_header(envemail="N"))
        self.assertEqual(result["statusCodigo"], "AGUARDANDO_ENVIO")
        self.assertIn("COMPRADOR TESTE", result["proximaAcao"])

    def test_overdue_delivery(self):
        result = self.aggregate(rows=[oc_item(prevdt=date(2026, 8, 19))])
        self.assertEqual(result["statusCodigo"], "ATRASADA")

    def test_partial_receipt(self):
        result = self.aggregate(
            rows=[oc_item(nfeitem=501, qtde_nf=4, nfe=900, nf="12345", serie="1", dataentrada=date(2026, 8, 18))]
        )
        self.assertEqual(result["statusCodigo"], "RECEBIDA_PARCIAL")
        self.assertEqual(result["percentualRecebido"], 40.0)

    def test_full_receipt_uses_nf_entry(self):
        result = self.aggregate(
            rows=[oc_item(nfeitem=501, qtde_nf=10, nfe=900, nf="12345", serie="1", dataentrada=date(2026, 8, 18))]
        )
        self.assertEqual(result["statusCodigo"], "RECEBIDA")
        self.assertEqual(result["recebidaEm"], "2026-08-18T00:00:00")
        self.assertEqual(result["notasFiscais"][0]["numero"], "12345")

    def test_rejected_and_missing_oc(self):
        rejected = self.aggregate(header=oc_header(compraaprov="R"))
        missing = self.aggregate(header=False, rows=[])
        self.assertEqual(rejected["statusCodigo"], "RECUSADA")
        self.assertEqual(missing["statusCodigo"], "NAO_ENCONTRADA")
        self.assertIn("OC recusada", summarize_oc_status([rejected, missing]))


class DemandMonitorTests(unittest.TestCase):
    def test_watch_uses_only_filtered_listener_without_full_stream(self):
        events = {}

        class Watch:
            def unsubscribe(self):
                events["unsubscribed"] = True

        class Query:
            def on_snapshot(self, callback):
                events["callback"] = callback
                return Watch()

        class Collection:
            def where(self, *, filter):
                events["filter"] = filter
                return Query()

            def stream(self):
                raise AssertionError("A colecao completa nao pode ser lida no modo watch")

        class DB:
            def collection(self, name):
                self.assert_name = name
                return Collection()

        with patch("sincronizar_compras_sc.time.sleep", side_effect=KeyboardInterrupt):
            with self.assertRaises(KeyboardInterrupt):
                run_watch(DB(), 30)

        self.assertIn("callback", events)
        self.assertTrue(events.get("unsubscribed"))


if __name__ == "__main__":
    unittest.main()
