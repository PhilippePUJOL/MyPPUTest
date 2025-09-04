// Pages: Home, Question, Results
import { store, actions } from './store.js';

export function renderHomePage() {
  const div = document.createElement('div');
  div.innerHTML = `<h2>Liste des quizz</h2><ul class="quiz-list"></ul>`;
  const ul = div.querySelector('.quiz-list');
  Object.values(store.state.quizzes).forEach(q => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${q.name} (${q.totalQuestions} questions)</span> <button>Démarrer</button>`;
    li.querySelector('button').onclick = () => {
      actions.startQuiz(q.id);
      location.hash = `#/quiz/${q.id}/q/1`;
    };
    ul.appendChild(li);
  });
  return div;
}

export function renderQuestionPage(quizId, index) {
  const run = store.state.run;
  const lang = store.state.language;
  const decodedQuizId = decodeURIComponent(quizId);
  if (!store.state.datasets[decodedQuizId] || !store.state.datasets[decodedQuizId][lang]) {
    return document.createTextNode('Erreur : quiz ou langue non trouvés (' + decodedQuizId + ', ' + lang + ')');
  }
  const quiz = store.state.datasets[decodedQuizId][lang].questionnaire;
  const question = quiz[index - 1];
  if (!question) return document.createTextNode('Question introuvable');
  const qState = run.byQuestionId[question.id] || { verified: false, selections: {}, awardedPoint: 0 };
  const div = document.createElement('div');
  const expanded = store.state.autoCorrection || qState.verified;
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>Question ${index} / ${quiz.length}</span>
      <span class="timer">${getElapsedTime(run)}</span>
    </div>
    <h3>${question.statement}</h3>
    ${question.guidelines ? `<p><em>${question.guidelines}</em></p>` : ''}
    ${(Array.isArray(question.image_ids) ? question.image_ids.map(relPath => `<img src="/QUIZZ/${quizId}/${relPath}" alt="image" style="width:100%;max-width:100%;height:auto;display:block;margin:16px 0;">`).join('') : '')}
    <form class="answers"></form>
    <button id="verify-btn">Vérifier</button>
    <details class="exp-details" ${expanded ? 'open' : ''} style="margin-top:16px;">
      <summary style="font-weight:bold;cursor:pointer;">Explications & Sources</summary>
      <div class="explanation" style="margin:8px 0;"></div>
      <ul class="sources"></ul>
    </details>
  `;
  // Answers (1 par ligne, pas de reload inutile)
  const form = div.querySelector('.answers');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  question.answers.forEach((a, i) => {
    const label = document.createElement('label');
    label.className = 'answer';
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.innerHTML = `<input type="checkbox" ${qState.selections[i] ? 'checked' : ''} ${store.state.autoCorrection || qState.verified ? 'disabled' : ''}> ${a.statement}`;
    if ((store.state.autoCorrection || qState.verified) && a.is_correct) label.classList.add('correct');
    if ((store.state.autoCorrection || qState.verified) && !a.is_correct && qState.selections[i]) label.classList.add('incorrect');
    label.querySelector('input').onchange = () => {
      actions.answerToggle(question.id, i);
      // Ne pas recharger la page, juste mettre à jour la sélection
      label.querySelector('input').checked = !!(run.byQuestionId[question.id]?.selections[i]);
    };
    form.appendChild(label);
  });
  // Verify button
  const verifyBtn = div.querySelector('#verify-btn');
  if (store.state.autoCorrection || qState.verified) {
    verifyBtn.disabled = true;
    verifyBtn.style.opacity = 0.5;
  }
  verifyBtn.onclick = () => {
    actions.verifyQuestion(question.id);
    // Re-render la question sans reload
    const newDiv = renderQuestionPage(quizId, index);
    div.replaceWith(newDiv);
  };
  // Explications et sources dans l'espace rétractable
  const explanationDiv = div.querySelector('.explanation');
  // Markdown to HTML (basic)
  function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    // Headers
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Unordered lists
    html = html.replace(/(^|\n)[\*-] (.*)/g, '$1<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    // Ordered lists
    html = html.replace(/(^|\n)\d+\. (.*)/g, '$1<ol><li>$2</li></ol>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }
  explanationDiv.innerHTML = markdownToHtml(question.explanation || '');
  explanationDiv.style.lineHeight = '1.7';
  explanationDiv.style.marginBottom = '12px';

  const ul = div.querySelector('.sources');
  ul.style.marginTop = '8px';
  ul.style.lineHeight = '1.7';
  question.Source_URL.forEach(url => {
    const li = document.createElement('li');
    li.style.marginBottom = '6px';
    li.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    ul.appendChild(li);
  });
  return div;
}

export function renderResultsPage(quizId) {
  const run = store.state.run;
  const lang = store.state.language;
  const decodedQuizId = decodeURIComponent(quizId);
  if (!store.state.datasets[decodedQuizId] || !store.state.datasets[decodedQuizId][lang]) {
    return document.createTextNode('Erreur : quiz ou langue non trouvés (' + decodedQuizId + ', ' + lang + ')');
  }
  const quiz = store.state.datasets[decodedQuizId][lang].questionnaire;
  actions.stopQuiz();
  const points = Object.values(run.byQuestionId).reduce((sum, q) => sum + (q.awardedPoint || 0), 0);
  const div = document.createElement('div');
  div.innerHTML = `
    <h2>Résultats</h2>
    <p>Score : ${points} / ${quiz.length}</p>
    <p>Taux de réussite : ${Math.round((points / quiz.length) * 100)}%</p>
    <p>Temps total : ${getElapsedTime(run)}</p>
  `;
  return div;
}

function getElapsedTime(run) {
  if (!run || !run.startedAt) return '00:00';
  const end = run.stoppedAt || Date.now();
  const sec = Math.floor((end - run.startedAt) / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
