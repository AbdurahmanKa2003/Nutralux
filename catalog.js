/* ==========================================================================
   NUTRALUX — каталог
   Один скрипт на обе языковые версии: тексты и пути приходят из data-*
   атрибутов сетки, поэтому логика не дублируется между catalog.html
   и catalog-en.html.
   ========================================================================== */

(() => {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const cfg = {
    source: grid.dataset.source || 'products-en.json',
    productPage: grid.dataset.productPage || 'product-en.html',
    labelAll: grid.dataset.labelAll || 'All',
    labelDetails: grid.dataset.labelDetails || 'Learn more',
    labelEmpty: grid.dataset.labelEmpty || 'No products in this category yet.',
    labelError: grid.dataset.labelError || 'Could not load the catalog. Please try again later.',
    labelCount: grid.dataset.labelCount || '{n} products',
  };

  const filtersRow = document.querySelector('.filters-row');
  const counter = document.querySelector('.catalog-count');

  let items = [];
  let active = null;

  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const card = (p) => `
    <article class="product-card">
      <a class="product-card__media" href="${cfg.productPage}?slug=${encodeURIComponent(p.slug)}" tabindex="-1" aria-hidden="true">
        <img src="${escape(p.image)}" alt="" loading="lazy" decoding="async" width="1200" height="1200" />
      </a>
      <div class="product-card__body">
        <p class="product-card__cat">${escape(p.category)}</p>
        <h3>${escape(p.name)}</h3>
        <p>${escape(p.short)}</p>
        <a class="product-card__link" href="${cfg.productPage}?slug=${encodeURIComponent(p.slug)}">
          ${escape(cfg.labelDetails)} <i class="bx bx-right-arrow-alt" aria-hidden="true"></i>
        </a>
      </div>
    </article>`;

  const render = () => {
    const shown = active ? items.filter((p) => p.category === active) : items;

    grid.innerHTML = shown.length
      ? shown.map(card).join('')
      : `<div class="empty-catalog"><i class="bx bx-info-circle"></i><p>${escape(cfg.labelEmpty)}</p></div>`;

    if (counter) counter.textContent = cfg.labelCount.replace('{n}', String(shown.length));
  };

  const buildFilters = () => {
    if (!filtersRow) return;

    const categories = [...new Set(items.map((p) => p.category))].sort((a, b) => a.localeCompare(b));

    const makeChip = (label, value) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = label;
      chip.setAttribute('aria-pressed', String(active === value));
      chip.addEventListener('click', () => {
        active = value;
        filtersRow.querySelectorAll('.chip').forEach((el) => {
          el.setAttribute('aria-pressed', String(el === chip));
        });
        render();
      });
      return chip;
    };

    filtersRow.replaceChildren(
      makeChip(cfg.labelAll, null),
      ...categories.map((cat) => makeChip(cat, cat)),
    );
  };

  const load = async () => {
    try {
      const resp = await fetch(cfg.source, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      items = await resp.json();
      buildFilters();
      render();
    } catch (err) {
      console.error('Каталог не загрузился:', err);
      grid.innerHTML = `<div class="error-message"><i class="bx bx-error-alt"></i><p>${escape(cfg.labelError)}</p></div>`;
      if (counter) counter.textContent = '';
    }
  };

  load();
})();
