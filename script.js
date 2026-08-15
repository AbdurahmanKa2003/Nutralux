/* ==========================================================================
   NUTRALUX — core UI script
   Загружается на всех страницах. Каждый блок изолирован и проверяет наличие
   своих узлов, поэтому отсутствующий элемент больше не обрывает весь файл.
   ========================================================================== */

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
