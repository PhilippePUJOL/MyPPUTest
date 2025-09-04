
// Store global & actions
export const store = {
  state: null,
  loaded: false,
  bootError: null,
};

export async function loadAllDatasetsOnce() {
  try {
    const quizzes = {};
    const datasets = {};
  const index = await fetch('QUIZZ/quizz-list.json').then(r => r.json());
    for (const quiz of index.quizzes) {
      quizzes[quiz.id] = {
        id: quiz.id,
        name: quiz.name,
        totalQuestions: 0,
      };
      datasets[quiz.id] = {};
      const toAbs = path => path.startsWith('QUIZZ/') ? path : 'QUIZZ/' + path;
      const [fr, en] = await Promise.all([
        fetch(toAbs(quiz.fr)).then(r => r.json()),
        fetch(toAbs(quiz.en)).then(r => r.json()),
      ]);
      datasets[quiz.id].fr = fr;
      datasets[quiz.id].en = en;
      quizzes[quiz.id].totalQuestions = fr.questionnaire.length;
      // Les images sont maintenant des chemins relatifs dans image_ids
    }
    store.state = {
      language: 'fr',
      autoCorrection: false,
      quizzes,
      datasets,
      images: {}, // plus utilisé
      run: null,
    };
    store.loaded = true;
    store.bootError = null;
  } catch (e) {
    store.bootError = e;
    store.loaded = false;
  }
}

export const actions = {
  toggleLanguage(lang) {
    if (store.state) store.state.language = lang;
  },
  toggleAutoCorrection(val) {
    if (store.state) store.state.autoCorrection = val;
  },
  startQuiz(quizId) {
    const quiz = store.state.quizzes[quizId];
    store.state.run = {
      quizId,
      totalQuestions: quiz.totalQuestions,
      currentIndex: 1,
      startedAt: Date.now(),
      stoppedAt: null,
      byQuestionId: {},
    };
  },
  stopQuiz() {
    if (store.state.run) {
      store.state.run.stoppedAt = Date.now();
    }
  },
  navigatePrev() {
    const run = store.state.run;
    if (run && run.currentIndex > 1) {
      run.currentIndex--;
      location.hash = `#/quiz/${run.quizId}/q/${run.currentIndex}`;
    }
  },
  navigateNext() {
    const run = store.state.run;
    if (run && run.currentIndex < run.totalQuestions) {
      run.currentIndex++;
      location.hash = `#/quiz/${run.quizId}/q/${run.currentIndex}`;
    }
  },
  answerToggle(questionId, answerIdx) {
    const run = store.state.run;
    if (!run) return;
    if (!run.byQuestionId[questionId]) {
      run.byQuestionId[questionId] = { verified: false, selections: {}, awardedPoint: 0 };
    }
    const qState = run.byQuestionId[questionId];
    qState.selections[answerIdx] = !qState.selections[answerIdx];
  },
  verifyQuestion(questionId) {
    const run = store.state.run;
    if (!run) return;
    const lang = store.state.language;
    const quizId = run.quizId;
    const quiz = store.state.datasets[quizId][lang].questionnaire;
    const question = quiz.find(q => q.id === questionId);
    if (!question) return;
    if (!run.byQuestionId[questionId]) {
      run.byQuestionId[questionId] = { verified: false, selections: {}, awardedPoint: 0 };
    }
    const qState = run.byQuestionId[questionId];
    qState.verified = true;
    // Calcul du score
    let correct = true;
    question.answers.forEach((a, i) => {
      if (!!qState.selections[i] !== !!a.is_correct) correct = false;
    });
    qState.awardedPoint = correct ? 1 : 0;
  },
};
