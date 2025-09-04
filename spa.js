// SPA JS Vanilla respecting architecture, guidelines, and using example JSON
import { loadAllDatasetsOnce, store, actions } from './store.js';
import { renderHeader, renderFooter } from './ui.js';
import { renderHomePage, renderQuestionPage, renderResultsPage } from './pages.js';

export function App(root) {
  // Boot: load all datasets
    loadAllDatasetsOnce().then(() => {
      if (store.bootError) {
        root.innerHTML = `<div style="color:red">Erreur de chargement des quizz : ${store.bootError}</div>`;
        return;
      }
      route(window.location.hash || '#/');
  });

  let timerId = null;
  window.addEventListener('hashchange', () => {
      if (!store.loaded) return;
      route(window.location.hash);
  });

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function route(hash) {
    clearTimer();
    const { run } = store.state;
    let page;
    let isQuizPage = false;
    if (hash.startsWith('#/quiz/') && /\/q\//.test(hash)) {
      // #/quiz/:quizId/q/:index
      const match = hash.match(/^#\/quiz\/([^\/]+)\/q\/(\d+)/);
      if (match) {
        const quizId = match[1];
        const index = parseInt(match[2], 10);
        page = renderQuestionPage(quizId, index);
        isQuizPage = true;
      } else {
        page = document.createTextNode('URL de question invalide');
      }
    } else if (hash.startsWith('#/quiz/') && hash.endsWith('/results')) {
      // #/quiz/:quizId/results
      const quizId = hash.replace('#/quiz/', '').replace('/results', '');
      page = renderResultsPage(quizId);
      isQuizPage = true;
    } else {
      // Home
      page = renderHomePage();
    }
    root.innerHTML = '';
    root.appendChild(renderHeader());
    root.appendChild(page);
    root.appendChild(renderFooter());

    // Timer: rafraîchit uniquement le chronomètre chaque seconde
    if (isQuizPage) {
      const timerEl = root.querySelector('.timer');
      timerId = setInterval(() => {
        if (timerEl && store.state.run && store.state.run.startedAt) {
          const end = store.state.run.stoppedAt || Date.now();
          const sec = Math.floor((end - store.state.run.startedAt) / 1000);
          const min = Math.floor(sec / 60);
          const s = sec % 60;
          timerEl.textContent = `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }, 1000);

      // Ajout gestion clavier : flèche droite/gauche
      window.onkeydown = e => {
        if (e.key === 'ArrowRight') {
          actions.navigateNext();
        } else if (e.key === 'ArrowLeft') {
          actions.navigatePrev();
        } else if (e.key === 'Enter') {
          const verifyBtn = root.querySelector('#verify-btn');
          if (verifyBtn && !verifyBtn.disabled) {
            verifyBtn.click();
          }
        }
      };
    } else {
      window.onkeydown = null;
    }
  }
}
