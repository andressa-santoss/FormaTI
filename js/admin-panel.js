
import {
  esc,
  safeUrl,
  carregarCatalogo,
  catalogo,
  createTrack,
  updateTrack,
  deleteTrack as excluirTrilhaFirestore,
  createTraining,
  updateTraining,
  deleteTraining as excluirTreinamentoFirestore,
} from "./store.js";

// ============================================================
// CATÁLOGO E ESTADO
// ============================================================

function tracks() {
  return catalogo().tracks;
}

function trainings() {
  return catalogo().trainings;
}

let editorTrackIds = [];
let editorContents = [];
let editorFiles = [];
let editorQuiz = [];

// Referências explícitas aos elementos do HTML.
// Evita depender de IDs expostos implicitamente como variáveis globais.
const $ = (id) => document.getElementById(id);

const el = {
  statTracks: $("statTracks"),
  statTrainings: $("statTrainings"),
  statPublished: $("statPublished"),
  statDrafts: $("statDrafts"),
  overviewTracks: $("overviewTracks"),
  overviewTrainings: $("overviewTrainings"),

  trackSearch: $("trackSearch"),
  trackFilter: $("trackFilter"),
  trackList: $("trackList"),
  trainingSearch: $("trainingSearch"),
  trainingFilter: $("trainingFilter"),
  trainingList: $("trainingList"),
  materialList: $("materialList"),

  adminName: $("adminName"),
  adminRole: $("adminRole"),
  welcomeAdmin: $("welcomeAdmin"),

  trackOverlay: $("trackOverlay"),
  trackEditorTitle: $("trackEditorTitle"),
  trackForm: $("trackForm"),
  trackId: $("trackId"),
  trackTitle: $("trackTitle"),
  trackDescription: $("trackDescription"),
  trackLevel: $("trackLevel"),
  trackHours: $("trackHours"),
  trackImage: $("trackImage"),
  trackPublished: $("trackPublished"),
  trackPublishText: $("trackPublishText"),
  trackTrainingOrder: $("trackTrainingOrder"),

  trainingOverlay: $("trainingOverlay"),
  trainingEditorTitle: $("trainingEditorTitle"),
  trainingForm: $("trainingForm"),
  trainingId: $("trainingId"),
  trainingTitle: $("trainingTitle"),
  trainingDescription: $("trainingDescription"),
  trainingLevel: $("trainingLevel"),
  trainingHours: $("trainingHours"),
  trainingImage: $("trainingImage"),
  trainingPublished: $("trainingPublished"),
  trainingPublishText: $("trainingPublishText"),
  trainingTrack: $("trainingTrack"),
  trainingContentEditor: $("trainingContentEditor"),
  trainingQuizEditor: $("trainingQuizEditor"),
  trainingFileList: $("trainingFileList"),
  trainingFiles: $("trainingFiles"),
};

function sessionAdmin() {
  try {
    return JSON.parse(
      localStorage.getItem("formatiAdminSession") || "null"
    );
  } catch {
    return null;
  }
}

function requiredElement(name) {
  if (!el[name]) {
    throw new Error(
      `Elemento "${name}" não encontrado no HTML do painel.`
    );
  }
  return el[name];
}

function escapeAttribute(value) {
  return esc(value);
}

function getTrack(id) {
  return tracks().find((item) => item.id === id);
}

function getTraining(id) {
  return trainings().find((item) => item.id === id);
}

function normalizeTrack(item) {
  return {
    ...item,
    title: String(item.title || "").trim(),
    description: String(item.description || "").trim(),
    level: item.level || "Iniciante",
    hours: Number(item.hours || 0),
    image: String(item.image || "").trim(),
    published: Boolean(item.published),
    trainingIds: [...new Set(item.trainingIds || [])],
    quiz: item.quiz || [],
  };
}

function normalizeTraining(item) {
  return {
    ...item,
    title: String(item.title || "").trim(),
    description: String(item.description || "").trim(),
    level: item.level || "Iniciante",
    hours: Number(item.hours || 0),
    image: String(item.image || "").trim(),
    trackId: item.trackId || "",
    published: Boolean(item.published),
    contents: (item.contents || []).map((content) => ({
      ...content,
      url: safeUrl(content.url),
    })),
    files: item.files || [],
    quiz: item.quiz || [],
  };
}

function refreshAll() {
  renderTracks();
  renderTrainings();
  renderMaterials();
  refreshOverview();
}

function showSection(section) {
  document.querySelectorAll(".admin-section").forEach((node) => {
    node.classList.toggle(
      "active",
      node.id === "section-" + section
    );
  });

  document.querySelectorAll(".side-link").forEach((node) => {
    node.classList.toggle(
      "active",
      node.dataset.section === section
    );
  });

  if (section === "tracks") renderTracks();
  if (section === "trainings") renderTrainings();
  if (section === "materials") renderMaterials();
}

// ============================================================
// VISÃO GERAL
// ============================================================

function refreshOverview() {
  const tr = tracks();
  const tn = trainings();

  if (el.statTracks) el.statTracks.textContent = tr.length;
  if (el.statTrainings) el.statTrainings.textContent = tn.length;
  if (el.statPublished) {
    el.statPublished.textContent = tn.filter((x) => x.published).length;
  }
  if (el.statDrafts) {
    el.statDrafts.textContent = tn.filter((x) => !x.published).length;
  }

  if (el.overviewTracks) {
    el.overviewTracks.innerHTML =
      tr.slice(0, 4).map((x) =>
        miniRow(
          x.title,
          x.published ? "PUBLICADA" : "RASCUNHO",
          (x.trainingIds || []).length + " treinamentos"
        )
      ).join("") ||
      '<div class="empty-state small">Nenhuma trilha cadastrada.</div>';
  }

  if (el.overviewTrainings) {
    el.overviewTrainings.innerHTML =
      tn.slice(0, 4).map((x) =>
        miniRow(
          x.title,
          x.published ? "PUBLICADO" : "RASCUNHO",
          (x.contents || []).length + " conteúdos"
        )
      ).join("") ||
      '<div class="empty-state small">Nenhum treinamento cadastrado.</div>';
  }
}

function miniRow(title, status, meta) {
  return `<div class="mini-row">
    <div>
      <strong>${esc(title)}</strong>
      <span>${esc(meta)}</span>
    </div>
    <span class="status ${
      status.includes("PUBLIC") ? "published" : "draft"
    }">${status}</span>
  </div>`;
}

// ============================================================
// LISTA DE TRILHAS
// ============================================================

function renderTracks() {
  if (!el.trackList) return;

  const all = tracks();
  const q = (el.trackSearch?.value || "").toLowerCase();
  const f = el.trackFilter?.value || "all";

  const data = all
    .filter((x) =>
      `${x.title || ""} ${x.description || ""}`.toLowerCase().includes(q)
    )
    .filter((x) =>
      f === "all" ||
      (f === "published" ? x.published : !x.published)
    );

  el.trackList.innerHTML = data.length
    ? data.map((t) => {
        const count = (t.trainingIds || []).length;

        return `<article class="admin-row">
          <div class="row-avatar">◈</div>
          <div class="row-content">
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.description || "Sem descrição cadastrada.")}</p>
            <div class="training-tags">
              <span class="tag">${esc(t.level || "Iniciante")}</span>
              <span class="tag">${Number(t.hours) || 0}h</span>
              <span class="tag">${count} treinamentos</span>
              <span class="status ${t.published ? "published" : "draft"}">
                ${t.published ? "PUBLICADA" : "RASCUNHO"}
              </span>
            </div>
          </div>
          <div class="row-actions">
            <button class="icon-btn" onclick="openTrackEditor('${t.id}')">Editar</button>
            <button class="icon-btn" onclick="toggleTrack('${t.id}')">
              ${t.published ? "Despublicar" : "Publicar"}
            </button>
            <button class="icon-btn" style="color:#dc2626"
              onclick="deleteTrack('${t.id}')">Excluir</button>
          </div>
        </article>`;
      }).join("")
    : '<div class="empty-state">Nenhuma trilha encontrada.</div>';
}

// ============================================================
// LISTA DE TREINAMENTOS
// ============================================================

function renderTrainings() {
  if (!el.trainingList) return;

  const all = trainings();
  const q = (el.trainingSearch?.value || "").toLowerCase();
  const f = el.trainingFilter?.value || "all";

  const data = all
    .filter((x) =>
      `${x.title || ""} ${x.description || ""}`.toLowerCase().includes(q)
    )
    .filter((x) =>
      f === "all" ||
      (f === "published" ? x.published : !x.published)
    );

  el.trainingList.innerHTML = data.length
    ? data.map((t) => {
        const track = tracks().find((x) => x.id === t.trackId);

        return `<article class="admin-row">
          <div class="row-avatar">⌘</div>
          <div class="row-content">
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.description || "Sem descrição cadastrada.")}</p>
            <div class="training-tags">
              <span class="tag">${esc(track?.title || "Sem trilha")}</span>
              <span class="tag">${(t.contents || []).length} conteúdos</span>
              <span class="status ${t.published ? "published" : "draft"}">
                ${t.published ? "PUBLICADO" : "RASCUNHO"}
              </span>
            </div>
          </div>
          <div class="row-actions">
            <button class="icon-btn" onclick="openTrainingEditor('${t.id}')">Editar</button>
            <button class="icon-btn" onclick="toggleTraining('${t.id}')">
              ${t.published ? "Despublicar" : "Publicar"}
            </button>
            <button class="icon-btn" style="color:#dc2626"
              onclick="deleteTraining('${t.id}')">Excluir</button>
          </div>
        </article>`;
      }).join("")
    : '<div class="empty-state">Nenhum treinamento encontrado.</div>';
}

// ============================================================
// MATERIAIS
// ============================================================

function renderMaterials() {
  if (!el.materialList) return;

  const list = [];

  trainings().forEach((t) => {
    (t.contents || []).forEach((c) => {
      list.push({ ...c, training: t.title });
    });
  });

  el.materialList.innerHTML = list.length
    ? list.map((c) => `
        <article class="material-card">
          <div class="material-icon">${
            c.type === "Vídeo" ? "▶" : c.type === "PDF" ? "PDF" : "▤"
          }</div>
          <div>
            <span class="tag">${esc(c.type || "Material")}</span>
            <h3>${esc(c.title || "Sem título")}</h3>
            <p>${esc(c.training)}</p>
            ${
              c.url
                ? `<a href="${escapeAttribute(c.url)}" target="_blank" rel="noopener noreferrer">Abrir recurso ↗</a>`
                : "<small>Recurso ainda não informado</small>"
            }
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">Nenhum conteúdo cadastrado.</div>';
}

// ============================================================
// EDITOR DE TRILHAS
// ============================================================

function openTrackEditor(id = "") {
  const t = id
    ? getTrack(id)
    : {
        id: "",
        title: "",
        description: "",
        level: "Iniciante",
        hours: 10,
        image: "",
        published: false,
        trainingIds: [],
        quiz: [],
      };

  if (!t) {
    alert("Não foi possível encontrar essa trilha.");
    return;
  }

  el.trackEditorTitle.textContent = id ? "Editar trilha" : "Nova trilha";
  el.trackId.value = t.id || "";
  el.trackTitle.value = t.title || "";
  el.trackDescription.value = t.description || "";
  el.trackLevel.value = t.level || "Iniciante";
  el.trackHours.value = t.hours ?? 10;
  el.trackImage.value = t.image || "";
  el.trackPublished.checked = Boolean(t.published);

  renderTrackTrainingOrder(t.trainingIds || []);
  updateTrackPublishText();
  el.trackOverlay.classList.add("open");
}

function closeTrackEditor() {
  el.trackOverlay?.classList.remove("open");
}

function renderTrackTrainingOrder(ids) {
  editorTrackIds = [...ids];

  if (!el.trackTrainingOrder) return;

  const all = trainings();

  el.trackTrainingOrder.innerHTML = editorTrackIds.length
    ? editorTrackIds.map((id, i) => {
        const t = all.find((x) => x.id === id);
        if (!t) return "";

        return `<div class="order-row" data-id="${id}">
          <span class="order-number">${i + 1}</span>
          <div>
            <strong>${esc(t.title)}</strong>
            <small>${t.published ? "Publicado" : "Rascunho"}</small>
          </div>
          <div class="order-actions">
            <button type="button" onclick="moveTrackTraining(${i},-1)">↑</button>
            <button type="button" onclick="moveTrackTraining(${i},1)">↓</button>
            <button type="button" onclick="removeFromTrack(${i})">×</button>
          </div>
        </div>`;
      }).join("")
    : '<div class="empty-state small">Nenhum treinamento associado ainda.</div>';
}

function moveTrackTraining(i, d) {
  const n = i + d;
  if (n < 0 || n >= editorTrackIds.length) return;

  [editorTrackIds[i], editorTrackIds[n]] =
    [editorTrackIds[n], editorTrackIds[i]];

  renderTrackTrainingOrder(editorTrackIds);
}

function removeFromTrack(i) {
  editorTrackIds.splice(i, 1);
  renderTrackTrainingOrder(editorTrackIds);
}

function updateTrackPublishText() {
  if (!el.trackPublishText || !el.trackPublished) return;

  el.trackPublishText.textContent = el.trackPublished.checked
    ? "A trilha será publicada e ficará disponível para os alunos."
    : "Esta trilha ficará salva como rascunho e não aparecerá para os alunos.";
}

async function toggleTrack(id) {
  const t = getTrack(id);
  if (!t) return;

  try {
    await updateTrack(id, {
      ...t,
      published: !t.published,
    });

    await carregarCatalogo();
    refreshAll();
  } catch (error) {
    console.error(error);
    alert("Não foi possível alterar a publicação da trilha.\n\n" + error.message);
  }
}

async function deleteTrack(id) {
  const t = getTrack(id);
  if (!t) return;

  const linked = trainings().filter(
    (x) => x.trackId === id || (t.trainingIds || []).includes(x.id)
  );

  const ok = confirm(
    `Excluir a trilha "${t.title}"?` +
      (linked.length
        ? `\n\nOs ${linked.length} treinamento(s) vinculados NÃO serão excluídos; ficarão sem trilha.`
        : "") +
      "\n\nEsta ação não pode ser desfeita."
  );

  if (!ok) return;

  try {
    // Primeiro remove o vínculo nos treinamentos.
    for (const training of linked) {
      if (training.trackId === id) {
        await updateTraining(training.id, { trackId: "" });
      }
    }

    await excluirTrilhaFirestore(id);
    await carregarCatalogo();
    refreshAll();
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir a trilha.\n\n" + error.message);
  }
}

// ============================================================
// EDITOR DE TREINAMENTOS
// ============================================================

function openTrainingEditor(id = "", trackId = "") {
  const t = id
    ? getTraining(id)
    : {
        id: "",
        title: "",
        description: "",
        level: "Iniciante",
        hours: 1,
        image: "",
        trackId: trackId || tracks()[0]?.id || "",
        published: false,
        contents: [],
        files: [],
        quiz: [],
      };

  if (!t) {
    alert("Não foi possível encontrar esse treinamento.");
    return;
  }

  el.trainingEditorTitle.textContent = id
    ? "Editar treinamento"
    : "Novo treinamento";

  el.trainingId.value = t.id || "";
  el.trainingTitle.value = t.title || "";
  el.trainingDescription.value = t.description || "";
  el.trainingLevel.value = t.level || "Iniciante";
  el.trainingHours.value = t.hours ?? 1;
  el.trainingImage.value = t.image || "";
  el.trainingPublished.checked = Boolean(t.published);

  populateTrackSelect(t.trackId || "");

  editorContents = JSON.parse(JSON.stringify(t.contents || []));
  editorFiles = [...(t.files || [])];
  editorQuiz = JSON.parse(JSON.stringify(t.quiz || []));

  // Mantém compatibilidade com os onchange/onclick existentes no HTML gerado.
  window.editorContents = editorContents;
  window.editorFiles = editorFiles;
  window.editorQuiz = editorQuiz;

  renderTrainingContents();
  renderQuizEditor();
  renderTrainingFiles();
  updateTrainingPublishText();

  el.trainingOverlay.classList.add("open");
}

function closeTrainingEditor() {
  el.trainingOverlay?.classList.remove("open");
}

function populateTrackSelect(selected = "") {
  if (!el.trainingTrack) return;

  el.trainingTrack.innerHTML =
    '<option value="">Sem trilha</option>' +
    tracks().map((t) => `
      <option value="${t.id}" ${t.id === selected ? "selected" : ""}>
        ${esc(t.title)}
      </option>
    `).join("");

  el.trainingTrack.value = selected || "";
}

function addTrainingContent() {
  editorContents.push({
    id: "c" + Date.now() + Math.random().toString(16).slice(2),
    type: "Vídeo",
    title: "Novo conteúdo",
    url: "",
    duration: "",
  });

  window.editorContents = editorContents;
  renderTrainingContents();
  renderQuizEditor();
}

function renderTrainingContents() {
  if (!el.trainingContentEditor) return;

  el.trainingContentEditor.innerHTML = editorContents.length
    ? editorContents.map((c, i) => `
        <div class="content-editor">
          <div class="content-index">${i + 1}</div>
          <div class="content-fields">
            <div class="form-grid">
              <select onchange="editorContents[${i}].type=this.value">
                <option ${c.type === "Vídeo" ? "selected" : ""}>Vídeo</option>
                <option ${c.type === "PDF" ? "selected" : ""}>PDF</option>
                <option ${c.type === "Material" ? "selected" : ""}>Material</option>
              </select>
              <input value="${escapeAttribute(c.title || "")}"
                placeholder="Título"
                onchange="editorContents[${i}].title=this.value">
            </div>
            <div class="form-grid">
              <input value="${escapeAttribute(c.url || "")}"
                placeholder="URL do vídeo, PDF ou material"
                onchange="editorContents[${i}].url=this.value">
              <input value="${escapeAttribute(c.duration || "")}"
                placeholder="Duração / páginas"
                onchange="editorContents[${i}].duration=this.value">
            </div>
          </div>
          <button type="button" class="icon-btn danger"
            onclick="removeTrainingContent(${i})">×</button>
        </div>
      `).join("")
    : '<div class="empty-state small">Nenhum conteúdo. Clique em “Adicionar conteúdo”.</div>';
}

function removeTrainingContent(i) {
  const content = editorContents[i];
  if (!content) return;

  editorContents.splice(i, 1);

  editorQuiz.forEach((q) => {
    if (q.src === content.id) q.src = "";
  });

  window.editorContents = editorContents;
  window.editorQuiz = editorQuiz;

  renderTrainingContents();
  renderQuizEditor();
}

function addQuizQuestion() {
  editorQuiz.push({ q: "", o: ["", "", "", ""], src: "" });
  window.editorQuiz = editorQuiz;
  renderQuizEditor();
}

function removeQuizQuestion(i) {
  editorQuiz.splice(i, 1);
  window.editorQuiz = editorQuiz;
  renderQuizEditor();
}

function renderQuizEditor() {
  if (!el.trainingQuizEditor) return;

  el.trainingQuizEditor.innerHTML = editorQuiz.length
    ? editorQuiz.map((q, i) => `
        <div class="content-editor">
          <div class="content-index">${i + 1}</div>
          <div class="content-fields">
            <input value="${escapeAttribute(q.q || "")}"
              placeholder="Pergunta"
              onchange="editorQuiz[${i}].q=this.value">

            <select onchange="editorQuiz[${i}].src=this.value">
              <option value="">Baseada em: material geral</option>
              ${editorContents.map((c) => `
                <option value="${escapeAttribute(c.id)}"
                  ${c.id === q.src ? "selected" : ""}>
                  ${esc(c.type)} — ${esc(c.title)}
                </option>
              `).join("")}
            </select>

            ${(q.o || ["", "", "", ""]).map((o, j) => `
              <input value="${escapeAttribute(o)}"
                placeholder="${j ? "Alternativa incorreta" : "Resposta correta"}"
                onchange="editorQuiz[${i}].o[${j}]=this.value">
            `).join("")}
          </div>
          <button type="button" class="icon-btn danger"
            onclick="removeQuizQuestion(${i})">×</button>
        </div>
      `).join("")
    : '<div class="empty-state small">Nenhuma pergunta. Clique em “Adicionar pergunta”.</div>';
}

function renderTrainingFiles() {
  if (!el.trainingFileList) return;

  el.trainingFileList.innerHTML = editorFiles
    .map((f) => `<div class="file-item">📎 ${esc(f)}</div>`)
    .join("");
}

function updateTrainingPublishText() {
  if (!el.trainingPublishText || !el.trainingPublished) return;

  el.trainingPublishText.textContent = el.trainingPublished.checked
    ? "O treinamento será publicado e ficará disponível na trilha selecionada."
    : "Este treinamento ficará salvo como rascunho.";
}

async function toggleTraining(id) {
  const t = getTraining(id);
  if (!t) return;

  try {
    await updateTraining(id, {
      ...t,
      published: !t.published,
    });

    await carregarCatalogo();
    refreshAll();
  } catch (error) {
    console.error(error);
    alert("Não foi possível alterar a publicação do treinamento.\n\n" + error.message);
  }
}

async function deleteTraining(id) {
  const t = getTraining(id);
  if (!t) return;

  if (!confirm(
    `Excluir o treinamento "${t.title}"?\n\nSeus ${
      (t.contents || []).length
    } conteúdo(s) e ${(t.quiz || []).length} pergunta(s) do quiz também serão removidos. Esta ação não pode ser desfeita.`
  )) return;

  try {
    // Exclui o treinamento e remove suas referências nas trilhas.
    await excluirTreinamentoFirestore(id);

    for (const track of tracks()) {
      const ids = (track.trainingIds || []).filter((x) => x !== id);

      if (ids.length !== (track.trainingIds || []).length) {
        await updateTrack(track.id, { trainingIds: ids });
      }
    }

    await carregarCatalogo();
    refreshAll();
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir o treinamento.\n\n" + error.message);
  }
}

// ============================================================
// SALVAMENTO DE TRILHAS NO FIRESTORE
// ============================================================

async function handleTrackSubmit(event) {
  event.preventDefault();

  const id = el.trackId.value || "tr" + Date.now();

  const previous = getTrack(el.trackId.value);
  const item = normalizeTrack({
    id,
    title: el.trackTitle.value,
    description: el.trackDescription.value,
    level: el.trackLevel.value,
    hours: el.trackHours.value,
    image: el.trackImage.value,
    published: el.trackPublished.checked,
    trainingIds: [...editorTrackIds],
    quiz: previous?.quiz || [],
  });

  if (!item.title) {
    alert("Informe o título da trilha.");
    return;
  }

  try {
    const existing = getTrack(id);

    if (existing) {
      const { id: ignoredId, ...data } = item;
      await updateTrack(id, data);
    } else {
      await createTrack(item);
    }

    // Atualiza os treinamentos vinculados a essa trilha.
    for (const training of trainings()) {
      const shouldLink = item.trainingIds.includes(training.id);
      const currentlyLinked = training.trackId === id;

      if (shouldLink && !currentlyLinked) {
        await updateTraining(training.id, { trackId: id });
      } else if (!shouldLink && currentlyLinked) {
        await updateTraining(training.id, { trackId: "" });
      }
    }

    // Se o treinamento foi movido de outra trilha, remove o vínculo antigo.
    for (const track of tracks()) {
      if (track.id === id) continue;

      const newIds = (track.trainingIds || []).filter(
        (trainingId) => !item.trainingIds.includes(trainingId)
      );

      if (newIds.length !== (track.trainingIds || []).length) {
        await updateTrack(track.id, { trainingIds: newIds });
      }
    }

    await carregarCatalogo();
    closeTrackEditor();
    refreshAll();
    populateTrackSelect(id);
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar a trilha.\n\n" + error.message);
  }
}

// ============================================================
// SALVAMENTO DE TREINAMENTOS NO FIRESTORE
// ============================================================

async function handleTrainingSubmit(event) {
  event.preventDefault();

  const id = el.trainingId.value || "t" + Date.now();

  const quiz = editorQuiz
    .filter((q) =>
      q.q.trim() &&
      Array.isArray(q.o) &&
      q.o.length === 4 &&
      q.o.every((o) => String(o).trim())
    )
    .map((q) => ({
      ...q,
      q: q.q.trim(),
      o: q.o.map((o) => String(o).trim()),
    }));

  if (quiz.length < editorQuiz.length) {
    alert(
      "Perguntas incompletas (sem enunciado ou com alternativas vazias) foram descartadas."
    );
  }

  const previous = getTraining(el.trainingId.value);

  const item = normalizeTraining({
    id,
    title: el.trainingTitle.value,
    description: el.trainingDescription.value,
    level: el.trainingLevel.value,
    hours: el.trainingHours.value,
    image: el.trainingImage.value,
    trackId: el.trainingTrack.value,
    published: el.trainingPublished.checked,
    contents: editorContents,
    quiz,
    files: [
      ...new Set([
        ...editorFiles,
        ...[...(el.trainingFiles?.files || [])].map((file) => file.name),
      ]),
    ],
  });

  if (!item.title) {
    alert("Informe o título do treinamento.");
    return;
  }

  try {
    const existing = getTraining(id);

    if (existing) {
      const { id: ignoredId, ...data } = item;
      await updateTraining(id, data);
    } else {
      await createTraining(item);
    }

    // Remove o treinamento de outras trilhas e inclui na selecionada.
    for (const track of tracks()) {
      let ids = (track.trainingIds || []).filter((x) => x !== id);

      if (track.id === item.trackId && !ids.includes(id)) {
        ids.push(id);
      }

      const oldIds = track.trainingIds || [];

      if (
        ids.length !== oldIds.length ||
        ids.some((value, index) => value !== oldIds[index])
      ) {
        await updateTrack(track.id, { trainingIds: ids });
      }
    }

    // Caso a trilha selecionada não exista, o treinamento fica sem vínculo.
    if (item.trackId && !getTrack(item.trackId)) {
      console.warn("A trilha selecionada não foi encontrada.");
    }

    await carregarCatalogo();
    closeTrainingEditor();
    refreshAll();
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar o treinamento.\n\n" + error.message);
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.body.classList.contains("admin-shell")) return;

  try {
    // O login deve ser validado pelo admin-auth.js.
    // O catálogo só é carregado depois que esta tela é inicializada.
    await carregarCatalogo();

    const s = sessionAdmin();

    if (el.adminName) {
      el.adminName.textContent = s?.name || "Administrador";
    }
    if (el.adminRole) {
      el.adminRole.textContent = s?.role || "Administrador";
    }
    if (el.welcomeAdmin) {
      el.welcomeAdmin.textContent =
        (s?.name || "Administrador").split(" ")[0];
    }

    refreshAll();

    document.querySelectorAll(".side-link").forEach((button) => {
      button.addEventListener("click", () => {
        showSection(button.dataset.section);
      });
    });

    el.trackForm?.addEventListener("submit", handleTrackSubmit);
    el.trainingForm?.addEventListener("submit", handleTrainingSubmit);

    el.trackSearch?.addEventListener("input", renderTracks);
    el.trackFilter?.addEventListener("change", renderTracks);
    el.trainingSearch?.addEventListener("input", renderTrainings);
    el.trainingFilter?.addEventListener("change", renderTrainings);

    el.trackPublished?.addEventListener("change", updateTrackPublishText);
    el.trainingPublished?.addEventListener("change", updateTrainingPublishText);

    el.trainingFiles?.addEventListener("change", () => {
      editorFiles = [
        ...editorFiles,
        ...[...(el.trainingFiles.files || [])].map((file) => file.name),
      ];

      editorFiles = [...new Set(editorFiles)];
      window.editorFiles = editorFiles;
      renderTrainingFiles();
    });
  } catch (error) {
    console.error("[FormaTI/admin]", error);

    alert(
      "Não foi possível carregar o painel. Verifique sua conexão, o login e as regras do Firestore.\n\n" +
      error.message
    );
  }
});

// ============================================================
// FUNÇÕES UTILIZADAS PELOS onclick DO HTML
// ============================================================

Object.assign(window, {
  showSection,
  openTrackEditor,
  closeTrackEditor,
  moveTrackTraining,
  removeFromTrack,
  toggleTrack,
  deleteTrack,
  openTrainingEditor,
  closeTrainingEditor,
  addTrainingContent,
  removeTrainingContent,
  addQuizQuestion,
  removeQuizQuestion,
  toggleTraining,
  deleteTraining,
});
