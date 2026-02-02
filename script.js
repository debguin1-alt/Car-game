/***********************
 * PWA INSTALL SUPPORT
 ***********************/
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installMsg = document.getElementById("message");
  installMsg.innerText = "Tap here to install the game";
  installMsg.style.display = "block";

  installMsg.onclick = async () => {
    installMsg.style.display = "none";
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  };
});

/***********************
 * GAME ELEMENTS
 ***********************/
const game = document.getElementById("game");
const road = document.getElementById("road");
const player = document.getElementById("player");

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const challengeText = document.getElementById("challengeText");
const message = document.getElementById("message");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

/***********************
 * AUDIO (MOBILE SAFE)
 ***********************/
const driveSound = new Audio("./sounds/drive.mp3");
const crashSound = new Audio("./sounds/crash.mp3");
driveSound.loop = true;

let audioStarted = false;
document.addEventListener("touchstart", () => {
  if (!audioStarted) {
    driveSound.play().catch(()=>{});
    audioStarted = true;
  }
}, { once: true });

/***********************
 * GAME STATE
 ***********************/
let playerX = 150;
let speed = 4;
let score = 0;
let level = 1;

let traffic = [];
let powerUp = null;
let shield = false;

let moveLeft = false;
let moveRight = false;

let roadY = -640;
let gameOver = false;

/***********************
 * CHALLENGES
 ***********************/
const challenges = {
  1: "Reach 200 score",
  2: "Avoid fast traffic",
  3: "Survive longer",
  4: "No crash zone",
  5: "High speed chaos"
};

/***********************
 * CONTROLS
 ***********************/
leftBtn.addEventListener("touchstart", () => moveLeft = true);
leftBtn.addEventListener("touchend", () => moveLeft = false);

rightBtn.addEventListener("touchstart", () => moveRight = true);
rightBtn.addEventListener("touchend", () => moveRight = false);

/***********************
 * SPAWN FUNCTIONS
 ***********************/
function spawnTraffic() {
  if (Math.random() < 0.025) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.style.left = Math.random() * 300 + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

function spawnPowerUp() {
  if (!powerUp && Math.random() < 0.003) {
    powerUp = document.createElement("div");
    powerUp.className = "power";
    powerUp.style.left = Math.random() * 320 + "px";
    powerUp.style.top = "-20px";
    game.appendChild(powerUp);
  }
}

/***********************
 * LEVEL UP
 ***********************/
function levelUp() {
  level++;
  speed++;
  message.innerText = "LEVEL " + level;
  message.style.display = "block";
  setTimeout(() => message.style.display = "none", 1200);
}

/***********************
 * COLLISION
 ***********************/
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

/***********************
 * GAME LOOP
 ***********************/
function gameLoop() {
  if (gameOver) return;

  // Road scroll
  roadY += speed;
  if (roadY >= 0) roadY = -640;
  road.style.top = roadY + "px";

  // Player movement
  if (moveLeft) playerX -= 8;
  if (moveRight) playerX += 8;

  playerX = Math.max(0, Math.min(300, playerX));
  player.style.left = playerX + "px";

  spawnTraffic();
  spawnPowerUp();

  // Traffic logic
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
        gameOver = true;
        message.innerText = "GAME OVER\nScore: " + score;
        message.style.display = "block";
        setTimeout(() => location.reload(), 1500);
      }
    }
  });

  // Power-up logic
  if (powerUp) {
    powerUp.style.top = powerUp.offsetTop + speed + "px";
    if (collision(player, powerUp)) {
      shield = true;
      powerUp.remove();
      powerUp = null;
    }
  }

  // Level progress
  if (score >= level * 200) levelUp();

  levelText.innerText = level;
  scoreText.innerText = score;
  challengeText.innerText = challenges[level] || "ENDLESS";

  requestAnimationFrame(gameLoop);
}

gameLoop();
