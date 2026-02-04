/*************************
 * ELEMENTS
 *************************/
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

/*************************
 * AUDIO (SAFE)
 *************************/
const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;

/*************************
 * GAME CONSTANTS
 *************************/
const LANES = [60, 156, 252];
const PLAYER_Y_OFFSET = 120;

/*************************
 * GAME STATE
 *************************/
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

/*************************
 * LEVEL SETTINGS
 *************************/
const LEVELS = {
  1: { target: 40, speed: 4 },
  2: { target: 70, speed: 5 },
  3: { target: 100, speed: 6 }
};

/*************************
 * CONTROLS
 *************************/
leftBtn.onclick = () => {
  if (currentLane > 0) {
    currentLane--;
    targetX = LANES[currentLane];
  }
};

rightBtn.onclick = () => {
  if (currentLane < 2) {
    currentLane++;
    targetX = LANES[currentLane];
  }
};

/*************************
 * BUTTONS
 *************************/
playBtn.onclick = startLevel;
nextBtn.onclick = () => {
  level++;
  startLevel();
};
restartBtn.onclick = () => location.reload();

/*************************
 * START LEVEL
 *************************/
function startLevel() {
  gameState = "play";
  score = 0;
  speed = LEVELS[level]?.speed || 7;

  traffic.forEach(t => t.remove());
  traffic = [];

  finishLine.style.display = "none";
  finishY = -800;

  challengeText.innerText =
    "Reach " + (LEVELS[level]?.target ?? "∞");

  overlay.classList.add("hidden");
  nextBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");

  driveSound.play().catch(() => {});
  requestAnimationFrame(gameLoop);
}

/*************************
 * SPAWN TRAFFIC (LANE BASED)
 *************************/
function spawnTraffic() {
  if (Math.random() < 0.035) {
    const car = document.createElement("img");
    car.src = "./images/traffic.png";
    car.className = "traffic";
    car.dataset.lane = Math.floor(Math.random() * 3);
    car.style.left = LANES[car.dataset.lane] + "px";
    car.style.top = "-80px";
    game.appendChild(car);
    traffic.push(car);
  }
}

/*************************
 * COLLISION (NO AIR HIT)
 *************************/
function collision(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return (
    r1.left + 6 < r2.right - 6 &&
    r1.right - 6 > r2.left + 6 &&
    r1.top + 10 < r2.bottom - 10 &&
    r1.bottom - 10 > r2.top + 10
  );
}

/*************************
 * GAME LOOP
 *************************/
function gameLoop() {
  if (gameState !== "play") return;

  /* ROAD */
  roadY += speed;
  if (roadY >= 0) roadY = -640;
  road.style.top = roadY + "px";

  /* PLAYER SMOOTH MOVE */
  currentX += (targetX - currentX) * 0.15;
  player.style.left = currentX + "px";
  player.style.bottom = PLAYER_Y_OFFSET + "px";

  /* TRAFFIC */
  spawnTraffic();

  traffic.forEach((t, i) => {
    t.style.top = t.offsetTop + speed + "px";

    if (t.offsetTop > 700) {
      t.remove();
      traffic.splice(i, 1);
      score++;
    }

    if (collision(player, t)) {
      endGame();
    }
  });

  /* FINISH LINE */
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

/*************************
 * LEVEL COMPLETE
 *************************/
function levelComplete() {
  gameState = "complete";
  driveSound.pause();

  overlayTitle.innerText = "LEVEL COMPLETE";
  overlayText.innerText =
    `Level: ${level}\nScore: ${score}`;

  overlay.classList.remove("hidden");
  nextBtn.classList.remove("hidden");
}

/*************************
 * GAME OVER
 *************************/
function endGame() {
  gameState = "over";
  driveSound.pause();
  crashSound.play().catch(() => {});

  overlayTitle.innerText = "GAME OVER";
  overlayText.innerText =
    `Level: ${level}\nScore: ${score}`;

  overlay.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
}

/*************************
 * MENU
 *************************/
overlayTitle.innerText = "Highway Drive";
overlayText.innerText = "Tap Play to Start";
overlay.classList.remove("hidden");
