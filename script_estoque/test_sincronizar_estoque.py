import unittest

import pandas as pd

from sincronizar_estoque import (
    buscar_componentes_ativos,
    componentes_do_projeto,
    projeto_ate_fo050,
    saldos_relevantes_da_planilha,
)


class RegraEstoqueAteFO050Test(unittest.TestCase):
    def test_busca_reune_componentes_somente_dos_projetos_elegiveis(self):
        class Documento:
            def __init__(self, dados):
                self.dados = dados

            def to_dict(self):
                return self.dados

        class Colecao:
            def stream(self):
                return iter([
                    Documento({
                        "necessita": {"fixacao": True}, "etapaAtual": 10,
                        "refs": {"alojamento": "ATIVO-COMPLETO"},
                    }),
                    Documento({
                        "necessita": {"fixacao": True}, "etapaAtual": 11,
                        "refs": {"alojamento": "FORA-DO-LIMITE"},
                    }),
                    Documento({
                        "necessita": {"fixacao": False}, "etapaAtual": 3,
                        "refs": {"pino": "ATIVO-SIMPLES"},
                    }),
                ])

        class Banco:
            def collection(self, nome):
                self.nome = nome
                return Colecao()

        codigos, ativos, total = buscar_componentes_ativos(Banco())
        self.assertEqual(codigos, {"ATIVO-COMPLETO", "ATIVO-SIMPLES"})
        self.assertEqual(ativos, 2)
        self.assertEqual(total, 3)

    def test_fluxo_completo_inclui_fo050_e_exclui_etapa_seguinte(self):
        projeto = {"necessita": {"fixacao": True}, "etapaAtual": 10}
        self.assertTrue(projeto_ate_fo050(projeto))
        projeto["etapaAtual"] = 11
        self.assertFalse(projeto_ate_fo050(projeto))

    def test_fluxo_simplificado_inclui_fo050_e_exclui_etapa_seguinte(self):
        projeto = {"necessita": {"fixacao": False}, "etapaAtual": 3}
        self.assertTrue(projeto_ate_fo050(projeto))
        projeto["etapaAtual"] = 4
        self.assertFalse(projeto_ate_fo050(projeto))

    def test_componentes_usam_apenas_as_quatro_referencias_de_saldo(self):
        projeto = {
            "refs": {
                "alojamento": " caixa-1 ",
                "forjadoAlojamento": "forj-1",
                "pino": "PINO-1",
                "forjadoPino": "0",
                "npUsinagem": "NAO-INCLUIR",
            }
        }
        self.assertEqual(
            componentes_do_projeto(projeto),
            {"CAIXA-1", "FORJ-1", "PINO-1"},
        )

    def test_planilha_retorna_somente_saldos_dos_codigos_ativos(self):
        dados = pd.DataFrame([
            {
                "CAIXA": "CAIXA-1", "SALDO CAIXA": "12",
                "PINO": "PINO-1", "SALDO PINO": "5",
                "FORJ_CAIXA": "FORJ-1", "SALDO FORJ_CAIXA": "2",
                "FORJ_PINO": "FORJ-PINO-1", "SALDO FORJ_PINO": "8",
            }
        ])
        saldos = saldos_relevantes_da_planilha(dados, {"CAIXA-1", "PINO-1"})
        self.assertEqual(saldos, {"CAIXA-1": 12, "PINO-1": 5})


if __name__ == "__main__":
    unittest.main()
