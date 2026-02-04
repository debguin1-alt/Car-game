/* =========================================================
   HIGHWAY DRIVE – FULL GAME LOGIC (SINGLE FILE)
   ========================================================= */

/* ------------------ ELEMENTS ------------------ */
const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");
const finishLine = document.getElementById("finishLine");

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const challengeText = document.getElementById("challengeText");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

/* ------------------ CONSTANTS ------------------ */
const LANES = [60, 156, 252];
const PLAYER_BOTTOM = 120;
const ROAD_RESET_Y = -640;
const FINISH_START_Y = -900;

/* ------------------ GAME STATE ------------------ */
let state = "menu"; // menu | play | levelComplete | gameOver
let level = 1;
let score = 0;
let speed = 4;

let currentLane = 1;
let targetX = LANES[currentLane];
let currentX = targetX;

let roadY = ROAD_RESET_Y;
let finishY = FINISH_START_Y;

let traffic = [];
let canCollide = false;
let spawnCooldown = 0;

/* ------------------ LEVEL DATA ------------------ */
const LEVELS = {
  1: { target: 40, speed: 4, density: 0.025 },
  2: { target: 80, speed: 5, density: 0.030 },
  3: { target: 130, speed: 6, density: 0.035 },
  4: { target: 200, speed: 7, density: 0.040 }
};

/* ------------------ INPUT ------------------ */
function moveLeft() {
  if (state !== "play") return;
  if (currentLane > 0) {
    currentLane--;
    targetX = LANES[currentLane];
  }
}

function moveRight() {
  if (state !== "play") return;
  if (currentLane < LANES.length - 1) {
    currentLane++;
    targetX = LANES[currentLane];
  }
}

leftBtn.addEventListener("touchstart", e => { e.preventDefault(); moveLeft(); });
rightBtn.addEventListener("touchstart", e => { e.preventDefault(); moveRight(); });
leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);

/* ------------------ BUTTONS ------------------ */
playBtn.addEventListener("touchstart", e => { e.preventDefault(); startLevel(); });
playBtn.addEventListener("click", startLevel);

nextBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  level++;
  startLevel();
});

restartBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  location.reload();
});

/* ------------------ START LEVEL ------------------ */
function startLevel() {
  const cfg = LEVELS[level] || LEVELS[Object.keys(LEVELS).length];

  state = "play";
  score = 0;
  speed = cfg.speed;

  traffic.forEach(t => t.el.remove());
  traffic.length = 0;

  currentLane = 1;
  currentX = targetX = LANES[1];
  player.style.left = currentX + "px";

  roadY = ROAD_RESET_Y;
  finishY = FINISH_START_Y;
  finishLine.style.display = "none";

  canCollide = false;
  setTimeout(() => canCollide = true, 500);

  spawnCooldown = 0;

  challengeText.innerText = `Reach ${cfg.target}`;
  overlay.classList.add("hidden");

  requestAnimationFrame(gameLoop);
}

/* ------------------ TRAFFIC ------------------ */
function spawnTraffic() {
  const cfg = LEVELS[level];
  if (spawnCooldown > 0) {
    spawnCooldown--;
    return;
  }

  if (Math.random() < cfg.density) {
    const lane = Math.floor(Math.random() * LANES.length);
    const el = document.createElement("img");
    el.src = "./images/traffic.png";
    el.className = "traffic";
    el.style.left = LANES[lane] + "px";
    el.style.top = "-90px";

    game.appendChild(el);
    traffic.push({ el, lane });
    spawnCooldown = 20;
  }
}

/* ------------------ COLLISION ------------------ */
function hit(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(
    r1.bottom < r2.top + 14 ||
    r1.top > r2.bottom - 14 ||
    r1.right < r2.left + 10 ||
    r1.left > r2.right - 10
  );
}

/* ------------------ GAME LOOP ------------------ */
function gameLoop() {
  if (state !== "play") return;

  /* ROAD */
  roadY += speed;
  if (roadY >= 0) roadY = ROAD_RESET_Y;
  road.style.top = roadY + "px";

  /* PLAYER (SMOOTH) */
  currentX += (targetX - currentX) * 0.18;
  player.style.left = currentX + "px";
  player.style.bottom = PLAYER_BOTTOM + "px";

  /* TRAFFIC */
  spawnTraffic();

  for (let i = traffic.length - 1; i >= 0; i--) {
    const car = traffic[i];
    car.el.style.top = car.el.offsetTop + speed + "px";

    if (car.el.offsetTop > 720) {
      car.el.remove();
      traffic.splice(i, 1);
      score++;
      continue;
    }

    if (canCollide && hit(player, car.el)) {
      endGame();
      return;
    }
  }

  /* FINISH LINE */
  const targetScore = LEVELS[level]?.target ?? Infinity;
  if (score >= targetScore && finishLine.style.display === "none") {
    finishLine.style.display = "block";
  }

  if (finishLine.style.display === "block") {
    finishY += speed;
    finishLine.style.top = finishY + "px";
    if (finishY > 640) levelComplete();
  }

  levelText.innerText = level;
  scoreText.innerText = score;

  requestAnimationFrame(gameLoop);
}

/* ------------------ END STATES ------------------ */
function levelComplete() {
  state = "levelComplete";
  overlayTitle.innerText = "LEVEL COMPLETE";
  overlayText.innerText = `Level ${level}\nScore ${score}`;
  nextBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function endGame() {
  state = "gameOver";
  overlayTitle.innerText = "GAME OVER";
  overlayText.innerText = `Score ${score}`;
  restartBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  overlay.classList.remove("hidden");
}

/* ------------------ MENU INIT ------------------ */
overlayTitle.innerText = "Highway Drive";
overlayText.innerText = "Tap Play to Start";
overlay.classList.remove("hidden");
