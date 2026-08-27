import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(scriptsDir);
const indexPath = path.join(repoDir, "public", "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

const inicio = indexHtml.indexOf("function numeroFO050");
const fim = indexHtml.indexOf("function abrirImpressaoFO050");
assert.ok(inicio >= 0 && fim > inicio, "Funções do relatório FO050 não encontradas.");

const versao = indexHtml.match(/const\s+VERSAO_ATUAL\s*=\s*"([^"]+)"/)?.[1];
assert.ok(versao, "VERSAO_ATUAL não encontrada.");

const esc = valor => String(valor ?? "").replace(/[&<>"']/g, caractere => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[caractere]);
const fmtL = valor => valor
  ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor + "T08:00:00" : valor).toLocaleDateString("pt-BR")
  : "—";
const nomesComponentes = projeto => [
  ["pinoHaste", "Pino/Haste"],
  ["cachimboAlojamento", "Cachimbo/Alojamento"],
  ["copo", "Copo"],
  ["pistao", "Pistão"]
].filter(([chave]) => projeto.componentes?.[chave]).map(([, nome]) => nome);

const factory = new Function(
  "normalizarProjeto", "estado", "window", "VERSAO_ATUAL", "esc", "fmtL", "nomesComponentes",
  indexHtml.slice(inicio, fim) + "\nreturn { htmlRelatorioFO050 };"
);
const estado = { usuario: { nome: "Técnico de Teste" } };
const windowMock = { location: { href: "http://127.0.0.1:8765/index.html" } };
const { htmlRelatorioFO050 } = factory(
  () => {},
  estado,
  windowMock,
  versao,
  esc,
  fmtL,
  nomesComponentes
);

const projeto = {
  id: "teste-fo050",
  devId: "DEV-999",
  codigo: "C600000",
  descricao: "COMPONENTE DE TESTE",
  cliente: "CLIENTE",
  familia: "TERMINAL DE DIREÇÃO",
  tipo: "Novo",
  responsavel: "Técnico Usinagem",
  componentes: { pinoHaste: true, cachimboAlojamento: true, copo: false, pistao: false },
  refs: {
    alojamento: "A600000",
    forjadoAlojamento: "FA600000",
    pino: "P600000",
    forjadoPino: "FP600000",
    npUsinagem: "NP600000"
  },
  ferramentas: ["FRCNC0001", "FRCNC0002"],
  fo050: {
    celulas: ["Célula CNC 01"],
    observacao: "Validar acabamento <visual>.",
    processos: [
      { nome: "Usinar macho", maquina: "CNC01", tempoUsinagem: "12,5", tempoTroca: "3,0", dataExecucao: "2026-08-26", numOP: "123456" },
      { nome: "Usinar furo de centro", maquina: "CNC02", tempoUsinagem: "8", tempoTroca: "2", dataExecucao: "2026-08-26", numOP: "123456" }
    ]
  },
  montagem: {
    responsavel: "Técnico Montagem",
    ferramentas: ["FRM0001"],
    fo050: {
      linhasMontagem: ["Linha MTD"],
      dataExecucao: "2026-08-26",
      numOP: "654321",
      observacao: "Montagem aprovada.",
      processos: [
        { nome: "Montagem", posto: "Posto 01", tempoProcesso: "6,5" },
        { nome: "Embalagem", posto: "Posto 02", tempoProcesso: "4,0" }
      ]
    }
  }
};

const relatorioUsinagem = htmlRelatorioFO050(structuredClone(projeto), false);
const relatorioMontagem = htmlRelatorioFO050(structuredClone(projeto), true);

for (const [modulo, relatorio] of [["Usinagem", relatorioUsinagem], ["Montagem", relatorioMontagem]]) {
  assert.match(relatorio, /@page\{size:A4 portrait/);
  assert.match(relatorio, new RegExp("FO050 · " + modulo));
  assert.match(relatorio, /Imprimir \/ Salvar em PDF/);
  assert.match(relatorio, /QUALIDADE/);
  assert.match(relatorio, /PRODUÇÃO/);
  assert.match(relatorio, /PRESET/);
  assert.match(relatorio, /ENGª PRODUTO/);
  assert.match(relatorio, /ENGº PROCESSO \(1\)/);
  assert.doesNotMatch(relatorio, />undefined</);
}

assert.match(relatorioUsinagem, /FRCNC0001/);
assert.match(relatorioUsinagem, /Célula CNC 01/);
assert.match(relatorioUsinagem, /Validar acabamento &lt;visual&gt;\./);
assert.match(relatorioMontagem, /Linha MTD/);
assert.match(relatorioMontagem, /Posto 01/);
assert.match(relatorioMontagem, /Montagem aprovada\./);

if (process.env.FO050_PREVIEW_PATH) {
  fs.writeFileSync(process.env.FO050_PREVIEW_PATH, relatorioUsinagem, "utf8");
}

console.log("Relatórios FO050 de Usinagem e Montagem validados.");
