/***********************
 * GAME ELEMENTS
 ***********************/
const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");

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

/***********************
 * AUDIO
 ***********************/
const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;

/***********************
 * GAME STATE
 ***********************/
let gameState = "menu";
let level = 1;
let score = 0;
let speed = 4;

let playerX = 150;
let roadY = -640;
let traffic = [];
let moveLeft = false;
let moveRight = false;

/***********************
 * LEVEL DATA
 ***********************/
const levels = {
  1: { target: 100, speed: 4, text: "Reach 100 score" },
  2: { target: 200, speed: 5, text: "Traffic is faster" },
  3: { target: 300, speed: 6, text: "Survive the chaos" }
};

/***********************
 * CONTROLS
 ***********************/
leftBtn.ontouchstart = () => moveLeft = true;
leftBtn.ontouchend = () => moveLeft = false;

rightBtn.ontouchstart = () => moveRight = true;
rightBtn.ontouchend = () => moveRight = false;

/***********************
 * BUTTONS
 ***********************/
playBtn.onclick = () => startLevel();
nextBtn.onclick = () => {
  level++;
  startLevel();
};
restartBtn.onclick = () => location.reload();

/***********************
 * START LEVEL
 ***********************/
function startLevel() {
  gameState = "playing";
  score = 0;
  traffic.forEach(t => t.remove());
  traffic = [];

  speed = levels[level]?.speed || (6 + level);
  challengeText.innerText = levels[level]?.text || "ENDLESS";

  overlay.classList.add("hidden");
  nextBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");

  driveSound.play().catch(()=>{});
  requestAnimationFrame(gameLoop);
}

/***********************
 * SPAWN TRAFFIC
 ***********************/
function spawnTraffic() {
  if (Math.random() < 0.03) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.style.left = Math.random() * 300 + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

/***********************
 * COLLISION
 ***********************/
function collision(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return !(r1.bottom < r2.top || r1.top > r2.bottom || r1.right < r2.left || r1.left > r2.right);
}

/***********************
 * GAME LOOP
 ***********************/
function gameLoop() {
  if (gameState !== "playing") return;

  roadY += speed;
  if (roadY >= 0) roadY = -640;
  road.style.top = roadY + "px";

  if (moveLeft) playerX -= 8;
  if (moveRight) playerX += 8;
  playerX = Math.max(0, Math.min(300, playerX));
  player.style.left = playerX + "px";

  spawnTraffic();

  traffic.forEach((t, i) => {
    t.style.top = t.offsetTop + speed + "px";

    if (t.offsetTop > 700) {
      t.remove();
      traffic.splice(i, 1);
      score++;
    }

    if (collision(player, t)) {
      crashSound.play();
      gameOver();
    }
  });

  if (score >= (levels[level]?.target || 99999)) {
    levelComplete();
    return;
  }

  levelText.innerText = level;
  scoreText.innerText = score;

  requestAnimationFrame(gameLoop);
}

/***********************
 * LEVEL COMPLETE
 ***********************/
function levelComplete() {
  gameState = "levelComplete";
  driveSound.pause();

  overlayTitle.innerText = "Level Complete!";
  overlayText.innerText = `Score: ${score}`;
  overlay.classList.remove("hidden");

  nextBtn.classList.remove("hidden");
}

/***********************
 * GAME OVER
 ***********************/
function gameOver() {
  gameState = "gameOver";
  driveSound.pause();

  overlayTitle.innerText = "Game Over";
  overlayText.innerText = `Score: ${score}`;
  overlay.classList.remove("hidden");

  restartBtn.classList.remove("hidden");
}

/***********************
 * START MENU
 ***********************/
overlayTitle.innerText = "Highway Drive";
overlayText.innerText = "Tap Play to Start";
overlay.classList.remove("hidden");
