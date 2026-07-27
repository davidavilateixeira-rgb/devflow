
/* ============================================================
   0. FIREBASE
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDJbrkXR8jurdxKK0Ca7y734p14PeoTTGU",
  authDomain: "workflow-desenvolvimento.firebaseapp.com",
  projectId: "workflow-desenvolvimento",
  storageBucket: "workflow-desenvolvimento.firebasestorage.app",
  messagingSenderId: "555108817102",
  appId: "1:555108817102:web:b787981ba87bb86253189f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Configuração do Chart.js DataLabels
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
  color: '#333',
  font: { weight: '600', size: 10 },
  anchor: 'center',
  align: 'center',
  formatter: (value) => (value > 0 ? value : '')
});

const ADMIN_EMAILS = ["davidavilateixeira@gmail.com", "dteixeira@viemar.com.br"];
const ehEmailAdmin = (email)=> ADMIN_EMAILS.includes((email||"").toLowerCase());

/* ============================================================
   1. CONSTANTES DO FLUXO DE PROCESSO
   ============================================================ */
// Fluxo completo (item com nova fixação). "Desenvolver Programas CNC" NÃO é etapa linear:
// é tarefa paralela do Técnico Fase 1 (ver p.programaCnc), concluível a qualquer momento após a Análise.
const ETAPAS = ["Recebido","Análise","Projeto da Fixação","Orçamento","Solicitação de Compra",
  "Aprovação SC","Ordem de Compra","Aprovação OC","Fornecedor",
  "Recebimento","Validação/FO050","Liberação"];
// Fluxo simples (sem compras nem recebimento, CNC sequencial)
const ETAPAS_SIMPLES = ["Recebido","Análise","Programa CNC","Validação/FO050","Liberação"];
const TODAS_ETAPAS = ["Recebido","Análise","Programa CNC","Projeto da Fixação","Orçamento","Solicitação de Compra",
  "Aprovação SC","Ordem de Compra","Aprovação OC","Fornecedor",
  "Recebimento","Validação/FO050","Liberação"];
// Etapas que caracterizam "Aguardando Compras"
const ETAPAS_COMPRAS = ["Orçamento","Solicitação de Compra","Aprovação SC","Ordem de Compra","Aprovação OC"];
const ETAPA_CNC = "Desenvolver Programas CNC";   // tarefa paralela (apenas no fluxo com fixação)

const LISTA_PROCESSOS = ["USI CAIXA", "USI PINO", "FR EQUIPTOP", "FR TORNO", "USI ESFERA", "USI ESFERA + CANAL", "USI CANAL", "USI COPO AXIAL", "USI COPO PIVÔ", "USI PRÉ-FORMA", "USI COPO PIVÔ 1LD", "USI COPO PIVÔ 2LD"];

// Descrição curta exibida sob cada etapa no checklist
const DESC_ETAPAS = {
  "Recebido":"Novo desenvolvimento recebido e registrado no sistema.",
  "Análise":"Análise rápida: revisar forjado, necessidade de pinça/fixação etc. Ao concluir, defina se necessita nova fixação.",
  "Projeto da Fixação":"Projeto da fixação/pinça. Ao concluir, informe o(s) código(s) da(s) ferramenta(s) gerada(s).",
  "Orçamento":"Cotar a ferramenta/fixação com os fornecedores.",
  "Solicitação de Compra":"Abrir a SC — o nº é registrado ao concluir a etapa.",
  "Aprovação SC":"Buscar o aprovador e garantir que a SC seja aprovada.",
  "Ordem de Compra":"Garantir que a OC seja gerada — o nº é registrado ao concluir.",
  "Aprovação OC":"Garantir que a OC seja aprovada — ao concluir, informe o prazo do fornecedor.",
  "Fornecedor":"Fabricação das ferramentas pelo fornecedor, dentro do prazo informado.",
  "Desenvolver Programas CNC":"Deixar os programas CNC dos componentes concluídos (pode concluir a qualquer momento após a Análise).",
  "Programa CNC":"Deixar os programas CNC dos componentes concluídos.",
  "Recebimento":"Conferir se a ferramenta entregue está OK.",
  "Validação/FO050":"Iniciar o processo produtivo (FO050).",
  "Liberação":"Documentos preenchidos e desenvolvimento concluído."
};

// Grupos de responsabilidade (títulos do checklist): [título, índice da 1ª etapa do grupo]
const GRUPOS_FIXACAO = [["Técnico · Fase 1",0],["Analista",5],["Técnico · Fase 2",9],["PCP",10]];
const GRUPOS_SIMPLES = [["Técnico",0],["PCP",3]];
const gruposDe = p => p.necessita.fixacao ? GRUPOS_FIXACAO : GRUPOS_SIMPLES;

// Responsabilidade de cada etapa (para indicadores de lead time)
const GRUPO_ETAPA = {
  "Recebido":"Técnico","Análise":"Técnico","Projeto da Fixação":"Técnico","Orçamento":"Técnico","Solicitação de Compra":"Técnico",
  "Aprovação SC":"Analista","Ordem de Compra":"Analista","Aprovação OC":"Analista","Fornecedor":"Analista",
  "Desenvolver Programas CNC":"Técnico","Programa CNC":"Técnico","Recebimento":"Técnico",
  "Validação/FO050":"PCP","Liberação":"PCP"
};
const COR_GRUPO = {"Técnico":"#EA5B0C","Analista":"#0F5FA8","PCP":"#107C41"};

// Índice a partir do qual o CNC pode ser concluído (logo após a Análise, que é o índice 1 nos dois fluxos)
const analiseConcluida = p => p.etapaAtual > 1;

// Migração de dados antigos: renomeia etapas extintas e realinha o índice da etapa atual
const RENOMES_ETAPAS = {"Liberado":"Liberação","Validação":"Validação/FO050","Teste":"Recebimento"};
function normalizarProjeto(p){
  if(!p.historico) p.historico = [];
  if(!p.fo050) p.fo050 = { celulas:[], maquina:"", tempoUsinagem:"", tempoTroca:"", dataExecucao:"", numOP:"" };
  if(!p.programaCnc) p.programaCnc = {feito:false, data:"", usuario:""};
  p.historico.forEach(h=>{ if(RENOMES_ETAPAS[h.etapa]) h.etapa = RENOMES_ETAPAS[h.etapa]; });
  // "Desenvolver Programas CNC" deixou de ser etapa linear: se estava no histórico, converte em tarefa paralela concluída
  if(p.historico.some(h=>h.etapa===ETAPA_CNC) && !p.programaCnc.feito){
    const h = p.historico.find(x=>x.etapa===ETAPA_CNC);
    p.programaCnc = {feito:true, data:h.data, usuario:h.usuario||""};
  }
  const simplificado = p.necessita && p.necessita.fixacao === false;
  // Migra "Programa CNC" da tarefa paralela para o histórico no fluxo simplificado
  if(simplificado && p.programaCnc.feito && !p.historico.some(h=>h.etapa==="Programa CNC")){
    const idxAnalise = p.historico.findIndex(h=>h.etapa==="Análise");
    if(idxAnalise >= 0){
      p.historico.splice(idxAnalise+1, 0, {etapa:"Programa CNC", data:p.programaCnc.data||new Date().toISOString(), usuario:p.programaCnc.usuario||"Sistema"});
    }
  }
  const flx = p.necessita && p.necessita.fixacao ? ETAPAS : ETAPAS_SIMPLES;
  p.historico = p.historico.filter(h=>flx.includes(h.etapa));           // descarta etapas que não existem no fluxo do projeto
  p.historico = p.historico.filter((h,i,arr)=> i===0 || h.etapa!==arr[i-1].etapa);
  const ult = p.historico[p.historico.length-1];
  if(ult){ const idx = flx.indexOf(ult.etapa); if(idx>=0) p.etapaAtual = idx; }
  if(p.etapaAtual > flx.length-1) p.etapaAtual = flx.length-1;
  return p;
}

const FILTROS = ["Todos","Sem responsável","Meu desenvolvimento","Urgentes","Atrasados","Compras","Fornecedor","Liberados"];

// Famílias de produto sugeridas (o campo aceita digitar outra)
const FAMILIAS = ["TERMINAL DE DIREÇÃO","PISTÃO DE FREIO","ARTICULAÇÃO AXIAL","PIVÔ DE SUSPENSÃO - COPO","PIVÔ DE SUSPENSÃO - ALOJAMENTO","TIRANTE ESTABILIZADOR"];

// Componentes a serem desenvolvidos
const COMPONENTES = [["pinoHaste","Pino/Haste"],["cachimboAlojamento","Cachimbo/Alojamento"],["copo","Copo"],["pistao","Pistão"]];
const nomesComponentes = p => COMPONENTES.filter(([k])=>p.componentes && p.componentes[k]).map(([,l])=>l);

/* ============================================================
   2. ESTADO GLOBAL + UTILITÁRIOS
   ============================================================ */
const HOJE = new Date();
const d = (s)=> new Date(s+"T08:00:00");                 // atalho p/ data (yyyy-mm-dd)
// Datas "yyyy-mm-dd" devem ser lidas no fuso local (senão o navegador as interpreta como UTC e exibe 1 dia antes)
const parseData = (dt)=> (typeof dt==="string" && /^\d{4}-\d{2}-\d{2}$/.test(dt)) ? new Date(dt+"T08:00:00") : new Date(dt);
const fmt = (dt)=> dt ? parseData(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}) : "—";
const fmtL = (dt)=> dt ? parseData(dt).toLocaleDateString("pt-BR") : "—";
const dias = (a,b)=> Math.round((b-a)/864e5);
// Escapa texto digitado pelo usuário antes de injetar em innerHTML
const esc = (s)=> String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function novoProjeto(o){
  return Object.assign({
    codigo:"", descricao:"", cliente:"", familia:"",
    componentes:{pinoHaste:false, cachimboAlojamento:false, copo:false, pistao:false},
    refs:{alojamento:"", forjadoAlojamento:"", pino:"", forjadoPino:""},
    observacao:"", tipo:"Novo", prioridade:"Média",
    responsavel:"", responsavelUid:"", assumidoEm:"",
    dataInicio:"", dataPrevista:"", dataReal:"",
    necessita:{fixacao:false,ferramenta:false,barra:false,programa:true,dispositivo:false,inspecao:false},
    fornecedor:"", numSC:"", numOC:"", prazoFornecedor:"", prazoProjetoFixacao:"", prazoAnalise:"",
    ferramentas:[], obsEtapas:{}, programaCnc:{feito:false, data:"", usuario:""},
    comentarios:[], anexos:[], historico:[], etapaAtual:0, criadoPor:""
  }, o);
}

let estado = { usuario:null, busca:"", filtrosChip:["Todos"], projetos:[], usuarios:[], ordLista:"", mesesLanc:[], resps:[], fams:[], statusSel:[],
  movFiltroData:"", movFiltroUsuario:"", movFiltroEtapa:"" };
let unsubProjetos = null, unsubUsuarios = null, avisoDesativado = false;

const isAdmin = ()=> estado.usuario && estado.usuario.papel === "admin";
const isProduto = ()=> estado.usuario && estado.usuario.papel === "produto";   // visualiza + cadastra, não edita
const isVisitante = ()=> estado.usuario && estado.usuario.papel === "visitante"; // apenas visualiza
const isSomenteLeitura = ()=> isProduto() || isVisitante();
const podeCadastrar = ()=> (isAdmin() || isProduto()) && !isVisitante();
const rotuloPapel = pl => ({admin:"Administrador", produto:"Engenharia de Produto", tecnico:"Técnico", visitante:"Visitante"}[pl] || "Técnico");
const podeGerenciar = (p)=> isAdmin() || (estado.usuario && estado.usuario.papel !== "produto" && estado.usuario.papel !== "visitante");

/* ============================================================
   3. AUTENTICAÇÃO
   ============================================================ */
function msgLogin(idMostrar, texto){
  ["loginErro","loginOk"].forEach(i=>document.getElementById(i).classList.add("hidden"));
  if(idMostrar){ const el = document.getElementById(idMostrar); el.textContent = texto; el.classList.remove("hidden"); }
}
function erroAuthPt(e){
  const c = (e && e.code) || "";
  if(c.includes("invalid-credential")||c.includes("wrong-password")||c.includes("user-not-found")) return "E-mail ou senha incorretos.";
  if(c.includes("invalid-email")) return "E-mail inválido.";
  if(c.includes("too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos.";
  if(c.includes("email-already-in-use")) return "Este e-mail já possui conta.";
  if(c.includes("weak-password")) return "Senha fraca: use ao menos 6 caracteres.";
  if(c.includes("network-request-failed")) return "Sem conexão com a internet.";
  return "Erro: " + ((e && e.message) || e);
}
async function fazerLogin(){
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  if(!email || !senha){ msgLogin("loginErro","Informe e-mail e senha."); return; }
  const btn = document.getElementById("loginBotao");
  btn.disabled = true; msgLogin(null);
  try{ await auth.signInWithEmailAndPassword(email, senha); }
  catch(e){ msgLogin("loginErro", erroAuthPt(e)); }
  btn.disabled = false;
}
async function entrarComoVisitante(){
  const btn = document.getElementById("loginBotao");
  const btnV = document.getElementById("visitanteBotao");
  if(btn) btn.disabled = true;
  if(btnV) btnV.disabled = true;
  msgLogin(null);
  const emailV = "visitante@viemar.com.br";
  const passV = "visitante123456";
  try {
    await auth.signInWithEmailAndPassword(emailV, passV);
  } catch(e) {
    const c = (e && e.code) || "";
    if (c.includes("user-not-found") || c.includes("invalid-credential")) {
      try {
        const cred = await auth.createUserWithEmailAndPassword(emailV, passV);
        await db.collection("usuarios").doc(cred.user.uid).set({
          nome: "Visitante",
          email: emailV,
          papel: "visitante",
          ativo: true
        });
      } catch(err) {
        try { await auth.signInAnonymously(); } catch(e2) { msgLogin("loginErro", "Erro ao acessar como visitante: " + err.message); }
      }
    } else {
      try { await auth.signInAnonymously(); } catch(e2) { msgLogin("loginErro", "Erro ao acessar como visitante: " + e.message); }
    }
  }
  if(btn) btn.disabled = false;
  if(btnV) btnV.disabled = false;
}
// Cria a conta do administrador na primeira utilização do sistema
async function primeiroAcesso(){
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  if(!email || !senha){ msgLogin("loginErro","Preencha e-mail e senha acima e clique de novo em Primeiro acesso."); return; }
  if(!ehEmailAdmin(email)){ msgLogin("loginErro","O primeiro acesso é somente para o administrador. Peça ao admin para criar seu usuário."); return; }
  try{ await auth.createUserWithEmailAndPassword(email, senha); }
  catch(e){ msgLogin("loginErro", erroAuthPt(e)); }
}
async function resetSenha(){
  const email = document.getElementById("loginEmail").value.trim();
  if(!email){ msgLogin("loginErro","Digite seu e-mail no campo acima e clique de novo."); return; }
  try{ await auth.sendPasswordResetEmail(email); msgLogin("loginOk","E-mail de redefinição enviado. Verifique sua caixa de entrada."); }
  catch(e){ msgLogin("loginErro", erroAuthPt(e)); }
}
function sair(){ auth.signOut(); }

auth.onAuthStateChanged(async (u)=>{
  if(!u){
    if(unsubProjetos){unsubProjetos();unsubProjetos=null}
    if(unsubUsuarios){unsubUsuarios();unsubUsuarios=null}
    estado.usuario = null; estado.projetos = []; estado.usuarios = [];
    document.getElementById("app").classList.add("hidden");
    document.getElementById("telaLogin").classList.remove("hidden");
    document.getElementById("loginCarregando").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    if(avisoDesativado){ msgLogin("loginErro","Seu acesso foi desativado pelo administrador."); avisoDesativado = false; }
    return;
  }
  // Carrega (ou cria, no primeiro login) o perfil do usuário
  try{
    const ref = db.collection("usuarios").doc(u.uid);
    let docu = await ref.get();
    if(!docu.exists){
      const ehAdmin = ehEmailAdmin(u.email);
      const ehAnonimo = u.isAnonymous || !u.email || u.email.includes("visitante");
      await ref.set({
        nome: ehAnonimo ? "Visitante" : (ehAdmin ? "David" : (u.email||"").split("@")[0]),
        email: u.email||"",
        papel: ehAnonimo ? "visitante" : (ehAdmin ? "admin" : "tecnico")
      });
      docu = await ref.get();
    }
    const dadosU = docu.data();
    if(dadosU.ativo === false){ avisoDesativado = true; await auth.signOut(); return; }
    estado.usuario = Object.assign({uid:u.uid}, dadosU);
    ref.update({ultimoAcesso: new Date().toISOString()}).catch(e=>console.error("Erro no ultimoAcesso",e));
    iniciarApp();
  }catch(e){
    console.error(e);
    document.getElementById("loginCarregando").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    msgLogin("loginErro","Falha ao carregar o perfil: "+e.message);
  }
});

function iniciarApp(){
  document.getElementById("telaLogin").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("ativo"));
  const nav = document.querySelector(`.nav-item[data-view="${viewAtual}"]`);
  if(nav) nav.classList.add("ativo");
  document.getElementById("navUsuarios").classList.toggle("hidden", !isAdmin());
  document.getElementById("navMovimentacoes").classList.toggle("hidden", !isAdmin());
  document.getElementById("avatarUsuario").textContent = (estado.usuario.nome||"?")[0].toUpperCase();
  document.getElementById("nomeUsuario").textContent = estado.usuario.nome;
  document.getElementById("papelUsuario").textContent = rotuloPapel(estado.usuario.papel);
  document.getElementById("btnNovo").classList.toggle("hidden", !podeCadastrar());

  if(!unsubProjetos){
    unsubProjetos = db.collection("projetos").onSnapshot(s=>{
      estado.projetos = s.docs.map(x=>normalizarProjeto(Object.assign({id:x.id}, x.data())));
      estado.projetos.sort((a,b)=>(b.dataInicio||"").localeCompare(a.dataInicio||""));
      
      // SCRIPT DE MIGRAÇÃO ÚNICO: Gerar DEV-XXX para projetos existentes
      if (!window.__migracaoIniciada && estado.projetos.length > 0 && estado.projetos.some(p => !p.devId)) {
        window.__migracaoIniciada = true;
        console.log("Migrando projetos antigos para DEV-XXX...");
        const ordemCrescente = estado.projetos.slice().sort((a,b)=>(a.dataInicio||"").localeCompare(b.dataInicio||""));
        ordemCrescente.forEach((p, i) => {
          if (!p.devId) {
            p.devId = "DEV-" + String(i+1).padStart(3, '0');
            db.collection("projetos").doc(p.id).update({ devId: p.devId });
          }
        });
      }

      renderTudo();
    }, e=>console.error("Firestore projetos:", e));
  }
  if(!unsubUsuarios){
    unsubUsuarios = db.collection("usuarios").onSnapshot(s=>{
      estado.usuarios = s.docs.map(x=>Object.assign({uid:x.id}, x.data()));
      if(viewAtual==="usuarios") renderTudo();
    }, e=>console.error("Firestore usuarios:", e));
  }
  renderTudo();
}

/* ============================================================
   4. PERSISTÊNCIA
   ============================================================ */
function salvarProjeto(p){
  const dados = Object.assign({}, p); delete dados.id;
  return db.collection("projetos").doc(p.id).set(dados).catch(e=>alert("Erro ao salvar: "+e.message));
}

/* ============================================================
   5. CÁLCULOS DE PRAZO E STATUS (regras de negócio)
   ============================================================ */
const fluxoDe = p => p.necessita.fixacao ? ETAPAS : ETAPAS_SIMPLES;
const etapaNome = p => {
  const f = fluxoDe(p);
  if(p.etapaAtual >= f.length || (p.etapaAtual === f.length-1 && p.dataReal)) return "Concluído";
  return f[p.etapaAtual];
};
const concluido = p => {
  const f = fluxoDe(p);
  return p.etapaAtual >= f.length || (p.etapaAtual === f.length-1 && !!p.dataReal);
};

function diasNaEtapa(p){
  const ult = p.historico[p.historico.length-1];
  return Math.max(0, dias(ult ? new Date(ult.data) : d(p.dataInicio), HOJE));
}
const diasDesdeInicio = p => Math.max(0, dias(d(p.dataInicio), HOJE));
const leadTime = p => dias(d(p.dataInicio), p.dataReal ? d(p.dataReal) : HOJE);
const prazoRestante = p => p.dataPrevista ? dias(HOJE, d(p.dataPrevista)) : 0;
function diasAtraso(p){
  if(!p.dataPrevista) return 0;
  const fim = p.dataReal ? d(p.dataReal) : HOJE;
  return concluido(p) && p.dataReal ? Math.max(0, dias(d(p.dataPrevista), d(p.dataReal)))
                                    : Math.max(0, dias(d(p.dataPrevista), fim));
}
function statusDe(p){
  if(concluido(p)) return "Concluído";
  if(!p.responsavel) return "Aguardando Técnico";
  if(diasAtraso(p) > 0) return "Atrasado";
  const e = etapaNome(p);
  if(ETAPAS_COMPRAS.includes(e)) return "Aguardando Compras";
  if(e==="Fornecedor") return "Aguardando Fornecedor";
  if(e==="Validação/FO050") return "Em Validação";
  return "Em Andamento";
}
// Semáforo: vermelho = atrasado ou parado além do limite; amarelo = vence em ≤5 dias
function semaforo(p){
  if(concluido(p)) return "verde";
  const el = document.getElementById("cfgDiasAlerta");
  const limite = el ? (+el.value||5) : 5;
  if(diasAtraso(p)>0 || diasNaEtapa(p)>limite) return "vermelho";
  if(p.dataPrevista && prazoRestante(p)<=5) return "amarelo";
  return "verde";
}
// Tempo médio gasto em cada etapa (todas as passagens registradas no histórico)
function temposPorEtapa(projs){
  const acc = {};
  projs.forEach(p=>{
    for(let i=0;i<p.historico.length;i++){
      const ini = new Date(p.historico[i].data);
      const fim = p.historico[i+1] ? new Date(p.historico[i+1].data) : (concluido(p)? ini : HOJE);
      const et = p.historico[i].etapa;
      (acc[et] = acc[et]||[]).push(Math.max(0,dias(ini,fim)));
    }
  });
  const med = {};
  for(const k in acc) med[k] = acc[k].reduce((a,b)=>a+b,0)/acc[k].length;
  return med;
}

/* ============================================================
   6. FILTRO + PESQUISA
   ============================================================ */
function projetosVisiveis(){
  let ps = estado.projetos.slice();
  
  if (!estado.filtrosChip.includes("Todos")) {
    ps = ps.filter(p => {
      for (const f of estado.filtrosChip) {
        if(f==="Sem responsável" && !p.responsavel) return true;
        if(f==="Meu desenvolvimento" && p.responsavelUid===estado.usuario.uid) return true;
        if(f==="Urgentes" && p.prioridade==="Alta" && !concluido(p)) return true;
        if(f==="Atrasados" && diasAtraso(p)>0 && !concluido(p)) return true;
        if(f==="Compras" && ETAPAS_COMPRAS.includes(etapaNome(p))) return true;
        if(f==="Fornecedor" && etapaNome(p)==="Fornecedor") return true;
        if(f==="Liberados" && concluido(p)) return true;
      }
      return false; // se tem filtros marcados mas não atendeu a nenhum
    });
  }

  const q = estado.busca.trim().toLowerCase();
  if(q) ps = ps.filter(p=>{
    const r = p.refs||{};
    return [p.devId,p.codigo,p.descricao,p.cliente,p.responsavel,p.fornecedor,p.familia,p.prioridade,statusDe(p),
      r.alojamento,r.forjadoAlojamento,r.pino,r.forjadoPino,p.numSC,p.numOC,nomesComponentes(p).join(" "),(p.ferramentas||[]).join(" ")].join(" ").toLowerCase().includes(q);
  });
  return ps;
}

// Filtros extras multi-seleção
function filtroMes(ps){
  if(estado.mesesLanc.length > 0) {
    ps = ps.filter(p => estado.mesesLanc.includes((p.dataPrevista||"").slice(0,7)));
  }
  if(estado.resps.length > 0) {
    ps = ps.filter(p => {
      if(!p.responsavel && estado.resps.includes("__sem__")) return true;
      return estado.resps.includes(p.responsavel);
    });
  }
  if(estado.fams.length > 0) {
    ps = ps.filter(p => estado.fams.includes((p.familia||"")));
  }
  if(estado.statusSel && estado.statusSel.length > 0) {
    ps = ps.filter(p => estado.statusSel.includes(statusDe(p)));
  }
  return ps;
}

window.toggleMS = function(id, event) {
  event.stopPropagation();
  const container = document.getElementById(id);
  if (!container) return;
  const isOpen = container.classList.contains('open');
  document.querySelectorAll('.ms-container').forEach(el => el.classList.remove('open'));
  if (!isOpen) container.classList.add('open');
};
document.addEventListener('click', () => {
  document.querySelectorAll('.ms-container').forEach(el => el.classList.remove('open'));
});
window.toggleFiltroArray = function(chave, valor) {
  const arr = estado[chave];
  if(arr.includes(valor)) estado[chave] = arr.filter(x => x !== valor);
  else estado[chave].push(valor);
  renderTudo();
  // Reabre o menu após renderTudo para manter a experiência multi-seleção
  setTimeout(() => {
    const id = 'ms-' + (chave === 'mesesLanc' ? 'mes' : chave === 'resps' ? 'resp' : chave === 'fams' ? 'fam' : 'status');
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }, 0);
};


function componenteMultiSelect(id, chaveEstado, label, opcoes, optNenhum = null) {
  const selecionados = estado[chaveEstado];
  const qtd = selecionados.length;
  const textoBtn = qtd === 0 ? `Todos` : (qtd === 1 ? (selecionados[0]==='__sem__'?optNenhum:selecionados[0]) : `${qtd} selecionados`);
  
  let html = `<div class="ms-container" id="${id}">
    <button class="ms-btn" onclick="toggleMS('${id}', event)">
      <span><b>${label}:</b> <span style="font-weight:normal">${textoBtn}</span></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ml-2"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="ms-menu" onclick="event.stopPropagation()">
      <div class="ms-item font-bold" onclick="estado['${chaveEstado}']=[];renderTudo()">
        <input type="checkbox" ${qtd===0?'checked':''} readonly> <span>Todas as opções</span>
      </div>`;
  
  if (optNenhum) {
    const sel = selecionados.includes("__sem__");
    html += `<div class="ms-item" onclick="toggleFiltroArray('${chaveEstado}', '__sem__')">
      <input type="checkbox" ${sel?'checked':''} readonly> <span>${optNenhum}</span>
    </div>`;
  }
  
  opcoes.forEach(op => {
    const v = op.valor;
    const l = op.label;
    const sel = selecionados.includes(v);
    html += `<div class="ms-item" onclick="toggleFiltroArray('${chaveEstado}', '${v}')">
      <input type="checkbox" ${sel?'checked':''} readonly> <span>${l}</span>
    </div>`;
  });
  
  html += `</div></div>`;
  return html;
}

function barraFiltros(){
  const meses = [...new Set(estado.projetos.map(p=>(p.dataPrevista||"").slice(0,7)).filter(Boolean))].sort();
  const nome = m => { const s = new Date(m+"-02T08:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"}); return s[0].toUpperCase()+s.slice(1); };
  const resps = [...new Set(estado.projetos.map(p=>p.responsavel).filter(Boolean))].sort();
  const fams = [...new Set(estado.projetos.map(p=>p.familia).filter(Boolean))].sort();
  const statusLista = ["Em Andamento", "Atrasado", "Em Validação", "Aguardando Técnico", "Aguardando Compras", "Aguardando Fornecedor", "Concluído"];
  
  const showViews = ["dashboard","kanban","lista","gerencial"];
  const bar = document.getElementById("filtros-bar");
  if (!bar) return;
  bar.style.display = showViews.includes(viewAtual) ? "block" : "none";
  
  bar.innerHTML = `<div class="flex gap-2 flex-wrap pb-3 border-b border-gray-100">
    ${componenteMultiSelect('ms-mes', 'mesesLanc', 'Lançamento', meses.map(m=>({valor:m, label:nome(m)})))}
    ${componenteMultiSelect('ms-resp', 'resps', 'Responsável', resps.map(r=>({valor:esc(r), label:esc(r)})), "Sem responsável")}
    ${componenteMultiSelect('ms-fam', 'fams', 'Família', fams.map(f=>({valor:esc(f), label:esc(f)})))}
    ${componenteMultiSelect('ms-status', 'statusSel', 'Status', statusLista.map(s=>({valor:s, label:s})))}
    ${(estado.mesesLanc.length > 0 || estado.resps.length > 0 || estado.fams.length > 0 || (estado.statusSel && estado.statusSel.length > 0)) ? `<button onclick="estado.mesesLanc=[];estado.resps=[];estado.fams=[];estado.statusSel=[];renderTudo()" style="font-size:.72rem;padding:.25rem .6rem;border-radius:6px;border:1px solid var(--cinza-borda);background:#fff;cursor:pointer;color:var(--vermelho)">&#x2715; Limpar filtros</button>` : ''}
  </div>`;
}

/* ============================================================
   7. NAVEGAÇÃO ENTRE VIEWS
   ============================================================ */
let viewAtual = "dashboard", viewAnterior = "kanban", projetoAberto = null, charts = {};
function irPara(v, id){
  if(v !== "projeto") viewAnterior = v;
  viewAtual = v; projetoAberto = id ?? projetoAberto;
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("ativo", n.dataset.view===v));
  ["dashboard","kanban","lista","gerencial","usuarios","movimentacoes","projeto"].forEach(x=>
    document.getElementById("view-"+x).classList.toggle("hidden", x!==v));
  document.getElementById("chips").style.display = (v==="projeto"||v==="gerencial"||v==="usuarios"||v==="movimentacoes") ? "none":"flex";
  renderTudo();
}
function grafico(id, cfg){                       // recria Chart.js sem vazamento
  if(charts[id]) charts[id].destroy();
  const el = document.getElementById(id);
  if(el) charts[id] = new Chart(el, cfg);
}
const CORES = ["#EA5B0C","#F59E0B","#0F5FA8","#107C41","#7C5CBF","#C42B1C","#0E7490","#525260"];

/* ============================================================
   8. COMPONENTES REUTILIZÁVEIS
   ============================================================ */
const badgeStatus = s => ({
  "Concluído":"b-verde","Atrasado":"b-vermelho","Aguardando Compras":"b-laranja","Aguardando Técnico":"b-roxo",
  "Aguardando Fornecedor":"b-azul","Em Teste":"b-amarelo","Em Validação":"b-amarelo","Em Andamento":"b-cinza"
}[s]||"b-cinza");

function cardProjeto(p){
  const sem = semaforo(p), st = statusDe(p);
  return `<div class="card kb-card p-3 mb-2 surgir" onclick="irPara('projeto','${p.id}')">
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-1.5"><span class="font-bold text-[13px]">${esc(p.codigo)}</span>${p.devId ? `<span class="badge b-laranja text-[9px] !px-1 leading-none">${p.devId}</span>` : ""}</div>
      <span class="dot dot-${sem}"></span>
    </div>
    <div class="text-[12px] leading-snug mb-2" style="color:var(--texto-2)">${esc(p.descricao)}</div>
    <div class="flex items-center gap-1.5 flex-wrap mb-2">
      ${p.tipo?`<span class="badge" style="background:#F1F5F9;color:#475569;border:1px solid #CBD5E1">${esc(p.tipo)}</span>`:""}
      ${p.cliente?`<span class="badge b-cinza">${esc(p.cliente)}</span>`:""}
      ${p.familia?`<span class="badge b-laranja">${esc(p.familia)}</span>`:""}
      ${nomesComponentes(p).map(l=>`<span class="badge b-azul">${l}</span>`).join("")}
      ${p.prioridade==="Alta"?'<span class="badge b-vermelho">Urgente</span>':""}
    </div>
    <div class="flex items-center justify-between text-[11px]" style="color:var(--texto-2)">
      ${p.responsavel
        ? `<span class="flex items-center gap-1">
            <span class="w-[18px] h-[18px] rounded-full text-[9px] font-bold text-white flex items-center justify-center" style="background:#8A8A93">${esc(p.responsavel[0])}</span>
            ${esc(p.responsavel)}
          </span>`
        : (isProduto()
            ? `<span class="badge b-roxo">Aguardando técnico</span>`
            : `<button class="btn btn-primario !py-0.5 !px-2 !text-[11px] no-print" onclick="event.stopPropagation();assumirTarefa('${p.id}')">✋ Assumir tarefa</button>`)}
      <span>${diasNaEtapa(p)}d na etapa</span>
    </div>
    <div class="flex items-center justify-between text-[11px] mt-1" style="color:var(--texto-2)">
      <span>Lançamento: <b style="color:${diasAtraso(p)>0?'var(--vermelho)':'var(--texto)'}">${fmt(p.dataPrevista)}</b></span>
      <span class="badge ${badgeStatus(st)}">${st}</span>
    </div>
  </div>`;
}

/* ============================================================
   9. AÇÃO — ASSUMIR TAREFA
   ============================================================ */
function assumirTarefa(id){
  if(isSomenteLeitura()) return;
  const p = estado.projetos.find(x=>x.id===id);
  if(!p) return;
  if(p.responsavel){ alert("Este desenvolvimento já foi assumido por "+p.responsavel+"."); return; }
  // Ao assumir, o técnico deve informar obrigatoriamente um prazo para a análise rápida
  pedirCampo("Assumir "+p.codigo, "Prazo para a análise rápida", "date", p.prazoAnalise, (v)=>{
    p.responsavel = estado.usuario.nome;
    p.responsavelUid = estado.usuario.uid;
    p.assumidoEm = new Date().toISOString();
    p.prazoAnalise = v;
    // "Recebido" é concluído automaticamente ao assumir; a Análise passa a ser a etapa atual
    if(p.etapaAtual===0){
      const flx = fluxoDe(p);
      p.etapaAtual = 1;
      p.historico.push({etapa:flx[1], data:new Date().toISOString(), usuario:estado.usuario.nome});
    }
    p.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome, texto:"Assumiu o desenvolvimento. Prazo da análise: "+fmtL(v)+"."});
    salvarProjeto(p);
  });
}

/* ============================================================
   10. VIEW — DASHBOARD
   ============================================================ */
function renderDashboard(){
  const ps = filtroMes(projetosVisiveis());
  const ativos = ps.filter(p=>!concluido(p));
  const kpis = [
    ["Total de desenvolvimentos", ps.length, "b-laranja"],
    ["Desenvolvimentos ativos", ativos.length, "b-laranja"],
    ["Sem responsável", ps.filter(p=>!p.responsavel).length, "b-roxo"],
    ["Concluídos", ps.filter(concluido).length, "b-verde"],
    ["Atrasados", ps.filter(p=>diasAtraso(p)>0 && !concluido(p)).length, "b-vermelho"],
    ["Aguardando Compras", ps.filter(p=>ETAPAS_COMPRAS.includes(etapaNome(p))).length, "b-laranja"],
    ["Aguardando Fornecedor", ps.filter(p=>etapaNome(p)==="Fornecedor").length, "b-azul"],
    ["Em Setup/FO050", ps.filter(p=>etapaNome(p)==="Validação/FO050").length, "b-amarelo"],
    ["Lead Time médio", (ps.reduce((a,p)=>a+leadTime(p),0)/(ps.length||1)).toFixed(0)+" dias", "b-cinza"],
    ["Projetos críticos", ps.filter(p=>semaforo(p)==="vermelho").length, "b-vermelho"],
  ];
  const porEtapa = TODAS_ETAPAS.map(e=> ps.filter(p=>etapaNome(p)===e).length);
  const stCount = {};
  ps.forEach(p=>{const s=statusDe(p);stCount[s]=(stCount[s]||0)+1});
  const porResp = {};
  ps.forEach(p=>{const r=p.responsavel||"Sem responsável";porResp[r]=(porResp[r]||0)+1});
  const meses={};
  ps.forEach(p=>{if(p.dataInicio){const k=p.dataInicio.slice(0,7);meses[k]=(meses[k]||0)+1}});
  const mesesOrd = Object.keys(meses).sort();

  document.getElementById("view-dashboard").innerHTML = `
    <h1 class="text-xl font-bold mb-1 surgir">Dashboard</h1>
    <p class="text-[13px] mb-5 surgir" style="color:var(--texto-2)">Visão geral do desenvolvimento de novos produtos · ${fmtL(HOJE)}</p>
    ${estado.projetos.length===0?`<div class="card p-8 text-center surgir mb-5">
      <div class="text-3xl mb-2">📭</div>
      <div class="font-semibold mb-1">Nenhum desenvolvimento cadastrado ainda</div>
      <div class="text-[13px]" style="color:var(--texto-2)">${podeCadastrar()?'Clique em "Novo Desenvolvimento" no topo para cadastrar o primeiro.':'Aguarde o administrador cadastrar os desenvolvimentos.'}</div>
    </div>`:""}
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      ${kpis.map((k,i)=>`<div class="card p-4 surgir surgir-${(i%5)+1}">
        <div class="text-[11px] font-semibold mb-1.5" style="color:var(--texto-2)">${k[0]}</div>
        <div class="text-2xl font-bold">${k[1]}</div>
      </div>`).join("")}
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card p-5 surgir"><div class="font-semibold text-sm mb-3">Desenvolvimentos por etapa</div><canvas id="gEtapa" height="220"></canvas></div>
      <div class="card p-5 surgir surgir-1"><div class="font-semibold text-sm mb-3">Distribuição por status</div><div class="max-w-[260px] mx-auto"><canvas id="gStatus"></canvas></div></div>
      <div class="card p-5 surgir surgir-2"><div class="font-semibold text-sm mb-3">Linha do tempo — desenvolvimentos iniciados</div><canvas id="gTempo" height="200"></canvas></div>
      <div class="card p-5 surgir surgir-3"><div class="font-semibold text-sm mb-3">Quantidade por responsável</div><canvas id="gResp" height="200"></canvas></div>
    </div>`;

  const base = {plugins:{legend:{display:false}},responsive:true,
    scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,ticks:{precision:0,font:{size:10}},grid:{color:"#EFEFF3"}}}};
  grafico("gEtapa",{type:"bar",data:{labels:TODAS_ETAPAS,datasets:[{data:porEtapa,backgroundColor:"#EA5B0C",borderRadius:5,maxBarThickness:26}]},
    options:{...base,scales:{...base.scales,x:{...base.scales.x,ticks:{font:{size:9},maxRotation:60,minRotation:45}}}}});
  grafico("gStatus",{type:"doughnut",data:{labels:Object.keys(stCount),datasets:[{data:Object.values(stCount),backgroundColor:CORES,borderWidth:2,borderColor:"#fff"}]},
    options:{cutout:"62%",plugins:{legend:{position:"bottom",labels:{font:{size:10},boxWidth:10}}}}});
  grafico("gTempo",{type:"line",data:{labels:mesesOrd,datasets:[{data:mesesOrd.map(m=>meses[m]),borderColor:"#EA5B0C",backgroundColor:"rgba(234,91,12,.08)",fill:true,tension:.35,pointRadius:4,pointBackgroundColor:"#EA5B0C"}]},options:base});
  grafico("gResp",{type:"bar",data:{labels:Object.keys(porResp),datasets:[{data:Object.values(porResp),backgroundColor:CORES,borderRadius:5,maxBarThickness:34}]},
    options:{...base,indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{precision:0,font:{size:10}},grid:{color:"#EFEFF3"}},y:{grid:{display:false},ticks:{font:{size:11}}}}}});
}

/* ============================================================
   11. VIEW — KANBAN
   ============================================================ */
let kanbanScrollLeft = 0;
function renderKanban(){
  const containerOld = document.getElementById("kanbanContainer");
  if (containerOld) kanbanScrollLeft = containerOld.scrollLeft;
  const ps = filtroMes(projetosVisiveis());
  ps.sort((a,b) => {
    const dPa = a.dataPrevista || "9999-99-99";
    const dPb = b.dataPrevista || "9999-99-99";
    if (dPa !== dPb) return dPa.localeCompare(dPb);
    return (a.dataInicio || "").localeCompare(b.dataInicio || "");
  });
  document.getElementById("view-kanban").innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
      <h1 class="text-xl font-bold surgir">Kanban de Desenvolvimentos</h1>
    </div>
    <div id="kanbanContainer" class="flex gap-3 overflow-x-auto pb-4" style="min-height:60vh" onscroll="kanbanScrollLeft = this.scrollLeft">
      ${TODAS_ETAPAS.map(et=>{
        const cards = ps.filter(p=>etapaNome(p)===et);
        return `<div class="kb-col">
          <div class="flex items-center justify-between px-1 mb-2">
            <span class="text-[12px] font-bold uppercase tracking-wide" style="color:var(--texto-2)">${et}</span>
            <span class="badge ${cards.length?'b-laranja':'b-cinza'}">${cards.length}</span>
          </div>
          <div class="rounded-lg p-1.5 min-h-[120px]" style="background:#EDEDF0">
            ${cards.map(cardProjeto).join("") || '<div class="text-center text-[11px] py-6" style="color:#A0A0A8">—</div>'}
          </div>
        </div>`;
      }).join("")}
    </div>`;
  const containerNew = document.getElementById("kanbanContainer");
  if (containerNew) containerNew.scrollLeft = kanbanScrollLeft;
}

/* ============================================================
   12. VIEW — LISTA DE DESENVOLVIMENTOS
   ============================================================ */
function alternarOrdemLista(){
  estado.ordLista = estado.ordLista==="" ? "cadastro-desc" : (estado.ordLista==="cadastro-desc" ? "cadastro-asc" : "");
  renderTudo();
}
function renderLista(){
  let ps = filtroMes(projetosVisiveis());
  if(estado.ordLista==="cadastro-desc")      ps.sort((a,b)=>(b.dataInicio||"").localeCompare(a.dataInicio||""));
  else if(estado.ordLista==="cadastro-asc")  ps.sort((a,b)=>(a.dataInicio||"").localeCompare(b.dataInicio||""));
  else ps.sort((a,b) => {
    const dPa = a.dataPrevista || "9999-99-99";
    const dPb = b.dataPrevista || "9999-99-99";
    if (dPa !== dPb) return dPa.localeCompare(dPb);
    return (a.dataInicio || "").localeCompare(b.dataInicio || "");
  });
  const setaOrd = estado.ordLista==="cadastro-desc" ? " ▼" : (estado.ordLista==="cadastro-asc" ? " ▲" : " ⇅");
  document.getElementById("view-lista").innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
      <h1 class="text-xl font-bold surgir">Desenvolvimentos <span class="text-sm font-normal" style="color:var(--texto-2)">(${ps.length})</span></h1>
    </div>
    <div class="card overflow-x-auto surgir">
      <table class="w-full text-[12.5px]">
        <thead><tr class="text-left text-[11px] uppercase tracking-wide" style="color:var(--texto-2);background:var(--cinza-bg)">
          <th class="p-3"></th><th class="p-3">Ref. Produto</th><th class="p-3">Descrição</th><th class="p-3">Cliente</th>
          <th class="p-3">Família</th><th class="p-3">Responsável</th><th class="p-3">Etapa</th><th class="p-3">Status</th>
          <th class="p-3 text-right cursor-pointer select-none" title="Clique para ordenar por data de cadastro" onclick="alternarOrdemLista()">Cadastro${setaOrd}</th>
          <th class="p-3 text-right">Dias etapa</th><th class="p-3 text-right">Lead Time</th><th class="p-3 text-right">Lançamento</th><th class="p-3 text-right">Atraso</th>
        </tr></thead>
        <tbody>${ps.map(p=>`
          <tr class="border-t hover:bg-orange-50/40 cursor-pointer transition" style="border-color:var(--cinza-borda)" onclick="irPara('projeto','${p.id}')">
            <td class="p-3"><span class="dot dot-${semaforo(p)}"></span></td>
            <td class="p-3"><div class="font-bold flex items-center gap-1.5">${esc(p.codigo)}${p.devId ? `<span class="badge b-laranja text-[9px] !px-1 leading-none mt-0.5">${p.devId}</span>` : ""}</div></td>
            <td class="p-3 max-w-[240px] truncate" style="color:var(--texto-2)">${esc(p.descricao)}</td>
            <td class="p-3">${esc(p.cliente)||"—"}</td>
            <td class="p-3">${p.familia?`<span class="badge b-laranja">${esc(p.familia)}</span>`:"—"}</td>
            <td class="p-3">${p.responsavel?esc(p.responsavel):(isSomenteLeitura()?'<span class="text-[11px]" style="color:var(--roxo)">—</span>':`<button class="btn btn-primario !py-0.5 !px-2 !text-[11px] no-print" onclick="event.stopPropagation();assumirTarefa('${p.id}')">✋ Assumir</button>`)}</td>
            <td class="p-3">${etapaNome(p)}</td>
            <td class="p-3"><span class="badge ${badgeStatus(statusDe(p))}">${statusDe(p)}</span></td>
            <td class="p-3 text-right">${fmt(p.dataInicio)}</td>
            <td class="p-3 text-right">${diasNaEtapa(p)}</td>
            <td class="p-3 text-right">${leadTime(p)}d</td>
            <td class="p-3 text-right">${fmt(p.dataPrevista)}</td>
            <td class="p-3 text-right font-semibold" style="color:${diasAtraso(p)>0?'var(--vermelho)':'var(--verde)'}">${diasAtraso(p)>0? diasAtraso(p)+"d":"—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ${ps.length===0?'<div class="p-8 text-center text-[13px]" style="color:var(--texto-2)">Nenhum desenvolvimento encontrado.</div>':""}
    </div>`;
}

/* ============================================================
   13. VIEW — PÁGINA DO PROJETO
   ============================================================ */
function renderProjeto(){
  const p = estado.projetos.find(x=>x.id===projetoAberto);
  if(!p){irPara("dashboard");return}
  const flx = fluxoDe(p), st = statusDe(p);
  const gerencia = podeGerenciar(p);
  // Linha da tarefa paralela "Desenvolver Programas CNC" (Técnico Fase 1)
  const linhaCnc = ()=>{
    const cnc = p.programaCnc || {feito:false};
    const liberado = analiseConcluida(p);                 // só após a Análise
    const podeClicar = gerencia && liberado;
    const h = cnc.feito && cnc.data ? new Date(cnc.data) : null;
    return `<div class="chk-linha">
      <div class="chk-box ${cnc.feito?'feito':''} ${!podeClicar&&!cnc.feito?'bloq':''}" style="border-style:dashed"
           ${podeClicar?`onclick="toggleProgramaCnc('${p.id}')" title="${cnc.feito?'Clique para desmarcar':'Marcar como concluído'}"`:""}>
        ${cnc.feito?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke-width="3.5"><path d="M4 12l5 5L20 7"/></svg>':""}
      </div>
      <div class="flex-1">
        <div class="text-[12.5px] font-medium ${cnc.feito?'line-through opacity-60':''}">${ETAPA_CNC} <span class="badge b-azul ml-1">Paralela</span></div>
        ${!cnc.feito?`<div class="text-[10px] leading-snug" style="color:#9A9AA3">${liberado?DESC_ETAPAS[ETAPA_CNC]:"Disponível após concluir a Análise."}</div>`:""}
        ${h?`<div class="text-[10.5px]" style="color:var(--texto-2)">✓ ${h.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})} · ${esc(cnc.usuario||"")}</div>`:""}
      </div>
    </div>`;
  };
  const nec = Object.entries({fixacao:"Nova fixação",programa:"Programa CNC"})
    .map(([k,v])=>`<span class="badge ${p.necessita[k]?'b-laranja':'b-cinza'}" style="${p.necessita[k]?'':'opacity:.5'}">${p.necessita[k]?'✓ ':''}${v}</span>`).join(" ");

  // Pendências geradas automaticamente
  const pend = [];
  if(!concluido(p)){
    if(!p.responsavel) pend.push("Nenhum técnico assumiu este desenvolvimento ainda.");
    if(diasAtraso(p)>0) pend.push(`Projeto atrasado em <b>${diasAtraso(p)} dias</b> em relação à previsão de lançamento.`);
    if(diasNaEtapa(p) > (+document.getElementById("cfgDiasAlerta").value||5)) pend.push(`Parado há <b>${diasNaEtapa(p)} dias</b> na etapa "${etapaNome(p)}".`);
    if(p.necessita.fixacao && ["Solicitação de Compra","Aprovação SC"].includes(etapaNome(p)) && !p.numSC) pend.push("Número da SC não registrado.");
    if(p.necessita.fixacao && ["Ordem de Compra","Aprovação OC","Fornecedor"].includes(etapaNome(p)) && !p.numOC) pend.push("Número da OC não registrado.");
    if(etapaNome(p)==="Fornecedor" && p.prazoFornecedor && d(p.prazoFornecedor)<HOJE) pend.push(`Prazo do fornecedor vencido em ${fmtL(p.prazoFornecedor)}.`);
  }

  const r = p.refs||{};
  const info = [["Componentes",nomesComponentes(p).join(", ")||"—"],
    ["Ref. produto final",esc(p.codigo)],["Ref. Alojamento",esc(r.alojamento)||"—"],["Ref. Forjado Alojamento",esc(r.forjadoAlojamento)||"—"],
    ["Ref. Pino",esc(r.pino)||"—"],["Ref. Forjado Pino",esc(r.forjadoPino)||"—"],["NP de Usinagem",esc(r.npUsinagem)||"—"],
    ["Cliente",esc(p.cliente)||"—"],["Família",esc(p.familia)||"—"],["Tipo",esc(p.tipo)],
    ["Responsável",p.responsavel?esc(p.responsavel):"—"],["Prioridade",esc(p.prioridade)],["Cadastro",fmtL(p.dataInicio)],["Previsão de lançamento",fmtL(p.dataPrevista)],
    ["Data real",p.dataReal?fmtL(p.dataReal):"—"],["Fornecedor",esc(p.fornecedor)||"—"],["Nº SC",esc(p.numSC)||"—"],["Nº OC",esc(p.numOC)||"—"],
    ["Análise prevista",p.prazoAnalise?fmtL(p.prazoAnalise):"—"],["Prazo fornecedor",p.prazoFornecedor?fmtL(p.prazoFornecedor):"—"],["Projeto fixação previsto",p.prazoProjetoFixacao?fmtL(p.prazoProjetoFixacao):"—"],
    ["Programa CNC",p.programaCnc&&p.programaCnc.feito?("✓ concluído "+(p.programaCnc.data?fmtL(p.programaCnc.data):"")):"pendente"],["Cadastrado por",esc(p.criadoPor)||"—"]];

  const indicadores = [["Dias desde o cadastro",diasDesdeInicio(p)+"d"],["Dias na etapa",diasNaEtapa(p)+"d"],
    ["Lead Time",leadTime(p)+"d"],["Prazo restante",(concluido(p)?"—":(p.dataPrevista?prazoRestante(p)+"d":"—"))],["Dias em atraso",diasAtraso(p)+"d"]];

  document.getElementById("view-projeto").innerHTML = `
    <button class="btn btn-suave mb-4 no-print" onclick="irPara(viewAnterior)">← Voltar</button>
    <div class="flex items-start justify-between flex-wrap gap-3 mb-5 surgir">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold">${p.devId ? `<span class="badge b-laranja">${p.devId}</span>` : ""} ${esc(p.codigo)}</h1>
          <span class="dot dot-${semaforo(p)}"></span>
          <span class="badge ${badgeStatus(st)}">${st}</span>
          ${p.prioridade==="Alta"?'<span class="badge b-vermelho">Urgente</span>':""}
        </div>
        <p class="text-[13px] mt-1" style="color:var(--texto-2)">${esc(p.descricao)}</p>
        ${p.observacao?`<div class="card !shadow-none p-3 mt-2 text-[12.5px]" style="background:var(--laranja-claro);border-color:#F5CBAF"><b>Observação:</b> ${esc(p.observacao)}</div>`:""}
        <div class="mt-2 flex gap-1.5 flex-wrap">${nomesComponentes(p).map(l=>`<span class="badge b-azul">${l}</span>`).join(" ")} ${nec}</div>
      </div>
      <div class="flex gap-2 no-print flex-wrap items-center">
        ${isAdmin()?`<select class="inp !w-auto !text-[12px]" title="Direcionar a um técnico" onchange="atribuirTecnico('${p.id}',this.value)">
          <option value="">${p.responsavel?"— Remover responsável —":"— Direcionar a… —"}</option>
          ${estado.usuarios.filter(u=>u.ativo!==false).map(u=>`<option value="${u.uid}" ${p.responsavelUid===u.uid?"selected":""}>${esc(u.nome)}</option>`).join("")}
        </select>`:""}
        ${!p.responsavel && !isSomenteLeitura()?`<button class="btn btn-primario" onclick="assumirTarefa('${p.id}')">✋ Assumir tarefa</button>`:""}
        ${gerencia?`<button class="btn btn-suave" onclick="abrirCadastro('${p.id}')">✎ Editar</button>`:""}
        ${gerencia && p.etapaAtual>0 && !concluido(p) ? `<button class="btn btn-suave" onclick="voltarEtapa('${p.id}')">↩ Voltar etapa</button>`:""}
        ${isAdmin()?`<button class="btn btn-suave" onclick="duplicarProjeto('${p.id}')">⧉ Duplicar</button>`:""}
        ${isAdmin()?`<button class="btn btn-suave" style="color:var(--vermelho);border-color:#F5C6C0" onclick="excluirProjeto('${p.id}')">🗑 Excluir</button>`:""}
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      ${indicadores.map((k,i)=>`<div class="card p-3.5 surgir surgir-${i+1}">
        <div class="text-[10.5px] font-semibold uppercase tracking-wide" style="color:var(--texto-2)">${k[0]}</div>
        <div class="text-xl font-bold mt-1">${k[1]}</div></div>`).join("")}
    </div>

    ${pend.length?`<div class="card p-4 mb-5 surgir" style="border-left:4px solid var(--vermelho)">
      <div class="font-semibold text-sm mb-2" style="color:var(--vermelho)">⚠ Pendências (${pend.length})</div>
      <ul class="text-[12.5px] space-y-1" style="color:var(--texto-2)">${pend.map(x=>`<li>• ${x}</li>`).join("")}</ul>
    </div>`:""}

    <div class="grid md:grid-cols-3 gap-4">
      <div class="card p-5 surgir">
        <div class="font-semibold text-sm mb-3">Dados gerais</div>
        <div class="space-y-2">${info.map(k=>`<div class="flex justify-between text-[12.5px] border-b pb-1.5" style="border-color:var(--cinza-bg)">
          <span style="color:var(--texto-2)">${k[0]}</span><span class="font-medium text-right">${k[1]}</span></div>`).join("")}</div>
      </div>

      <div class="card p-5 surgir surgir-1">
        <div class="font-semibold text-sm mb-1">Checklist de etapas</div>
        <div class="text-[11px] mb-3" style="color:var(--texto-2)">
          ${gerencia ? "Concluir uma etapa registra data, hora, usuário e tempo gasto." : (isVisitante() ? "Perfil Visitante: apenas visualização de desenvolvimentos e status." : "Engenharia de Produto apenas visualiza o fluxo.")}
        </div>
        ${flx.map((et,i)=>{
          // "Liberação" (última etapa) é o estado final: quando o projeto conclui, ela também aparece marcada
          const feita = i < p.etapaAtual || (concluido(p) && i === p.etapaAtual);
          const atual = i === p.etapaAtual && !concluido(p);
          const podeMarcar = atual && gerencia;
          const h = p.historico[i+1] || (concluido(p) && i===p.etapaAtual ? p.historico[i] : null);
          const temDuracao = !!p.historico[i+1];
          const prazoEtapa = ({"Análise":p.prazoAnalise,"Projeto da Fixação":p.prazoProjetoFixacao,"Fornecedor":p.prazoFornecedor})[et];
          const grupo = gruposDe(p).find(g=>g[1]===i);
          const tituloGrupo = grupo?`<div class="flex items-center gap-2 mt-3 mb-1 px-1">
            <span class="w-2 h-2 rounded-full flex-none" style="background:${COR_GRUPO[GRUPO_ETAPA[et]]||'var(--laranja)'}"></span>
            <span class="text-[10px] font-bold uppercase tracking-widest" style="color:${COR_GRUPO[GRUPO_ETAPA[et]]||'var(--laranja)'}">${grupo[0]}</span>
          </div>`:"";
          const linhaEtapa = `${tituloGrupo}<div class="chk-linha ${atual?'!bg-orange-50':''}">
            <div class="chk-box ${feita?'feito':''} ${!podeMarcar&&!feita?'bloq':''}"
                 ${podeMarcar?`onclick="concluirEtapa('${p.id}')"`:(feita&&gerencia?`onclick="reabrirEtapa('${p.id}',${i})" title="Clique para desmarcar e voltar a esta etapa"`:"")}>
              ${feita?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke-width="3.5"><path d="M4 12l5 5L20 7"/></svg>':""}
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2">
                <div class="text-[12.5px] font-medium ${feita?'line-through opacity-60':''}">${et} ${atual?'<span class="badge b-laranja ml-1">Atual</span>':''}</div>
                ${gerencia?`<button class="text-[10px] font-semibold no-print flex-none" style="color:var(--laranja)" title="Observação desta etapa" onclick="editarObsEtapa('${p.id}','${et}')">${p.obsEtapas&&p.obsEtapas[et]?'✎ obs':'+ obs'}</button>`:""}
              </div>
              ${!feita?`<div class="text-[10px] leading-snug" style="color:#9A9AA3">${DESC_ETAPAS[et]||""}</div>`:""}
              ${h?`<div class="text-[10.5px]" style="color:var(--texto-2)">✓ ${new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})} · ${esc(h.usuario)}${temDuracao?` · ${(()=>{const ant=p.historico[i];return ant?Math.max(0,dias(new Date(ant.data),new Date(h.data)))+"d na etapa":""})()}`:""}</div>`:""}
              ${feita && prazoEtapa?`<div class="text-[10.5px] mt-1 rounded-md p-1.5 leading-snug font-medium" style="background:#E8F1FB;color:#0F5FA8">🎯 Prazo: ${fmtL(prazoEtapa)}</div>`:""}
              ${p.obsEtapas&&p.obsEtapas[et]?`<div class="text-[10.5px] mt-1 rounded-md p-1.5 leading-snug" style="background:var(--laranja-claro);color:var(--texto-2)">📝 ${esc(p.obsEtapas[et])}</div>`:""}
            </div>
          </div>`;
          // Tarefa paralela "Desenvolver Programas CNC" — renderizada logo após a Análise (apenas no fluxo com fixação)
          return (et==="Análise" && flx===ETAPAS) ? linhaEtapa + linhaCnc() : linhaEtapa;
        }).join("")}
      </div>

      <div class="card p-5 surgir surgir-2">
        <div class="font-semibold text-sm mb-3">Linha do tempo</div>
        ${p.historico.slice().reverse().map(h=>`<div class="tl-item">
          <div class="tl-ponto"></div>
          <div class="text-[12.5px] font-semibold">${esc(h.etapa)}</div>
          <div class="text-[11px]" style="color:var(--texto-2)">${new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})} · ${esc(h.usuario)}</div>
        </div>`).join("") || '<div class="text-[12px]" style="color:var(--texto-2)">Sem movimentações.</div>'}
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-4 mt-4">
      <div class="card p-5 surgir">
        <div class="font-semibold text-sm mb-3">Comentários</div>
        <div class="space-y-3 mb-3 max-h-72 overflow-y-auto">
          ${p.comentarios.slice().reverse().map(c=>`<div class="rounded-lg p-3" style="background:var(--cinza-bg)">
            <div class="flex justify-between text-[11px] mb-1"><b>${esc(c.usuario)}</b><span style="color:var(--texto-2)">${new Date(c.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span></div>
            <div class="text-[12.5px]">${esc(c.texto)}</div>
          </div>`).join("") || '<div class="text-[12px]" style="color:var(--texto-2)">Nenhum comentário.</div>'}
        </div>
        ${!isSomenteLeitura()?`<div class="flex gap-2 no-print">
          <input id="novoComent" class="inp" placeholder="Escreva um comentário..." onkeydown="if(event.key==='Enter')addComentario('${p.id}')">
          <button class="btn btn-primario" onclick="addComentario('${p.id}')">Enviar</button>
        </div>`:""}
      </div>
      <div class="card p-5 surgir surgir-1">
        <div class="font-semibold text-sm mb-3">Documentos / Anexos</div>
        <div class="space-y-2 mb-3">
          ${p.anexos.map((a,i)=>`<div class="flex items-center justify-between rounded-lg p-2.5 text-[12.5px]" style="background:var(--cinza-bg)">
            <span>📎 ${esc(a)}</span>${gerencia?`<button class="text-[11px] no-print" style="color:var(--vermelho)" onclick="removerAnexo('${p.id}',${i})">remover</button>`:""}
          </div>`).join("") || '<div class="text-[12px]" style="color:var(--texto-2)">Nenhum documento anexado.</div>'}
        </div>
        ${!isSomenteLeitura()?`<div class="flex gap-2 no-print">
          <input id="novoAnexo" class="inp" placeholder="Nome do documento (ex.: Desenho REV-B.pdf)" onkeydown="if(event.key==='Enter')addAnexo('${p.id}')">
          <button class="btn btn-suave" onclick="addAnexo('${p.id}')">Anexar</button>
        </div>`:""}
      </div>
      <div class="card p-5 surgir surgir-2">
        <div class="font-semibold text-sm mb-3">Ferramentas desenvolvidas</div>
        <div class="space-y-2 mb-3">
          ${(p.ferramentas||[]).map((f,i)=>`<div class="flex items-center justify-between rounded-lg p-2.5 text-[12.5px]" style="background:var(--cinza-bg)">
            <span>🔧 ${esc(f)}</span>${gerencia?`<button class="text-[11px] no-print" style="color:var(--vermelho)" onclick="removerFerramenta('${p.id}',${i})">remover</button>`:""}
          </div>`).join("") || '<div class="text-[12px]" style="color:var(--texto-2)">Nenhuma ferramenta registrada.</div>'}
        </div>
        ${!isSomenteLeitura()?`<div class="flex gap-2 no-print">
          <input id="novaFerramenta" class="inp" placeholder="Cód. da ferramenta" onkeydown="if(event.key==='Enter')addFerramenta('${p.id}')">
          <button class="btn btn-suave" onclick="addFerramenta('${p.id}')">Adicionar</button>
        </div>`:""}
      </div>

      <div class="card p-5 surgir md:col-span-3">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold text-sm">Dados FO050</div>
          ${gerencia && !isSomenteLeitura() ? `<button class="btn btn-suave !p-1.5 no-print" onclick="abrirModalFO050('${p.id}', 'livre')">✎ Editar</button>` : ''}
        </div>
        ${(()=>{
          const fo = p.fo050 || { celulas:[], processos:[] };
          if(fo.maquina && !fo.processos) {
            fo.processos = [{ nome:"Processo Principal", maquina:fo.maquina, tempoUsinagem:fo.tempoUsinagem||"", tempoTroca:fo.tempoTroca||"", dataExecucao:fo.dataExecucao||"", numOP:fo.numOP||"" }];
          }
          if(!fo.processos) fo.processos = [];
          
          if(!fo.celulas.length && fo.processos.length === 0) return '<div class="text-[12px]" style="color:var(--texto-2)">Nenhum dado FO050 registrado.</div>';
          
          let celulasHtml = fo.celulas.length > 0 ? `<div class="mb-4">
              <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Células</div>
              <div class="text-[13px] mt-1 space-y-1">
                ${fo.celulas.map((c,i)=>`<div class="flex items-center gap-1.5">${i===0?`<span class="badge b-verde text-[9px] !px-1.5 leading-none">P</span>`:''}${esc(c)}</div>`).join("")}
              </div>
            </div>` : '';
          
          let procHtml = "";
          let totalUsi = 0, totalTro = 0;
          
          if(fo.processos.length > 0) {
            procHtml = fo.processos.map((pr, idx) => {
              const u = Number(pr.tempoUsinagem)||0;
              const t = Number(pr.tempoTroca)||0;
              totalUsi += u; totalTro += t;
              return `<div class="grid md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3 relative">
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Processo</div>
                  <div class="text-[13px] mt-1 font-bold text-blue-900">${esc(pr.nome)}</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Máquina</div>
                  <div class="text-[13px] mt-1 font-medium">${esc(pr.maquina)||"-"}</div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tempos (s)</div>
                  <div class="text-[13px] mt-1">Usinagem: <b>${pr.tempoUsinagem||"-"}</b></div>
                  <div class="text-[13px]">Troca: <b>${pr.tempoTroca||"-"}</b></div>
                  <div class="text-[13px] mt-1 pt-1 border-t border-gray-200">Parcial: <b class="text-blue-700">${(u+t)>0?(u+t).toFixed(1):"-"}</b></div>
                </div>
                <div>
                  <div class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Execução</div>
                  <div class="text-[13px] mt-1">Data: <b>${pr.dataExecucao?fmtL(pr.dataExecucao):"-"}</b></div>
                  <div class="text-[13px]">OP: <b>${esc(pr.numOP)||"-"}</b></div>
                </div>
              </div>`;
            }).join("");
            
            procHtml += `<div class="text-right text-[14px] font-bold bg-[#E8F1FB] p-2 rounded text-blue-900 border border-blue-100 mt-2">
              Tempo Total Geral: ${(totalUsi+totalTro).toFixed(1)} s
            </div>`;
          }
          
          return celulasHtml + procHtml;
        })()}
      </div>
    </div>`;
}

/* ============================================================
   14. VIEW — DASHBOARD GERENCIAL
   ============================================================ */
function renderGerencial(){
  const ps = filtroMes(projetosVisiveis());
  const med = temposPorEtapa(ps);
  const mediaDe = etapas => {
    const vals = etapas.filter(e=>med[e]!=null).map(e=>med[e]);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "—";
  };
  const porCliente = {}, porResp = {};
  ps.forEach(p=>{
    if(p.cliente) porCliente[p.cliente]=(porCliente[p.cliente]||0)+1;
    const r = p.responsavel||"Sem responsável";
    porResp[r]=(porResp[r]||0)+1;
  });
  const kpis = [
    ["Tempo médio de desenvolvimento",ps.length?(ps.reduce((a,p)=>a+leadTime(p),0)/ps.length).toFixed(0)+" dias":"—"],
    ["Lead Time (concluídos)",(()=>{const c=ps.filter(x=>concluido(x));return c.length?(c.reduce((a,p)=>a+leadTime(p),0)/c.length).toFixed(0)+" dias":"—"})()],
    ["Projetos atrasados",ps.filter(p=>diasAtraso(p)>0&&!concluido(p)).length],
    ["Projetos finalizados",ps.filter(concluido).length],
    ["Tempo médio em Compras",mediaDe(ETAPAS_COMPRAS)+" dias"],
    ["Tempo médio no Fornecedor",mediaDe(["Fornecedor"])+" dias"],
    ["Tempo médio Programas CNC",mediaDe(["Desenvolver Programas CNC", "Programa CNC"])+" dias"],
    ["Retrabalho (Retrocessos)",ps.reduce((a,p)=>a+(p.comentarios||[]).filter(c=>c.texto&&c.texto.startsWith("Retrocedeu")).length,0)],
    ["Em andamento",ps.filter(p=>!concluido(p)).length],
  ];
  const etapasLbl = TODAS_ETAPAS.filter(e=>med[e]!=null);
  // Lead time médio por responsabilidade: soma o tempo gasto nas etapas de cada grupo, por projeto, e tira a média
  const somaG = {}, contG = {};
  ps.forEach(p=>{
    const porGrupo = {};
    for(let i=0;i<p.historico.length;i++){
      const fim = p.historico[i+1] ? new Date(p.historico[i+1].data) : (concluido(p) ? null : HOJE);
      if(!fim) continue;
      const g = GRUPO_ETAPA[p.historico[i].etapa];
      if(!g) continue;
      porGrupo[g] = (porGrupo[g]||0) + Math.max(0, dias(new Date(p.historico[i].data), fim));
    }
    for(const g in porGrupo){ somaG[g]=(somaG[g]||0)+porGrupo[g]; contG[g]=(contG[g]||0)+1; }
  });
  const gruposLbl = ["Técnico","Analista","PCP"].filter(g=>contG[g]);
  const medG = gruposLbl.map(g=>+(somaG[g]/contG[g]).toFixed(1));
  document.getElementById("view-gerencial").innerHTML = `
    <h1 class="text-xl font-bold mb-1 surgir">Dashboard Gerencial</h1>
    <p class="text-[13px] mb-3 surgir" style="color:var(--texto-2)">Indicadores executivos do processo de desenvolvimento</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      ${kpis.map((k,i)=>`<div class="card p-4 surgir surgir-${(i%5)+1}">
        <div class="text-[11px] font-semibold mb-1.5" style="color:var(--texto-2)">${k[0]}</div>
        <div class="text-2xl font-bold">${k[1]}</div></div>`).join("")}
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card p-5 surgir md:col-span-2">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div class="font-semibold text-sm">Lead time por etapa (dias)</div>
          <div class="flex gap-3 text-[11px]" style="color:var(--texto-2)">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm inline-block" style="background:#EA5B0C"></span>Técnico</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm inline-block" style="background:#0F5FA8"></span>Analista</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm inline-block" style="background:#107C41"></span>PCP</span>
          </div>
        </div>
        <canvas id="gMedEtapa" height="120"></canvas>
      </div>
      <div class="card p-5 surgir"><div class="font-semibold text-sm mb-3">Lead time por responsabilidade (dias)</div><canvas id="gGrupo" height="200"></canvas></div>
      <div class="card p-5 surgir surgir-1"><div class="font-semibold text-sm mb-3">Projetos por cliente</div><canvas id="gCliente" height="200"></canvas></div>
      <div class="card p-5 surgir surgir-2"><div class="font-semibold text-sm mb-3">Projetos por responsável</div><div class="max-w-[240px] mx-auto"><canvas id="gRespG"></canvas></div></div>
    </div>`;

  const base = {plugins:{legend:{display:false}},responsive:true,
    scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:60,minRotation:45}},y:{beginAtZero:true,ticks:{font:{size:10}},grid:{color:"#EFEFF3"}}}};
  grafico("gMedEtapa",{type:"bar",data:{labels:etapasLbl,datasets:[{data:etapasLbl.map(e=>+med[e].toFixed(1)),backgroundColor:etapasLbl.map(e=>COR_GRUPO[GRUPO_ETAPA[e]]||"#525260"),borderRadius:5,maxBarThickness:30}]},options:base});
  grafico("gGrupo",{type:"bar",data:{labels:gruposLbl,datasets:[{data:medG,backgroundColor:gruposLbl.map(g=>COR_GRUPO[g]),borderRadius:5,maxBarThickness:60}]},
    options:{...base,indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{font:{size:10}},grid:{color:"#EFEFF3"}},y:{grid:{display:false},ticks:{font:{size:12}}}}}});
  grafico("gCliente",{type:"bar",data:{labels:Object.keys(porCliente),datasets:[{data:Object.values(porCliente),backgroundColor:"#0F5FA8",borderRadius:5,maxBarThickness:34}]},
    options:{...base,indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{precision:0,font:{size:10}},grid:{color:"#EFEFF3"}},y:{grid:{display:false},ticks:{font:{size:11}}}}}});
  grafico("gRespG",{type:"doughnut",data:{labels:Object.keys(porResp),datasets:[{data:Object.values(porResp),backgroundColor:CORES,borderWidth:2,borderColor:"#fff"}]},
    options:{cutout:"60%",plugins:{legend:{position:"bottom",labels:{font:{size:10},boxWidth:10}}}}});
}

/* ============================================================
   15. VIEW — USUÁRIOS (somente admin)
   ============================================================ */
function renderUsuarios(){
  if(!isAdmin()){ irPara("dashboard"); return; }
  const us = estado.usuarios.slice().sort((a,b)=>(a.papel||"").localeCompare(b.papel||"")||(a.nome||"").localeCompare(b.nome||""));
  document.getElementById("view-usuarios").innerHTML = `
    <h1 class="text-xl font-bold mb-1 surgir">Usuários</h1>
    <p class="text-[13px] mb-5 surgir" style="color:var(--texto-2)">Cadastre os técnicos que vão assumir e movimentar os desenvolvimentos</p>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card p-5 surgir">
        <div class="font-semibold text-sm mb-3">Cadastrar novo usuário</div>
        <div class="space-y-3">
          <div><label class="lbl">Nome *</label><input id="u-nome" class="inp" placeholder="Ex.: Oscar"></div>
          <div><label class="lbl">E-mail *</label><input id="u-email" type="email" class="inp" placeholder="oscar@empresa.com"></div>
          <div><label class="lbl">Senha inicial * (mín. 6 caracteres)</label><input id="u-senha" type="text" class="inp" placeholder="Senha que o técnico usará para entrar"></div>
          <div><label class="lbl">Papel</label><select id="u-papel" class="inp"><option value="tecnico">Técnico</option><option value="produto">Engenharia de Produto (visualiza + cadastra)</option><option value="visitante">Visitante (apenas visualização)</option><option value="admin">Administrador</option></select></div>
          <div id="u-msg" class="hidden text-[12px] font-medium rounded-md p-2"></div>
          <button id="u-botao" class="btn btn-primario" onclick="criarUsuario()">Criar usuário</button>
          <div class="text-[11px]" style="color:var(--texto-2)">O técnico entra com esse e-mail/senha e pode trocá-la depois em "Esqueci minha senha".</div>
        </div>
      </div>
      <div class="card p-5 surgir surgir-1">
        <div class="font-semibold text-sm mb-3">Usuários cadastrados (${us.length})</div>
        <div class="space-y-2">
          ${us.map(u=>`<div class="flex items-center gap-3 rounded-lg p-2.5" style="background:var(--cinza-bg);${u.ativo===false?'opacity:.55':''}">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-none" style="background:${u.papel==='admin'?'var(--laranja)':'#8A8A93'}">${esc((u.nome||"?")[0].toUpperCase())}</div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-semibold truncate">${esc(u.nome)} ${u.uid===estado.usuario.uid?'<span class="text-[10px] font-normal" style="color:var(--texto-2)">(você)</span>':''}</div>
              <div class="text-[11px] truncate" style="color:var(--texto-2)">${esc(u.email)}</div>
            </div>
            ${u.ativo===false?'<span class="badge b-vermelho">Desativado</span>':`<span class="badge ${u.papel==='admin'?'b-laranja':(u.papel==='produto'?'b-roxo':(u.papel==='visitante'?'b-cinza':'b-azul'))}">${u.papel==='admin'?'Admin':(u.papel==='produto'?'Eng. Produto':(u.papel==='visitante'?'Visitante':'Técnico'))}</span>`}
            <div class="flex gap-1 flex-none">
              <button class="btn btn-suave !p-1.5 !text-[12px]" title="Editar nome/papel" onclick="editarUsuario('${u.uid}')">✎</button>
              <button class="btn btn-suave !p-1.5 !text-[12px]" title="Enviar e-mail de redefinição de senha" onclick="resetSenhaUsuario('${u.uid}')">🔑</button>
              ${u.uid!==estado.usuario.uid?`<button class="btn btn-suave !p-1.5 !text-[11px]" style="color:${u.ativo===false?'var(--verde)':'var(--vermelho)'}" title="${u.ativo===false?'Reativar acesso':'Desativar acesso'}" onclick="alternarAtivo('${u.uid}')">${u.ativo===false?'Reativar':'Desativar'}</button>`:""}
            </div>
          </div>`).join("") || '<div class="text-[12px]" style="color:var(--texto-2)">Nenhum usuário ainda.</div>'}
        </div>
      </div>
    </div>`;
}
function msgUsuario(ok, texto){
  const el = document.getElementById("u-msg");
  el.classList.remove("hidden");
  el.style.color = ok ? "var(--verde)" : "var(--vermelho)";
  el.style.background = ok ? "#E6F4EC" : "#FDE7E5";
  el.textContent = texto;
}
async function criarUsuario(){
  if(!isAdmin()) return;
  const nome = document.getElementById("u-nome").value.trim();
  const email = document.getElementById("u-email").value.trim();
  const senha = document.getElementById("u-senha").value;
  const papel = document.getElementById("u-papel").value;
  if(!nome || !email || senha.length<6){ msgUsuario(false,"Preencha nome, e-mail e uma senha com ao menos 6 caracteres."); return; }
  const btn = document.getElementById("u-botao"); btn.disabled = true;
  try{
    // App secundário: cria a conta sem derrubar a sessão do admin
    const sec = firebase.apps.find(a=>a.name==="sec") || firebase.initializeApp(firebaseConfig,"sec");
    const cred = await sec.auth().createUserWithEmailAndPassword(email, senha);
    await db.collection("usuarios").doc(cred.user.uid).set({nome, email, papel});
    await sec.auth().signOut();
    msgUsuario(true, "Usuário "+nome+" criado. Ele já pode entrar com o e-mail e a senha informados.");
    document.getElementById("u-nome").value = document.getElementById("u-email").value = document.getElementById("u-senha").value = "";
  }catch(e){ msgUsuario(false, erroAuthPt(e)); }
  btn.disabled = false;
}

// Edição de usuário (nome/papel) — e-mail e senha não podem ser alterados pelo navegador
function editarUsuario(uid){
  if(!isAdmin()) return;
  const u = estado.usuarios.find(x=>x.uid===uid);
  if(!u) return;
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  modal.innerHTML = `<div class="modal p-6 !w-[420px]" onclick="event.stopPropagation()">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">Editar usuário</h2>
      <button class="btn btn-suave !p-1.5" onclick="fecharModal()">✕</button>
    </div>
    <div class="space-y-3">
      <div><label class="lbl">Nome</label><input id="eu-nome" class="inp" value="${esc(u.nome)}"></div>
      <div><label class="lbl">E-mail (não editável)</label><input class="inp" value="${esc(u.email)}" disabled style="opacity:.6"></div>
      <div><label class="lbl">Papel</label><select id="eu-papel" class="inp">
        <option value="tecnico" ${u.papel==="tecnico"?"selected":""}>Técnico</option>
        <option value="produto" ${u.papel==="produto"?"selected":""}>Engenharia de Produto (visualiza + cadastra)</option>
        <option value="visitante" ${u.papel==="visitante"?"selected":""}>Visitante (apenas visualização)</option>
        <option value="admin" ${u.papel==="admin"?"selected":""}>Administrador</option></select></div>
      <div class="text-[11px]" style="color:var(--texto-2)">Para trocar a senha, use o botão 🔑 (envia e-mail de redefinição). Para trocar o e-mail, desative este usuário e crie um novo.</div>
      <div class="flex justify-end gap-2 mt-2">
        <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primario" onclick="salvarEdicaoUsuario('${uid}')">Salvar</button>
      </div>
    </div></div>`;
  modal.onclick = fecharModal;
}
async function salvarEdicaoUsuario(uid){
  const nome = document.getElementById("eu-nome").value.trim();
  const papel = document.getElementById("eu-papel").value;
  if(!nome){ alert("Informe o nome."); return; }
  try{
    await db.collection("usuarios").doc(uid).update({nome, papel});
    // Propaga o novo nome aos desenvolvimentos direcionados a ele
    const meus = estado.projetos.filter(p=>p.responsavelUid===uid);
    if(meus.length){
      const batch = db.batch();
      meus.forEach(p=>batch.update(db.collection("projetos").doc(p.id),{responsavel:nome}));
      await batch.commit();
    }
    if(uid===estado.usuario.uid){ estado.usuario.nome = nome; estado.usuario.papel = papel; iniciarApp(); }
    fecharModal();
  }catch(e){ alert("Erro: "+e.message); }
}
async function resetSenhaUsuario(uid){
  const u = estado.usuarios.find(x=>x.uid===uid);
  if(!u) return;
  if(!confirm("Enviar e-mail de redefinição de senha para "+u.email+"?")) return;
  try{ await auth.sendPasswordResetEmail(u.email); alert("E-mail de redefinição enviado para "+u.email+"."); }
  catch(e){ alert("Erro: "+erroAuthPt(e)); }
}
async function alternarAtivo(uid){
  if(!isAdmin()) return;
  const u = estado.usuarios.find(x=>x.uid===uid);
  if(!u) return;
  if(uid===estado.usuario.uid){ alert("Você não pode desativar a si mesmo."); return; }
  const desativar = u.ativo!==false;
  if(desativar && !confirm("Desativar o acesso de "+u.nome+"? Ele não conseguirá mais entrar no sistema (pode ser reativado depois).")) return;
  try{ await db.collection("usuarios").doc(uid).update({ativo: !desativar}); }
  catch(e){ alert("Erro: "+e.message); }
}

/* ============================================================
   16. AÇÕES — checklist, comentários, anexos, etapas
   ============================================================ */
// Admin direciona (ou remove) o responsável sem que o técnico precise assumir
function atribuirTecnico(id, uid){
  if(!isAdmin()) return;
  const p = estado.projetos.find(x=>x.id===id);
  if(!p) return;
  if(!uid){
    if(!confirm("Remover o responsável de "+p.codigo+"? O desenvolvimento volta para \"Aguardando Técnico\".")) { renderTudo(); return; }
    p.responsavel=""; p.responsavelUid=""; p.assumidoEm="";
    p.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome, texto:"Removeu o responsável."});
  }else{
    const u = estado.usuarios.find(x=>x.uid===uid);
    if(!u) return;
    p.responsavel = u.nome; p.responsavelUid = u.uid; p.assumidoEm = new Date().toISOString();
    p.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome, texto:"Direcionou o desenvolvimento para "+u.nome+"."});
  }
  salvarProjeto(p);
}
// Admin duplica um desenvolvimento: cópia idêntica (histórico, comentários, anexos, ferramentas, obs)
function duplicarProjeto(id){
  if(!isAdmin()) return;
  const p = estado.projetos.find(x=>x.id===id);
  if(!p) return;
  if(!confirm("Duplicar o desenvolvimento "+p.codigo+"? Será criada uma cópia idêntica.")) return;
  const c = JSON.parse(JSON.stringify(p));
  c.id = db.collection("projetos").doc().id;
  c.codigo = p.codigo + " (CÓPIA)";
  if(!c.comentarios) c.comentarios = [];
  c.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome, texto:"Duplicado do desenvolvimento "+p.codigo+"."});
  salvarProjeto(c).then(()=>irPara("projeto", c.id));
}
function excluirProjeto(id){
  if(!isAdmin()) return;
  const p = estado.projetos.find(x=>x.id===id);
  if(!p) return;
  if(!confirm("Excluir definitivamente o desenvolvimento "+p.codigo+"?\n\nEssa ação não pode ser desfeita: histórico, comentários e anexos serão apagados.")) return;
  db.collection("projetos").doc(id).delete()
    .then(()=>irPara("lista"))
    .catch(e=>alert("Erro ao excluir: "+e.message));
}
// Janela para pedir um dado obrigatório ao concluir certas etapas
function pedirCampo(titulo, label, tipo, valorAtual, aoConfirmar){
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  modal.innerHTML = `<div class="modal p-6 !w-[400px]" onclick="event.stopPropagation()">
    <h2 class="text-base font-bold mb-1">${titulo}</h2>
    <p class="text-[12px] mb-3" style="color:var(--texto-2)">Este dado será salvo automaticamente no cadastro do desenvolvimento.</p>
    <label class="lbl">${label}</label>
    <input id="pc-valor" type="${tipo}" class="inp" value="${esc(valorAtual||"")}" onkeydown="if(event.key==='Enter')document.getElementById('pc-ok').click()">
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
      <button class="btn btn-primario" id="pc-ok">Concluir etapa</button>
    </div></div>`;
  modal.onclick = fecharModal;
  const inp = document.getElementById("pc-valor");
  inp.focus();
  document.getElementById("pc-ok").onclick = ()=>{
    const v = inp.value.trim();
    if(!v){ inp.style.borderColor = "var(--vermelho)"; inp.focus(); return; }
    fecharModal(); aoConfirmar(v);
  };
}
// Observação livre por etapa (visível no checklist)
function editarObsEtapa(id, etapa){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p || !podeGerenciar(p)) return;
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  const obsAtual = (p.obsEtapas||{})[etapa]||"";
  modal.innerHTML = `<div class="modal p-6 !w-[440px]" onclick="event.stopPropagation()">
    <h2 class="text-base font-bold mb-3">Observação — ${etapa}</h2>
    <textarea id="obs-etapa" class="inp" rows="4" placeholder="Escreva a observação desta etapa...">${esc(obsAtual)}</textarea>
    <div class="flex justify-between items-center mt-4">
      <div>
        ${obsAtual ? `<button class="btn" style="color:var(--vermelho);border-color:var(--vermelho)" id="obs-del">&#x1F5D1; Excluir observação</button>` : ''}
      </div>
      <div class="flex gap-2">
        <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primario" id="obs-ok">Salvar</button>
      </div>
    </div></div>`;
  modal.onclick = fecharModal;
  document.getElementById("obs-etapa").focus();
  document.getElementById("obs-ok").onclick = ()=>{
    if(!p.obsEtapas) p.obsEtapas = {};
    const v = document.getElementById("obs-etapa").value.trim();
    if(v) p.obsEtapas[etapa] = v; else delete p.obsEtapas[etapa];
    fecharModal(); salvarProjeto(p);
  };
  if(obsAtual) document.getElementById("obs-del").onclick = ()=>{
    if(!confirm("Excluir a observação desta etapa?")) return;
    if(!p.obsEtapas) p.obsEtapas = {};
    delete p.obsEtapas[etapa];
    fecharModal(); salvarProjeto(p);
  };
}
// Conclusão da Análise: define se necessita fixação (ajusta o fluxo) e, se sim, a data do projeto da fixação
function modalConcluirAnalise(p, aoConfirmar){
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  modal.innerHTML = `<div class="modal p-6 !w-[460px]" onclick="event.stopPropagation()">
    <h2 class="text-base font-bold mb-1">Concluir: Análise</h2>
    <p class="text-[12px] mb-3" style="color:var(--texto-2)">O resultado da análise define o caminho do desenvolvimento e é salvo automaticamente no cadastro.</p>
    <label class="lbl">Necessita nova fixação?</label>
    <select id="an-fix" class="inp mb-3" onchange="document.getElementById('an-data-wrap').classList.toggle('hidden', this.value!=='sim')">
      <option value="sim" ${p.necessita.fixacao?"selected":""}>Sim — fluxo completo (orçamento → compras → fornecedor)</option>
      <option value="nao" ${!p.necessita.fixacao?"selected":""}>Não — fluxo simplificado (apenas programa CNC)</option>
    </select>
    <div id="an-data-wrap" class="${p.necessita.fixacao?"":"hidden"}">
      <label class="lbl">Data prevista para o projeto da fixação</label>
      <input id="an-data" type="date" class="inp" value="${p.prazoProjetoFixacao||""}">
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
      <button class="btn btn-primario" id="an-ok">Concluir etapa</button>
    </div></div>`;
  modal.onclick = fecharModal;
  document.getElementById("an-ok").onclick = ()=>{
    const fix = document.getElementById("an-fix").value === "sim";
    if(fix){
      const v = document.getElementById("an-data").value;
      if(!v){ const i = document.getElementById("an-data"); i.style.borderColor = "var(--vermelho)"; i.focus(); return; }
      p.prazoProjetoFixacao = v;
    } else {
      p.prazoProjetoFixacao = "";
    }
    if(p.necessita.fixacao !== fix){
      p.necessita.fixacao = fix;
      p.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome,
        texto: fix ? "Análise definiu: necessita nova fixação — fluxo completo." : "Análise definiu: não necessita fixação — fluxo simplificado."});
    }
    fecharModal();
    aoConfirmar();
  };
}
// Marca/desmarca a tarefa paralela "Desenvolver Programas CNC"
function toggleProgramaCnc(id){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p || !podeGerenciar(p)) return;
  if(!analiseConcluida(p)){ alert("Conclua a Análise antes de registrar o Programa CNC."); return; }
  if(!p.programaCnc) p.programaCnc = {feito:false, data:"", usuario:""};
  if(p.programaCnc.feito){
    if(!confirm("Desmarcar 'Desenvolver Programas CNC'?")) return;
    p.programaCnc = {feito:false, data:"", usuario:""};
    salvarProjeto(p);
    if(viewAtual==="projeto") renderProjeto();
  }else{
    const fo = p.fo050 || { celulas:[], maquina:"" };
    if(fo.celulas.length === 0 || !fo.maquina) {
      abrirModalFO050(id, 'maquina', () => {
        p.programaCnc = {feito:true, data:new Date().toISOString(), usuario:estado.usuario.nome};
        salvarProjeto(p);
        if(viewAtual==="projeto") renderProjeto();
      });
    } else {
      p.programaCnc = {feito:true, data:new Date().toISOString(), usuario:estado.usuario.nome};
      salvarProjeto(p);
      if(viewAtual==="projeto") renderProjeto();
    }
  }
}
// Modal para informar 1+ códigos de ferramenta ao concluir "Projeto da Fixação"
function modalFerramentas(p, aoConfirmar){
  if(!p.ferramentas) p.ferramentas = [];
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  const render = ()=>{
    modal.innerHTML = `<div class="modal p-6 !w-[460px]" onclick="event.stopPropagation()">
      <h2 class="text-base font-bold mb-1">Concluir: Projeto da Fixação</h2>
      <p class="text-[12px] mb-3" style="color:var(--texto-2)">Informe o(s) código(s) da(s) ferramenta(s) gerada(s). É obrigatório pelo menos uma.</p>
      <div class="space-y-2 mb-3">
        ${p.ferramentas.length?p.ferramentas.map((f,i)=>`<div class="flex items-center justify-between rounded-lg p-2.5 text-[12.5px]" style="background:var(--cinza-bg)">
          <span>🔧 ${esc(f)}</span><button class="text-[11px]" style="color:var(--vermelho)" onclick="__ferrRemover(${i})">remover</button>
        </div>`).join(""):'<div class="text-[12px]" style="color:var(--texto-2)">Nenhuma ferramenta adicionada.</div>'}
      </div>
      <div class="flex gap-2">
        <input id="mf-cod" class="inp" placeholder="Código da ferramenta (ex.: FX-1042)" onkeydown="if(event.key==='Enter'){event.preventDefault();__ferrAdd();}">
        <button class="btn btn-suave" onclick="__ferrAdd()">Adicionar</button>
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primario" id="mf-ok">Concluir etapa</button>
      </div></div>`;
    modal.onclick = fecharModal;
    document.getElementById("mf-ok").onclick = ()=>{
      if(!p.ferramentas.length){ alert("Adicione ao menos um código de ferramenta."); return; }
      fecharModal(); aoConfirmar();
    };
  };
  window.__ferrAdd = ()=>{ const el = document.getElementById("mf-cod"); const v = el.value.trim(); if(!v) return; p.ferramentas.push(v); render(); };
  window.__ferrRemover = (i)=>{ p.ferramentas.splice(i,1); render(); };
  render();
  const el = document.getElementById("mf-cod"); if(el) el.focus();
}
function concluirEtapa(id){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p || !podeGerenciar(p)) return;
  const flx = fluxoDe(p);
  if(concluido(p)) return;
  const etapaConcluida = flx[p.etapaAtual];
  const efetivar = ()=>{
    const f2 = fluxoDe(p);                       // recalcula: a Análise pode ter mudado o fluxo
    p.etapaAtual++;
    const nome = p.etapaAtual >= f2.length ? "Concluído" : f2[p.etapaAtual];
    p.historico.push({etapa:nome, data:new Date().toISOString(), usuario:estado.usuario.nome});
    if(concluido(p) && !p.dataReal) p.dataReal = new Date().toISOString().slice(0,10);
    salvarProjeto(p);
  };

  // Verifica FO050 antes de avançar
  const fo = p.fo050 || { celulas:[], processos:[] };
  const proximaEtapa = flx[p.etapaAtual+1];
  
  if(fo.maquina && !fo.processos) {
    // Migração de dados antigos
    fo.processos = [{ nome:"Processo Principal", maquina:fo.maquina, tempoUsinagem:fo.tempoUsinagem||"", tempoTroca:fo.tempoTroca||"", dataExecucao:fo.dataExecucao||"", numOP:fo.numOP||"" }];
  }
  if(!fo.processos) fo.processos = [];
  
  if((proximaEtapa === "Validação/FO050" || etapaConcluida === "Programa CNC") && (fo.celulas.length === 0 || fo.processos.length === 0 || fo.processos.some(pr => !pr.maquina || !pr.nome))){
    abrirModalFO050(id, 'maquina', ()=>concluirEtapa(id));
    return;
  }
  if(etapaConcluida === "Validação/FO050" && (fo.processos.length === 0 || fo.processos.some(pr => !pr.tempoUsinagem || !pr.tempoTroca || !pr.dataExecucao || !pr.numOP))){
    abrirModalFO050(id, 'todos', ()=>concluirEtapa(id));
    return;
  }

  // Etapas que exigem registrar um dado antes de concluir
  if(etapaConcluida==="Análise"){
    modalConcluirAnalise(p, efetivar);
  } else if(etapaConcluida==="Projeto da Fixação"){
    modalFerramentas(p, efetivar);
  } else if(etapaConcluida==="Solicitação de Compra"){
    pedirCampo("Concluir: Solicitação de Compra","Nº da Solicitação de Compra (SC)","text",p.numSC,(v)=>{ p.numSC = v; efetivar(); });
  } else if(etapaConcluida==="Ordem de Compra"){
    pedirCampo("Concluir: Ordem de Compra","Nº da Ordem de Compra (OC)","text",p.numOC,(v)=>{ p.numOC = v; efetivar(); });
  } else if(etapaConcluida==="Aprovação OC"){
    pedirCampo("Enviar ao fornecedor","Prazo de entrega da ferramenta (informado pelo fornecedor)","date",p.prazoFornecedor,(v)=>{ p.prazoFornecedor = v; efetivar(); });
  } else {
    efetivar();
  }
}
// Desmarca uma etapa já concluída: o desenvolvimento volta a ficar nela e as datas seguintes são removidas
function reabrirEtapa(id, i){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p || !podeGerenciar(p)) return;
  const flx = fluxoDe(p);
  const alvo = i;
  
  const msg = `Desmarcar a etapa "${flx[alvo]}" e voltar o projeto para cá?\n\nAs datas das etapas seguintes serão removidas.\n\nInforme o MOTIVO do retrocesso:`;
  const motivo = prompt(msg);
  if(motivo === null) return; // cancelou
  if(!motivo.trim()){ alert("Você deve informar o motivo para desmarcar a etapa."); return; }
  
  if(!p.comentarios) p.comentarios = [];
  p.comentarios.push({
    usuario: estado.usuario.nome || "Sistema",
    data: new Date().toISOString(),
    texto: `Retrocedeu o desenvolvimento para a etapa "${flx[alvo]}". Motivo: ${motivo.trim()}`
  });
  
  p.etapaAtual = alvo;
  if(!p.historico) p.historico = [];
  const idxHist = p.historico.findIndex(h => h.etapa === flx[alvo]);
  if(idxHist >= 0) {
    p.historico = p.historico.slice(0, idxHist + 1);
  } else {
    p.historico.push({etapa: flx[alvo], data: new Date().toISOString(), usuario: estado.usuario.nome || "Sistema"});
  }
  p.dataReal = "";
  
  // Limpa os dados e prazos vinculados às etapas que estão sendo desfeitas
  const limparEtapasDesfeitas = (p, alvo, flx) => {
    const etapasDesfeitas = flx.slice(alvo);
    if(etapasDesfeitas.includes("Recebido") || etapasDesfeitas.includes("Análise")) {
      p.prazoAnalise = "";
      p.prazoProjetoFixacao = "";
      p.necessita.fixacao = false;
      p.prazoFornecedor = "";
      p.numSC = "";
      p.numOC = "";
      p.ferramentas = [];
    } else if(etapasDesfeitas.includes("Projeto da Fixação")) {
      p.prazoProjetoFixacao = "";
      p.ferramentas = [];
      p.prazoFornecedor = "";
      p.numSC = "";
      p.numOC = "";
    } else if(etapasDesfeitas.includes("Solicitação de Compra")) {
      p.numSC = "";
      p.numOC = "";
      p.prazoFornecedor = "";
    } else if(etapasDesfeitas.includes("Ordem de Compra")) {
      p.numOC = "";
      p.prazoFornecedor = "";
    } else if(etapasDesfeitas.includes("Aprovação OC")) {
      p.prazoFornecedor = "";
    }
  };

  limparEtapasDesfeitas(p, alvo, flx);
  
  if(!p.comentarios) p.comentarios = [];
  p.comentarios.push({data:new Date().toISOString(), usuario:estado.usuario.nome || "Sistema", texto:`Reabriu a etapa "${flx[alvo]}".`});
  salvarProjeto(p);
}
function voltarEtapa(id){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p || !podeGerenciar(p)) return;
  if(p.etapaAtual<=0) return;
  
  const flx = fluxoDe(p);
  const alvo = p.etapaAtual - 1;
  p.etapaAtual = alvo;
  
  if(p.historico) {
    const idxHist = p.historico.findIndex(h => h.etapa === flx[alvo]);
    if(idxHist >= 0) {
      p.historico = p.historico.slice(0, idxHist + 1);
    } else {
      if(p.historico.length > 0) p.historico.pop();
      p.historico.push({etapa: flx[alvo], data: new Date().toISOString(), usuario: estado.usuario.nome || "Sistema"});
    }
  }
  p.dataReal="";
  limparEtapasDesfeitas(p, alvo, flx);
  salvarProjeto(p);
}
function addComentario(id){
  if(isSomenteLeitura()) return;
  const el = document.getElementById("novoComent");
  if(!el.value.trim()) return;
  const p = estado.projetos.find(x=>x.id===id);
  p.comentarios.push({data:new Date().toISOString(),usuario:estado.usuario.nome,texto:el.value.trim()});
  salvarProjeto(p);
}
function addAnexo(id){
  if(isSomenteLeitura()) return;
  const el = document.getElementById("novoAnexo");
  if(!el.value.trim()) return;
  const p = estado.projetos.find(x=>x.id===id);
  p.anexos.push(el.value.trim());
  salvarProjeto(p);
}
function removerAnexo(id,i){
  const p = estado.projetos.find(x=>x.id===id);
  if(!podeGerenciar(p)) return;
  p.anexos.splice(i,1);
  salvarProjeto(p);
}
function addFerramenta(id){
  if(isSomenteLeitura()) return;
  const el = document.getElementById("novaFerramenta");
  if(!el.value.trim()) return;
  const p = estado.projetos.find(x=>x.id===id);
  if(!p.ferramentas) p.ferramentas = [];
  p.ferramentas.push(el.value.trim());
  salvarProjeto(p);
}
function removerFerramenta(id,i){
  const p = estado.projetos.find(x=>x.id===id);
  if(!podeGerenciar(p)) return;
  p.ferramentas.splice(i,1);
  salvarProjeto(p);
}

/* ============================================================
   17. CADASTRO / EDIÇÃO (modal)
   ============================================================ */
function abrirCadastro(id){
  const p = id ? estado.projetos.find(x=>x.id===id) : null;
  if(!p && !podeCadastrar()){ alert("Você não tem permissão para cadastrar desenvolvimentos."); return; }
  if(p && !podeGerenciar(p)){ alert("Seu perfil de usuário não tem permissão para editar desenvolvimentos."); return; }
  const v = k => p ? (p[k]??"") : "";
  const vr = k => p && p.refs ? (p.refs[k]??"") : "";
  const nec = k => p && p.necessita[k] ? "checked":"";
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  modal.innerHTML = `<div class="modal p-6" onclick="event.stopPropagation()">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-bold">${p?"Editar":"Novo"} desenvolvimento</h2>
      <button class="btn btn-suave !p-1.5" onclick="fecharModal()">✕</button>
    </div>
    <div class="mb-2 text-[11px] font-bold uppercase tracking-wide" style="color:var(--laranja)">Referências</div>
    <div class="grid md:grid-cols-3 gap-4">
      <div><label class="lbl">Ref. produto final *</label><input id="f-codigo" class="inp" value="${esc(v("codigo"))}" placeholder="VMR-00000"></div>
      <div class="md:col-span-2"><label class="lbl">Descrição *</label><input id="f-descricao" class="inp" value="${esc(v("descricao"))}" placeholder="Ex.: Pivô suspensão dianteira linha pesada"></div>
      <div><label class="lbl">Ref. Alojamento</label><input id="f-refAloj" class="inp" value="${esc(vr("alojamento"))}"></div>
      <div><label class="lbl">Ref. Forjado do Alojamento</label><input id="f-refForjAloj" class="inp" value="${esc(vr("forjadoAlojamento"))}"></div>
      <div><label class="lbl">Ref. Pino</label><input id="f-refPino" class="inp" value="${esc(vr("pino"))}"></div>
      <div><label class="lbl">Ref. Forjado do Pino</label><input id="f-refForjPino" class="inp" value="${esc(vr("forjadoPino"))}"></div>
      <div><label class="lbl">NP de Usinagem</label><input id="f-npUsinagem" class="inp" value="${esc(vr("npUsinagem"))}"></div>
      <div><label class="lbl">Cliente</label><input id="f-cliente" class="inp" value="${esc(v("cliente"))}"></div>
      <div><label class="lbl">Família</label>
        <input id="f-familia" class="inp" list="listaFamilias" value="${esc(v("familia"))}" placeholder="Selecione ou digite outra">
        <datalist id="listaFamilias">${FAMILIAS.map(f=>`<option value="${f}">`).join("")}</datalist>
      </div>
    </div>
    <div class="grid md:grid-cols-4 gap-4 mt-4">
      <div><label class="lbl">Tipo</label><select id="f-tipo" class="inp">
        <option ${v("tipo")==="Novo"?"selected":""}>Novo</option>
        <option ${v("tipo")==="Alteração"?"selected":""}>Alteração</option>
        <option ${v("tipo")==="Melhoria"?"selected":""}>Melhoria</option>
        <option ${v("tipo")==="BGI"?"selected":""}>BGI</option>
      </select></div>
      <div><label class="lbl">Prioridade</label><select id="f-prioridade" class="inp">
        ${["Alta","Média","Baixa"].map(u=>`<option ${v("prioridade")===u?"selected":""}>${u}</option>`).join("")}</select></div>
      <div><label class="lbl">Previsão de lançamento *</label><input id="f-dataPrevista" type="date" class="inp" value="${v("dataPrevista")}"></div>
      ${isAdmin()?`<div><label class="lbl">Direcionar ao técnico</label><select id="f-responsavel" class="inp">
        <option value="">— Ninguém (técnico assume) —</option>
        ${estado.usuarios.filter(u=>u.ativo!==false).map(u=>`<option value="${u.uid}" ${p&&p.responsavelUid===u.uid?"selected":""}>${esc(u.nome)}</option>`).join("")}
      </select></div>`:""}
    </div>
    <div class="mt-4">
      <label class="lbl">Observações</label>
      <textarea id="f-observacao" class="inp" rows="3" placeholder="Instruções, particularidades do cliente, cuidados de processo...">${esc(v("observacao"))}</textarea>
    </div>
    <div class="mt-5">
      <label class="lbl">Componentes a serem desenvolvidos *</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
        ${COMPONENTES.map(([k,l])=>`<label class="flex items-center gap-2 text-[12.5px] card !shadow-none p-2.5 cursor-pointer">
          <input type="checkbox" id="f-comp-${k}" ${p&&p.componentes&&p.componentes[k]?"checked":""} class="accent-orange-600" onchange="atualizarNecessidades()"> ${l}</label>`).join("")}
      </div>
      <div class="text-[11px] mt-1.5" style="color:var(--texto-2)">Somente Pino/Haste: apenas "Programa CNC" fica disponível. Cachimbo/Alojamento, Copo ou Pistão liberam também "Nova fixação".</div>
    </div>
    <div class="mt-5">
      <label class="lbl">Necessidades do desenvolvimento</label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
        ${[["fixacao","Nova fixação"],["programa","Programa CNC"]]
          .map(([k,l])=>`<label class="flex items-center gap-2 text-[12.5px] card !shadow-none p-2.5 cursor-pointer">
            <input type="checkbox" id="f-nec-${k}" ${nec(k)} class="accent-orange-600" onchange="renderRetroCampos()"> ${l}</label>`).join("")}
      </div>
      <div class="text-[11px] mt-1.5" style="color:var(--texto-2)">Com "Nova fixação" marcado, o desenvolvimento segue o fluxo completo (orçamento → compras → fornecedor → programas CNC → validação). Sem, segue o fluxo simplificado (análise → programas CNC → validação).</div>
    </div>
    ${!p && isAdmin()?`<div class="mt-5 card !shadow-none p-4" style="background:#F4F0FB;border-color:#DCD2F0">
      <label class="flex items-center gap-2 text-[13px] font-semibold cursor-pointer" style="color:var(--roxo)">
        <input type="checkbox" id="f-retro" class="accent-purple-600" onchange="toggleRetro()"> Cadastro retroativo (desenvolvimento que já aconteceu)
      </label>
      <div class="text-[11px] mt-1" style="color:var(--texto-2)">Informe as datas reais em que cada etapa aconteceu. Histórico, lead time e indicadores serão calculados com essas datas.</div>
      <div id="retroCampos" class="hidden mt-3"></div>
    </div>`:""}
    <div id="camposHistoricos" class="${p?"":"hidden"}">
      <div class="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wide" style="color:var(--texto-2)">Dados de compras / conclusão ${p?"":"(preenchidos pelo técnico nas etapas)"}</div>
      <div class="grid md:grid-cols-5 gap-4">
        <div><label class="lbl">Data real (conclusão)</label><input id="f-dataReal" type="date" class="inp" value="${v("dataReal")}"></div>
        <div><label class="lbl">Fornecedor</label><input id="f-fornecedor" class="inp" value="${esc(v("fornecedor"))}"></div>
        <div><label class="lbl">Nº Solicitação de Compra</label><input id="f-numSC" class="inp" value="${esc(v("numSC"))}"></div>
        <div><label class="lbl">Nº Ordem de Compra</label><input id="f-numOC" class="inp" value="${esc(v("numOC"))}"></div>
        <div><label class="lbl">Prazo do fornecedor</label><input id="f-prazoFornecedor" type="date" class="inp" value="${v("prazoFornecedor")}"></div>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="salvarCadastro('${id||""}')">${p?"Salvar alterações":"Criar desenvolvimento"}</button>
    </div>
  </div>`;
  modal.onclick = fecharModal;
  atualizarNecessidades();
}
function fecharModal(){ document.getElementById("modalCadastro").className="hidden"; }

// Procura desenvolvimentos cujas referências coincidam com as informadas (possível duplicata)
function possiveisDuplicatas(dados, ignorarId){
  const norm = x => (x||"").trim().toLowerCase();
  const refsNovas = [dados.codigo, dados.refs.alojamento, dados.refs.forjadoAlojamento, dados.refs.pino, dados.refs.forjadoPino]
    .map(norm).filter(Boolean);
  return estado.projetos.filter(p=>{
    if(p.id===ignorarId) return false;
    const r = p.refs||{};
    const refsExist = [p.codigo, r.alojamento, r.forjadoAlojamento, r.pino, r.forjadoPino].map(norm).filter(Boolean);
    return refsNovas.some(x=>refsExist.includes(x));
  });
}

// Regra: só Pino/Haste marcado → apenas "Programa CNC"; Cachimbo/Alojamento, Copo ou Pistão liberam "Nova fixação"
function atualizarNecessidades(){
  const marcado = k => { const e = document.getElementById("f-comp-"+k); return e && e.checked; };
  const liberaFixacao = marcado("cachimboAlojamento") || marcado("copo") || marcado("pistao");
  const fix = document.getElementById("f-nec-fixacao");
  if(!fix) return;
  fix.disabled = !liberaFixacao;
  const lbl = fix.closest("label");
  if(lbl){ lbl.style.opacity = liberaFixacao ? "1" : ".45"; lbl.style.cursor = liberaFixacao ? "pointer" : "not-allowed"; }
  if(!liberaFixacao && fix.checked){ fix.checked = false; renderRetroCampos(); }
}

/* ---- Cadastro retroativo: campos de datas por etapa ---- */
function fluxoModal(){
  const chk = document.getElementById("f-nec-fixacao");
  return chk && chk.checked ? ETAPAS : ETAPAS_SIMPLES;
}
function toggleRetro(){
  const on = document.getElementById("f-retro").checked;
  document.getElementById("retroCampos").classList.toggle("hidden", !on);
  const ch = document.getElementById("camposHistoricos");     // fornecedor/SC/OC/prazo/data real só no retroativo
  if(ch) ch.classList.toggle("hidden", !on);
  renderRetroCampos();
}
function renderRetroCampos(){
  const el = document.getElementById("retroCampos");
  if(!el || el.classList.contains("hidden")) return;
  const flx = fluxoModal();
  const selAnt = document.getElementById("f-retro-etapa");
  const etapaSel = Math.min(selAnt ? +selAnt.value : 0, flx.length-1);
  // preserva o que já foi digitado ao re-renderizar
  const valores = {};
  el.querySelectorAll("[data-retro-i]").forEach(x=>valores[x.dataset.retroI]=x.value);
  const inicioAnt = document.getElementById("f-retro-inicio");
  const inicio = inicioAnt ? inicioAnt.value : "";
  el.innerHTML = `
    <div class="grid md:grid-cols-3 gap-4">
      <div><label class="lbl">Data de início (Recebido) *</label><input id="f-retro-inicio" type="date" class="inp" value="${inicio}"></div>
      <div class="md:col-span-2"><label class="lbl">Etapa em que está hoje *</label><select id="f-retro-etapa" class="inp" onchange="renderRetroCampos()">
        ${flx.map((e,i)=>`<option value="${i}" ${i===etapaSel?"selected":""}>${e}${i===flx.length-1?" (concluído)":""}</option>`).join("")}
      </select></div>
    </div>
    ${etapaSel>0?`<div class="grid md:grid-cols-3 gap-4 mt-3">
      ${flx.slice(1,etapaSel+1).map((e,idx)=>`<div><label class="lbl">Entrou em "${e}" em *</label><input data-retro-i="${idx+1}" type="date" class="inp" value="${valores[idx+1]||""}"></div>`).join("")}
    </div>`:""}`;
}
function salvarCadastro(id){
  const g = k => document.getElementById("f-"+k).value.trim();
  const gc = k => document.getElementById("f-nec-"+k).checked;
  if(!g("codigo")||!g("descricao")){alert("Ref. do produto final e descrição são obrigatórios.");return}
  if(!g("dataPrevista")){alert("Informe a previsão de lançamento (campo obrigatório).");return}
  const comps = {};
  COMPONENTES.forEach(([k])=>{ const e = document.getElementById("f-comp-"+k); comps[k] = !!(e && e.checked); });
  if(!Object.values(comps).some(Boolean)){alert("Selecione ao menos um componente a ser desenvolvido.");return}
  const dados = {codigo:g("codigo"),descricao:g("descricao"),cliente:g("cliente"),familia:g("familia"),componentes:comps,
    refs:{alojamento:g("refAloj"),forjadoAlojamento:g("refForjAloj"),pino:g("refPino"),forjadoPino:g("refForjPino"),npUsinagem:g("npUsinagem")},
    observacao:g("observacao"),tipo:g("tipo"),prioridade:g("prioridade"),
    dataPrevista:g("dataPrevista"),dataReal:g("dataReal"),
    fornecedor:g("fornecedor"),numSC:g("numSC"),numOC:g("numOC"),prazoFornecedor:g("prazoFornecedor"),
    necessita:{fixacao:gc("fixacao"),programa:gc("programa"),ferramenta:false,barra:false,dispositivo:false,inspecao:false}};
  // Alerta de possível duplicata (referências coincidentes com outro desenvolvimento)
  const dups = possiveisDuplicatas(dados, id||null);
  if(dups.length){
    const lista = dups.slice(0,5).map(d=>`• ${d.codigo} — ${statusDe(d)}${d.responsavel?` (resp.: ${d.responsavel})`:""} — cadastrado em ${fmtL(d.dataInicio)}`).join("\n");
    if(!confirm(`⚠ POSSÍVEL DUPLICATA\n\nJá existe desenvolvimento com referência coincidente:\n\n${lista}\n\nDeseja salvar mesmo assim?`)) return;
  }
  // Direcionamento pelo admin (campo só existe para ele)
  const selResp = document.getElementById("f-responsavel");
  if(selResp){
    const atual = id ? estado.projetos.find(x=>x.id===id) : null;
    if(selResp.value){
      const u = estado.usuarios.find(x=>x.uid===selResp.value);
      if(u){
        dados.responsavel = u.nome; dados.responsavelUid = u.uid;
        dados.assumidoEm = (atual && atual.responsavelUid===u.uid) ? atual.assumidoEm : new Date().toISOString();
      }
    }else{
      dados.responsavel = ""; dados.responsavelUid = ""; dados.assumidoEm = "";
    }
  }
  if(id){
    const p = estado.projetos.find(x=>x.id===id);
    const mudouFluxo = p.necessita.fixacao !== dados.necessita.fixacao;
    Object.assign(p,dados);
    if(mudouFluxo){ p.etapaAtual = Math.min(p.etapaAtual,1); p.historico = p.historico.slice(0,p.etapaAtual+1); } // fluxo mudou: recua p/ análise
    salvarProjeto(p);
  } else {
    const maxDev = estado.projetos.reduce((max, proj) => {
      if (proj.devId && proj.devId.startsWith("DEV-")) {
        const num = parseInt(proj.devId.replace("DEV-", ""), 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    dados.devId = "DEV-" + String(maxDev + 1).padStart(3, '0');
    const novoId = db.collection("projetos").doc().id;
    const retro = document.getElementById("f-retro");
    if(retro && retro.checked){
      // Cadastro retroativo: monta o histórico com as datas reais informadas
      const inicio = document.getElementById("f-retro-inicio").value;
      if(!inicio){ alert("Informe a data de início (Recebido)."); return; }
      const flx = dados.necessita.fixacao ? ETAPAS : ETAPAS_SIMPLES;
      const etapaSel = Math.min(+document.getElementById("f-retro-etapa").value, flx.length-1);
      const datas = [];
      let anterior = inicio;
      for(let i=1;i<=etapaSel;i++){
        const inp = document.querySelector(`[data-retro-i="${i}"]`);
        if(!inp || !inp.value){ alert(`Informe a data em que entrou em "${flx[i]}".`); return; }
        // "Desenvolver Programas CNC" é atividade paralela: pode ter data anterior às demais etapas
        const paralela = flx[i]==="Desenvolver Programas CNC";
        if(!paralela && inp.value < anterior){ alert(`A data de "${flx[i]}" não pode ser anterior à da etapa anterior.`); return; }
        datas[i] = inp.value;
        if(!paralela) anterior = inp.value;
      }
      const nome = estado.usuario.nome;
      const hist = [{etapa:flx[0], data:new Date(inicio+"T08:00:00").toISOString(), usuario:nome}];
      for(let i=1;i<=etapaSel;i++) hist.push({etapa:flx[i], data:new Date(datas[i]+"T08:00:00").toISOString(), usuario:nome});
      const p = novoProjeto(Object.assign(dados,{
        id:novoId, dataInicio:inicio, criadoPor:nome, etapaAtual:etapaSel, historico:hist
      }));
      if(etapaSel===flx.length-1 && !p.dataReal) p.dataReal = datas[etapaSel];
      salvarProjeto(p);
    } else {
      const p = novoProjeto(Object.assign(dados,{
        id:novoId,
        dataInicio:new Date().toISOString().slice(0,10),
        criadoPor:estado.usuario.nome,
        etapaAtual:0,
        historico:[{etapa:"Recebido",data:new Date().toISOString(),usuario:estado.usuario.nome}]
      }));
      salvarProjeto(p);
    }
  }
  fecharModal();
}

function abrirModalFO050(id, requiredMode, callback){
  const p = estado.projetos.find(x=>x.id===id);
  if(!p) return;
  if(!p.fo050) p.fo050 = { celulas:[], processos:[] };
  if(p.fo050.maquina && !p.fo050.processos) {
    p.fo050.processos = [{ nome:"Processo Principal", maquina:p.fo050.maquina, tempoUsinagem:p.fo050.tempoUsinagem||"", tempoTroca:p.fo050.tempoTroca||"", dataExecucao:p.fo050.dataExecucao||"", numOP:p.fo050.numOP||"" }];
  }
  if(!p.fo050.processos) p.fo050.processos = [];
  const fo = p.fo050;
  
  let procDraft = JSON.parse(JSON.stringify(fo.processos));
  
  const modal = document.getElementById("modalCadastro");
  modal.className = "overlay";
  
  window.__renderCelulasFO050 = () => {
    if(fo.celulas.length===0) return '<div class="text-[12px] text-gray-500 mb-2">Nenhuma célula adicionada.</div>';
    return fo.celulas.map((c, i) => `
      <div class="flex items-center justify-between p-2 rounded bg-white border border-gray-200 mb-2 shadow-sm">
        <div class="flex items-center gap-2">
          ${i===0 ? `<span class="badge b-verde text-[10px] leading-none">Principal</span>` : `<span class="badge b-cinza text-[10px] leading-none">Alternativa</span>`}
          <span class="text-[13px] font-semibold">${esc(c)}</span>
        </div>
        <button class="text-[11px] text-red-500 hover:text-red-700 font-medium px-2 py-1" onclick="window.__remCelulaFO050(${i})">Remover</button>
      </div>
    `).join("");
  };
  
  window.__remCelulaFO050 = (i) => {
    fo.celulas.splice(i, 1);
    document.getElementById("listaCelulasFO050").innerHTML = window.__renderCelulasFO050();
  };
  
  window.__addCelulaFO050 = () => {
    const v = document.getElementById("novaCelulaFO050").value.trim();
    if(!v) return;
    fo.celulas.push(v);
    document.getElementById("novaCelulaFO050").value = "";
    document.getElementById("listaCelulasFO050").innerHTML = window.__renderCelulasFO050();
    document.getElementById("novaCelulaFO050").focus();
  };

  window.__renderProcessosFO050 = () => {
    if(procDraft.length===0) return '<div class="text-[12px] text-gray-500 mt-2">Nenhum processo adicionado.</div>';
    return procDraft.map((pr, i) => `
      <div class="mb-4 p-4 rounded bg-white border border-gray-200 shadow-sm relative">
        <button class="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1" onclick="window.__remProcessoFO050(${i})" title="Remover processo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
        <div class="grid md:grid-cols-2 gap-4 mb-3 pr-6">
          <div>
            <label class="lbl">Processo ${requiredMode!=='livre'?'*':''}</label>
            <select class="inp proc-nome" data-idx="${i}" onchange="window.__updateProc(${i}, 'nome', this.value)">
              <option value="">Selecione...</option>
              ${LISTA_PROCESSOS.map(opt => `<option value="${opt}" ${pr.nome===opt?'selected':''}>${opt}</option>`).join("")}
              ${pr.nome && !LISTA_PROCESSOS.includes(pr.nome) ? `<option value="${esc(pr.nome)}" selected>${esc(pr.nome)} (Legado)</option>` : ''}
            </select>
          </div>
          <div>
            <label class="lbl">Máquina ${requiredMode!=='livre'?'*':''}</label>
            <input class="inp proc-maq" data-idx="${i}" value="${esc(pr.maquina||"")}" placeholder="Ex: Torno CNC" oninput="window.__updateProc(${i}, 'maquina', this.value)">
          </div>
        </div>
        ${requiredMode !== 'maquina' ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div><label class="lbl">T. Usinagem (s) ${requiredMode==='todos'?'*':''}</label><input type="number" step="0.1" class="inp proc-tu" data-idx="${i}" value="${pr.tempoUsinagem||""}" oninput="window.__updateProc(${i}, 'tempoUsinagem', this.value)"></div>
            <div><label class="lbl">T. Troca (s) ${requiredMode==='todos'?'*':''}</label><input type="number" step="0.1" class="inp proc-tt" data-idx="${i}" value="${pr.tempoTroca||""}" oninput="window.__updateProc(${i}, 'tempoTroca', this.value)"></div>
            <div><label class="lbl">Data exec. ${requiredMode==='todos'?'*':''}</label><input type="date" class="inp proc-dt" data-idx="${i}" value="${pr.dataExecucao||""}" oninput="window.__updateProc(${i}, 'dataExecucao', this.value)"></div>
            <div><label class="lbl">Nº da OP ${requiredMode==='todos'?'*':''}</label><input type="text" class="inp proc-op" data-idx="${i}" value="${esc(pr.numOP||"")}" oninput="window.__updateProc(${i}, 'numOP', this.value)"></div>
          </div>
          <div class="text-right text-[12px] font-bold text-blue-800" id="proc-parcial-${i}">Parcial: ${pr.tempoUsinagem||pr.tempoTroca ? (Number(pr.tempoUsinagem||0)+Number(pr.tempoTroca||0)).toFixed(1) : "0.0"} s</div>
        ` : ''}
      </div>
    `).join("");
  };

  window.__updateProc = (i, field, val) => {
    procDraft[i][field] = val;
    if(field === 'tempoUsinagem' || field === 'tempoTroca') {
      window.__calcTotalGeralFO050();
    }
  };

  window.__addProcessoFO050 = () => {
    procDraft.push({ nome:"", maquina:"", tempoUsinagem:"", tempoTroca:"", dataExecucao:"", numOP:"" });
    document.getElementById("listaProcessosFO050").innerHTML = window.__renderProcessosFO050();
    window.__calcTotalGeralFO050();
  };

  window.__remProcessoFO050 = (i) => {
    if(confirm("Remover este processo?")) {
      procDraft.splice(i, 1);
      document.getElementById("listaProcessosFO050").innerHTML = window.__renderProcessosFO050();
      window.__calcTotalGeralFO050();
    }
  };

  window.__salvarFO050 = () => {
    // Sincroniza valores caso tenham sido alterados via HTML e não tenham acionado o onchange por algum motivo
    document.querySelectorAll('.proc-nome').forEach(el => procDraft[el.dataset.idx].nome = el.value.trim());
    document.querySelectorAll('.proc-maq').forEach(el => procDraft[el.dataset.idx].maquina = el.value.trim());
    if(requiredMode !== 'maquina') {
      document.querySelectorAll('.proc-tu').forEach(el => procDraft[el.dataset.idx].tempoUsinagem = el.value);
      document.querySelectorAll('.proc-tt').forEach(el => procDraft[el.dataset.idx].tempoTroca = el.value);
      document.querySelectorAll('.proc-dt').forEach(el => procDraft[el.dataset.idx].dataExecucao = el.value);
      document.querySelectorAll('.proc-op').forEach(el => procDraft[el.dataset.idx].numOP = el.value.trim());
    }

    if(requiredMode === 'maquina' || requiredMode === 'todos') {
      if(fo.celulas.length === 0) { alert("Informe pelo menos uma célula."); return; }
      if(procDraft.length === 0) { alert("Informe pelo menos um processo."); return; }
      if(procDraft.some(pr => !pr.nome || !pr.maquina)) { alert("Preencha o Processo e a Máquina para todos os itens."); return; }
    }
    
    if(requiredMode === 'todos') {
      if(procDraft.some(pr => !pr.tempoUsinagem || !pr.tempoTroca || !pr.dataExecucao || !pr.numOP)) {
        alert("Preencha todos os campos obrigatórios (Tempos, Data de execução e OP) para todos os processos.");
        return;
      }
    }
    
    fo.processos = procDraft;
    
    // Remove fields from legacy items just in case
    delete fo.maquina; delete fo.tempoUsinagem; delete fo.tempoTroca; delete fo.dataExecucao; delete fo.numOP;
    
    salvarProjeto(p);
    fecharModal();
    if(callback) callback();
    else if(viewAtual==="projeto") renderProjeto();
  };
  
  modal.innerHTML = `<div class="modal p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <h2 class="text-lg font-bold mb-4">Dados FO050</h2>
    
    <div class="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <label class="lbl">Células ${requiredMode!=='livre'?'* ':''}(a primeira adicionada é a principal)</label>
      <div id="listaCelulasFO050" class="mb-2 max-h-32 overflow-y-auto pr-2">${window.__renderCelulasFO050()}</div>
      <div class="flex gap-2">
        <input id="novaCelulaFO050" class="inp" placeholder="Nome da célula" onkeydown="if(event.key==='Enter') window.__addCelulaFO050()">
        <button class="btn btn-suave flex-none" onclick="window.__addCelulaFO050()">+ Adicionar</button>
      </div>
    </div>
    
    <div class="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <label class="lbl !mb-0">Processos e Máquinas ${requiredMode!=='livre'?'*':''}</label>
        <button class="btn btn-suave !py-1 !px-2 text-xs" onclick="window.__addProcessoFO050()">+ Adicionar Processo</button>
      </div>
      <div id="listaProcessosFO050">${window.__renderProcessosFO050()}</div>
    </div>
    
    ${requiredMode !== 'maquina' ? `
      <div class="mb-4 bg-[#E8F1FB] p-3 rounded border border-blue-100 flex items-center justify-between">
        <div class="text-[12px] font-bold text-blue-800 uppercase tracking-wider">Tempo Total Geral (s)</div>
        <div id="fo-total-geral" class="text-xl font-bold text-blue-900">0.0 s</div>
      </div>
    ` : `<div class="text-[12px] text-yellow-800 mb-5 p-3 bg-yellow-50 rounded border border-yellow-200 flex items-start gap-2"><div class="text-yellow-600 font-bold text-lg leading-none">!</div><div>Nesta etapa o sistema exige apenas a Célula e a Máquina. Os demais dados (Tempos, Data e OP) serão solicitados na etapa de <b>Validação/FO050</b>.</div></div>`}
    
    <div class="flex justify-end gap-2">
      <button class="btn btn-suave" onclick="fecharModal()">Cancelar</button>
      <button class="btn btn-primario" onclick="window.__salvarFO050()">Salvar${callback?' e continuar':''}</button>
    </div>
  </div>`;
  
  window.__calcTotalGeralFO050 = () => {
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
  
}

/* ============================================================
   17. VIEW — MOVIMENTAÇÕES (Feed de Atividades)
   ============================================================ */
function renderMovimentacoes(){
  if(!isAdmin()) return;
  try {
    const evts = [];
    
    estado.usuarios.forEach(u => {
    if(u.ultimoAcesso) evts.push({ data: u.ultimoAcesso, tipo: "acesso", usr: u.nome, txt: "acessou o sistema" });
  });
  
  estado.projetos.forEach(p => {
    (p.historico || []).forEach(h => {
      evts.push({ data: h.data, tipo: "etapa", usr: h.usuario, txt: `chegou na etapa "${h.etapa}" no desenvolvimento <b>${p.codigo}</b>`, pid: p.id, etapa: h.etapa });
    });
    (p.comentarios||[]).forEach(c => {
      if(c.texto.startsWith("Assumiu")) {
        evts.push({ data: c.data, tipo: "assumiu", usr: c.usuario, txt: `assumiu o desenvolvimento <b>${p.codigo}</b>`, pid: p.id });
      } else if(c.texto.startsWith("Reabriu")) {
        evts.push({ data: c.data, tipo: "reabriu", usr: c.usuario, txt: `${c.texto} no desenvolvimento <b>${p.codigo}</b>`, pid: p.id });
      } else {
        evts.push({ data: c.data, tipo: "comentario", usr: c.usuario, txt: `comentou no desenvolvimento <b>${p.codigo}</b>: <span style="color:var(--texto-2)">"${c.texto}"</span>`, pid: p.id });
      }
    });
  });
  
  evts.sort((a,b) => (b.data||"").localeCompare(a.data||""));
  
  let filtrados = evts;
  if(estado.movFiltroData) filtrados = filtrados.filter(e => (e.data||"").slice(0,10) === estado.movFiltroData);
  if(estado.movFiltroUsuario) filtrados = filtrados.filter(e => e.usr === estado.movFiltroUsuario);
  if(estado.movFiltroEtapa) filtrados = filtrados.filter(e => e.tipo === "etapa" && e.etapa === estado.movFiltroEtapa);
  
  const usuariosUnicos = [...new Set(evts.map(e => e.usr).filter(Boolean))].sort();
  const icones = { "acesso": "🔑", "etapa": "➡️", "assumiu": "✋", "reabriu": "⏪", "comentario": "💬" };
  
  document.getElementById("view-movimentacoes").innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
      <h1 class="text-xl font-bold surgir">Movimentações e Notificações</h1>
    </div>
    <div class="flex gap-2 flex-wrap mb-4 pb-4 border-b border-gray-100 no-print" style="margin-top:-0.5rem">
      <input type="date" class="inp !w-auto" value="${estado.movFiltroData}" onchange="estado.movFiltroData=this.value;renderTudo()" title="Filtrar por data">
      <select class="inp !w-auto" onchange="estado.movFiltroUsuario=this.value;renderTudo()">
        <option value="">Todos os usuários</option>
        ${usuariosUnicos.map(u => `<option value="${esc(u)}" ${estado.movFiltroUsuario===u?'selected':''}>${esc(u)}</option>`).join("")}
      </select>
      <select class="inp !w-auto" onchange="estado.movFiltroEtapa=this.value;renderTudo()">
        <option value="">Todas as etapas</option>
        ${TODAS_ETAPAS.map(et => `<option value="${et}" ${estado.movFiltroEtapa===et?'selected':''}>Etapa: ${et}</option>`).join("")}
      </select>
      ${(estado.movFiltroData || estado.movFiltroUsuario || estado.movFiltroEtapa) ? `<button class="btn btn-suave !text-vermelho" onclick="estado.movFiltroData='';estado.movFiltroUsuario='';estado.movFiltroEtapa='';renderTudo()" style="color:var(--vermelho)">Limpar</button>` : ''}
    </div>
    <div class="card p-5 surgir">
      <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        ${filtrados.length === 0 ? '<div class="text-[13px] text-center" style="color:var(--texto-2)">Nenhuma movimentação encontrada.</div>' : ''}
        ${filtrados.map(e => `
          <div class="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors ${e.pid ? 'cursor-pointer hover:bg-gray-50' : ''}" ${e.pid ? `onclick="irPara('projeto','${e.pid}')"` : ''}>
            <div class="text-lg w-8 text-center flex-none">${icones[e.tipo]||"•"}</div>
            <div class="flex-1 min-w-0">
              <div class="text-[12.5px]"><b>${esc(e.usr)}</b> ${e.txt}</div>
              <div class="text-[10.5px] mt-0.5" style="color:var(--texto-2)">
                ${new Date(e.data).toLocaleString("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  } catch(e) {
    console.error("Erro no renderMovimentacoes", e);
    document.getElementById("view-movimentacoes").innerHTML = `<div class="p-6 text-red-500 font-bold">ERRO FATAL: ${e.message}<br><pre class="text-xs mt-2">${e.stack}</pre></div>`;
  }
}

/* ============================================================
   18. EXPORTAÇÃO
   ============================================================ */
function exportarExcel(){
  const cab = ["Ref. Produto Final","Descrição","Componentes","Ref. Alojamento","Ref. Forjado Alojamento","Ref. Pino","Ref. Forjado Pino",
    "Cliente","Família","Tipo","Responsável","Prioridade","Status","Etapa atual",
    "Data cadastro","Previsão lançamento","Data real","Dias desde cadastro","Dias na etapa","Lead Time","Prazo restante","Dias em atraso",
    "Fornecedor","Nº SC","Nº OC","Prazo fornecedor","Ferramentas","Observações"];
  const linhas = projetosVisiveis().map(p=>{const r=p.refs||{};return [p.codigo,p.descricao,nomesComponentes(p).join(", "),r.alojamento,r.forjadoAlojamento,r.pino,r.forjadoPino,
    p.cliente,p.familia,p.tipo,p.responsavel||"Sem responsável",p.prioridade,
    statusDe(p),etapaNome(p),fmtL(p.dataInicio),p.dataPrevista?fmtL(p.dataPrevista):"",p.dataReal?fmtL(p.dataReal):"",
    diasDesdeInicio(p),diasNaEtapa(p),leadTime(p),prazoRestante(p),diasAtraso(p),p.fornecedor,p.numSC,p.numOC,
    p.prazoFornecedor?fmtL(p.prazoFornecedor):"",(p.ferramentas||[]).join(", "),p.observacao]});
  const csv = "﻿"+[cab,...linhas].map(l=>l.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download = "desenvolvimentos_"+new Date().toISOString().slice(0,10)+".csv";
  a.click();
}

/* ============================================================
   19. RENDER GERAL
   ============================================================ */
window.toggleChip = function(f) {
  if (f === "Todos") {
    estado.filtrosChip = ["Todos"];
  } else {
    estado.filtrosChip = estado.filtrosChip.filter(x => x !== "Todos");
    if (estado.filtrosChip.includes(f)) {
      estado.filtrosChip = estado.filtrosChip.filter(x => x !== f);
    } else {
      estado.filtrosChip.push(f);
    }
    if (estado.filtrosChip.length === 0) estado.filtrosChip = ["Todos"];
  }
  renderTudo();
};

function renderChips(){
  document.getElementById("chips").innerHTML = FILTROS.map(f=>
    `<span class="chip ${estado.filtrosChip.includes(f)?'ativo':''}" onclick="toggleChip('${f}')">${f}</span>`).join("");
}
function renderTudo(){
  if(!estado.usuario) return;
  renderChips();
  barraFiltros();
  if(viewAtual==="dashboard") renderDashboard();
  if(viewAtual==="kanban")    renderKanban();
  if(viewAtual==="lista")     renderLista();
  if(viewAtual==="gerencial") renderGerencial();
  if(viewAtual==="movimentacoes") renderMovimentacoes();
  if(viewAtual==="usuarios")  renderUsuarios();
  if(viewAtual==="projeto")   renderProjeto();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("modalCadastro");
    if (modal && !modal.classList.contains("hidden")) {
      fecharModal();
    } else if (viewAtual === "projeto") {
      irPara(viewAnterior);
    }
  }
});


