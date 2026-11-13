// Exercita o bloco real que monta a coluna "Prazo da Etapa" do Status Report.
// Em "Fornecedor" a coluna precisa dizer a ORIGEM da data: estimativa do ERP ou prazo
// confirmado com o fornecedor. Fora dessa etapa, concluido ou sem prazo, nao diz nada.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const src = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const ini = src.indexOf('let badgePrazoHtml = "";');
const fim = src.indexOf('return `', ini);
assert.ok(ini > 0 && fim > ini, 'bloco do badge nao encontrado');
const corpo = src.slice(ini, fim);

const fmtL = s => s.split('-').reverse().join('/');
const fmt = fmtL;
const esc = s => String(s).replace(/</g, '&lt;');
const DIAS_FABRICACAO_FORNECEDOR = 20;
const textoOrigemPrazoFornecedor = p => p.__estimada
  ? `Data estimada pelo sistema (${DIAS_FABRICACAO_FORNECEDOR} dias de fabricação)`
  : 'Data informada pelo fornecedor';
const montar = (d, p) => new Function('d', 'p', 'fmtL', 'fmt', 'esc', 'DIAS_FABRICACAO_FORNECEDOR', 'textoOrigemPrazoFornecedor',
  corpo + ' return badgePrazoHtml;')(d, p, fmtL, fmt, esc, DIAS_FABRICACAO_FORNECEDOR, textoOrigemPrazoFornecedor);

const base = { isConcluido: false, prazoEtapa: '2026-12-01', etapaAtualStr: 'Fornecedor' };
const projEst = { dataPrevista: '2026-12-20', __estimada: true };
const projConf = { dataPrevista: '2026-12-20', __estimada: false };
const ESTIMADA = 'Estimada pelo sistema';
const CONFIRMADA = 'Confirmada pelo fornecedor';

let n = 0;
const ok = (cond, nome) => { n++; assert.ok(cond, nome); };

// 1. Caso do print: etapa Fornecedor, no prazo, data vinda do ERP.
const noPrazo = montar({ ...base, origemPrazo: 'estimada', statusPrazo: 'no_prazo', diffDias: 18 }, projEst);
ok(noPrazo.includes('01/12/2026') && noPrazo.includes('Faltam 18d'), 'data e contagem seguem na coluna');
ok(noPrazo.includes(ESTIMADA) && !noPrazo.includes(CONFIRMADA), 'no prazo + estimada');

// 2. Data acertada com o fornecedor: a coluna diz Confirmada, nunca Estimada.
const confirmada = montar({ ...base, origemPrazo: 'confirmada', statusPrazo: 'no_prazo', diffDias: 18 }, projConf);
ok(confirmada.includes('01/12/2026') && confirmada.includes(CONFIRMADA) && !confirmada.includes(ESTIMADA), 'no prazo + confirmada');

// 3. A origem acompanha os tres semaforos, sem trocar a cor do selo da data.
for (const [st, diff] of [['atrasado', -3], ['atencao', 1]]) {
  ok(montar({ ...base, origemPrazo: 'estimada', statusPrazo: st, diffDias: diff }, projEst).includes(ESTIMADA), `${st} + estimada`);
  ok(montar({ ...base, origemPrazo: 'confirmada', statusPrazo: st, diffDias: diff }, projConf).includes(CONFIRMADA), `${st} + confirmada`);
}
const atrasado = montar({ ...base, origemPrazo: 'estimada', statusPrazo: 'atrasado', diffDias: -3 }, projEst);
ok(atrasado.includes('b-vermelho') && atrasado.includes('3d em atraso'), 'semaforo vermelho preservado');

// 4. Fora de "Fornecedor" (origemPrazo vazio), concluido e sem prazo nao recebem marca nenhuma.
const outraEtapa = montar({ ...base, origemPrazo: '', etapaAtualStr: 'Recebimento', statusPrazo: 'no_prazo', diffDias: 5 }, projConf);
ok(!outraEtapa.includes(ESTIMADA) && !outraEtapa.includes(CONFIRMADA), 'outra etapa nao fala de origem');
const concluido = montar({ ...base, origemPrazo: 'estimada', isConcluido: true }, projEst);
ok(concluido.includes('Concluído') && !concluido.includes(ESTIMADA), 'concluido nao fala de origem');
const semPrazo = montar({ ...base, prazoEtapa: '', origemPrazo: '', statusPrazo: 'sem_prazo' }, projConf);
ok(semPrazo.includes('Lançamento: ') && !semPrazo.includes(ESTIMADA) && !semPrazo.includes(CONFIRMADA), 'sem prazo cai no lancamento');

console.log(`${n}/${n} verificacoes aprovadas na origem do prazo do Status Report.`);
