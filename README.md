# FormaTI — Plataforma de Formação em Tecnologia

## 1. Visão geral

A FormaTI é uma plataforma de formação em tecnologia composta por uma área pública para alunos e uma área administrativa/CMS para gerenciamento de trilhas, treinamentos e conteúdos.


## 2. Como executar

1. Extraia a pasta.
2. Abra a pasta no VS Code.
3. Abra `index.html` no navegador ou use a extensão Live Server.
4. Faça login usando qualquer e-mail e senha na área pública.

## 3. Acesso administrativo

### Acesso de demonstração

- Usuário: `***`
- Senha: `***`

### Entradas administrativas

- `admin-login.html` — login administrativo.
- `admin.html` — painel administrativo.
- `gestao.html` — redireciona para o painel/login.

## 4. Fluxo do aluno

O fluxo principal da plataforma é:

**Login → Dashboard → Trilhas → Selecionar trilha → Biblioteca → Estudo → (todos os conteúdos concluídos) → Quiz → Resultado → Certificado**

Todo o conteúdo exibido ao aluno vem do CMS.

O conteúdo é armazenado no `localStorage` por meio das estruturas:

- `formatiTracks`
- `formatiTrainings`

Os dados iniciais são definidos em `js/store.js`.

O progresso do aluno é salvo por conteúdo e por trilha.

## 5. Fluxo administrativo

O fluxo administrativo é:

**Login administrativo → Painel → Trilhas → Treinamentos → Conteúdos → Rascunho/Publicação**

O painel administrativo permite gerenciar o conteúdo que será disponibilizado na área pública.

## 6. Gestão de trilhas

No painel administrativo é possível:

- criar e editar trilhas;
- informar nome;
- informar descrição;
- definir nível;
- informar carga horária;
- adicionar imagem;
- associar treinamentos;
- reorganizar treinamentos usando os controles ↑ / ↓;
- publicar ou despublicar trilhas;
- visualizar o status de publicação como `publicado` ou `rascunho`.

## 7. Gestão de treinamentos

No painel administrativo é possível:

- criar e editar treinamentos;
- selecionar a trilha relacionada;
- informar título;
- informar descrição;
- definir nível;
- informar carga horária;
- adicionar imagem;
- cadastrar vídeos;
- cadastrar PDFs;
- cadastrar materiais;
- informar URLs;
- informar duração ou número de páginas;
- registrar documentos complementares;
- publicar ou despublicar;
- pesquisar e filtrar treinamentos.

## 8. Publicação de conteúdo

As trilhas e os treinamentos publicados são lidos pelas páginas públicas a partir do `localStorage` compartilhado do protótipo.

Dessa forma, ao publicar uma trilha ou treinamento no painel administrativo, o conteúdo passa a aparecer na área pública sem necessidade de edição manual do HTML.

## 9. Progresso, quiz e certificado

O navegador armazena no `localStorage`:

- progresso do aluno;
- nome do usuário;
- resultado do quiz;
- certificado.

O progresso é registrado individualmente por conteúdo e por trilha.

## 10. Tecnologias

A plataforma utiliza:

- HTML5
- CSS3
- JavaScript puro

## 11. Estrutura funcional

### Área pública

Responsável pela experiência do aluno:

- Login
- Dashboard
- Trilhas
- Biblioteca
- Conteúdos de estudo
- Quiz
- Resultado
- Certificado

### Área administrativa

Responsável pelo gerenciamento do conteúdo:

- Login administrativo
- Painel
- Gestão de trilhas
- Gestão de treinamentos
- Gestão de conteúdos
- Publicação e despublicação
- Pesquisa e filtros

## 12. Arquivos principais

- `index.html` — entrada da área pública.
- `admin-login.html` — login administrativo.
- `admin.html` — painel administrativo.
- `gestao.html` — redirecionamento para o painel/login.
- `js/store.js` — dados iniciais utilizados pelo protótipo.

## 13. Observações importantes

Este projeto é um **protótipo front-end**.

Atualmente:

- a autenticação está no navegador;
- os dados estão armazenados no navegador;
- os nomes de arquivos estão no navegador;
- o conteúdo utiliza `localStorage`;
- vídeos e PDFs não possuem armazenamento real de produção;
- o controle de permissões ainda não utiliza uma estrutura de servidor.

Para utilização em produção, é necessário implementar:

- autenticação no servidor;
- banco de dados;
- armazenamento real de vídeos e PDFs;
- controle de permissões;
- auditoria.

## 14. Arquitetura atual do conteúdo

O CMS utiliza o `localStorage` compartilhado para conectar a área administrativa à área pública:

**Painel Administrativo**
→ cria/edita trilhas e treinamentos  
→ publica o conteúdo  
→ salva no `localStorage`  
→ **Área Pública** lê o conteúdo publicado  
→ aluno acessa a trilha e os treinamentos  
→ conclui os conteúdos  
→ realiza o quiz  
→ visualiza o resultado  
→ recebe/acessa o certificado
