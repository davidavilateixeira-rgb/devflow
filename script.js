const fs = require('fs');
let html = fs.readFileSync('h:/DESENVOLVIMENTOS/public/index.html', 'utf8');

// 1. Corrigir __updateProc e __calcTotalGeralFO050
html = html.replace(/window\.__updateProc = \(i, field, val\) => \{.*?window\.__calcTotalGeralFO050\(\);\s*\}\s*\};/s, 
`window.__updateProc = (i, field, val) => {
    procDraft[i][field] = val;
    if(field === 'tempoUsinagem' || field === 'tempoTroca') {
      window.__calcTotalGeralFO050();
    }
  };`);

html = html.replace(/window\.__calcTotalGeralFO050 = \(\) => \{.*?\};\s*\};/s,
`window.__calcTotalGeralFO050 = () => {
    let geral = 0;
    const tus = document.querySelectorAll('.proc-tu');
    const tts = document.querySelectorAll('.proc-tt');
    tus.forEach((el, idx) => {
      const u = Number(el.value)||0;
      const t = Number(tts[idx].value)||0;
      geral += (u + t);
      const pLbl = document.getElementById('proc-parcial-' + idx);
      if(pLbl) pLbl.innerText = "Parcial: " + ((u+t)>0 ? (u+t).toFixed(1) : "0.0") + " s";
    });
    const el = document.getElementById("fo-total-geral");
    if(el) el.innerText = geral.toFixed(1) + " s";
  };
  
  window.__calcTotalGeralFO050();
};`); // Note that closing bracket of modal was included in replace.

// 2. Corrigir id="proc-parcial-${i}" na renderizacao do processo
html = html.replace(/<div class="text-right text-\[12px\] font-bold text-blue-800">Parcial:/g, 
'<div class="text-right text-[12px] font-bold text-blue-800" id="proc-parcial-${i}">Parcial:');

// 3. Corrigir renderDetalhe
html = html.replace(/<div class="grid md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">.*?<\/div>\s*<\/div>`;/s, 
`${(()=>{
          const fo = p.fo050 || { celulas:[], processos:[] };
          if(fo.maquina && !fo.processos) {
            fo.processos = [{ nome:"Processo Principal", maquina:fo.maquina, tempoUsinagem:fo.tempoUsinagem||"", tempoTroca:fo.tempoTroca||"", dataExecucao:fo.dataExecucao||"", numOP:fo.numOP||"" }];
          }
          if(!fo.processos) fo.processos = [];
          
          if(!fo.celulas.length && fo.processos.length === 0) return '<div class="text-[12px]" style="color:var(--texto-2)">Nenhum dado FO050 registrado.</div>';
          
          let celulasHtml = fo.celulas.length > 0 ? \`<div class="mb-4">
              <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Células</div>
              <div class="text-[13px] mt-1 space-y-1">
                \${fo.celulas.map((c,i)=>\`<div class="flex items-center gap-1.5">\${i===0?\`<span class="badge b-verde text-[9px] !px-1.5 leading-none">P</span>\`:\`\`}\${esc(c)}</div>\`).join("")}
              </div>
            </div>\` : '';
          
          let procHtml = "";
          let totalUsi = 0, totalTro = 0;
          
          if(fo.processos && fo.processos.length > 0) {
            procHtml = fo.processos.map((pr, idx) => {
              const u = Number(pr.tempoUsinagem)||0;
              const t = Number(pr.tempoTroca)||0;
              totalUsi += u; totalTro += t;
              return \`<div class="grid md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3 relative">
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Processo</div>
                  <div class="text-[13px] mt-1 font-bold text-blue-900">\${esc(pr.nome)}</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Máquina</div>
                  <div class="text-[13px] mt-1 font-medium">\${esc(pr.maquina)||"—"}</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tempos (s)</div>
                  <div class="text-[13px] mt-1">Usinagem: <b>\${pr.tempoUsinagem||"—"}</b></div>
                  <div class="text-[13px]">Troca: <b>\${pr.tempoTroca||"—"}</b></div>
                  <div class="text-[13px] mt-1 pt-1 border-t border-gray-200">Parcial: <b class="text-blue-700">\${(u+t)>0?(u+t).toFixed(1):"—"}</b></div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Execução</div>
                  <div class="text-[13px] mt-1">Data: <b>\${pr.dataExecucao?fmtL(pr.dataExecucao):"—"}</b></div>
                  <div class="text-[13px]">OP: <b>\${esc(pr.numOP)||"—"}</b></div>
                </div>
              </div>\`;
            }).join("");
            
            procHtml += \`<div class="text-right text-[14px] font-bold bg-[#E8F1FB] p-2 rounded text-blue-900 border border-blue-100 mt-2">
              Tempo Total Geral: \${(totalUsi+totalTro).toFixed(1)} s
            </div>\`;
          }
          
          return celulasHtml + procHtml;
        })()}
      </div>
    </div>\`;`);


fs.writeFileSync('h:/DESENVOLVIMENTOS/public/index.html', html, 'utf8');
console.log('Fixed!');
