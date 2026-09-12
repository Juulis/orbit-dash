export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function createPlayer(width, height) {
  return { x: width / 2 - 14, y: height - 64, w: 28, h: 28, speed: 280 };
}

export function isTouchDevice(nav = globalThis.navigator, win = globalThis) {
  if (!nav) return false;
  if (Number(nav.maxTouchPoints) > 0) return true;
  if (win.matchMedia && win.matchMedia("(pointer: coarse)").matches) return true;
  return "ontouchstart" in win;
}

export function canvasPointFromClient(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.width;
  const height = rect.height || canvas.height;
  return {
    x: ((clientX - rect.left) / width) * canvas.width,
    y: ((clientY - rect.top) / height) * canvas.height,
  };
}

export function movePlayer(player, keys, dt, bounds) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx && dy) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  player.x = Math.max(0, Math.min(bounds.w - player.w, player.x + dx * player.speed * dt));
  player.y = Math.max(0, Math.min(bounds.h - player.h, player.y + dy * player.speed * dt));
  return player;
}

export function movePlayerToward(player, target, dt, bounds) {
  if (!target) return player;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return player;
  const step = Math.min(dist, player.speed * dt);
  player.x += (dx / dist) * step;
  player.y += (dy / dist) * step;
  player.x = Math.max(0, Math.min(bounds.w - player.w, player.x));
  player.y = Math.max(0, Math.min(bounds.h - player.h, player.y));
  return player;
}

export function spawnAsteroid(width, rand = Math.random) {
  const size = 16 + Math.floor(rand() * 28);
  return {
    x: rand() * Math.max(1, width - size),
    y: -size,
    w: size,
    h: size,
    vy: 90 + rand() * 160,
    vx: (rand() - 0.5) * 80,
  };
}

export function stepAsteroids(asteroids, dt, height) {
  const next = [];
  let escaped = 0;
  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.y < height) next.push(a);
    else escaped += 1;
  }
  return { asteroids: next, escaped };
}

export function anyCollision(player, asteroids) {
  return asteroids.some((a) => rectsOverlap(player, a));
}

export function scoreForEscaped(escaped) {
  return escaped * 10;
}

export function nextSpawnDelay(elapsed, rand = Math.random) {
  const base = Math.max(0.22, 0.85 - elapsed * 0.012);
  return base + rand() * 0.15;
}

export function loadHighScore(storage = globalThis.localStorage) {
  if (!storage) return 0;
  const value = Number(storage.getItem("orbit-dash-high") || 0);
  return Number.isFinite(value) ? value : 0;
}

export function saveHighScore(score, storage = globalThis.localStorage) {
  if (!storage) return score;
  const high = Math.max(score, loadHighScore(storage));
  storage.setItem("orbit-dash-high", String(high));
  return high;
}
