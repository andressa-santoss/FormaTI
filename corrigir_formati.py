
from pathlib import Path
import re

app_path = Path("js/app.js")

if not app_path.exists():
    raise FileNotFoundError("Execute este script na pasta principal do FormaTI.")

code = app_path.read_text(encoding="utf-8")

# 1. Importa as funções necessárias do Firestore.
if not code.startswith('import { carregarCatalogo'):
    code = 'import { carregarCatalogo, esc, safeUrl, ytId } from "./store.js";\n\n' + code

# 2. Substitui a leitura antiga do localStorage pelo catálogo do Firestore.
old_data = """const pubTracks = () => read(TRACK_KEY, seedTracks).filter(t => t.published);
const pubTrack = id => pubTracks().find(t => t.id === id);
const trackTrainings = t => { const all = read(TRAINING_KEY, seedTrainings); return (t.trainingIds || []).map(i => all.find(x => x.id === i && x.published)).filter(Boolean) };"""

new_data = """let dadosTracks = [];
let dadosTrainings = [];

const pubTracks = () => dadosTracks.filter(t => t.published === true);
const pubTrack = id => pubTracks().find(t => t.id === id);
const trackTrainings = t => (t.trainingIds || [])
    .map(id => dadosTrainings.find(x => x.id === id && x.published === true))
    .filter(Boolean);"""

if old_data not in code:
    raise RuntimeError("Não encontrei o bloco antigo de leitura. Nenhuma alteração foi salva.")

code = code.replace(old_data, new_data, 1)

# 3. Remove a verificação antiga do login do escopo global.
code = code.replace(
    'if (!qs("loginForm") && !getState().loggedIn) location.replace("index.html");\n',
    ''
)

# 4. Remove o inicializador duplicado da página de conteúdos.
duplicate_pattern = (
    r'document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{\s*'
    r'if \(!qs\("conteudoList"\)\) return;.*?'
    r'\n\}\);\s*(?=\nfunction initConteudo)'
)
code, removed = re.subn(duplicate_pattern, '', code, count=1, flags=re.S)

if removed != 1:
    raise RuntimeError("Não consegui localizar o inicializador duplicado de conteúdos.")

# 5. Substitui a inicialização final por uma versão que aguarda o Firestore.
old_end = 'document.addEventListener("DOMContentLoaded",()=>{initLogin();initDashboard();initTrilhas();initTrilha();initBiblioteca();initEstudo();initQuiz();initResultado();initCertificado();initConteudo()});'

new_end = r'''
// Disponibiliza funções usadas pelos atributos onclick do HTML.
Object.assign(window, { logout, toggleDone, initBiblioteca });

document.addEventListener("DOMContentLoaded", async () => {
    if (!qs("loginForm") && !getState().loggedIn) {
        location.replace("index.html");
        return;
    }

    try {
        const dados = await carregarCatalogo();

        dadosTracks = dados.tracks || [];
        dadosTrainings = dados.trainings || [];

        initLogin();
        initDashboard();
        initTrilhas();
        initTrilha();
        initBiblioteca();
        initEstudo();
        initQuiz();
        initResultado();
        initCertificado();
        initConteudo();
    } catch (erro) {
        console.error("[FormaTI/app] Erro ao carregar catálogo:", erro);

        const mensagem =
            "Não foi possível carregar as trilhas agora. Atualize a página e tente novamente.";

        ["publicTrackList", "dashTracks", "publicTrackContent",
         "publicTrainingList", "conteudoList"].forEach(id => {
            const elemento = qs(id);
            if (elemento) {
                elemento.innerHTML =
                    `<div class="empty-state">${mensagem}</div>`;
            }
        });
    }
});
'''

if old_end not in code:
    raise RuntimeError("Não encontrei a inicialização final antiga.")

code = code.replace(old_end, new_end, 1)
app_path.write_text(code, encoding="utf-8")

# 6. Atualiza as páginas HTML que ainda carregam app.js como script comum.
alteradas = []

for html in Path(".").glob("*.html"):
    original = html.read_text(encoding="utf-8")
    atualizado = original

    atualizado = re.sub(
        r'\s*<script\s+src=["\']js/store\.js["\']\s*></script>',
        '',
        atualizado
    )

    atualizado = re.sub(
        r'<script\s+src=["\']js/app\.js["\']\s*></script>',
        '<script type="module" src="js/app.js"></script>',
        atualizado
    )

    if atualizado != original:
        html.write_text(atualizado, encoding="utf-8")
        alteradas.append(html.name)

print("Migração concluída.")
print("Arquivo atualizado: js/app.js")
print("Páginas HTML ajustadas:", ", ".join(alteradas) or "nenhuma")
print("Revise as alterações antes de fazer o commit.")
