const CACHE = "car-game-v5";
const FILES = [
  "./"
  "./index.html",
  "./style.css",
  "./script.js",
  "./images/car.png",
  "./images/traffic.png",
  "./images/road.png",
  "./sounds/crash.mp3",
  "./sounds/drive.mp3"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
