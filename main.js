import { App } from './spa.js';

// Boot the SPA
App(document.getElementById('app'));


// Enregistrement du service worker si le navigateur le supporte
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker enregistré avec succès:', registration);
      })
      .catch(error => {
        console.error('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}