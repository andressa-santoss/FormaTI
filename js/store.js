const TRACK_KEY='formatiTracks';
const TRAINING_KEY='formatiTrainings';
const seedQuiz=[
{q:"Qual componente é responsável por executar instruções em um computador?",o:["CPU","Monitor","Teclado","Roteador"]},
{q:"Qual protocolo é utilizado para acessar páginas web com segurança?",o:["HTTPS","FTP","SMTP","DHCP"]},
{q:"Qual prática ajuda a proteger uma conta online?",o:["Usar autenticação em dois fatores","Repetir a mesma senha","Compartilhar a senha","Desativar atualizações"]},
{q:"O que representa um endereço IP?",o:["Um identificador de um dispositivo em uma rede","Um tipo de monitor","Um formato de arquivo","Uma linguagem de programação"]},
{q:"Qual atitude reduz riscos de phishing?",o:["Verificar o remetente e o endereço do link","Clicar em qualquer promoção","Informar senha por mensagem","Desativar o antivírus"]}
]; // convenção: a 1ª opção é a correta; o aluno vê as opções embaralhadas
const seedTracks=[{id:'tr1',title:'Fundamentos da Tecnologia',description:'Formação introdutória para desenvolver uma base sólida em tecnologia, internet e segurança digital.',level:'Iniciante',hours:4,image:'',published:true,trainingIds:['t1'],quiz:seedQuiz}];
const seedTrainings=[{id:'t1',title:'Fundamentos da Tecnologia',description:'Conceitos essenciais de informática, internet e segurança digital.',level:'Iniciante',hours:4,image:'',trackId:'tr1',published:true,contents:[{id:'c1',type:'Vídeo',title:'O que é tecnologia?',url:'',duration:'12 min'},{id:'c2',type:'PDF',title:'Guia de fundamentos digitais',url:'',duration:'8 páginas'},{id:'c3',type:'Vídeo',title:'Como funciona a Internet',url:'',duration:'18 min'},{id:'c4',type:'PDF',title:'Internet e redes',url:'',duration:'12 páginas'},{id:'c5',type:'Vídeo',title:'Segurança digital na prática',url:'',duration:'15 min'},{id:'c6',type:'PDF',title:'Checklist de segurança',url:'',duration:'6 páginas'}],files:[]}];
function read(key,seed){try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x)return x;localStorage.setItem(key,JSON.stringify(seed));return seed}catch{localStorage.setItem(key,JSON.stringify(seed));return seed}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function safeUrl(u){u=String(u||'').trim();if(!u)return'';if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u='https://'+u;return /^https?:\/\//i.test(u)?u:''}
function ytId(url){try{const u=new URL(safeUrl(url)),h=u.hostname.replace(/^(www|m)\./,''),ok=s=>/^[\w-]{11}$/.test(s||'')?s:'';if(h==='youtu.be')return ok(u.pathname.split('/')[1]);if(h==='youtube.com'){if(u.pathname==='/watch')return ok(u.searchParams.get('v'));const p=u.pathname.split('/');if(p[1]==='shorts'||p[1]==='embed')return ok(p[2])}}catch{}return''}
