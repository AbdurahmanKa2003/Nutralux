/* ==========================================================================
   NUTRALUX — core UI script
   Загружается на всех страницах. Каждый блок изолирован и проверяет наличие
   своих узлов, поэтому отсутствующий элемент больше не обрывает весь файл.
   ========================================================================== */

/* ==================== снятие входной заставки ====================
   CSS уводит её сам; это подстраховка на случай, если анимация не
   отработала — заставка не должна перекрывать сайт ни при каких условиях. */
(() => {
  const intro = document.querySelector('.intro');
  if (!intro) return;

  const drop = () => intro.remove();

  intro.addEventListener('animationend', (e) => {
    if (e.animationName === 'intro-out') drop();
  });

  setTimeout(drop, 2200);

  /* Сценарий входа отыгран — снимаем режим, дальше всё живёт обычной жизнью. */
  setTimeout(() => document.documentElement.classList.remove('js-intro'), 2400);
})();

/* ==================== мобильное меню ==================== */
(() => {
  const menuIcon = document.querySelector('#menu-icon');
  const navbar = document.querySelector('.navbar');
  if (!menuIcon || !navbar) return;

  const closeMenu = () => {
    menuIcon.classList.remove('bx-x');
    navbar.classList.remove('active');
    menuIcon.setAttribute('aria-expanded', 'false');
  };

  menuIcon.setAttribute('role', 'button');
  menuIcon.setAttribute('tabindex', '0');
  menuIcon.setAttribute('aria-expanded', 'false');

  menuIcon.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('active');
    menuIcon.classList.toggle('bx-x', isOpen);
    menuIcon.setAttribute('aria-expanded', String(isOpen));
  });

  menuIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      menuIcon.click();
    }
  });

  navbar.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', closeMenu, { passive: true });
})();

/* ==================== состояние шапки при скролле ==================== */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  const sync = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
})();

/* ==================== появление блоков при скролле ====================
   Заменяет ScrollReveal: ~20 строк вместо ~15 KB библиотеки.           */
(() => {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.1 });

  items.forEach((el) => observer.observe(el));
})();

/* ==================== витрина в первом экране ====================
   Товар в сцене меняется сам, подпись и точки следуют за ним.         */
(() => {
  const stage = document.querySelector('.stage-products');
  const caption = document.querySelector('.stage-caption');
  const dots = document.querySelector('.stage-dots');
  if (!stage || !caption || !dots) return;

  const slides = [...stage.querySelectorAll('.stage-product')];
  if (slides.length < 2) return;

  const title = caption.querySelector('b');
  const sub = caption.querySelector('span');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;

  const show = (next) => {
    if (next === index) return;
    index = next;

    slides.forEach((el, i) => el.classList.toggle('is-active', i === index));
    [...dots.children].forEach((el, i) => el.setAttribute('aria-selected', String(i === index)));

    caption.classList.add('is-swapping');
    setTimeout(() => {
      title.textContent = slides[index].dataset.name || '';
      sub.textContent = slides[index].dataset.sub || '';
      caption.classList.remove('is-swapping');
    }, 320);
  };

  const restart = () => {
    if (reduced) return;
    clearInterval(timer);
    timer = setInterval(() => show((index + 1) % slides.length), 4600);
  };

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', String(i === 0));
    dot.setAttribute('aria-label', slide.dataset.name || `#${i + 1}`);
    dot.addEventListener('click', () => {
      show(i);
      restart();
    });
    dots.appendChild(dot);
  });

  restart();

  /* Не крутим витрину, пока вкладка не на экране. */
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (!document.hidden) restart();
  });
})();

/* ==================== свет за курсором в сцене ==================== */
(() => {
  const hero = document.querySelector('.home');
  const glow = document.querySelector('.stage-glow');
  if (!hero || !glow) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let raf = null;

  hero.addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width).toFixed(3));
      glow.style.setProperty('--my', ((e.clientY - r.top) / r.height).toFixed(3));
      raf = null;
    });
  }, { passive: true });
})();

/* ==================== индикатор прочитанного ==================== */
(() => {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    bar.style.setProperty('--read', Math.min(1, Math.max(0, value)).toFixed(4));
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

/* ==================== счётчики чисел ==================== */
(() => {
  const numbers = document.querySelectorAll('[data-count]');
  if (!numbers.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  const run = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (!Number.isFinite(target)) return;

    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };

    el.textContent = '0' + suffix;
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  numbers.forEach((el) => observer.observe(el));
})();

/* ==================== валидация контактной формы ==================== */
(() => {
  const EMAIL_REGEXP = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEXP = /^[\d+][\d()\s-]{8,16}\d$/;

  const bind = (input, regexp, message) => {
    if (!input) return;
    input.addEventListener('input', function () {
      this.setCustomValidity(regexp.test(this.value) ? '' : message);
    });
  };

  bind(document.getElementById('email'), EMAIL_REGEXP, 'Проверьте правильность введённого email');
  bind(document.getElementById('phone'), PHONE_REGEXP, 'Проверьте правильность введённого номера телефона');
})();

/* ==================== подгонка изображений товара ====================
   Нужна только страницам с .product-image-container (каталог/товар).   */
(() => {
  const images = document.querySelectorAll('.product-image-container img');
  if (!images.length) return;

  const adjust = () => {
    images.forEach((img) => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const isWide = img.naturalWidth / img.naturalHeight > 1;
      img.style.maxWidth = isWide ? '95%' : 'none';
      img.style.maxHeight = isWide ? 'none' : '95%';
    });
  };

  adjust();
  window.addEventListener('load', adjust);
  window.addEventListener('resize', adjust, { passive: true });
})();
