export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function element(className, parent, text = '') {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  parent.append(el);
  return el;
}
