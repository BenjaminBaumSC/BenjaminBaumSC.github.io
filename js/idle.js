import { idleStage } from './idle-stage.js';

const TICK_MS = 250;
const ZZZ_EVERY_MS = 900;
const RUN_PAUSE_MS = 1500;

const PACMAN_SVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <path class="jaw top" d="M50 50 L100 50 A50 50 0 0 0 0 50 Z" />
  <path class="jaw bottom" d="M50 50 L0 50 A50 50 0 0 0 100 50 Z" />
  <circle class="eye" cx="52" cy="24" r="7" />
</svg>`;

const GHOST_SVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <path class="body" d="M8 96 V48 A42 42 0 0 1 92 48 V96 L78 84 L64 96 L50 84 L36 96 L22 84 Z" />
  <circle class="eye-white" cx="36" cy="46" r="12" />
  <circle class="eye-white" cx="66" cy="46" r="12" />
  <circle class="pupil" cx="41" cy="48" r="6" />
  <circle class="pupil" cx="71" cy="48" r="6" />
</svg>`;

function element(className, parent, html = '') {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  parent.append(el);
  return el;
}

export function createIdle({ layer, getContext, isBusy, reducedMotion, comic }) {
  let lastActivity = performance.now();
  let stage = 0;
  let nodes = [];
  let zzzTimer = null;
  let runFrame = null;

  function looseTiles() {
    return getContext().physics.tileStates().filter((tile) => tile.visible && tile.snappedField === null);
  }

  function stopAll() {
    const { renderer } = getContext();
    renderer?.setIdle(null);
    clearInterval(zzzTimer);
    cancelAnimationFrame(runFrame);
    zzzTimer = null;
    runFrame = null;
    nodes.forEach((node) => node.remove());
    nodes = [];
  }

  function tapImpatiently() {
    const tiles = looseTiles();
    if (tiles.length === 0) return;
    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    if (!reducedMotion) getContext().renderer.setIdle('tap', tile.id);
    comic('…?', tile.x, tile.y - getContext().layout.tileSize * 0.6);
  }

  function spawnZ() {
    const tiles = looseTiles();
    if (tiles.length === 0) return;
    const x = tiles.reduce((sum, tile) => sum + tile.x, 0) / tiles.length;
    const y = Math.min(...tiles.map((tile) => tile.y)) - getContext().layout.tileSize * 0.6;
    const z = element(reducedMotion ? 'zzz calm' : 'zzz', layer);
    z.textContent = reducedMotion ? 'Z z z' : 'Z';
    z.style.left = `${x + (Math.random() - 0.5) * 60}px`;
    z.style.top = `${y}px`;
    nodes.push(z);
    if (!reducedMotion) setTimeout(() => z.remove(), 2600);
  }

  function fallAsleep() {
    if (reducedMotion) {
      spawnZ();
      return;
    }
    getContext().renderer.setIdle('sleep');
    spawnZ();
    zzzTimer = setInterval(spawnZ, ZZZ_EVERY_MS);
  }

  function runPacman() {
    const { layout } = getContext();
    const size = layout.tileSize * 1.1;
    const pac = element('pacman', layer, PACMAN_SVG);
    const ghost = element('ghost', layer, GHOST_SVG);
    nodes.push(pac, ghost);
    for (const node of [pac, ghost]) {
      node.style.width = `${size}px`;
      node.style.top = `${layout.floorY - size}px`;
    }
    const speed = layout.width / 4500;
    let started = performance.now();
    let startled = new Set();
    const frame = (now) => {
      const x = -size + (now - started) * speed;
      pac.style.transform = `translateX(${x}px)`;
      ghost.style.transform = `translateX(${x - size * 1.8}px)`;
      for (const tile of looseTiles()) {
        if (!startled.has(tile.id) && Math.abs(tile.x - (x + size / 2)) < layout.tileSize * 0.8) {
          startled.add(tile.id);
          getContext().physics.hopTile(tile.id);
        }
      }
      if (x - size * 1.8 > layout.width + RUN_PAUSE_MS * speed) {
        started = now;
        startled = new Set();
      }
      runFrame = requestAnimationFrame(frame);
    };
    runFrame = requestAnimationFrame(frame);
  }

  function attract() {
    clearInterval(zzzTimer);
    nodes.forEach((node) => node.remove());
    nodes = [];
    getContext().renderer.setIdle(null);
    const { layout } = getContext();
    const banner = element(reducedMotion ? 'press-start calm' : 'press-start', layer);
    banner.textContent = 'PRESS START';
    banner.style.top = `${layout.rowY - layout.fieldSize * 1.6}px`;
    nodes.push(banner);
    if (!reducedMotion) runPacman();
  }

  const ENTER = [null, tapImpatiently, fallAsleep, attract];

  setInterval(() => {
    const now = performance.now();
    if (isBusy()) {
      lastActivity = now;
      return;
    }
    const next = idleStage(now - lastActivity);
    while (stage < next) {
      stage++;
      ENTER[stage]();
    }
  }, TICK_MS);

  return {
    activity() {
      lastActivity = performance.now();
      if (stage > 0) stopAll();
      stage = 0;
    },
  };
}
