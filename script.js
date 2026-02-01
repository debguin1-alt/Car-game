/* ================= ELEMENTS ================= */
const game = document.getElementById("game");
const roads = document.querySelectorAll(".road");
const car = document.getElementById("car");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const statusText = document.getElementById("status");
const replayBtn = document.getElementById("replay");

const crashSound = document.getElementById("crashSound");
const driveSound = document.getElementById("driveSound");

/* ================= CONSTANTS ================= */
const GAME_HEIGHT = 520;
const ROAD_PADDING = 10;

const NPC_LANES = [9,50,91, 132, 173,214];
const SAFE_DISTANCE = 140;
const HITBOX_PADDING = 20;

/* Player steering */
const ACCELERATION = 0.6;
const FRICTION = 0.9;
const MAX_STEER_SPEED = 6;

/* Road scrolling */
const BASE_ROAD_SPEED = 5;

/* ================= STATE ================= */
let roadY = [0, -GAME_HEIGHT];
let traffic = [];

let carX = 0;
let carVelocity = 0;
let steerDir = 0;

let speed = BASE_ROAD_SPEED;
let score = 0;
let level = 1;
let running = true;

/* ================= HITBOX ================= */
function hitbox(el) {
  const r = el.getBoundingClientRect();
  return {
    left: r.left + HITBOX_PADDING,
    right: r.right - HITBOX_PADDING,
    top: r.top + HITBOX_PADDING,
    bottom: r.bottom - HITBOX_PADDING
  };
}

function collide(a, b) {
  return !(
    a.bottom < b.top ||
    a.top > b.bottom ||
    a.right < b.left ||
    a.left > b.right
  );
}

/* ================= RESET ================= */
function resetGame() {
  traffic.forEach(t => t.el.remove());
  traffic = [];

  roadY[0] = 0;
  roadY[1] = -GAME_HEIGHT;

  roads[0].style.transform = "translateY(0px)";
  roads[1].style.transform = "translateY(-" + GAME_HEIGHT + "px)";

  carX = game.offsetWidth / 2 - car.offsetWidth / 2;
  carVelocity = 0;
  steerDir = 0;

  score = 0;
  level = 1;
  speed = BASE_ROAD_SPEED;
  running = true;

  car.style.left = carX + "px";

  scoreEl.textContent = score;
  levelEl.textContent = level;
  statusText.textContent = "";
  replayBtn.hidden = true;

  driveSound.currentTime = 0;
  driveSound.play().catch(() => {});

  requestAnimationFrame(loop);
}

/* ================= CONTROLS (SMOOTH) ================= */
function startLeft() { steerDir = -1; }
function startRight() { steerDir = 1; }
function stopSteer() { steerDir = 0; }

// Touch
document.getElementById("left")?.addEventListener("touchstart", startLeft);
document.getElementById("right")?.addEventListener("touchstart", startRight);
document.getElementById("left")?.addEventListener("touchend", stopSteer);
document.getElementById("right")?.addEventListener("touchend", stopSteer);

// Mouse
document.getElementById("left")?.addEventListener("mousedown", startLeft);
document.getElementById("right")?.addEventListener("mousedown", startRight);
document.addEventListener("mouseup", stopSteer);

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") steerDir = -1;
  if (e.key === "ArrowRight") steerDir = 1;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") stopSteer();
});

/* ================= NPC HELPERS ================= */
function laneFree(lane, y) {
  return !traffic.some(t =>
    t.lane === lane && Math.abs(t.y - y) < SAFE_DISTANCE
  );
}

/* ================= SPAWN NPC ================= */
function spawnNPC() {
  const lane = Math.floor(Math.random() * NPC_LANES.length);
  if (!laneFree(lane, -140)) return;

  const el = document.createElement("img");
  el.src = "images/traffic.png";
  el.className = "traffic";
  el.style.position = "absolute";
  el.style.top = "-140px";
  el.style.left = NPC_LANES[lane] + "px";

  game.appendChild(el);

  traffic.push({
    el,
    lane,
    y: -140,
    speed: speed - 1
  });
}

/* ================= MAIN LOOP ================= */
function loop() {
  if (!running) return;

  /* ---- ROAD SCROLL (FIXED) ---- */
  roads.forEach((road, i) => {
    roadY[i] += speed;

    // Seamless loop - when road goes off bottom, move it back to top
    if (roadY[i] >= GAME_HEIGHT) {
      roadY[i] -= GAME_HEIGHT * 2;
    }

    road.style.transform = `translateY(${roadY[i]}px)`;
  });

  /* ---- PLAYER SMOOTH STEERING ---- */
  carVelocity += steerDir * ACCELERATION;
  carVelocity *= FRICTION;
  carVelocity = Math.max(-MAX_STEER_SPEED, Math.min(MAX_STEER_SPEED, carVelocity));

  carX += carVelocity;

  const minX = ROAD_PADDING;
  const maxX = game.offsetWidth - car.offsetWidth - ROAD_PADDING;
  carX = Math.max(minX, Math.min(maxX, carX));

  car.style.left = carX + "px";

  /* ---- NPC UPDATE (NO LANE JUMPING) ---- */
  traffic.forEach((npc, i) => {
    // NPCs now stay in their lane and maintain constant speed
    npc.y += npc.speed+3;
    npc.el.style.top = npc.y + "px";

    // Check collision
    if (collide(hitbox(car), hitbox(npc.el))) {
      running = false;
      driveSound.pause();
      crashSound.currentTime = 0;
      crashSound.play().catch(() => {});
      statusText.textContent = "💥 GAME OVER";
      replayBtn.hidden = false;
    }

    // Remove NPC when off screen and update score
    if (npc.y > GAME_HEIGHT + 160) {
      npc.el.remove();
      traffic.splice(i, 1);

      score++;
      scoreEl.textContent = score;

      // Level up every 10 cars
      if (score % 10 === 0) {
        level++;
        speed += 0.6;
        levelEl.textContent = level;
      }
    }
  });

  // Spawn new NPCs randomly
  if (Math.random() < 0.035) spawnNPC();

  requestAnimationFrame(loop);
}

/* ================= REPLAY ================= */
replayBtn?.addEventListener("click", resetGame);

/* ================= START ================= */
resetGame();
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);
