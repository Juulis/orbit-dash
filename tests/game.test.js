import test from "node:test";
import assert from "node:assert/strict";
import {
  anyCollision,
  createPlayer,
  loadHighScore,
  movePlayer,
  nextSpawnDelay,
  saveHighScore,
  scoreForEscaped,
  spawnAsteroid,
  stepAsteroids,
  rectsOverlap,
} from "../js/game.js";

test("rectsOverlap detekterar överlapp", () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 5, h: 5 }), true);
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 11, y: 0, w: 5, h: 5 }), false);
});

test("movePlayer håller sig inom banan", () => {
  const player = createPlayer(200, 200);
  player.x = 0;
  player.y = 0;
  movePlayer(player, { left: true, up: true, right: false, down: false }, 1, { w: 200, h: 200 });
  assert.equal(player.x, 0);
  assert.equal(player.y, 0);
});

test("spawnAsteroid använder seedad slump", () => {
  const rock = spawnAsteroid(400, () => 0.5);
  assert.equal(rock.w, 16 + Math.floor(0.5 * 28));
  assert.ok(rock.y < 0);
});

test("stepAsteroids räknar de som lämnar skärmen", () => {
  const result = stepAsteroids([{ x: 0, y: 90, w: 10, h: 10, vx: 0, vy: 20 }], 1, 100);
  assert.equal(result.escaped, 1);
  assert.equal(result.asteroids.length, 0);
});

test("kollision och poäng", () => {
  const player = { x: 10, y: 10, w: 20, h: 20 };
  assert.equal(anyCollision(player, [{ x: 15, y: 15, w: 10, h: 10 }]), true);
  assert.equal(scoreForEscaped(3), 30);
});

test("nextSpawnDelay blir kortare över tid", () => {
  const early = nextSpawnDelay(0, () => 0);
  const late = nextSpawnDelay(100, () => 0);
  assert.ok(late < early);
  assert.ok(late >= 0.22);
});

test("highscore sparas i storage", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  assert.equal(loadHighScore(storage), 0);
  assert.equal(saveHighScore(40, storage), 40);
  assert.equal(saveHighScore(12, storage), 40);
});
