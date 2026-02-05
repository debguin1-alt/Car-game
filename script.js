window.onload = () => {

/* ===== ELEMENTS ===== */
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const game = document.getElementById("game");
const roads = document.querySelectorAll(".road");
const car = document.getElementById("car");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const statusText = document.getElementById("status");
const replayBtn = document.getElementById("replay");

const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");

const crashSound = document.getElementById("crashSound");
const driveSound = document.getElementById("driveSound");

/* ===== CONSTANTS ===== */
const GAME_HEIGHT = 520;
const NPC_LANES = [9, 50, 91, 132, 173, 214];
const HITBOX_PADDING = 20;

const ACCEL = 0.6;
const FRICTION = 0.85;
const MAX_SPEED = 6;

/* ===== LEVELS ===== */
const LEVELS = {
  1: { targetScore: 25, speed: 5 },
  2: { time: 30, speed: 5.5 },
  3: { targetScore: 35, speed: 6 },
  4: { targetScore: 50, speed: 7 },
  5: { endless: true, speed: 8 }
};

/* ===== STATE ===== */
let roadY = [0, -GAME_HEIGHT];
let traffic = [];

let carX = 120;
let carVel = 0;
let steer = 0;

let speed = 5;
let score = 0;
let levelTimer = 0;
let currentLevel = 1;
let running = false;

/* ===== HITBOX ===== */
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
  return !(a.bottom < b.top || a.top > b.bottom || a.right < b.left || a.left > b.right);
}

/* ===== RESET ===== */
function resetGame() {
  traffic.forEach(t => t.el.remove());
  traffic = [];

  roadY = [0, -GAME_HEIGHT];
  carX = game.offsetWidth / 2 - car.offsetWidth / 2;
  carVel = 0;
  steer = 0;

  score = 0;
  levelTimer = 0;
  running = true;
  speed = LEVELS[currentLevel].speed;

  scoreEl.textContent = score;
  levelEl.textContent = currentLevel;
  statusText.textContent = "";
  replayBtn.hidden = true;

  car.style.left = carX + "px";
  driveSound.currentTime = 0;
  driveSound.play().catch(() => {});

  requestAnimationFrame(loop);
}

/* ==================================================
   ✅ BUTTON CONTROLS (THIS IS THE FIX)
   ================================================== */

/* LEFT BUTTON */
leftBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  steer = -1;
});
leftBtn.addEventListener("touchend", () => steer = 0);
leftBtn.addEventListener("mousedown", () => steer = -1);
leftBtn.addEventListener("mouseup", () => steer = 0);

/* RIGHT BUTTON */
rightBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  steer = 1;
});
rightBtn.addEventListener("touchend", () => steer = 0);
rightBtn.addEventListener("mousedown", () => steer = 1);
rightBtn.addEventListener("mouseup", () => steer = 0);

/* ===== NPC ===== */
function spawnNPC() {
  const lane = Math.floor(Math.random() * NPC_LANES.length);
  const el = document.createElement("img");
  el.src = "images/traffic.png";
  el.className = "traffic";
  el.style.left = NPC_LANES[lane] + "px";
  el.style.top = "-140px";
  game.appendChild(el);

  traffic.push({ el, y: -140, speed: speed + 2 });
}

/* ===== LOOP ===== */
function loop() {
  if (!running) return;

  levelTimer += 1 / 60;
  const lvl = LEVELS[currentLevel];
  if (lvl.targetScore && score >= lvl.targetScore) win();
  if (lvl.time && levelTimer >= lvl.time) win();

  roads.forEach((road, i) => {
    roadY[i] += speed;
    if (roadY[i] >= GAME_HEIGHT) roadY[i] -= GAME_HEIGHT * 2;
    road.style.transform = `translateY(${roadY[i]}px)`;
  });

  /* SMOOTH BUTTON STEERING */
  carVel += steer * ACCEL;
  carVel *= FRICTION;
  carVel = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, carVel));
  carX += carVel;

  carX = Math.max(0, Math.min(game.offsetWidth - car.offsetWidth, carX));
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

/* ===== END STATES ===== */
function win() {
  running = false;
  statusText.textContent = "✅ LEVEL COMPLETE";
  replayBtn.hidden = false;
}

function gameOver() {
  running = false;
  crashSound.play().catch(()=>{});
  statusText.textContent = "💥 GAME OVER";
  replayBtn.hidden = false;
}

/* ===== UI ===== */
document.querySelectorAll(".level-btn").forEach(btn => {
  btn.onclick = () => {
    currentLevel = Number(btn.dataset.level);
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";
    resetGame();
  };
});

replayBtn.onclick = () => {
  gameScreen.style.display = "none";
  startScreen.style.display = "flex";
};

};
