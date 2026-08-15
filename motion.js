/* ==========================================================================
   NUTRALUX — motion layer (StringTune)
   Подключается только на главных страницах.

   Принципы:
   • при prefers-reduced-motion библиотека не стартует вовсе — текст остаётся
     нетронутым, никаких span-обёрток и переходов;
   • если CDN не отдал библиотеку, страница просто остаётся статичной —
     сплит-стили в CSS привязаны к классу html.-string, который ставит
     сама StringTune, поэтому текст никогда не «пропадает»;
   • собственный скролл библиотеки выключен: якоря и инерция остаются
     нативными.
   ========================================================================== */

(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const boot = () => {
    const ns = window.StringTune;
    if (!ns || typeof ns.StringTune?.getInstance !== 'function') return;

    /* Магнитные кнопки — только там, где есть настоящий курсор. */
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (hasFinePointer && window.innerWidth > 1024) {
      document.querySelectorAll('[data-magnetic]').forEach((el) => {
        el.setAttribute('string', 'magnetic');
        el.setAttribute('string-radius', '130');
        el.setAttribute('string-strength', '0.28');
      });
    }

    const tune = ns.StringTune.getInstance();
    tune.use(ns.StringSplit);
    tune.use(ns.StringMagnetic);

    /* Нативный скролл. ВНИМАНИЕ: 'disable' у этой библиотеки означает
       «запретить прокрутку вообще», а не «не вмешиваться в неё».
       Нужен именно 'default'. */
    try {
      tune.scrollDesktopMode = 'default';
      tune.scrollMobileMode = 'default';
    } catch (err) {
      /* режим недоступен в этой сборке — не критично */
    }

    tune.start(60);
    normalizeWordGaps();
    revealSplitText();
  };

  /* Появление текста вешаем на собственный IntersectionObserver, а не на
     класс -inview из библиотеки: он обновляется её скролл-циклом, и стоит
     тому не отработать — текст остаётся невидимым навсегда. */
  const revealSplitText = () => {
    const targets = document.querySelectorAll('.home-content h1, .heading');
    if (!targets.length) return;

    const show = (el) => el.classList.add('is-revealed');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(show);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    targets.forEach((el) => observer.observe(el));

    /* Страховка: что бы ни случилось со сплитом и наблюдателем, через
       2.5 секунды текст обязан быть виден. */
    setTimeout(() => targets.forEach(show), 2500);
  };

  /* StringSplit склеивает слова неразрывным пробелом и убирает его у слова,
     которое на момент расчёта было последним в строке. Любой сдвиг лейаута
     после инициализации (подгрузка шрифта, изменение ширины) перестраивает
     строки — и пробел пропадает в середине фразы.
     Поэтому убираем её пробелы совсем и держим ритм слов на margin в CSS. */
  const NBSP = '\u00A0';

  const stripNbsp = (root) => {
    root.querySelectorAll('.-s-word').forEach((word) => {
      if (word.textContent.includes(NBSP)) {
        word.textContent = word.textContent.replaceAll(NBSP, '');
      }
    });
  };

  const normalizeWordGaps = () => {
    document.querySelectorAll('.heading').forEach((heading) => {
      stripNbsp(heading);
      /* Библиотека пересобирает разбиение на resize — держим руку на пульсе. */
      new MutationObserver(() => stripNbsp(heading))
        .observe(heading, { childList: true, subtree: true });
    });
  };

  /* Сплит обязан считать строки уже загруженным шрифтом: иначе он расставит
     неразрывные пробелы по строкам fallback-шрифта, и после подмены на
     Cormorant слова слипнутся. */
  const bootAfterFonts = () => {
    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(boot, boot);
    } else {
      boot();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAfterFonts, { once: true });
  } else {
    bootAfterFonts();
  }
})();
