/* NP Gruppen – interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Header shadow on scroll */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Stäng meny' : 'Öppna meny');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Active nav link */
  const links = $$('.nav a[href^="#"]:not(.btn)');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navIO.observe(s));

  /* Reveal on scroll */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => {
    // stagger siblings in grids
    const parent = el.parentElement;
    if (parent && parent.matches('.services, .steps, .reviews, .gallery')) {
      el.style.transitionDelay = `${([...parent.children].indexOf(el) % 4) * 0.08}s`;
    }
    revealIO.observe(el);
  });

  /* Count-up numbers */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const end = +el.dataset.count;
      const start = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* Pre-select service when clicking "Begär offert" on a card */
  const select = $('#tjanst');
  $$('[data-service]').forEach((a) => a.addEventListener('click', () => {
    const v = a.dataset.service;
    const opt = [...select.options].find((o) => o.text === v);
    if (opt) select.value = opt.value;
  }));

  /* Lightbox */
  const items = $$('.gallery__item');
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbTitle = $('#lbTitle');
  const lbDesc = $('#lbDesc');
  let idx = 0;
  let lastFocus = null;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    const img = $('img', it);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbTitle.textContent = it.dataset.title;
    lbDesc.textContent = it.dataset.desc;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  items.forEach((it, i) => it.addEventListener('click', () => open(i)));
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  /* Form – validates and opens the visitor's mail client (no backend needed) */
  const form = $('#offertForm');
  const msg = $('#formMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((input) => {
      const wrap = input.closest('.field, .check');
      const valid = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
      if (wrap) wrap.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    msg.className = 'form__msg';
    if (!ok) {
      msg.textContent = 'Fyll i de obligatoriska fälten och godkänn villkoren.';
      msg.classList.add('is-err');
      return;
    }
    const d = new FormData(form);
    const body = [
      `Kundtyp: ${d.get('kundtyp')}`,
      `Tjänst: ${d.get('tjanst')}`,
      `Namn/Företag: ${d.get('namn')}`,
      `Telefon: ${d.get('telefon') || '-'}`,
      `E-post: ${d.get('epost')}`,
      `Adress: ${d.get('adress') || '-'}`,
      '',
      d.get('meddelande') || '',
    ].join('\n');
    const subject = `Offertförfrågan – ${d.get('tjanst')}`;
    window.location.href = `mailto:kontakt@np-gruppen.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    msg.textContent = 'Tack! Ditt mejlprogram öppnas med förfrågan ifylld.';
    msg.classList.add('is-ok');
  });
  $$('[required]', form).forEach((input) => input.addEventListener('input', () => input.closest('.field, .check')?.classList.remove('is-invalid')));

  /* Hero video – respect reduced motion, pause when off-screen */
  const video = $('#heroVideo');
  if (video) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) { video.removeAttribute('autoplay'); video.pause(); }
    else {
      video.play().catch(() => {});
      new IntersectionObserver(([en]) => { en.isIntersecting ? video.play().catch(() => {}) : video.pause(); }).observe(video);
    }
  }

  /* Year */
  $('#year').textContent = new Date().getFullYear();
})();
