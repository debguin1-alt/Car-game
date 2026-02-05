window.onload = () => {

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

  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");

  const levelText = document.getElementById("levelText");

  const crashSound = document.getElementById("crashSound");
  const driveSound = document.getElementById("driveSound");

  /* ================= CONSTANTS ================= */
  const GAME_HEIGHT = 520;
  const ROAD_HEIGHT = 540; // MUST be bigger than game height
  const ROAD_PADDING = 10;

  const NPC_LANES = [9, 50, 91, 132, 173, 214];
  const SAFE_DISTANCE = 140;
  const HITBOX_PADDING = 20;

  const ACCEL = 0.6;
  const FRICTION = 0.85;
  const MAX_STEER = 6;

  /* ================= LEVELS ================= */
  const LEVELS = {
    1: { targetScore: 5, speed: 5 },
    2: { time: 20, speed: 5.5 },
    3: { targetScore: 10, speed: 6 },
    4: { targetScore: 15, speed: 7 },
    5: { endless: true, speed: 8 }
  };

  /* ================= STATE ================= */
  let roadY = [0, -ROAD_HEIGHT];
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

    roadY = [0, -ROAD_HEIGHT];

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

    levelText.style.display = "none";

    driveSound.currentTime = 0;
    driveSound.play().catch(() => {});

    requestAnimationFrame(loop);
  }

  /* ================= BUTTON CONTROLS ================= */
  leftBtn.addEventListener("touchstart", e => { e.preventDefault(); steerDir = -1; });
  leftBtn.addEventListener("touchend", () => steerDir = 0);
  leftBtn.addEventListener("mousedown", () => steerDir = -1);
  leftBtn.addEventListener("mouseup", () => steerDir = 0);

  rightBtn.addEventListener("touchstart", e => { e.preventDefault(); steerDir = 1; });
  rightBtn.addEventListener("touchend", () => steerDir = 0);
  rightBtn.addEventListener("mousedown", () => steerDir = 1);
  rightBtn.addEventListener("mouseup", () => steerDir = 0);

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

  /* ================= LEVEL COMPLETE ================= */
  function winLevel() {
    running = false;
    driveSound.pause();

    levelText.textContent = "LEVEL COMPLETE";
    levelText.style.display = "block";

    setTimeout(() => {
      levelText.style.display = "none";

      if (currentLevel < Object.keys(LEVELS).length) {
        currentLevel++;
        resetGame();
      } else {
        statusText.textContent = "🏁 ALL LEVELS COMPLETE!";
        replayBtn.hidden = false;
      }
    }, 2500);
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

    if (lvl.targetScore && score >= lvl.targetScore) winLevel();
    if (lvl.time && levelTimer >= lvl.time) winLevel();

    /* ---- ROAD SCROLL (NO GAPS) ---- */
    roads.forEach((road, i) => {
      roadY[i] += speed;

      if (roadY[i] >= ROAD_HEIGHT) {
        roadY[i] -= ROAD_HEIGHT * 2;
      }

      road.style.transform = `translateY(${Math.floor(roadY[i])}px)`;
    });

    /* ---- PLAYER MOVEMENT ---- */
    carVelocity += steerDir * ACCEL;
    carVelocity *= FRICTION;
    carVelocity = Math.max(-MAX_STEER, Math.min(MAX_STEER, carVelocity));
    carX += carVelocity;

    carX = Math.max(
      ROAD_PADDING,
      Math.min(game.offsetWidth - car.offsetWidth - ROAD_PADDING, carX)
    );

    car.style.left = carX + "px";

    /* ---- NPC UPDATE ---- */
    traffic.forEach((npc, i) => {
      npc.y += npc.speed;
      npc.el.style.top = npc.y + "px";

      if (collide(hitbox(car), hitbox(npc.el))) {
        gameOver();
      }

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
