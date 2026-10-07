import { env, $, $$ } from './env.js';

const cls = (line) => (line.startsWith('>') ? 'is-out' : line.trim().startsWith('//') ? 'is-dim' : '');

function type(lines, out) {
  let li = 0;
  let ci = 0;
  let span = null;

  const step = () => {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci === 0) {
      span = document.createElement('span');
      span.className = cls(line);
      out.appendChild(span);
    }
    // output lines appear at once; commands are typed
    if (line.startsWith('>')) {
      span.textContent = line;
      ci = line.length;
    } else {
      span.textContent = line.slice(0, ++ci);
    }
    if (ci >= line.length) {
      li++;
      ci = 0;
      if (li < lines.length) out.appendChild(document.createTextNode('\n'));
      setTimeout(step, line.startsWith('>') ? 260 : 340);
    } else {
      setTimeout(step, 18 + Math.random() * 38);
    }
  };
  step();
}

/** <div data-term data-lines='["$ git init", "> ready."]'> types itself out once seen. */
export function initTerms(root = document) {
  $$('[data-term]', root).forEach((el) => {
    if (el.__term) return;
    el.__term = true;
    let lines = [];
    try {
      lines = JSON.parse(el.dataset.lines || '[]');
    } catch {
      return;
    }
    const out = $('[data-term-out]', el);
    if (!out) return;

    if (env.reduced) {
      lines.forEach((l, i) => {
        const s = document.createElement('span');
        s.className = cls(l);
        s.textContent = l + (i < lines.length - 1 ? '\n' : '');
        out.appendChild(s);
      });
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTimeout(() => type(lines, out), 250);
      },
      { threshold: 0.75 },
    );
    io.observe(el);
  });
}
