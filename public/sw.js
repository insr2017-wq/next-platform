self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener vazio: o Chrome exige `fetch` para o PWA ser instalável no Android.
// NÃO interceptar requests — o App Router (RSC, cookies, navegação) quebra se o SW
// fizer respondWith(fetch(...)) em documentos e /_next/.
self.addEventListener("fetch", () => {});
