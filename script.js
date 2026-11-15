const FILM_ID = 'WA22zd9o3pk';
const FILM_EMBED = `https://www.youtube-nocookie.com/embed/${FILM_ID}?autoplay=1&rel=0`;
const FILM_WATCH = `https://www.youtube.com/watch?v=${FILM_ID}`;
// YouTube refuses to play inside pages opened straight from disk
const canEmbed = location.protocol !== 'file:';

function filmFrame() {
  const f = document.createElement('iframe');
  f.src = FILM_EMBED;
  f.title = 'Shred Hate Ride Love — fullstop brand';
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  return f;
}

const nav = document.querySelector('.site-nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const dialog = document.querySelector('dialog.film');
document.querySelectorAll('[data-film-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!canEmbed) { window.open(FILM_WATCH, '_blank', 'noopener'); return; }
    dialog.querySelector('.frame').replaceChildren(filmFrame());
    dialog.showModal();
  });
});
if (dialog) {
  dialog.addEventListener('close', () => dialog.querySelector('.frame').replaceChildren());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
}

document.querySelectorAll('.film-facade').forEach(facade => {
  facade.addEventListener('click', () => {
    if (!canEmbed) { window.open(FILM_WATCH, '_blank', 'noopener'); return; }
    facade.replaceChildren(filmFrame());
  });
});

// videos marked data-autoplay only load and play while on screen
const lazyVideos = document.querySelectorAll('video[data-autoplay]');
if (lazyVideos.length) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { rootMargin: '200px' });
  lazyVideos.forEach(v => io.observe(v));
}

// visuals: images breathe with the scroll, joined by a line and shapes drawn behind them
const stream = document.querySelector('.stream');
if (stream) {
  const NS = 'http://www.w3.org/2000/svg';
  const art = stream.querySelector('.stream-art');
  const shots = [...stream.querySelectorAll('.shot')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let line = null, lineLength = 0;

  const el = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    art.appendChild(n);
    return n;
  };

  function draw() {
    const W = stream.offsetWidth, H = stream.offsetHeight;
    art.setAttribute('viewBox', `0 0 ${W} ${H}`);
    art.replaceChildren();
    const unit = Math.min(W * 0.09, 130);
    const pts = shots.map(s => ({
      x: s.offsetLeft + s.offsetWidth / 2, y: s.offsetTop + s.offsetHeight / 2,
      w: s.offsetWidth, h: s.offsetHeight,
    }));

    pts.forEach((p, i) => {
      const side = p.x < W / 2 ? 1 : -1;          // the free side of this image
      const edgeX = p.x + side * p.w / 2;
      const o = { 'stroke-width': 1.5, opacity: 0.3 };
      if (i % 3 === 0) {
        // the ring-and-bar from the logo, peeking out behind a corner
        const cx = p.x - (i % 2 ? 1 : -1) * p.w / 2, cy = p.y - p.h / 2;
        el('circle', { cx, cy, r: unit, ...o });
        el('circle', { cx, cy, r: unit * 0.52, ...o });
        el('line', { x1: cx - unit * 1.35, y1: cy, x2: cx + unit * 1.35, y2: cy, ...o });
      } else if (i % 3 === 1) {
        const cx = edgeX + side * unit * 0.9, cy = p.y + p.h * 0.5;
        el('circle', { cx, cy, r: unit * 1.25, ...o });
        el('circle', { cx, cy, r: 5, fill: 'currentColor', stroke: 'none', opacity: 0.5 });
      } else {
        const y = p.y + p.h / 2 + unit * 0.7;
        el('line', { x1: 0, y1: y, x2: W, y2: y, ...o, opacity: 0.18 });
        el('rect', { x: edgeX + side * unit * 0.5 - unit * 0.3, y: p.y - unit * 0.3, width: unit * 0.6, height: unit * 0.6, ...o });
      }
    });

    let d = `M ${W / 2} 0`, prev = { x: W / 2, y: 0 };
    for (const p of [...pts, { x: W / 2, y: H }]) {
      const mid = (prev.y + p.y) / 2;
      d += ` C ${prev.x} ${mid}, ${p.x} ${mid}, ${p.x} ${p.y}`;
      prev = p;
    }
    line = el('path', { d, 'stroke-width': 1.5, opacity: 0.6 });
    lineLength = line.getTotalLength();
    line.style.strokeDasharray = lineLength;
    update();
  }

  function update() {
    const vh = window.innerHeight;
    if (line) {
      const top = stream.getBoundingClientRect().top;
      const progress = still ? 1 : Math.max(0, Math.min(1, (vh * 0.65 - top) / stream.offsetHeight));
      line.style.strokeDashoffset = lineLength * (1 - progress);
    }
    if (still) return;
    for (const s of shots) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const off = Math.min(1, Math.abs((r.top + r.height / 2 - vh / 2) / vh));
      const img = s.firstElementChild;
      img.style.transform = `scale(${1 - off * 0.24})`;
      img.style.opacity = 1 - off * 0.45;
    }
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  new ResizeObserver(draw).observe(stream);
  draw();
}

document.querySelectorAll('.deck').forEach(deck => {
  const flip = () => deck.classList.toggle('flipped');
  deck.addEventListener('click', flip);
  deck.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
});
