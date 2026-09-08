// Regressao do avanco das etapas de compras confirmadas pelo ERP:
// Aprovacao SC, Ordem de Compra, Aprovacao OC e Fornecedor (entrada da NF).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(scriptsDir);
const indexHtml = fs.readFileSync(path.join(repoDir, "public", "index.html"), "utf8");

const inicio = indexHtml.indexOf("// Data da ultima entrada de NF");
const fim = indexHtml.indexOf("function dadosComprasProjeto");
assert.ok(inicio >= 0 && fim > inicio, "Funções do avanço por ERP não encontradas.");

const ETAPAS = ["Recebido", "Análise", "Projeto da Fixação", "Orçamento", "Solicitação de Compra",
  "Aprovação SC", "Ordem de Compra", "Aprovação OC", "Fornecedor",
  "Recebimento", "Validação/FO050", "Revisar/Atualizar cadastro no ERP",
  "Aprovar cadastro no sistema ERP", "Liberação"];

const salvos = [];
const avisos = [];
const estado = { projetos: [], aguardandoERP: new Set() };
let confirmarResposta = true;

const statusComprasInferido = p => {
  const i = p.etapaAtual;
  const iAprovSC = 5, iOC = 6, iAprovOC = 7, iFornecedor = 8, iRecebimento = 9;
  return {
    sc: i < iAprovSC ? "A criar" : i < iOC ? "Aguardando aprovação" : i < iAprovOC ? "Aprovada" : "Convertida em OC",
    oc: i < iAprovOC ? "A criar" : i < iFornecedor ? "Aguardando aprovação" : i <= iRecebimento ? "Aguardando entrega" : "Recebida"
  };
};

const factory = new Function(
  "ETAPAS", "estado", "USUARIO_ERP", "registrosOCERP", "registrosSCERP", "numerosOCERP", "comprasDe",
  "podeGravarFirestore", "podeGerenciarUsinagem", "sincronizacaoSCPendente", "statusComprasInferido",
  "sincronizarPrazoFornecedor", "salvarProjeto", "notificarSistema", "fmtL", "confirm", "renderTudo",
  indexHtml.slice(inicio, fim)
    + "\nreturn { entradaNFCompleta, somarDiasUteis, sinalERPDaEtapa, destinoAvancoERP,"
    + " avancarEtapasComprasPorERP, concluirEtapasComprasPorERP, projetosAvancoERPPendente,"
    + " aplicarAvancosERPPendentes, DIAS_UTEIS_PRAZO_FORNECEDOR };"
);
const api = factory(
  ETAPAS,
  estado,
  "Sistema · ERP",
  p => p.compras.integracao.ocERP,
  p => p.compras.integracao.scERP,
  p => {
    const manuais = [p.compras.oc.numero, p.numOC].filter(Boolean).join(" ").match(/\d+/g) || [];
    const derivados = (p.compras.integracao.scERP || []).flatMap(r => r.ocNumeros || []).map(String);
    return [...new Set([...manuais, ...derivados])];
  },
  p => p.compras,
  () => true,
  () => true,
  i => !!(i.solicitadoEm && (!i.processadoEm || i.solicitadoEm > i.processadoEm)),
  statusComprasInferido,
  p => {
    p.prazosEtapas = p.prazosEtapas || {};
    if (p.prazoFornecedor) p.prazosEtapas["Fornecedor"] = p.prazoFornecedor;
    else delete p.prazosEtapas["Fornecedor"];
  },
  p => salvos.push(p.id),
  msg => avisos.push(msg),
  valor => new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor + "T08:00:00" : valor).toLocaleDateString("pt-BR"),
  () => confirmarResposta,
  () => {}
);
const { entradaNFCompleta, somarDiasUteis, destinoAvancoERP, avancarEtapasComprasPorERP,
  concluirEtapasComprasPorERP, projetosAvancoERPPendente, aplicarAvancosERPPendentes,
  DIAS_UTEIS_PRAZO_FORNECEDOR } = api;

const projeto = (id, etapa, integracao = {}) => ({
  id, devId: id, codigo: id,
  necessita: { fixacao: true },
  etapaAtual: ETAPAS.indexOf(etapa),
  historico: [{ etapa, data: "2026-09-01T12:00:00Z", usuario: "Técnico" }],
  comentarios: [], numSC: "676853", numOC: "",
  compras: {
    sc: { numero: "676853", status: "", dataAbertura: "2026-09-08", dataAprovacao: "" },
    oc: { numero: "", status: "", dataEmissao: "", dataAprovacao: "", prazoEntrega: "" },
    integracao: {
      solicitadoEm: "2026-09-08T10:00:00Z", processadoEm: "2026-09-08T10:01:00Z",
      scERP: [], ocERP: [], ...integracao
    }
  }
});

const scAprovada = (ocNumeros = []) => ({
  numero: "676853", encontrada: true, statusCodigo: ocNumeros.length ? "CONVERTIDA_EM_OC" : "APROVADA",
  dataAprovacao: "2026-09-08T11:28:03", ocNumeros
});
const scPendente = () => ({ numero: "676853", encontrada: true, statusCodigo: "AGUARDANDO_APROVACAO", dataAprovacao: "", ocNumeros: [] });
const oc = (over = {}) => ({
  numero: "1291033", encontrada: true, statusCodigo: "NAO_LIBERADA",
  dataEmissao: "2026-09-09T08:15:00", dataAprovacao: "", recebidaEm: "", notasFiscais: [], ...over
});

// 1. SC aprovada conclui "Aprovação SC" com a data do ERP.
let p = projeto("DEV-A", "Aprovação SC", { scERP: [scAprovada()] });
let avancos = avancarEtapasComprasPorERP(p);
assert.equal(avancos.length, 1);
assert.equal(ETAPAS[p.etapaAtual], "Ordem de Compra");
assert.equal(p.historico.at(-1).data, "2026-09-08T11:28:03");
assert.equal(p.historico.at(-1).usuario, "Sistema · ERP");
assert.equal(p.compras.sc.dataAprovacao, "2026-09-08");

// 2. SC ainda aguardando aprovação não avança.
p = projeto("DEV-B", "Aprovação SC", { scERP: [scPendente()] });
assert.deepEqual(avancarEtapasComprasPorERP(p), []);
assert.equal(ETAPAS[p.etapaAtual], "Aprovação SC");

// 3. Uma SC aprovada e outra pendente segura a etapa.
p = projeto("DEV-C", "Aprovação SC", { scERP: [scAprovada(), scPendente()] });
assert.deepEqual(avancarEtapasComprasPorERP(p), []);

// 4. OC gerada conclui "Ordem de Compra" e grava o número no cadastro.
p = projeto("DEV-D", "Ordem de Compra", { scERP: [scAprovada(["1291033"])], ocERP: [oc()] });
avancos = avancarEtapasComprasPorERP(p);
assert.equal(avancos.length, 1);
assert.equal(ETAPAS[p.etapaAtual], "Aprovação OC");
assert.equal(p.numOC, "1291033", "deveria gravar o número da OC");
assert.equal(p.compras.oc.numero, "1291033");
assert.equal(p.compras.oc.dataEmissao, "2026-09-09");
assert.equal(p.historico.at(-1).data, "2026-09-09T08:15:00");

// 5. OC aprovada conclui "Aprovação OC" e adota 7 dias úteis como prazo do fornecedor.
// Aprovada numa quinta (10/09/2026): 7 dias úteis caem na segunda 21/09.
p = projeto("DEV-E", "Aprovação OC", {
  ocERP: [oc({ statusCodigo: "AGUARDANDO_ENVIO", dataAprovacao: "2026-09-10T16:00:00" })]
});
avancos = avancarEtapasComprasPorERP(p);
assert.equal(ETAPAS[p.etapaAtual], "Fornecedor");
assert.equal(p.compras.oc.dataAprovacao, "2026-09-10");
assert.equal(p.prazoFornecedor, "2026-09-21", "7 dias úteis a partir da aprovação da OC");
assert.equal(p.compras.oc.prazoEntrega, "2026-09-21");
assert.equal(p.prazosEtapas["Fornecedor"], "2026-09-21",
  "o prazo da etapa deve acompanhar a previsão do fornecedor");

// 6. OC ainda não aprovada não avança.
p = projeto("DEV-F", "Aprovação OC", { ocERP: [oc({ statusCodigo: "AGUARDANDO_APROVACAO" })] });
assert.deepEqual(avancarEtapasComprasPorERP(p), []);

// 7. Cascata: ERP adiantado percorre etapa por etapa, cada uma com a sua data.
p = projeto("DEV-G", "Aprovação SC", {
  scERP: [scAprovada(["1291033"])],
  ocERP: [oc({ statusCodigo: "RECEBIDA", dataAprovacao: "2026-09-10T16:00:00",
    recebidaEm: "2026-09-14T09:00:00", notasFiscais: [{ numero: "5285", entradaEm: "2026-09-14T09:00:00" }] })]
});
avancos = avancarEtapasComprasPorERP(p);
assert.deepEqual(avancos.map(a => a.etapa), ["Aprovação SC", "Ordem de Compra", "Aprovação OC", "Fornecedor"]);
assert.equal(ETAPAS[p.etapaAtual], "Recebimento");
assert.deepEqual(p.historico.slice(1).map(h => h.data),
  ["2026-09-08T11:28:03", "2026-09-09T08:15:00", "2026-09-10T16:00:00", "2026-09-14T09:00:00"],
  "cada etapa carimbada com a sua própria data do ERP");
assert.equal(p.compras.oc.status, "Recebida");
assert.equal(p.comentarios.length, 4, "um registro por etapa concluída");

// 8. Nunca ultrapassa "Recebimento", que é confirmação humana da ferramenta.
assert.deepEqual(avancarEtapasComprasPorERP(p), []);

// 9. Fluxo simples não tem etapas de compras.
p = projeto("DEV-H", "Aprovação SC", { scERP: [scAprovada()] });
p.necessita.fixacao = false;
assert.deepEqual(avancarEtapasComprasPorERP(p), []);

// 10. Caminho automático: só age depois da resposta do conector.
p = projeto("DEV-I", "Aprovação SC", { scERP: [scAprovada()] });
p.compras.integracao.solicitadoEm = "2026-09-08T10:05:00Z";   // pedido mais novo que a resposta
estado.projetos = [p];
estado.aguardandoERP = new Set([p.id]);
concluirEtapasComprasPorERP();
assert.equal(ETAPAS[p.etapaAtual], "Aprovação SC", "não deveria agir antes da resposta");
assert.equal(estado.aguardandoERP.size, 1, "deveria continuar aguardando");
p.compras.integracao.processadoEm = "2026-09-08T10:06:00Z";
concluirEtapasComprasPorERP();
assert.equal(ETAPAS[p.etapaAtual], "Ordem de Compra", "deveria avançar após a resposta");
assert.equal(estado.aguardandoERP.size, 0);

// 11. Caminho manual: lista os elegíveis com o destino e aplica em lote.
estado.projetos = [
  projeto("DEV-J", "Aprovação SC", { scERP: [scAprovada()] }),
  projeto("DEV-K", "Aprovação SC", { scERP: [scPendente()] }),
  projeto("DEV-L", "Ordem de Compra", { scERP: [scAprovada(["1291033"])], ocERP: [oc()] })
];
estado.aguardandoERP = new Set();
assert.deepEqual(projetosAvancoERPPendente().map(x => x.id), ["DEV-J", "DEV-L"]);
assert.equal(destinoAvancoERP(estado.projetos[0]), "Ordem de Compra");
assert.equal(destinoAvancoERP(estado.projetos[2]), "Aprovação OC");

salvos.length = 0;
confirmarResposta = false;
aplicarAvancosERPPendentes();
assert.deepEqual(salvos, [], "cancelar a confirmação não deveria gravar");

confirmarResposta = true;
aplicarAvancosERPPendentes();
assert.deepEqual(salvos, ["DEV-J", "DEV-L"]);
assert.deepEqual(projetosAvancoERPPendente(), [], "a fila deveria esvaziar");
assert.equal(ETAPAS[estado.projetos[1].etapaAtual], "Aprovação SC", "quem não tem sinal não move");

// 12. Dias úteis pulam fim de semana.
assert.equal(somarDiasUteis("2026-09-10", 7), "2026-09-21");
assert.equal(somarDiasUteis("2026-09-11", 1), "2026-09-14", "sexta + 1 útil = segunda");
assert.equal(DIAS_UTEIS_PRAZO_FORNECEDOR, 7);

// 13. entradaNFCompleta continua exigindo entrada em todas as OCs.
assert.equal(entradaNFCompleta({ compras: { integracao: { ocERP: [] } } }), "");
assert.equal(entradaNFCompleta({ compras: { integracao: { ocERP: [
  { recebidaEm: "2026-09-14T09:00:00" }, { recebidaEm: "" }] } } }), "");

console.log("Avanço das etapas de compras pelo ERP validado (13 cenários).");
