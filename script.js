/*********************************
 * ELEMENTS
 *********************************/
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

/*********************************
 * AUDIO (MOBILE SAFE)
 *********************************/
const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;
driveSound.volume = 0.6;

/*********************************
 * CONSTANTS
 *********************************/
const LANES = [60, 156, 252];
const PLAYER_BOTTOM = 120;

/*********************************
 * GAME STATE
 *********************************/
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

/*********************************
 * LEVEL DATA
 *********************************/
const LEVELS = {
  1: { target: 40, speed: 4 },
  2: { target: 70, speed: 5 },
  3: { target: 110, speed: 6 }
};

/*********************************
 * HELPERS
 *********************************/
function vibrate(ms = 30) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function fadeIn(el) {
  el.style.opacity = 0;
  el.classList.remove("hidden");
  let o = 0;
  const id = setInterval(() => {
    o += 0.08;
    el.style.opacity = o;
    if (o >= 1) clearInterval(id);
  }, 16);
}

function fadeOut(el) {
  let o = 1;
  const id = setInterval(() => {
    o -= 0.08;
    el.style.opacity = o;
    if (o <= 0) {
      clearInterval(id);
      el.classList.add("hidden");
    }
  }, 16);
}

/*********************************
 * INPUT (LANE BASED)
 *********************************/
function moveLeft() {
  if (currentLane > 0) {
    currentLane--;
    targetX = LANES[currentLane];
    vibrate(20);
  }
}

function moveRight() {
  if (currentLane < 2) {
    currentLane++;
    targetX = LANES[currentLane];
    vibrate(20);
  }
}

leftBtn.addEventListener("touchstart", e => { e.preventDefault(); moveLeft(); });
rightBtn.addEventListener("touchstart", e => { e.preventDefault(); moveRight(); });

leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);

/*********************************
 * BUTTONS (TOUCH + CLICK)
 *********************************/
function startGame() {
  fadeOut(overlay);
  gameState = "play";
  score = 0;

  speed = LEVELS[level]?.speed || 7;
  challengeText.innerText = "Reach " + (LEVELS[level]?.target ?? "∞");

  traffic.forEach(t => t.remove());
  traffic = [];

  finishLine.style.display = "none";
  finishY = -800;

  driveSound.play().catch(() => {});
  requestAnimationFrame(gameLoop);
}

playBtn.addEventListener("touchstart", e => { e.preventDefault(); vibrate(40); startGame(); });
playBtn.addEventListener("click", startGame);

nextBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  vibrate(40);
  level++;
  startGame();
});

restartBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  vibrate(40);
  location.reload();
});

/*********************************
 * TRAFFIC SPAWN
 *********************************/
function spawnTraffic() {
  if (Math.random() < 0.035) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.dataset.lane = Math.floor(Math.random() * 3);
    t.style.left = LANES[t.dataset.lane] + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

/*********************************
 * COLLISION (NO AIR HIT)
 *********************************/
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

/*********************************
 * MAIN LOOP
 *********************************/
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

    if (hit(player, t)) return gameOver();
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

/*********************************
 * END STATES
 *********************************/
function levelComplete() {
  gameState = "complete";
  driveSound.pause();

  overlayTitle.innerText = "LEVEL COMPLETE";
  overlayText.innerText = `Level: ${level}\nScore: ${score}`;

  nextBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  fadeIn(overlay);
}

function gameOver() {
  gameState = "over";
  driveSound.pause();
  crashSound.play().catch(() => {});
  vibrate(120);

  overlayTitle.innerText = "GAME OVER";
  overlayText.innerText = `Level: ${level}\nScore: ${score}`;

  restartBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  fadeIn(overlay);
}

/*********************************
 * MENU INIT
 *********************************/
overlayTitle.innerText = "Highway Drive";
overlayText.innerText = "Tap Play to Start";
fadeIn(overlay);
