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

/********************
 * GAME DATA
 ********************/
const lanes = [60, 156, 252];
let currentLane = 1;
let targetX = lanes[currentLane];
let currentX = targetX;

let speed = 4;
let score = 0;
let level = 1;
let roadY = -640;
let gameState = "menu";
let traffic = [];
let finishY = -800;

/********************
 * LEVEL CONFIG
 ********************/
const levels = {
  1: { target: 50, speed: 4 },
  2: { target: 80, speed: 5 },
  3: { target: 120, speed: 6 }
};

/********************
 * INPUT
 ********************/
leftBtn.onclick = () => {
  if (currentLane > 0) currentLane--;
  targetX = lanes[currentLane];
};

rightBtn.onclick = () => {
  if (currentLane < 2) currentLane++;
  targetX = lanes[currentLane];
};

/********************
 * BUTTONS
 ********************/
playBtn.onclick = () => startLevel();
nextBtn.onclick = () => { level++; startLevel(); };
restartBtn.onclick = () => location.reload();

/********************
 * START LEVEL
 ********************/
function startLevel() {
  gameState = "play";
  score = 0;
  traffic.forEach(t => t.remove());
  traffic = [];

  speed = levels[level]?.speed || 7;
  challengeText.innerText = "Reach " + (levels[level]?.target || "∞");

  finishLine.style.display = "none";
  finishY = -800;

  overlay.classList.add("hidden");
  nextBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");

  requestAnimationFrame(loop);
}

/********************
 * SPAWN TRAFFIC
 ********************/
function spawnTraffic() {
  if (Math.random() < 0.03) {
    const t = document.createElement("img");
    t.src = "./images/traffic.png";
    t.className = "traffic";
    t.dataset.lane = Math.floor(Math.random() * 3);
    t.style.left = lanes[t.dataset.lane] + "px";
    t.style.top = "-80px";
    game.appendChild(t);
    traffic.push(t);
  }
}

/********************
 * COLLISION (TIGHT)
 ********************/
function hit(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return (
    r1.left + 6 < r2.right - 6 &&
    r1.right - 6 > r2.left + 6 &&
    r1.top + 8 < r2.bottom - 8 &&
    r1.bottom - 8 > r2.top + 8
  );
}

/********************
 * MAIN LOOP
 ********************/
function loop() {
  if (gameState !== "play") return;

  roadY += speed;
  if (roadY >= 0) roadY = -640;
  road.style.top = roadY + "px";

  // Smooth lane movement
  currentX += (targetX - currentX) * 0.15;
  player.style.left = currentX + "px";

  spawnTraffic();

  traffic.forEach((t, i) => {
    t.style.top = t.offsetTop + speed + "px";

    if (t.offsetTop > 700) {
      t.remove();
      traffic.splice(i, 1);
      score++;
    }

    if (hit(player, t)) endGame();
  });

  if (score >= levels[level].target && finishLine.style.display === "none") {
    finishLine.style.display = "block";
  }

  if (finishLine.style.display === "block") {
    finishY += speed;
    finishLine.style.top = finishY + "px";

    if (finishY > 640) levelComplete();
  }

  levelText.innerText = level;
  scoreText.innerText = score;

  requestAnimationFrame(loop);
}

/********************
 * END STATES
 ********************/
function levelComplete() {
  gameState = "done";
  overlayTitle.innerText = "LEVEL COMPLETE";
  overlayText.innerText = `Score: ${score}`;
  overlay.classList.remove("hidden");
  nextBtn.classList.remove("hidden");
}

function endGame() {
  gameState = "over";
  overlayTitle.innerText = "GAME OVER";
  overlayText.innerText = `Score: ${score}`;
  overlay.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
}

/********************
 * MENU
 ********************/
overlayTitle.innerText = "Highway Drive";
overlayText.innerText = "Tap Play to Start";
overlay.classList.remove("hidden");
