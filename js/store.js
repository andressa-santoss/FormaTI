   import { db } from "./firebase.js";
   import {
     collection, doc, getDoc, getDocs, setDoc, addDoc,
     updateDoc, deleteDoc, serverTimestamp
   } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
   
   
   export function esc(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])) }
   
   export function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return /^https?:\/\//i.test(u) ? u : '' }
   
   export function ytId(url) { try { const u = new URL(safeUrl(url)), h = u.hostname.replace(/^(www|m)\./, ''), ok = s => /^[\w-]{11}$/.test(s || '') ? s : ''; if (h === 'youtu.be') return ok(u.pathname.split('/')[1]); if (h === 'youtube.com') { if (u.pathname === '/watch') return ok(u.searchParams.get('v')); const p = u.pathname.split('/'); if (p[1] === 'shorts' || p[1] === 'embed') return ok(p[2]) } } catch { } return '' }
   
   
   export const seedQuiz = [
     { q: "Qual componente é responsável por executar instruções em um computador?", o: ["CPU", "Monitor", "Teclado", "Roteador"] },
     { q: "Qual protocolo é utilizado para acessar páginas web com segurança?", o: ["HTTPS", "FTP", "SMTP", "DHCP"] },
     { q: "Qual prática ajuda a proteger uma conta online?", o: ["Usar autenticação em dois fatores", "Repetir a mesma senha", "Compartilhar a senha", "Desativar atualizações"] },
     { q: "O que representa um endereço IP?", o: ["Um identificador de um dispositivo em uma rede", "Um tipo de monitor", "Um formato de arquivo", "Uma linguagem de programação"] },
     { q: "Qual atitude reduz riscos de phishing?", o: ["Verificar o remetente e o endereço do link", "Clicar em qualquer promoção", "Informar senha por mensagem", "Desativar o antivírus"] }
   ]; 
   
   export const seedTracks = [{ id: 'tr1', title: 'Fundamentos da Tecnologia', description: 'Formação introdutória para desenvolver uma base sólida em tecnologia, internet e segurança digital.', level: 'Iniciante', hours: 4, image: '', published: true, trainingIds: ['t1'], quiz: seedQuiz }];
   
   export const seedTrainings = [{ id: 't1', title: 'Fundamentos da Tecnologia', description: 'Conceitos essenciais de informática, internet e segurança digital.', level: 'Iniciante', hours: 4, image: '', trackId: 'tr1', published: true, contents: [{ id: 'c1', type: 'Vídeo', title: 'O que é tecnologia?', url: '', duration: '12 min' }, { id: 'c2', type: 'PDF', title: 'Guia de fundamentos digitais', url: '', duration: '8 páginas' }, { id: 'c3', type: 'Vídeo', title: 'Como funciona a Internet', url: '', duration: '18 min' }, { id: 'c4', type: 'PDF', title: 'Internet e redes', url: '', duration: '12 páginas' }, { id: 'c5', type: 'Vídeo', title: 'Segurança digital na prática', url: '', duration: '15 min' }, { id: 'c6', type: 'PDF', title: 'Checklist de segurança', url: '', duration: '6 páginas' }], files: [] }];
      
   const TRACKS = 'tracks';
   const TRAININGS = 'trainings';
      
   function traduzErro(err) {
     const c = (err && err.code) || '';
     if (c === 'permission-denied') return 'Sem permissão para esta operação no Firestore (verifique as regras de segurança do projeto).';
     if (c === 'unavailable' || c === 'network-request-failed' || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 'Sem conexão com o Firestore. Verifique sua internet e tente novamente.';
     if (c === 'not-found') return 'Registro não encontrado (pode ter sido excluído).';
     if (c === 'invalid-argument') return 'Dados inválidos para salvar no Firestore.';
     if (c === 'unauthenticated') return 'Esta operação exige um usuário autenticado.';
     return (err && err.message) || 'Erro inesperado ao acessar o Firestore.';
   }
   function falha(err) { console.error('[FormaTI/store]', err); throw new Error(traduzErro(err)); }
   
   function limparUndefined(v) {
     if (Array.isArray(v)) return v.map(limparUndefined);
     if (v && typeof v === 'object') { const r = {}; for (const k of Object.keys(v)) if (v[k] !== undefined) r[k] = limparUndefined(v[k]); return r; }
     return v;
   }
      
   const doDoc = s => {
     const v = s.data() || {};
     const ts = x => (x && typeof x.toDate === 'function') ? x.toDate().toISOString() : (x || null);
     return { ...v, id: s.id, createdAt: ts(v.createdAt), updatedAt: ts(v.updatedAt) };
   };
   const ordem = (a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
   
   
   function validarComum(t, rotulo) {
     const erros = [];
     if (!t || typeof t !== 'object') erros.push(rotulo + ' inválida.');
     if (!String((t && t.title) || '').trim()) erros.push('A ' + rotulo.toLowerCase() + ' precisa de um título.');
     const hours = Number((t && t.hours) ?? 0);
     if (!Number.isFinite(hours) || hours < 0) erros.push('Carga horária inválida.');
     if (erros.length) throw new Error(erros.join(' '));
   }
   const validarTrilha = t => validarComum(t, 'Trilha');
   const validarTreinamento = t => validarComum(t, 'Treinamento');
   
   function payloadTrilha(t) {
     validarTrilha(t);
     return limparUndefined({
       title: String(t.title).trim(),
       description: String(t.description || ''),
       level: String(t.level || 'Iniciante'),
       hours: Number(t.hours || 0),
       image: String(t.image || ''),
       published: !!t.published,
       trainingIds: Array.isArray(t.trainingIds) ? t.trainingIds : [],
       quiz: Array.isArray(t.quiz) ? t.quiz : []
     });
   }
   function payloadTreinamento(t) {
     validarTreinamento(t);
     return limparUndefined({
       title: String(t.title).trim(),
       description: String(t.description || ''),
       level: String(t.level || 'Iniciante'),
       hours: Number(t.hours || 0),
       image: String(t.image || ''),
       trackId: String(t.trackId || ''),
       published: !!t.published,
       contents: Array.isArray(t.contents) ? t.contents : [],
       files: Array.isArray(t.files) ? t.files : [],
       quiz: Array.isArray(t.quiz) ? t.quiz : []
     });
   }
   
   let cache = null;
   
   export function catalogo() {
     if (!cache) throw new Error('Catálogo ainda não carregado do Firestore (aguarde carregarCatalogo).');
     return cache;
   }
   
   export async function carregarCatalogo() {
     if (!db) throw new Error('Firebase indisponível: verifique js/firebase.js e sua conexão.');
     try {
       const [tr, tn] = await Promise.all([getDocs(collection(db, TRACKS)), getDocs(collection(db, TRAININGS))]);
       cache = { tracks: tr.docs.map(doDoc).sort(ordem), trainings: tn.docs.map(doDoc).sort(ordem) };
       return cache;
     } catch (err) { cache = null; falha(err); }
   }
      
   export async function listTracks() {
     try { const s = await getDocs(collection(db, TRACKS)); return s.docs.map(doDoc).sort(ordem); } catch (err) { falha(err); }
   }
   
   export async function getTrack(id) {
     if (!id) return null;
     try { const s = await getDoc(doc(db, TRACKS, String(id))); return s.exists() ? doDoc(s) : null; } catch (err) { falha(err); }
   }
   
   export async function createTrack(dados) {
     const payload = payloadTrilha(dados);
     const id = String((dados && dados.id) || '').trim() || 'tr' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
     const ref = doc(db, TRACKS, id);
     try {
       if ((await getDoc(ref)).exists()) throw Object.assign(new Error("Já existe uma trilha com o identificador '" + id + "'."), { code: 'invalid-argument' });
       await setDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
     } catch (err) { falha(err); }
     const criada = await getTrack(id);
     if (cache && criada) cache.tracks = [...cache.tracks.filter(t => t.id !== id), criada].sort(ordem);
     return criada;
   }
   
   export async function updateTrack(id, dados) {
     if (!id) throw new Error('Identificador da trilha ausente.');
     if (dados && dados.title !== undefined && !String(dados.title).trim()) throw new Error('A trilha precisa de um título.');
     try {
       await updateDoc(doc(db, TRACKS, String(id)), { ...limparUndefined(dados || {}), updatedAt: serverTimestamp() });
     } catch (err) { falha(err); }
     const atual = await getTrack(id);
     if (cache && atual) cache.tracks = cache.tracks.map(t => t.id === id ? atual : t);
     return atual;
   }
   
   export async function deleteTrack(id) {
     if (!id) throw new Error('Identificador da trilha ausente.');
     try { await deleteDoc(doc(db, TRACKS, String(id))); }
     catch (err) { if ((err && err.code) !== 'not-found') falha(err); } 
     if (cache) cache.tracks = cache.tracks.filter(t => t.id !== id);
     return true;
   }
   
   
   export async function listTrainings() {
     try { const s = await getDocs(collection(db, TRAININGS)); return s.docs.map(doDoc).sort(ordem); } catch (err) { falha(err); }
   }
   
   export async function getTraining(id) {
     if (!id) return null;
     try { const s = await getDoc(doc(db, TRAININGS, String(id))); return s.exists() ? doDoc(s) : null; } catch (err) { falha(err); }
   }
   
   export async function createTraining(dados) {
     const payload = payloadTreinamento(dados);
     const id = String((dados && dados.id) || '').trim() || 't' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
     const ref = doc(db, TRAININGS, id);
     try {
       if ((await getDoc(ref)).exists()) throw Object.assign(new Error("Já existe um treinamento com o identificador '" + id + "'."), { code: 'invalid-argument' });
       await setDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
     } catch (err) { falha(err); }
     const criado = await getTraining(id);
     if (cache && criado) cache.trainings = [...cache.trainings.filter(t => t.id !== id), criado].sort(ordem);
     return criado;
   }
   
   export async function updateTraining(id, dados) {
     if (!id) throw new Error('Identificador do treinamento ausente.');
     if (dados && dados.title !== undefined && !String(dados.title).trim()) throw new Error('O treinamento precisa de um título.');
     try {
       await updateDoc(doc(db, TRAININGS, String(id)), { ...limparUndefined(dados || {}), updatedAt: serverTimestamp() });
     } catch (err) { falha(err); }
     const atual = await getTraining(id);
     if (cache && atual) cache.trainings = cache.trainings.map(t => t.id === id ? atual : t);
     return atual;
   }
   
   export async function deleteTraining(id) {
     if (!id) throw new Error('Identificador do treinamento ausente.');
     try { await deleteDoc(doc(db, TRAININGS, String(id))); }
     catch (err) { if ((err && err.code) !== 'not-found') falha(err); }
     if (cache) cache.trainings = cache.trainings.filter(t => t.id !== id);
     return true;
   }
   
   export async function salvarTrilha(item) {
     const id = String((item && item.id) || '').trim();
     return (id && await getTrack(id)) ? updateTrack(id, payloadTrilha(item)) : createTrack(item);
   }
   export async function salvarTreinamento(item) {
     const id = String((item && item.id) || '').trim();
     return (id && await getTraining(id)) ? updateTraining(id, payloadTreinamento(item)) : createTraining(item);
   }
   
   export async function migrarDadosIniciais() {
     const trilhasCriadas = [], treinamentosCriados = [];
     for (const t of seedTracks) {
       if (!(await getDoc(doc(db, TRACKS, t.id))).exists()) {
         await setDoc(doc(db, TRACKS, t.id), { ...payloadTrilha(t), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
         trilhasCriadas.push(t.id);
       }
     }
     for (const t of seedTrainings) {
       if (!(await getDoc(doc(db, TRAININGS, t.id))).exists()) {
         await setDoc(doc(db, TRAININGS, t.id), { ...payloadTreinamento(t), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
         treinamentosCriados.push(t.id);
       }
     }
     await carregarCatalogo();
     return { trilhasCriadas, treinamentosCriados };
   }
