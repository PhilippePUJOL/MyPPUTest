// UI Components: Header & Footer
import { store, actions } from './store.js';

export function renderHeader() {
  const header = document.createElement('header');
  header.innerHTML = `
    <div>
      <span>${store.state.run ? 'Quiz: ' + store.state.quizzes[store.state.run.quizId].name : 'Quiz SPA'}</span>
    </div>
    <div>
      <select id="lang-select">
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </select>
      <label><input type="checkbox" id="auto-correct"> Auto-correction</label>
    </div>
  `;
  setTimeout(() => {
    document.getElementById('lang-select').value = store.state.language;
    document.getElementById('lang-select').onchange = e => {
      actions.toggleLanguage(e.target.value);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
    document.getElementById('auto-correct').checked = store.state.autoCorrection;
    document.getElementById('auto-correct').onchange = e => {
      actions.toggleAutoCorrection(e.target.checked);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
  }, 0);
  return header;
}

export function renderFooter() {
  const footer = document.createElement('footer');
  // Détecte si on est sur une page question ou résultats
  const hash = window.location.hash;
  const isQuestionPage = hash.startsWith('#/quiz/') && /\/q\//.test(hash);
  const isResultsPage = hash.startsWith('#/quiz/') && hash.endsWith('/results');
  if (!store.state.run || (!isQuestionPage && !isResultsPage)) {
    // Accueil : ne pas afficher le bouton Accueil
    let navHtml = '<nav>';
    // Ajoute bouton Continuer si un quiz est en cours et pas sur la page de résultats
    if (store.state.run && !isResultsPage) {
      navHtml += '<button id="continue-btn">Continuer</button>';
    }
    navHtml += '</nav>';
    footer.innerHTML = navHtml;
    setTimeout(() => {
      const btn = document.getElementById('continue-btn');
      if (btn) {
        const run = store.state.run;
        if (run) {
          btn.onclick = () => {
            location.hash = `#/quiz/${run.quizId}/q/${run.currentIndex}`;
          };
        }
      }
    }, 0);
    return footer;
  }
  // Page de question : navigation
  const run = store.state.run;
    if (isQuestionPage) {
      // Détermine si on est à la première ou dernière question
      const isFirst = run.currentIndex === 1;
      const isLast = run.currentIndex === run.totalQuestions;
      footer.innerHTML = `
        <nav>
          <button id="prev-btn"${isFirst ? ' disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Précédent</button>
          <button id="next-btn"${isLast ? ' disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Suivant</button>
          <button id="end-btn">Terminer</button>
          <button onclick="location.hash='/'">Accueil</button>
        </nav>
      `;
      setTimeout(() => {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (!isFirst) prevBtn.onclick = () => { actions.navigatePrev(); };
        if (!isLast) nextBtn.onclick = () => { actions.navigateNext(); };
        document.getElementById('end-btn').onclick = () => {
          if (run) location.hash = `#/quiz/${run.quizId}/results`;
        };
      }, 0);
      return footer;
    }
    // Page de résultats ou autres : uniquement Accueil
    footer.innerHTML = `<nav><button onclick="location.hash='/'">Accueil</button></nav>`;
    return footer;
}
