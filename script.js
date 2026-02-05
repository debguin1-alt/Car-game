/* ================= ELEMENTS ================= */
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

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

const NPC_LANES = [9, 50, 91, 132, 173, 214];
const SAFE_DISTANCE = 140;
const HITBOX_PADDING = 20;

const ACCELERATION = 0.6;
const FRICTION = 0.9;
const MAX_STEER_SPEED = 6;

/* ================= LEVEL DEFINITIONS ================= */
const LEVELS = {
  1: { targetScore: 5, speed: 5 },
  2: { time: 30, speed: 5.5 },
  3: { targetScore: 15, speed: 6 },
  4: { targetScore: 20, speed: 7 },
  5: { endless: true, speed: 8 }
};

/* ================= STATE ================= */
let roadY = [0, -GAME_HEIGHT];
let traffic = [];

let carX = 0;
let carVelocity = 0;
let steerDir = 0;

let speed = 5;
let score = 0;
let currentLevel = 1;
let levelTimer = 0;
let running = false;

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

  roadY = [0, -GAME_HEIGHT];

  carX = game.offsetWidth / 2 - car.offsetWidth / 2;
  carVelocity = 0;
  steerDir = 0;

  score = 0;
  levelTimer = 0;
  running = true;

  speed = LEVELS[currentLevel].speed;

  car.style.left = carX + "px";
  scoreEl.textContent = score;
  levelEl.textContent = currentLevel;
  statusText.textContent = "";
  replayBtn.hidden = true;

  driveSound.currentTime = 0;
  driveSound.play().catch(() => {});

  requestAnimationFrame(loop);
}

/* ================= CONTROLS ================= */
function startLeft() { steerDir = -1; }
function startRight() { steerDir = 1; }
function stopSteer() { steerDir = 0; }

document.getElementById("left").addEventListener("touchstart", startLeft);
document.getElementById("right").addEventListener("touchstart", startRight);
document.getElementById("left").addEventListener("touchend", stopSteer);
document.getElementById("right").addEventListener("touchend", stopSteer);

document.getElementById("left").addEventListener("mousedown", startLeft);
document.getElementById("right").addEventListener("mousedown", startRight);
document.addEventListener("mouseup", stopSteer);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") steerDir = -1;
  if (e.key === "ArrowRight") steerDir = 1;
});
document.addEventListener("keyup", stopSteer);

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
  el.style.top = "-140px";
  el.style.left = NPC_LANES[lane] + "px";

  game.appendChild(el);

  traffic.push({
    el,
    lane,
    y: -140,
    speed: speed + 2
  });
}

/* ================= WIN ================= */
function winLevel() {
  running = false;
  driveSound.pause();
  statusText.textContent = "✅ LEVEL COMPLETE!";
  replayBtn.hidden = false;
}

/* ================= GAME OVER ================= */
function gameOver() {
  running = false;
  driveSound.pause();
  crashSound.currentTime = 0;
  crashSound.play().catch(() => {});
  statusText.textContent = "💥 GAME OVER";
  replayBtn.hidden = false;
}

/* ================= MAIN LOOP ================= */
function loop() {
  if (!running) return;

  levelTimer += 1 / 60;
  const lvl = LEVELS[currentLevel];

  if (lvl.time && levelTimer >= lvl.time) winLevel();
  if (lvl.targetScore && score >= lvl.targetScore) winLevel();

  roads.forEach((road, i) => {
    roadY[i] += speed;
    if (roadY[i] >= GAME_HEIGHT) roadY[i] -= GAME_HEIGHT * 2;
    road.style.transform = `translateY(${roadY[i]}px)`;
  });

  carVelocity += steerDir * ACCELERATION;
  carVelocity *= FRICTION;
  carVelocity = Math.max(-MAX_STEER_SPEED, Math.min(MAX_STEER_SPEED, carVelocity));

  carX += carVelocity;
  carX = Math.max(ROAD_PADDING,
         Math.min(game.offsetWidth - car.offsetWidth - ROAD_PADDING, carX));
  car.style.left = carX + "px";

  traffic.forEach((npc, i) => {
    npc.y += npc.speed;
    npc.el.style.top = npc.y + "px";

    if (collide(hitbox(car), hitbox(npc.el))) gameOver();

    if (npc.y > GAME_HEIGHT + 160) {
      npc.el.remove();
      traffic.splice(i, 1);
      score++;
      scoreEl.textContent = score;
    }
  });

  if (Math.random() < 0.035) spawnNPC();
  requestAnimationFrame(loop);
}

/* ================= UI ================= */
document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = parseInt(btn.dataset.level);
    startScreen.classList.remove("active");
    gameScreen.classList.add("active");
    resetGame();
  });
});

replayBtn.addEventListener("click", () => {
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
});

/* ================= SAFETY ================= */
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("gesturestart", e => e.preventDefault());
