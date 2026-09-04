// Regressao do avanco automatico da etapa "Fornecedor" pela entrada da NF no ERP.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(scriptsDir);
const indexHtml = fs.readFileSync(path.join(repoDir, "public", "index.html"), "utf8");

const inicio = indexHtml.indexOf("// Data da ultima entrada de NF");
const fim = indexHtml.indexOf("function dadosComprasProjeto");
assert.ok(inicio >= 0 && fim > inicio, "Funções da entrada de NF não encontradas.");

const ETAPAS = ["Recebido", "Análise", "Projeto da Fixação", "Orçamento", "Solicitação de Compra",
  "Aprovação SC", "Ordem de Compra", "Aprovação OC", "Fornecedor",
  "Recebimento", "Validação/FO050", "Revisar/Atualizar cadastro no ERP",
  "Aprovar cadastro no sistema ERP", "Liberação"];

const salvos = [];
const avisos = [];
const estado = { projetos: [], aguardandoERP: new Set() };

const factory = new Function(
  "ETAPAS", "estado", "USUARIO_ENTRADA_NF", "registrosOCERP", "comprasDe", "podeGravarFirestore",
  "podeGerenciarUsinagem", "sincronizacaoSCPendente", "salvarProjeto", "notificarSistema", "fmtL",
  indexHtml.slice(inicio, fim) + "\nreturn { entradaNFCompleta, concluirFornecedorPorEntradaNF };"
);
const { entradaNFCompleta, concluirFornecedorPorEntradaNF } = factory(
  ETAPAS,
  estado,
  "Sistema · Entrada de NF",
  p => p.compras.integracao.ocERP,
  p => p.compras,
  () => true,
  () => true,
  integracao => !!(integracao.solicitadoEm && (!integracao.processadoEm || integracao.solicitadoEm > integracao.processadoEm)),
  p => salvos.push(p.id),
  msg => avisos.push(msg),
  valor => new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor + "T08:00:00" : valor).toLocaleDateString("pt-BR")
);

const projeto = (id, over = {}) => ({
  id, devId: id, codigo: id,
  necessita: { fixacao: true },
  etapaAtual: ETAPAS.indexOf("Fornecedor"),
  historico: [{ etapa: "Fornecedor", data: "2026-08-01T12:00:00Z", usuario: "Técnico" }],
  comentarios: [],
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:00:00Z", processadoEm: "2026-09-04T10:01:00Z", ocERP: [] } },
  ...over
});

const rodar = p => {
  estado.projetos = [p];
  estado.aguardandoERP = new Set([p.id]);
  salvos.length = 0;
  concluirFornecedorPorEntradaNF();
  return p;
};

const nf = entradaEm => ({ recebidaEm: entradaEm, notasFiscais: [{ numero: "5285", entradaEm }] });

// 1. Todas as OCs com entrada de NF: avanca e carimba a data da ULTIMA entrada.
let p = rodar(projeto("DEV-A", {
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:00:00Z", processadoEm: "2026-09-04T10:01:00Z",
    ocERP: [nf("2026-09-01T09:00:00Z"), nf("2026-09-03T14:30:00Z")] } }
}));
assert.equal(ETAPAS[p.etapaAtual], "Recebimento", "deveria avancar para Recebimento");
assert.equal(p.historico.at(-1).data, "2026-09-03T14:30:00Z", "deveria usar a data da ultima entrada");
assert.equal(p.historico.at(-1).usuario, "Sistema · Entrada de NF");
assert.equal(p.compras.oc.status, "Recebida");
assert.equal(p.comentarios.length, 1, "deveria registrar o avanco nos comentarios");
assert.deepEqual(salvos, ["DEV-A"], "deveria gravar uma unica vez");
assert.equal(estado.aguardandoERP.size, 0, "deveria sair da fila de espera");

// 2. Entrega parcial: uma OC sem entrada de NF nao avanca.
p = rodar(projeto("DEV-B", {
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:00:00Z", processadoEm: "2026-09-04T10:01:00Z",
    ocERP: [nf("2026-09-01T09:00:00Z"), { recebidaEm: "", notasFiscais: [] }] } }
}));
assert.equal(ETAPAS[p.etapaAtual], "Fornecedor", "entrega parcial nao deveria avancar");
assert.deepEqual(salvos, [], "entrega parcial nao deveria gravar");

// 3. Sem nenhuma OC no ERP: nao avanca.
p = rodar(projeto("DEV-C"));
assert.equal(ETAPAS[p.etapaAtual], "Fornecedor", "sem OC no ERP nao deveria avancar");

// 4. Desenvolvimento em outra etapa: nao pula etapas.
p = rodar(projeto("DEV-D", {
  etapaAtual: ETAPAS.indexOf("Aprovação OC"),
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:00:00Z", processadoEm: "2026-09-04T10:01:00Z",
    ocERP: [nf("2026-09-03T14:30:00Z")] } }
}));
assert.equal(ETAPAS[p.etapaAtual], "Aprovação OC", "nao deveria avancar de outra etapa");

// 5. Fluxo simples nao tem a etapa "Fornecedor".
p = rodar(projeto("DEV-E", {
  necessita: { fixacao: false },
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:00:00Z", processadoEm: "2026-09-04T10:01:00Z",
    ocERP: [nf("2026-09-03T14:30:00Z")] } }
}));
assert.deepEqual(salvos, [], "fluxo simples nao deveria gravar");

// 6. Conector ainda nao respondeu: continua na fila, sem avancar.
p = rodar(projeto("DEV-F", {
  compras: { oc: { status: "" }, integracao: { solicitadoEm: "2026-09-04T10:05:00Z", processadoEm: "2026-09-04T10:01:00Z",
    ocERP: [nf("2026-09-03T14:30:00Z")] } }
}));
assert.equal(ETAPAS[p.etapaAtual], "Fornecedor", "nao deveria avancar antes da resposta do ERP");
assert.equal(estado.aguardandoERP.size, 1, "deveria continuar aguardando o conector");

// 7. entradaNFCompleta isolada.
assert.equal(entradaNFCompleta({ compras: { integracao: { ocERP: [] } } }), "");
assert.equal(entradaNFCompleta({ compras: { integracao: { ocERP: [nf("2026-09-02T08:00:00Z")] } } }), "2026-09-02T08:00:00Z");

console.log("Avanço automático por entrada de NF validado (7 cenários).");
