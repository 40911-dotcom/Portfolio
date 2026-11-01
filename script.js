/* Portfólio — Rafael Coelho Balieiro | Vanilla JS, cada bloco é independente */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== 1. ENTRADA ===== */
  const intro = $('#intro'), fragsEl = $('#frags');
  const HOLD_MS = 1600;          // tempo que o visitante precisa segurar
  const COLS = 9, ROWS = 6;      // quantidade de "cacos" de vidro
  let p = 0, holding = false, broken = false, last = 0;

  function buildFrags() {
    // grade de pontos com variação aleatória -> triângulos irregulares
    const pts = [];
    for (let y = 0; y <= ROWS; y++) {
      pts[y] = [];
      for (let x = 0; x <= COLS; x++) {
        const edgeX = x === 0 || x === COLS, edgeY = y === 0 || y === ROWS;
        pts[y][x] = [
          x / COLS * 100 + (edgeX ? 0 : (Math.random() - .5) * 70 / COLS),
          y / ROWS * 100 + (edgeY ? 0 : (Math.random() - .5) * 70 / ROWS)
        ];
      }
    }
    const tris = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const a = pts[y][x], b = pts[y][x + 1], c = pts[y + 1][x + 1], d = pts[y + 1][x];
      if (Math.random() > .5) { tris.push([a, b, c], [a, c, d]); } else { tris.push([a, b, d], [b, c, d]); }
    }
    const frag = document.createDocumentFragment();
    tris.forEach(t => {
      const el = document.createElement('div');
      el.className = 'frag';
      el.style.clipPath = `polygon(${t.map(q => q[0].toFixed(2) + '% ' + q[1].toFixed(2) + '%').join(',')})`;
      const l = 8 + Math.random() * 5;
      el.style.background = `hsl(26 38% ${l}%)`;
      // direção de fuga: do ponto de impacto (centro) para fora
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3 - 50, cy = (t[0][1] + t[1][1] + t[2][1]) / 3 - 50;
      const dist = Math.hypot(cx, cy), k = 14 + Math.random() * 10;
      el.style.setProperty('--tx', (cx / (dist || 1) * k * (.6 + dist / 30)).toFixed(1) + 'vw');
      el.style.setProperty('--ty', (cy / (dist || 1) * k * (.6 + dist / 30) + 25 + Math.random() * 30).toFixed(1) + 'vh');
      el.style.setProperty('--r', ((Math.random() - .5) * 140).toFixed(0) + 'deg');
      el.style.setProperty('--d', (dist / 70 * .35).toFixed(2) + 's');
      frag.appendChild(el);
    });
    fragsEl.appendChild(frag);
  }

  function setP(v) {
    p = Math.max(0, Math.min(1, v));
    intro.style.setProperty('--p', p);
    intro.classList.toggle('holding', holding);
    intro.classList.toggle('tense', p > .55 && !broken);
  }

  function loop(t) {
    if (broken) return;
    const dt = last ? t - last : 16; last = t;
    setP(p + (holding ? dt / HOLD_MS : -dt / HOLD_MS * 1.6));
    if (p >= 1) return shatter();
    requestAnimationFrame(loop);
  }
  function startHold() { if (broken || holding) return; holding = true; last = 0; requestAnimationFrame(loop); }
  function endHold() { holding = false; }

  function shatter() {
    if (broken) return; broken = true; holding = false;
    intro.classList.remove('holding', 'tense');
    intro.classList.add('broken');
    enter(1900);
  }
  function enter(wait = 0) {
    document.body.classList.remove('locked');
    document.body.classList.add('ready');
    setTimeout(() => { intro.classList.add('gone'); $('#main').focus({ preventScroll: true }); }, wait);
  }

  buildFrags();
  intro.addEventListener('pointerdown', e => { if (e.target.id === 'skip') return; e.preventDefault(); startHold(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => intro.addEventListener(ev, endHold));
  intro.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => { if (!intro.classList.contains('gone') && (e.key === 'Enter' || e.key === ' ') && e.target.id !== 'skip') { e.preventDefault(); startHold(); } });
  addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') endHold(); });
  $('#skip').addEventListener('click', () => { broken = true; intro.style.transition = 'opacity .5s'; intro.style.opacity = 0; enter(500); });
  if (reduce) { broken = true; intro.classList.add('gone'); enter(); } else { intro.focus(); }

  /* ===== 2. MENU ===== */
  const nav = $('#nav'), menu = $('#menu'), btn = $('#menuBtn');
  const setMenu = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

  // seção atual
  const links = $$('a', menu);
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(s => spy.observe(s));

  /* ===== 8. REVELAÇÃO AO ROLAR ===== */
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ===== 7. FORMULÁRIO (envio real via fetch; sem simulação) ===== */
  const form = $('#form'), status = $('#status');
  const rules = {
    nome: v => v.trim().length >= 2 || 'Digite seu nome (mínimo 2 letras).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Digite um e-mail válido, como nome@email.com.',
    mensagem: v => v.trim().length >= 10 || 'Escreva pelo menos 10 caracteres.'
  };
  function check(input) {
    const r = rules[input.name](input.value), f = input.closest('.field');
    f.classList.toggle('ok', r === true); f.classList.toggle('bad', r !== true && input.value !== '');
    $('small', f).textContent = r === true || input.value === '' ? '' : r;
    return r === true;
  }
  $$('input,textarea', form).forEach(i => i.addEventListener('input', () => check(i)));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = '';
    const ok = $$('input,textarea', form).map(check).every(Boolean);
    if (!ok) { status.className = 'err'; status.textContent = 'Corrija os campos destacados e envie de novo.'; return; }
    if (form.action.includes('SEU_ID')) { status.className = 'err'; status.textContent = 'Envio ainda não configurado: troque SEU_ID no atributo action do formulário (index.html).'; return; }
    status.textContent = 'Enviando…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      form.reset(); $$('.field', form).forEach(f => f.classList.remove('ok', 'bad'));
      status.className = 'good'; status.textContent = 'Mensagem enviada. Obrigado pelo contato!';
    } catch { status.className = 'err'; status.textContent = 'Não foi possível enviar. Verifique a conexão e tente de novo.'; }
  });
})();
