
// ── Theme toggle ─────────────────────────────────────────
(function() {
  const html = document.documentElement;
  const STORAGE_KEY = 'ss-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }

  function applyTheme(theme, animate) {
    if (animate) {
      html.setAttribute('data-theme-transition', '');
      setTimeout(() => html.removeAttribute('data-theme-transition'), 350);
    }
    html.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon && label) {
      if (theme === 'dark') {
        icon.innerHTML = '&#9788;';
        label.textContent = 'Light';
      } else {
        icon.innerHTML = '&#9790;';
        label.textContent = 'Dark';
      }
    }
  }

  applyTheme(getPreferredTheme(), false);

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark', true);
    }
  });

  window.toggleTheme = function() {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, true);
  };
})();

// ── Photo morph ─────────────────────────────────────────
const MARINE_IMG = "images/marine.jpg";
const PRO_IMG = "images/pro.jpg";

const canvas = document.getElementById('morphCanvas');
const ctx = canvas.getContext('2d');
const label = document.getElementById('morphLabel');
const replayBtn = document.getElementById('replayBtn');

const W = 600;
const H = 750;
canvas.width = W;
canvas.height = H;

const BG_R = 13, BG_G = 15, BG_B = 20;

let marineData = null;
let proData = null;

let phase = 'marine-hold';
let phaseTimer = 0;
let morphProgress = 0;
let animId = null;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function getImageData(img) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const cx = c.getContext('2d');

  // Cover-crop: scale to fill canvas while preserving aspect ratio
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const sx = (W - sw) / 2;
  const sy = (H - sh) / 2;

  // Grayscale
  cx.filter = 'grayscale(1)';
  cx.drawImage(img, sx, sy, sw, sh);
  cx.filter = 'none';

  return cx.getImageData(0, 0, W, H);
}

// Concentric circular vignette with softer falloff.
// Uses true circular distance from center (equal in x and y)
// with a gentler fade curve.
function vignetteAlpha(x, y) {
  const cx = W / 2;
  const cy = H / 2;
  // Normalize distance so that the circle fits the smaller dimension
  const maxR = Math.min(W, H) * 0.48;
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  const norm = d / maxR;
  // Softer falloff: fully opaque until 0.55, then gentle ease to 0 at 1.4
  if (norm < 0.55) return 1;
  if (norm > 1.4) return 0;
  // Smooth cosine fade
  const t = (norm - 0.55) / (1.4 - 0.55);
  return 0.5 + 0.5 * Math.cos(t * Math.PI);
}

// Draw a sharp photo with circular vignette blending into bg
function drawSharpPhoto(imgData) {
  ctx.putImageData(imgData, 0, 0);
}

// Particle system — only active during morph transition
const PARTICLE_GAP = 2;
let particles = [];

function buildParticles() {
  particles = [];
  for (let y = 0; y < H; y += PARTICLE_GAP) {
    for (let x = 0; x < W; x += PARTICLE_GAP) {
      const idx = (y * W + x) * 4;
      const mBright = marineData.data[idx];
      const pBright = proData.data[idx];
      particles.push({
        mx: x, my: y, mColor: mBright,
        px: x, py: y, pColor: pBright,
        sx: (Math.random() - 0.5) * 100,
        sy: (Math.random() - 0.5) * 100,
        vAlpha: 1,
        size: PARTICLE_GAP,
      });
    }
  }
}

function startAnimation() {
  phase = 'marine-hold';
  phaseTimer = 0;
  morphProgress = 0;
  label.textContent = 'Marine \u2014 Iraq, 2005';
  label.style.opacity = '1';
  replayBtn.classList.remove('visible');
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(animate);
}

function replay() {
  buildParticles();
  startAnimation();
}

function animate(time) {
  ctx.fillStyle = `rgb(${BG_R}, ${BG_G}, ${BG_B})`;
  ctx.fillRect(0, 0, W, H);

  phaseTimer++;
  const HOLD_MARINE = 110;
  const MORPH_DURATION = 150;

  switch (phase) {
    case 'marine-hold':
      morphProgress = 0;
      drawSharpPhoto(marineData);
      if (phaseTimer > HOLD_MARINE) {
        phase = 'morphing';
        phaseTimer = 0;
      }
      break;

    case 'morphing':
      morphProgress = easeInOutCubic(Math.min(phaseTimer / MORPH_DURATION, 1));
      if (phaseTimer === Math.floor(MORPH_DURATION * 0.45)) {
        label.style.opacity = '0';
      }
      if (phaseTimer === Math.floor(MORPH_DURATION * 0.65)) {
        label.textContent = 'Designer. Researcher. Builder. \u2014 Present';
        label.style.opacity = '1';
      }
      drawMorphFrame();
      if (phaseTimer > MORPH_DURATION) {
        phase = 'pro-settle';
        phaseTimer = 0;
        morphProgress = 1;
      }
      break;

    case 'pro-settle':
      // Brief transition from particles back to sharp photo
      morphProgress = 1;
      const settleT = Math.min(phaseTimer / 30, 1);  // ~0.5s settle
      if (settleT < 1) {
        drawMorphFrame();
      } else {
        drawSharpPhoto(proData);
      }
      if (phaseTimer > 50) {
        phase = 'done';
        replayBtn.classList.add('visible');
      }
      break;

    case 'done':
      drawSharpPhoto(proData);
      cancelAnimationFrame(animId);
      animId = null;
      return;
  }

  animId = requestAnimationFrame(animate);
}

function drawMorphFrame() {
  const scatterAmount = Math.sin(morphProgress * Math.PI) * 0.4;

  for (const p of particles) {
    let tx = lerp(p.mx, p.px, morphProgress);
    let ty = lerp(p.my, p.py, morphProgress);

    if (scatterAmount > 0) {
      tx += p.sx * scatterAmount;
      ty += p.sy * scatterAmount;
    }

    const brightness = Math.round(lerp(p.mColor, p.pColor, morphProgress));
    let alpha = p.vAlpha;

    if (scatterAmount > 0.05) {
      alpha *= (1 - scatterAmount * 0.15);
    }

    if (alpha < 0.02) continue;
    if (tx < -30 || tx > W + 30 || ty < -30 || ty > H + 30) continue;

    const r = Math.round(brightness * alpha + BG_R * (1 - alpha));
    const g = Math.round(brightness * alpha + BG_G * (1 - alpha));
    const b = Math.round(brightness * alpha + BG_B * (1 - alpha));

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(tx, ty, p.size, p.size);
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

async function init() {
  const mImg = await loadImage(MARINE_IMG);
  const pImg = await loadImage(PRO_IMG);
  marineData = getImageData(mImg);
  proData = getImageData(pImg);
  buildParticles();
  startAnimation();
}

init();

// ── Scroll & nav ────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Case study toggle
document.querySelectorAll('.case-study-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.querySelector('.toggle-label').textContent = expanded ? 'Read the case study' : 'Close case study';
    if (expanded) {
      panel.hidden = true;
    } else {
      panel.hidden = false;
      // Smooth scroll to panel
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  });
});



// ── Case study screenshot carousel ──
(function() {
  var track = document.getElementById('csCarouselTrack');
  var caption = document.getElementById('csCarouselCaption');
  var counter = document.getElementById('csCarouselCounter');
  var prevBtn = document.getElementById('csCarouselPrev');
  var nextBtn = document.getElementById('csCarouselNext');
  var dots = document.querySelectorAll('.cs-carousel-dot');
  if (!track) return;

  var captions = [
    'Transcript Annotation \u2014 highlighted passages with hierarchical tag panel',
    'Affinity Mapping \u2014 drag-and-drop thematic grouping across sessions',
    'Infinite Whiteboard \u2014 freeform synthesis canvas for connecting findings',
    'Research Stories \u2014 narrative structure with supporting evidence attached',
    'Analytics Dashboard \u2014 theme distribution and synthesis progress'
  ];

  var current = 0;
  var total = captions.length;

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    caption.textContent = captions[current];
    counter.textContent = (current + 1) + ' / ' + total;
    dots.forEach(function(d, i) { d.setAttribute('aria-selected', i === current ? 'true' : 'false'); });
  }

  prevBtn.addEventListener('click', function() { goTo(current - 1); });
  nextBtn.addEventListener('click', function() { goTo(current + 1); });
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() { goTo(parseInt(dot.dataset.slide)); });
  });

  var carouselRegion = track.closest('.cs-carousel');
  if (carouselRegion) {
    carouselRegion.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); e.preventDefault(); }
    });
  }
})();

// ── Screenshot lightbox ──
(function() {
  var lightbox = document.getElementById('csLightbox');
  var lightboxImg = document.getElementById('csLightboxImg');
  var closeBtn = document.getElementById('csLightboxClose');
  if (!lightbox || !lightboxImg || !closeBtn) {
    console.warn('Lightbox elements missing', { lightbox: !!lightbox, lightboxImg: !!lightboxImg, closeBtn: !!closeBtn });
    return;
  }

  function openLightbox(img) {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    try { closeBtn.focus(); } catch (e) {}
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Delegated click handler — works regardless of when the case study panel opens
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.cs-expand-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      var slide = btn.closest('.cs-carousel-slide');
      var img = slide && slide.querySelector('img');
      if (img) openLightbox(img);
      return;
    }
    var phone = e.target.closest('.phone');
    if (phone) {
      e.preventDefault();
      e.stopPropagation();
      var phoneImg = phone.querySelector('img');
      if (phoneImg) openLightbox(phoneImg);
      return;
    }
    if (e.target === lightbox) closeLightbox();
  });

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeLightbox();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
})();
