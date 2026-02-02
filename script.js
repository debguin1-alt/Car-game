const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const challengeText = document.getElementById("challengeText");
const message = document.getElementById("message");

const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;

let playerX = 150;
let roadY = 0;
let speed = 4;
let score = 0;
let level = 1;
let traffic = [];
let powerUp = null;
let shield = false;
let moveLeft = false;
let moveRight = false;
let soundStarted = false;

const GAME_WIDTH = 360;
const PLAYER_WIDTH = 60;

const challenges = {
  1: "Reach 200 score",
  2: "Avoid fast traffic",
  3: "Survive 20 seconds",
  4: "No crash challenge",
  5: "High speed chaos"
};

/* ---------- INPUT ---------- */
document.addEventListener("touchstart", startSound, { once: true });

function startSound() {
  if (!soundStarted) {
    driveSound.play().catch(() => {});
    soundStarted = true;
  }
}

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

leftBtn.addEventListener("touchstart", () => moveLeft = true);
leftBtn.addEventListener("touchend", () => moveLeft = false);

rightBtn.addEventListener("touchstart", () => moveRight = true);
rightBtn.addEventListener("touchend", () => moveRight = false);

/* ---------- SPAWN ---------- */
function spawnTraffic() {
  if (Math.random() < 0.025) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.style.left = Math.random() * (GAME_WIDTH - 60) + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

function spawnPowerUp() {
  if (!powerUp && Math.random() < 0.004) {
    powerUp = document.createElement("div");
    powerUp.className = "power";
    powerUp.style.left = Math.random() * (GAME_WIDTH - 30) + "px";
    powerUp.style.top = "-30px";
    game.appendChild(powerUp);
  }
}

/* ---------- LEVEL ---------- */
function levelUp() {
  level++;
  speed++;
  message.innerText = "LEVEL " + level;
  message.style.display = "block";
  setTimeout(() => message.style.display = "none", 1500);
}

/* ---------- COLLISION ---------- */
function collision(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return !(
    r1.bottom < r2.top ||
    r1.top > r2.bottom ||
    r1.right < r2.left ||
    r1.left > r2.right
  );
}

/* ---------- GAME LOOP ---------- */
function gameLoop() {
  roadY += speed;
  if (roadY >= 640) roadY = 0;
  road.style.top = -roadY + "px";

  if (moveLeft) playerX -= 6;
  if (moveRight) playerX += 6;

  playerX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, playerX));
  player.style.left = playerX + "px";

  spawnTraffic();
  spawnPowerUp();

  traffic.forEach((t, i) => {
    t.style.top = t.offsetTop + speed + "px";

    if (t.offsetTop > 700) {
      t.remove();
      traffic.splice(i, 1);
      score++;
    }

    if (collision(player, t)) {
      if (shield) {
        shield = false;
        t.remove();
        traffic.splice(i, 1);
      } else {
        crashSound.play();
        alert("GAME OVER\nScore: " + score);
        location.reload();
      }
    }
  });

  if (powerUp) {
    powerUp.style.top = powerUp.offsetTop + speed + "px";
    if (collision(player, powerUp)) {
      shield = true;
      powerUp.remove();
      powerUp = null;
    }
  }

  if (score >= level * 200) levelUp();

  levelText.innerText = level;
  scoreText.innerText = score;
  challengeText.innerText = challenges[level] || "ENDLESS";

  requestAnimationFrame(gameLoop);
}

gameLoop();
