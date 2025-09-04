const CACHE_NAME = 'SSG-SAP-Certif-Learning-cache-v1';

// Liste des fichiers à mettre en cache (à adapter dynamiquement si besoin)
const FILES_TO_CACHE = [
    // Ajoutez ici les chemins relatifs de tous les fichiers du dossier src et QUIZZ
    // Exemple :
    'index.html',
    'data.js',
    'main.js',
    'manifest.json',
    'pages.js',
    'spa.js',
    'store.js',
    'style.css',
    'ui.js',
  'images/icons/app-icon-192x192.png',
  'images/icons/app-icon-512x512.png',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/quizz-en.json',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/quizz-fr.json',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00001.bmp',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00002.bmp',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00003.bmp',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00004.bmp',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00005.bmp',
    'QUIZZ/SAP BTP - P_BTPA - 08_2024/images/img_00006.bmp',
    'QUIZZ/SAP BTP - test 3Q/quizz-en.json',
    'QUIZZ/SAP BTP - test 3Q/quizz-fr.json',
    'QUIZZ/SAP BTP - test 3Q/images/img_00001.bmp'
    // Ajoutez tous les autres fichiers et sous-dossiers nécessaires
];

// Installation du service worker et mise en cache des fichiers
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activation du service worker et nettoyage des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Interception des requêtes : stratégie "Cache First"
self.addEventListener('fetch', event => {
  event.respondWith(
    // On cherche d'abord dans le cache
    caches.match(event.request)
      .then(cachedResponse => {
        // Si on trouve dans le cache, on le retourne
        if (cachedResponse) {
          return cachedResponse;
        }

        // Sinon, on essaie de récupérer via le réseau
        return fetch(event.request).catch(() => {
          // SI LA REQUÊTE RÉSEAU ÉCHOUE (on est hors ligne)
          // On retourne la page index.html en dernier recours
          // Utile pour que le rechargement de n'importe quelle page de l'app fonctionne
          return caches.match('/index.html');
        });
      })
  );
});