import {
  anyCollision,
  canvasPointFromClient,
  createPlayer,
  isTouchDevice,
  loadHighScore,
  movePlayer,
  movePlayerToward,
  nextSpawnDelay,
  saveHighScore,
  scoreForEscaped,
  spawnAsteroid,
  stepAsteroids,
} from "./game.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("high");
const hintEl = document.getElementById("controls-hint");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const touch = isTouchDevice();
const keys = { left: false, right: false, up: false, down: false };
const KEY_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
  A: "left",
  D: "right",
  W: "up",
  S: "down",
};

if (touch) {
  document.body.classList.add("is-touch");
  hintEl.textContent = "Håll fingret på skärmen så följer skeppet efter.";
  overlayText.textContent = "Tryck starta eller någonstans på banan.";
}

let player = createPlayer(canvas.width, canvas.height);
let asteroids = [];
let score = 0;
let high = loadHighScore();
let elapsed = 0;
let spawnIn = 0.4;
let running = false;
let last = 0;
let touchTarget = null;

highEl.textContent = String(high);

function reset() {
  player = createPlayer(canvas.width, canvas.height);
  asteroids = [];
  score = 0;
  elapsed = 0;
  spawnIn = 0.4;
  touchTarget = null;
  scoreEl.textContent = "0";
}

function start() {
  reset();
  running = true;
  overlay.classList.add("hidden");
  last = performance.now();
  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  touchTarget = null;
  high = saveHighScore(score);
  highEl.textContent = String(high);
  overlayTitle.textContent = "Game over";
  overlayText.textContent = `Poäng: ${score} · Bästa: ${high}`;
  overlay.classList.remove("hidden");
}

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  elapsed += dt;
  spawnIn -= dt;

  if (touchTarget) {
    movePlayerToward(player, touchTarget, dt, { w: canvas.width, h: canvas.height });
  } else {
    movePlayer(player, keys, dt, { w: canvas.width, h: canvas.height });
  }

  if (spawnIn <= 0) {
    asteroids.push(spawnAsteroid(canvas.width));
    spawnIn = nextSpawnDelay(elapsed);
  }

  const stepped = stepAsteroids(asteroids, dt, canvas.height);
  asteroids = stepped.asteroids;
  if (stepped.escaped) {
    score += scoreForEscaped(stepped.escaped);
    scoreEl.textContent = String(score);
  }

  if (anyCollision(player, asteroids)) {
    draw();
    gameOver();
    return;
  }

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.fillStyle = "#070b16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#9ecbff";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 73 + elapsed * 12) % canvas.width;
    const y = (i * 131) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#7cf0ff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff7a59";
  for (const a of asteroids) {
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function setTouchFromEvent(event) {
  const point = event.touches ? event.touches[0] : event;
  if (!point) {
    touchTarget = null;
    return;
  }
  touchTarget = canvasPointFromClient(canvas, point.clientX, point.clientY);
}

window.addEventListener("keydown", (event) => {
  const dir = KEY_MAP[event.key];
  if (dir) {
    keys[dir] = true;
    event.preventDefault();
  }
  if (!running && (event.key === " " || event.key === "Enter")) start();
});

window.addEventListener("keyup", (event) => {
  const dir = KEY_MAP[event.key];
  if (dir) keys[dir] = false;
});

canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen" || touch) {
      event.preventDefault();
      if (!running) start();
      setTouchFromEvent(event);
      canvas.setPointerCapture?.(event.pointerId);
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "pointermove",
  (event) => {
    if (touchTarget && (event.pointerType === "touch" || event.pointerType === "pen" || touch)) {
      event.preventDefault();
      setTouchFromEvent(event);
    }
  },
  { passive: false }
);

function clearTouch(event) {
  if (event.pointerType === "touch" || event.pointerType === "pen" || touch) {
    touchTarget = null;
  }
}

canvas.addEventListener("pointerup", clearTouch);
canvas.addEventListener("pointercancel", clearTouch);

document.getElementById("start").addEventListener("click", start);
draw();
