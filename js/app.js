const KEY="formatiState";
const defState={userName:"Aluno",loggedIn:false,done:[],scores:{},certs:{}};
const getState=()=>{try{return{...defState,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return{...defState}}};
const saveState=s=>localStorage.setItem(KEY,JSON.stringify(s));
const qs=id=>document.getElementById(id),param=k=>new URLSearchParams(location.search).get(k);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
// Sair encerra só a sessão: progresso, notas e certificados são preservados.
function logout(){const s=getState();s.loggedIn=false;saveState(s);location.href="index.html"}
if(!qs("loginForm")&&!getState().loggedIn)location.replace("index.html");

const pubTracks=()=>read(TRACK_KEY,seedTracks).filter(t=>t.published);
const pubTrack=id=>pubTracks().find(t=>t.id===id);
const trackTrainings=t=>{const all=read(TRAINING_KEY,seedTrainings);return(t.trainingIds||[]).map(i=>all.find(x=>x.id===i&&x.published)).filter(Boolean)};
const trackContents=t=>trackTrainings(t).flatMap(x=>x.contents||[]);
function prog(t){const ids=trackContents(t).map(c=>c.id),d=ids.filter(i=>getState().done.includes(i)).length;return{done:d,total:ids.length,pct:ids.length?Math.round(d/ids.length*100):0}}
const quizOf=t=>{const q=trackTrainings(t).flatMap(x=>x.quiz||[]),all=q.length?q:(t.quiz||[]);return all.length?all:null};
const canQuiz=t=>{const p=prog(t);return p.total>0&&p.pct===100};
const eligible=t=>canQuiz(t)&&(quizOf(t)?(getState().scores[t.id]??0)>=70:true);
function toggleDone(id){const s=getState();s.done=s.done.includes(id)?s.done.filter(x=>x!==id):[...s.done,id];saveState(s)}
const notFound=(m)=>`<div class="empty-state">${m} <a href="trilhas.html">Ver trilhas</a></div>`;

function initLogin(){const f=qs("loginForm");if(!f)return;f.addEventListener("submit",e=>{e.preventDefault();const s=getState();s.userName=qs("email").value.split("@")[0]||"Aluno";s.loggedIn=true;saveState(s);location.href="dashboard.html"})}

function initDashboard(){const box=qs("dashTracks");if(!box)return;const s=getState(),ts=pubTracks(),ps=ts.map(prog);
qs("userName").textContent=cap(s.userName);
qs("statProgress").textContent=(ps.length?Math.round(ps.reduce((a,p)=>a+p.pct,0)/ps.length):0)+"%";
qs("statAvailable").textContent=ts.length;qs("statCompleted").textContent=ts.filter(eligible).length;qs("statCertificates").textContent=ts.filter(t=>s.certs[t.id]).length;
box.innerHTML=ts.map((t,i)=>`<article class="course-card featured"><div class="course-icon">⌘</div><div class="course-info"><span class="tag">${esc(t.level)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><div class="progress-row"><span>Progresso</span><span>${ps[i].pct}%</span></div><div class="progress"><i style="width:${ps[i].pct}%"></i></div></div><a class="btn secondary" href="biblioteca.html?track=${encodeURIComponent(t.id)}">${ps[i].done?"Continuar":"Começar"}</a></article>`).join("")||'<div class="empty-state">Nenhuma trilha publicada no momento.</div>'}

function initTrilhas(){const b=qs("publicTrackList");if(!b)return;
b.innerHTML=pubTracks().map(t=>`<article class="course-card"><div class="course-icon purple">◈</div><span class="tag">${esc(t.level)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><ul class="meta"><li>${trackTrainings(t).length} treinamentos</li><li>${t.hours||0}h</li></ul><a class="btn primary full" href="trilha.html?id=${encodeURIComponent(t.id)}">Selecionar trilha</a></article>`).join("")||'<div class="empty-state">Nenhuma trilha publicada no momento.</div>'}

function initTrilha(){const b=qs("publicTrackContent");if(!b)return;const t=pubTrack(param("id"));if(!t){b.innerHTML=notFound("Trilha não encontrada ou não publicada.");return}
const l=trackTrainings(t),p=prog(t),id=encodeURIComponent(t.id);
b.innerHTML=`<section class="detail-hero"><div><span class="tag">TRILHA • ${esc(t.level)}</span><h1>${esc(t.title)}</h1><p>${esc(t.description)}</p><div class="detail-meta"><span>${l.length} treinamentos</span><span>${p.total} conteúdos</span><span>${t.hours||0}h estimadas</span></div></div><a class="btn primary" href="biblioteca.html?track=${id}">${p.done?"Continuar trilha":"Iniciar trilha"}</a></section><section class="content-two"><div><h2>Treinamentos desta trilha</h2><div class="public-training-list">${l.map((x,i)=>`<a class="public-training-row" href="biblioteca.html?track=${id}"><span>${i+1}</span><div><strong>${esc(x.title)}</strong><small>${(x.contents||[]).length} conteúdos</small></div><b>→</b></a>`).join("")||'<p class="muted">Nenhum treinamento publicado nesta trilha.</p>'}</div></div><div class="side-panel"><strong>Como concluir</strong><p>Conclua todos os conteúdos${quizOf(t)?" e seja aprovado na avaliação final (mínimo de 70%)":""}.</p><strong>Certificado</strong><p>Liberado automaticamente ao cumprir os critérios.</p></div></section>`}

function initBiblioteca(){const b=qs("publicTrainingList");if(!b)return;const t=pubTrack(param("track")),cta=qs("quizCta");
if(!t){b.innerHTML=notFound("Trilha não encontrada ou não publicada.");cta.style.display="none";return}
const s=getState(),id=encodeURIComponent(t.id);qs("libTitle").textContent=t.title;
b.innerHTML=trackTrainings(t).map((x,i)=>{const cs=x.contents||[],d=cs.filter(c=>s.done.includes(c.id)).length;return`<article class="module"><div class="module-head"><h3>${i+1}. ${esc(x.title)}</h3><span>${d}/${cs.length}</span></div><div class="lessons">${cs.map(c=>{const ok=s.done.includes(c.id);return`<div class="lesson ${ok?"done":""}"><div class="lesson-type">${c.type==="PDF"?"PDF":c.type==="Vídeo"?"▶":"▤"}</div><div class="lesson-info"><strong>${esc(c.title)}</strong><span>${esc(c.duration||"Material complementar")}</span></div><a class="btn secondary" href="estudo.html?track=${id}&training=${encodeURIComponent(x.id)}&content=${encodeURIComponent(c.id)}">Estudar</a><button class="check" title="Marcar como concluído" onclick="toggleDone('${c.id}');initBiblioteca()">${ok?"✓":""}</button></div>`}).join("")}</div></article>`}).join("")||'<div class="empty-state">Nenhum treinamento publicado nesta trilha.</div>';
const p=prog(t),ready=canQuiz(t),hasQuiz=!!quizOf(t),a=cta.querySelector("a");
qs("libraryPercent").textContent=p.pct+"%";qs("libraryBar").style.width=p.pct+"%";
a.textContent=hasQuiz?"Iniciar quiz":"Emitir certificado";a.href=(hasQuiz?"quiz.html":"certificado.html")+"?track="+id;
cta.style.opacity=ready?1:.55;a.style.pointerEvents=ready?"auto":"none";
cta.querySelector("p").textContent=ready?(hasQuiz?"Tudo concluído! Você já pode fazer a avaliação final.":"Tudo concluído! Você já pode emitir o certificado."):"Conclua todos os conteúdos para liberar "+(hasQuiz?"o quiz.":"o certificado.")}

function initEstudo(){const b=qs("publicStudyContent");if(!b)return;const t=pubTrack(param("track")),x=t&&trackTrainings(t).find(y=>y.id===param("training")),c=x&&(x.contents||[]).find(y=>y.id===param("content"));
if(!c){b.innerHTML=notFound("Conteúdo não encontrado.");return}
const back="biblioteca.html?track="+encodeURIComponent(t.id);qs("backLink").href=back;
const done=getState().done.includes(c.id),yt=c.type==="Vídeo"?ytId(c.url):"",url=safeUrl(c.url);let media;
if(yt)media=`<div class="youtube-player"><iframe src="https://www.youtube.com/embed/${yt}?rel=0" title="${esc(c.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
else if(c.type==="PDF"&&url){const src=url.replace(/(drive\.google\.com\/file\/d\/[\w-]+)\/(view|edit).*$/,"$1/preview");media=`<div class="pdf-viewer"><iframe src="${esc(src)}" title="${esc(c.title)}" allowfullscreen></iframe></div><p class="muted" style="margin-top:10px">Se o PDF não carregar aqui, use “Abrir recurso”: alguns sites bloqueiam a visualização incorporada.</p>`}
else media=c.type==="Vídeo"?'<div class="video-placeholder">▶</div>':`<div class="pdf-placeholder">${c.type==="PDF"?"Visualização do PDF":"Material complementar"}</div>`;
b.innerHTML=`<div class="study-card"><span class="tag">${esc(c.type)}</span><h1>${esc(c.title)}</h1><p class="muted">${esc(x.title)}</p>${media}${c.type==="Vídeo"&&c.url&&!yt?'<div class="video-error">Este vídeo não possui uma URL válida do YouTube cadastrada.</div>':""}<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;flex-wrap:wrap"><span class="muted">${esc(c.duration||"")}</span>${url&&!yt?`<a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">Abrir recurso ↗</a>`:""}<button class="btn primary" onclick="toggleDone('${c.id}');location.href='${back}'">${done?"Concluído ✓ (desmarcar)":"Marcar como concluído"}</button></div></div>`}

const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function initQuiz(){const form=qs("quizForm");if(!form)return;const t=pubTrack(param("track"));if(!t){location.replace("trilhas.html");return}
const Q=quizOf(t),id=encodeURIComponent(t.id);if(!Q||!canQuiz(t)){location.replace("biblioteca.html?track="+id);return}
qs("quizTitle").textContent="Quiz — "+t.title;let current=0;const titles=Object.fromEntries(trackContents(t).map(c=>[c.id,c.title]));
/* Posição da resposta correta sorteada em "rodadas": só repete uma posição depois de usar todas */
let bag=[];const pos=n=>{if(!bag.length)bag=shuffle([0,1,2,3]);return Math.min(bag.pop(),n-1)};
const order=q=>{const w=shuffle(q.o.map((o,j)=>({o,j})).slice(1));w.splice(pos(q.o.length),0,{o:q.o[0],j:0});return w};
form.innerHTML=Q.map((q,i)=>`<div class="question ${i===0?"active":""}"><p class="eyebrow">QUESTÃO ${i+1} DE ${Q.length}</p><h2>${esc(q.q)}</h2>${q.src&&titles[q.src]?`<p class="muted">Baseada em: ${esc(titles[q.src])}</p>`:""}<div class="options">${order(q).map(({o,j})=>`<label class="option"><input type="radio" name="q${i}" value="${j}" required> <span>${esc(o)}</span></label>`).join("")}</div><div class="quiz-nav">${i?'<button type="button" class="btn secondary prev">Anterior</button>':"<span></span>"}${i<Q.length-1?'<button type="button" class="btn primary next">Próxima</button>':'<button type="submit" class="btn primary">Finalizar quiz</button>'}</div></div>`).join("");
const qsA=[...form.querySelectorAll(".question")];
function show(n){qsA.forEach((q,i)=>q.classList.toggle("active",i===n));qs("questionCount").textContent=`Questão ${n+1} de ${Q.length}`;qs("quizBar").style.width=((n+1)/Q.length*100)+"%"}
form.addEventListener("click",e=>{if(e.target.classList.contains("next")){if(!qsA[current].querySelector("input:checked"))return alert("Selecione uma resposta.");show(++current)}if(e.target.classList.contains("prev"))show(--current)});
form.addEventListener("submit",e=>{e.preventDefault();if(!qsA[current].querySelector("input:checked"))return alert("Selecione uma resposta.");
let score=0;Q.forEach((q,i)=>{const a=form.querySelector(`input[name="q${i}"]:checked`);if(a&&Number(a.value)===0)score++});
const s=getState();s.scores[t.id]=Math.round(score/Q.length*100);saveState(s);location.href="resultado.html?track="+id});show(0)}

function initResultado(){if(!qs("resultTitle"))return;const t=pubTrack(param("track")),sc=t?getState().scores[t.id]:null;if(sc==null){location.replace("trilhas.html");return}
const ok=sc>=70,id=encodeURIComponent(t.id);qs("scoreValue").textContent=sc+"%";qs("resultTitle").textContent=ok?"Parabéns!":"Quase lá!";
qs("resultText").textContent=ok?"Você foi aprovado e já pode emitir seu certificado de conclusão.":"Você precisa de pelo menos 70% para concluir a trilha. Revise os materiais e tente novamente.";
qs("resultIcon").textContent=ok?"✓":"!";qs("resultAction").textContent=ok?"Emitir certificado":"Refazer quiz";qs("resultAction").href=(ok?"certificado.html":"quiz.html")+"?track="+id}

function initCertificado(){const c=qs("certificate");if(!c)return;const s=getState(),t=pubTrack(param("track"))||pubTracks().find(x=>s.certs[x.id]);
const acts=document.querySelector(".certificate-actions");
if(!t||!eligible(t)){c.innerHTML='<div class="cert-brand">FormaTI</div><h2>Certificado indisponível</h2><p>Conclua todos os conteúdos e a avaliação final de uma trilha para emitir seu certificado.</p>';acts.innerHTML='<a class="btn primary" href="trilhas.html">Ir para as trilhas</a>';return}
if(!s.certs[t.id]){s.certs[t.id]={date:new Date().toISOString(),code:"FORM-"+new Date().getFullYear()+"-"+Math.random().toString(36).slice(2,8).toUpperCase()};saveState(s)}
const cert=s.certs[t.id];qs("certificateName").textContent=cap(s.userName);qs("certTrack").textContent=t.title;qs("certHours").textContent=(t.hours||0)+" horas";
qs("certificateDate").textContent=new Date(cert.date).toLocaleDateString("pt-BR");qs("certCode").textContent=cert.code}

document.addEventListener("DOMContentLoaded",()=>{initLogin();initDashboard();initTrilhas();initTrilha();initBiblioteca();initEstudo();initQuiz();initResultado();initCertificado()});
