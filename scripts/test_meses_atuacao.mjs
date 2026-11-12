/**
 * Valida o calculo dos meses de atuacao da engenharia usado nos indicadores de
 * portfolio do Dashboard Gerencial (public/index.html).
 *
 * Extrai o bloco de helpers direto do index.html e avalia com stubs minimos,
 * para o teste nunca divergir do codigo que roda em producao.
 *
 * Uso: node scripts/test_meses_atuacao.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(raiz, "public", "index.html"), "utf8");

const INI = "/* ---- Indicadores de portfolio";
const FIM = "\nfunction renderGerencial(){";
const i = html.indexOf(INI), f = html.indexOf(FIM);
if (i < 0 || f < 0) { console.error("Bloco de helpers nao encontrado no index.html"); process.exit(1); }
const fonte = html.slice(i, f);

// Stubs do que o bloco consome do resto do app.
const TIPOS = ["Novo", "Alteração", "Melhoria", "Internalização", "BGI"];
const HOJE = new Date("2026-11-12T12:00:00Z");
const dataInicioMontagem = (p) => (p.montagem && p.montagem.dataInicio) || p.dataInicio;
const concluido = (p) => !!p.__concluido;
const concluidoMontagem = (p) => !!(p.montagem && p.montagem.__concluido);

const { mesesAtuacao, familiaDe, tipoDe, acumularMeses, mesChave } =
  new Function("TIPOS", "HOJE", "dataInicioMontagem", "concluido", "concluidoMontagem",
    fonte + "\nreturn {mesesAtuacao, familiaDe, tipoDe, acumularMeses, mesChave, ordemTipo, TIPO_COR, ETAPAS_SEM_ATUACAO};"
  )(TIPOS, HOJE, dataInicioMontagem, concluido, concluidoMontagem);

let falhas = 0, total = 0;
function conferir(nome, obtido, esperado) {
  total++;
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a === b) { console.log(`  ok   ${nome}`); }
  else { falhas++; console.log(`  FALHA ${nome}\n        obtido:   ${a}\n        esperado: ${b}`); }
}
const meses = (p, isM = false) => [...mesesAtuacao(p, isM)].sort();
const h = (etapa, data) => ({ etapa, data, usuario: "t" });

console.log("\n1. Ciclo completo: Fornecedor nao conta, Recebido nao conta");
conferir("DEV concluido atravessando a espera do fornecedor", meses({
  dataInicio: "2026-01-10", __concluido: true,
  historico: [
    h("Recebido", "2026-01-10"),           // fila: descartado
    h("Análise", "2026-02-05"),            // fev -> mar
    h("Projeto da Fixação", "2026-03-01"), // mar -> abr (ate entrar no fornecedor)
    h("Fornecedor", "2026-04-10"),         // espera: descartado
    h("Recebimento", "2026-08-20"),        // ago -> set
    h("Liberação", "2026-09-02"),          // ultimo e concluido: so set
  ],
}), ["2026-02", "2026-03", "2026-04", "2026-08", "2026-09"]);

console.log("\n2. Em aberto, parado no fornecedor: nao consome meses recentes");
conferir("DEV parado no Fornecedor desde maio", meses({
  dataInicio: "2026-03-02",
  historico: [h("Recebido", "2026-03-02"), h("Análise", "2026-04-01"), h("Fornecedor", "2026-05-20")],
}), ["2026-04", "2026-05"]);

console.log("\n3. Em aberto, em etapa de atuacao: conta ate o mes de hoje");
conferir("DEV em Validação/FO050 desde setembro", meses({
  dataInicio: "2026-08-01",
  historico: [h("Recebido", "2026-08-01"), h("Validação/FO050", "2026-09-15")],
}), ["2026-09", "2026-10", "2026-11"]);

console.log("\n4. Bordas");
conferir("sem historico cai no dataInicio", meses({ dataInicio: "2026-07-21", historico: [] }), ["2026-07"]);
conferir("historico fora de ordem e reordenado", meses({
  dataInicio: "2026-01-05", __concluido: true,
  historico: [h("Liberação", "2026-03-04"), h("Análise", "2026-01-05"), h("Recebimento", "2026-02-02")],
}), ["2026-01", "2026-02", "2026-03"]);
conferir("virada de ano", meses({
  dataInicio: "2025-11-10",
  historico: [h("Análise", "2025-11-10"), h("Recebimento", "2026-02-03"), h("Fornecedor", "2026-02-20")],
}), ["2025-11", "2025-12", "2026-01", "2026-02"]);
conferir("dia 1 do mes nao escorrega para o mes anterior (fuso)", meses({
  dataInicio: "2026-03-01", __concluido: true,
  historico: [h("Análise", "2026-03-01"), h("Liberação", "2026-03-01")],
}), ["2026-03"]);
conferir("registro sem data e ignorado", meses({
  dataInicio: "2026-06-01", __concluido: true,
  historico: [h("Análise", "2026-06-01"), { etapa: "Recebimento", usuario: "t" }, h("Liberação", "2026-06-10")],
}), ["2026-06"]);

console.log("\n5. Montagem: Fabricacao e a espera");
conferir("montagem parada em Fabricação", meses({
  dataInicio: "2026-01-02",
  montagem: {
    dataInicio: "2026-02-01",
    historico: [h("Recebido", "2026-02-01"), h("Projeto de Ferramentas", "2026-03-05"), h("Fabricação", "2026-04-02")],
  },
}, true), ["2026-03", "2026-04"]);

console.log("\n6. Normalizacao de familia e tipo");
conferir("caixa e espacos", familiaDe({ familia: "  Pistão   de  Freio " }), "PISTÃO DE FREIO");
conferir("familia vazia", familiaDe({ familia: "" }), "Sem família");
conferir("familia ausente", familiaDe({}), "Sem família");
conferir("tipo ausente", tipoDe({}), "Não informado");
conferir("tipo preenchido", tipoDe({ tipo: "Melhoria" }), "Melhoria");

console.log("\n7. acumularMeses");
const s1 = new Set(); acumularMeses(s1, "2026-11", "2027-02");
conferir("intervalo entre anos", [...s1], ["2026-11", "2026-12", "2027-01", "2027-02"]);
const s2 = new Set(); acumularMeses(s2, "2026-05", "2026-03");
conferir("fim antes do inicio vira so o inicio", [...s2], ["2026-05"]);
const s3 = new Set(); acumularMeses(s3, "", "2026-03");
conferir("inicio vazio nao acumula", [...s3], []);
conferir("mesChave de Date usa UTC", mesChave(new Date("2026-03-01T02:00:00Z")), "2026-03");

console.log(`\n${total - falhas}/${total} verificacoes aprovadas.`);
process.exit(falhas ? 1 : 0);
