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

/* AUDIO */
const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;

/* CONSTANTS */
const LANES = [60, 156, 252];
const PLAYER_BOTTOM = 120;

/* STATE */
let gameState = "menu";
let level = 1;
let score = 0;
let speed = 4;

let currentLane = 1;
let targetX = LANES[currentLane];
let currentX = targetX;

let roadY = -640;
let finishY = -800;
let traffic = [];

/* LEVEL CONFIG */
const LEVELS = {
  1: { target: 40, speed: 4 },
  2: { target: 70, speed: 5 },
  3: { target: 110, speed: 6 }
};

/* INPUT */
function moveLeft() {
  if (currentLane > 0) {
    currentLane--;
    targetX = LANES[currentLane];
  }
}

function moveRight() {
  if (currentLane < 2) {
    currentLane++;
    targetX = LANES[currentLane];
  }
}

leftBtn.addEventListener("touchstart", e => { e.preventDefault(); moveLeft(); });
rightBtn.addEventListener("touchstart", e => { e.preventDefault(); moveRight(); });

/* BUTTONS */
playBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  startLevel();
});

nextBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  level++;
  startLevel();
});

restartBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  location.reload();
});

/* START LEVEL */
function startLevel() {
  gameState = "play";
  score = 0;
  speed = LEVELS[level]?.speed || 7;

  traffic.forEach(t => t.remove());
  traffic = [];

  finishLine.style.display = "none";
  finishY = -800;

  challengeText.innerText = "Reach " + (LEVELS[level]?.target ?? "∞");

  overlay.classList.add("hidden");
  driveSound.play().catch(() => {});
  requestAnimationFrame(gameLoop);
}

/* SPAWN TRAFFIC */
function spawnTraffic() {
  if (Math.random() < 0.035) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.style.left = LANES[Math.floor(Math.random() * 3)] + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

/* COLLISION */
function hit(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return (
    r1.left + 8 < r2.right - 8 &&
    r1.right - 8 > r2.left + 8 &&
    r1.top + 12 < r2.bottom - 12 &&
    r1.bottom - 12 > r2.top + 12
  );
}

/* LOOP */
function gameLoop() {
  if (gameState !== "play") return;

  roadY += speed;
  if (roadY >= 0) roadY = -640;
  road.style.top = roadY + "px";

  currentX += (targetX - currentX) * 0.15;
  player.style.left = currentX + "px";
  player.style.bottom = PLAYER_BOTTOM + "px";

  spawnTraffic();

  traffic.forEach((t, i) => {
    t.style.top = t.offsetTop + speed + "px";

    if (t.offsetTop > 700) {
      t.remove();
      traffic.splice(i, 1);
      score++;
    }

    if (hit(player, t)) gameOver();
  });

  if (
    score >= (LEVELS[level]?.target ?? Infinity) &&
    finishLine.style.display === "none"
  ) {
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

/* END STATES */
function levelComplete() {
  gameState = "complete";
  driveSound.pause();
  overlayTitle.innerText = "LEVEL COMPLETE";
  overlayText.innerText = `Level: ${level}\nScore: ${score}`;
  nextBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function gameOver() {
  gameState = "over";
  driveSound.pause();
  crashSound.play().catch(() => {});
  overlayTitle.innerText = "GAME OVER";
  overlayText.innerText = `Level: ${level}\nScore: ${score}`;
  restartBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  overlay.classList.remove("hidden");
}
