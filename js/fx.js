const COMIC_MS = 1000;
const GLOW_MS = 500;
const SPEEDLINES = 5;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function removeAfter(el, ms) {
  setTimeout(() => el.remove(), ms);
}

export function showComicWord(layer, text, x, y, { reducedMotion }) {
  const el = document.createElement('div');
  el.className = reducedMotion ? 'comic calm' : 'comic';
  el.textContent = text;
  el.style.left = `${x + random(-12, 12)}px`;
  el.style.top = `${y + random(-12, 12)}px`;
  el.style.setProperty('--s', random(0.85, 1.2).toFixed(2));
  el.style.setProperty('--r', `${random(-14, -4).toFixed(1)}deg`);
  layer.append(el);
  removeAfter(el, COMIC_MS);
}

export function showImpact(layer, x, y, size) {
  const el = document.createElement('div');
  el.className = 'impact';
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });
  for (let i = 0; i < SPEEDLINES; i++) {
    const line = document.createElement('b');
    line.style.setProperty('--a', `${120 + i * 30}deg`);
    el.append(line);
  }
  layer.append(el);
  removeAfter(el, COMIC_MS);
}

export function glowFields(fieldEls, indices) {
  indices.forEach((i) => fieldEls[i].classList.add('glow'));
  return new Promise((resolve) =>
    setTimeout(() => {
      indices.forEach((i) => fieldEls[i].classList.remove('glow'));
      resolve();
    }, GLOW_MS),
  );
}
