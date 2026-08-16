/* ==========================================================================
   NUTRALUX — виджет поддержки

   Разметку строит сам скрипт: раньше она была скопирована в шесть HTML-файлов
   и расходилась между ними. Язык интерфейса берётся из <html lang>.
   ========================================================================== */

(() => {
  const API_URL = 'https://support-backend-with-rag.onrender.com/api/chat';
  const LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const MARK = 'images/logo-mark.png';

  const T = {
    ru: {
      title: 'Поддержка Nutralux',
      status: 'Обычно отвечаем сразу',
      open: 'Открыть чат поддержки',
      close: 'Закрыть чат',
      reset: 'Начать заново',
      placeholder: 'Спросите о составе, приёме, подборе…',
      hint: 'Enter — отправить, Shift+Enter — новая строка',
      heroTitle: 'Чем помочь?',
      heroText: 'Подскажем состав, дозировку и поможем выбрать формулу под вашу задачу.',
      steps: ['Читаю ваш вопрос…', 'Ищу по составам и описаниям…', 'Готовлю ответ…'],
      copy: 'Копировать',
      copied: 'Скопировано',
      error: 'Не удалось связаться с поддержкой. Попробуйте ещё раз.',
      slow: 'Сервис просыпается, первый ответ может занять до минуты…',
      fallback: 'Извините, сейчас не получилось ответить.',
      cards: [
        { t: 'Подбор', d: 'Что подойдёт для иммунитета?', q: 'Что подойдёт для иммунитета?' },
        { t: 'Приём', d: 'Как принимать магний?', q: 'Как правильно принимать магний B6?' },
        { t: 'Состав', d: 'Что внутри омеги-3?', q: 'Какой состав у Омега-3 1000 мг?' },
        { t: 'Детям', d: 'Что можно детям?', q: 'Какие добавки подходят детям?' },
      ],
    },
    en: {
      title: 'Nutralux Support',
      status: 'Usually replies right away',
      open: 'Open support chat',
      close: 'Close chat',
      reset: 'Start over',
      placeholder: 'Ask about ingredients, dosage, choice…',
      hint: 'Enter to send, Shift+Enter for a new line',
      heroTitle: 'How can we help?',
      heroText: 'We can explain ingredients and dosages, and help you pick a formula for your goal.',
      steps: ['Reading your question…', 'Searching formulas and descriptions…', 'Composing the answer…'],
      copy: 'Copy',
      copied: 'Copied',
      error: 'Could not reach support. Please try again.',
      slow: 'The service is waking up, the first answer may take up to a minute…',
      fallback: 'Sorry, I could not answer right now.',
      cards: [
        { t: 'Choosing', d: 'What supports immunity?', q: 'What do you recommend for immunity?' },
        { t: 'Dosage', d: 'How to take magnesium?', q: 'How should I take Magnesium B6?' },
        { t: 'Ingredients', d: "What's inside Omega-3?", q: 'What are the ingredients of Omega-3 1000 mg?' },
        { t: 'For kids', d: 'What suits children?', q: 'Which supplements are suitable for children?' },
      ],
    },
  }[LANG];

  const ICONS = {
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    copy: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
  };

  const svg = (paths, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  /* ── разметка ── */
  const root = document.createElement('div');
  root.id = 'nx-chat';
  root.innerHTML = `
    <div class="nx-panel" role="dialog" aria-label="${escapeHtml(T.title)}" aria-modal="false">
      <div class="nx-toast" id="nx-toast" role="status"></div>

      <header class="nx-head">
        <div class="nx-avatar"><img src="${MARK}" alt="" width="30" height="31" /></div>
        <div class="nx-head-text">
          <b>${escapeHtml(T.title)}</b>
          <span class="nx-status"><i class="nx-dot"></i>${escapeHtml(T.status)}</span>
        </div>
        <button class="nx-head-btn" id="nx-reset" title="${escapeHtml(T.reset)}" aria-label="${escapeHtml(T.reset)}">${svg(ICONS.reset)}</button>
        <button class="nx-head-btn" id="nx-close" title="${escapeHtml(T.close)}" aria-label="${escapeHtml(T.close)}">${svg(ICONS.close)}</button>
      </header>

      <div class="nx-feed" id="nx-feed"></div>

      <div class="nx-dock">
        <div class="nx-input-glass" id="nx-glass">
          <textarea class="nx-input" id="nx-input" rows="1" placeholder="${escapeHtml(T.placeholder)}" aria-label="${escapeHtml(T.placeholder)}"></textarea>
          <button class="nx-send" id="nx-send" disabled aria-label="${escapeHtml(T.title)}">${svg(ICONS.send)}</button>
        </div>
        <p class="nx-hint">${escapeHtml(T.hint)}</p>
      </div>
    </div>

    <button class="nx-launcher" id="nx-launcher" aria-label="${escapeHtml(T.open)}" aria-expanded="false">
      ${svg(ICONS.chat, 'nx-ico-chat')}
      ${svg(ICONS.close, 'nx-ico-close')}
    </button>
  `;
  document.body.appendChild(root);

  const $ = (id) => root.querySelector('#' + id);
  const feed = $('nx-feed');
  const input = $('nx-input');
  const sendBtn = $('nx-send');
  const glass = $('nx-glass');
  const toast = $('nx-toast');
  const launcher = $('nx-launcher');

  let history = [];
  const answers = {};

  /* ── форматирование ответа ── */
  const format = (text) => {
    let html = escapeHtml(text);

    html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
      `<div class="nx-code"><div class="nx-code-head"><i></i><i></i><i></i></div><div class="nx-code-body">${code.trim()}</div></div>`);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?:^|\n)(\d+)\.\s+(.+)/g,
      '<div class="nx-li"><span class="nx-li-mark">$1.</span><span>$2</span></div>');
    html = html.replace(/(?:^|\n)[-•*]\s+(.+)/g,
      '<div class="nx-li"><span class="nx-li-mark">•</span><span>$1</span></div>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/(<br>)+(<div class="nx-li">)/g, '$2');
    html = html.replace(/(<br>)+(<div class="nx-code">)/g, '$2');
    return html;
  };

  const scroll = () => feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

  /* ── экран приветствия ── */
  const renderHero = () => {
    feed.innerHTML = `
      <div class="nx-hero">
        <h3>${escapeHtml(T.heroTitle)}</h3>
        <p>${escapeHtml(T.heroText)}</p>
        <div class="nx-cards">
          ${T.cards.map((c, i) => `
            <button class="nx-card" type="button" data-q="${i}">
              <b>${escapeHtml(c.t)}</b>
              <span>${escapeHtml(c.d)}</span>
            </button>`).join('')}
        </div>
      </div>`;

    feed.querySelectorAll('.nx-card').forEach((card) => {
      card.addEventListener('click', () => {
        input.value = T.cards[Number(card.dataset.q)].q;
        resize();
        send();
      });
    });
  };

  const addUser = (text) => {
    feed.querySelector('.nx-hero')?.remove();
    const row = document.createElement('div');
    row.className = 'nx-row user';
    row.innerHTML = `
      <div class="nx-msg-avatar">${LANG === 'ru' ? 'Я' : 'You'}</div>
      <div class="nx-body"><div class="nx-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div></div>`;
    feed.appendChild(row);
    scroll();
  };

  /* Ответ проявляется блоками — так он читается как живая речь, а не
     возникает стеной текста. */
  const reveal = (host, html, done) => {
    host.innerHTML = html;
    const parts = [...host.childNodes];

    parts.forEach((node) => {
      if (node.nodeType !== 1) return;
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      node.style.transition = 'opacity .35s ease, transform .35s ease';
    });

    let i = 0;
    const step = () => {
      if (i >= parts.length) { done?.(); return; }
      const node = parts[i++];
      if (node.nodeType === 1) {
        node.style.opacity = '1';
        node.style.transform = 'none';
        scroll();
      }
      setTimeout(step, 45);
    };
    step();
  };

  const addBot = (text) => {
    const id = 'a' + Date.now();
    answers[id] = text;

    const row = document.createElement('div');
    row.className = 'nx-row bot';
    row.innerHTML = `
      <div class="nx-msg-avatar"><img src="${MARK}" alt="" width="22" height="23" /></div>
      <div class="nx-body">
        <div class="nx-bubble" id="b-${id}"></div>
        <div class="nx-meta" style="opacity:0;transition:opacity .4s ease">
          <button class="nx-copy" type="button" data-copy="${id}">${svg(ICONS.copy)}<span>${escapeHtml(T.copy)}</span></button>
        </div>
      </div>`;
    feed.appendChild(row);

    const meta = row.querySelector('.nx-meta');
    reveal(row.querySelector('#b-' + id), format(text), () => {
      meta.style.opacity = '1';
      scroll();
    });

    row.querySelector('[data-copy]').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      navigator.clipboard?.writeText(answers[id]).then(() => {
        btn.innerHTML = `${svg(ICONS.check)}<span>${escapeHtml(T.copied)}</span>`;
        setTimeout(() => {
          btn.innerHTML = `${svg(ICONS.copy)}<span>${escapeHtml(T.copy)}</span>`;
        }, 2000);
      });
    });

    scroll();
  };

  /* ── индикатор работы ── */
  let stepTimers = [];

  const showSteps = () => {
    const row = document.createElement('div');
    row.className = 'nx-row bot';
    row.id = 'nx-thinking';
    row.innerHTML = `
      <div class="nx-msg-avatar"><img src="${MARK}" alt="" width="22" height="23" /></div>
      <div class="nx-body">
        <div class="nx-steps">
          ${T.steps.map((s, i) => `
            <div class="nx-step" data-step="${i}" style="opacity:${i === 0 ? 1 : .35}">
              <span class="nx-spin"></span>${escapeHtml(s)}
            </div>`).join('')}
        </div>
        <div class="nx-shimmer"><i></i><i></i><i></i></div>
      </div>`;
    feed.appendChild(row);
    scroll();

    const mark = (index) => {
      const cur = row.querySelector(`[data-step="${index}"]`);
      const next = row.querySelector(`[data-step="${index + 1}"]`);
      cur?.classList.add('done');
      if (next) next.style.opacity = '1';
    };

    stepTimers = [
      setTimeout(() => mark(0), 900),
      setTimeout(() => mark(1), 2600),
      /* Render усыпляет бесплатный сервис — предупреждаем, если долго */
      setTimeout(() => showToast(T.slow), 9000),
    ];
  };

  const hideSteps = () => {
    stepTimers.forEach(clearTimeout);
    stepTimers = [];
    root.querySelector('#nx-thinking')?.remove();
  };

  let toastTimer = null;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
  };

  /* ── поле ввода ── */
  const resize = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 132) + 'px';
    const filled = input.value.trim().length > 0;
    sendBtn.disabled = !filled;
    glass.classList.toggle('is-active', filled);
  };

  const send = async () => {
    const text = input.value.trim();
    if (!text) return;

    addUser(text);
    history.push({ role: 'user', content: text });

    input.value = '';
    resize();
    input.disabled = true;
    sendBtn.disabled = true;
    showSteps();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      const answer = data.answer || T.fallback;

      hideSteps();
      addBot(answer);
      history.push({ role: 'assistant', content: answer });
    } catch (err) {
      console.error('Чат поддержки:', err);
      hideSteps();
      showToast(T.error);
    } finally {
      input.disabled = false;
      resize();
      input.focus();
    }
  };

  /* ── события ── */
  const open = (state) => {
    root.classList.toggle('is-open', state);
    root.classList.add('is-touched');
    launcher.setAttribute('aria-expanded', String(state));
    launcher.setAttribute('aria-label', state ? T.close : T.open);
    if (state) setTimeout(() => input.focus(), 320);
  };

  launcher.addEventListener('click', () => open(!root.classList.contains('is-open')));
  $('nx-close').addEventListener('click', () => open(false));

  $('nx-reset').addEventListener('click', () => {
    history = [];
    renderHero();
    input.focus();
  });

  input.addEventListener('input', resize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  sendBtn.addEventListener('click', send);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) open(false);
  });

  renderHero();
})();
