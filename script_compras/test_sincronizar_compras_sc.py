import unittest
from datetime import date

from sincronizar_compras_sc import aggregate_sc, sc_numbers_from_text, summarize_status


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


if __name__ == "__main__":
    unittest.main()
