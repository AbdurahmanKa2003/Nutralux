/* ==========================================================================
   NUTRALUX — страница товара
   Как и catalog.js, один скрипт на обе языковые версии: тексты и пути
   приходят из data-* атрибутов #content.
   ========================================================================== */

(() => {
  const root = document.getElementById('content');
  if (!root) return;

  const SITE = 'https://www.nutralux.com.tr';
  const WHATSAPP = '905332452900';

  const d = root.dataset;
  const cfg = {
    source: d.source || 'products-en.json',
    catalogPage: d.catalogPage || 'catalog-en.html',
    homePage: d.homePage || 'index.html',
    selfPage: d.selfPage || 'product-en.html',
    altPage: d.altPage || 'product.html',
    lang: d.lang || 'en',
    labelHome: d.labelHome || 'Home',
    labelCatalog: d.labelCatalog || 'Catalog',
    labelOrder: d.labelOrder || 'Order via WhatsApp',
    labelBack: d.labelBack || 'Back to catalog',
    labelRelated: d.labelRelated || 'You may also like',
    labelMissing: d.labelMissing || 'Product not found',
    labelMissingText: d.labelMissingText || 'It may have been renamed or removed from the catalog.',
    labelNote: d.labelNote || 'Dietary supplement. Not a medicine. Consult a specialist before use.',
    labelAsk: d.labelAsk || 'Ask about this product',
    orderText: d.orderText || 'Hello! I would like to order:',
    trust: (d.trust || 'Verified suppliers|Same-day dispatch|Transparent labels').split('|'),
  };

  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const setMeta = (selector, create, content) => {
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = create();
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const applySeo = (p) => {
    const url = `${SITE}/${cfg.selfPage}?slug=${encodeURIComponent(p.slug)}`;
    const image = `${SITE}/${p.image}`;

    document.title = `${p.name} — Nutralux`;

    setMeta('meta[name="description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      return m;
    }, `${p.name} — ${p.description}`);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const og = {
      'og:title': `${p.name} — Nutralux`,
      'og:description': p.description,
      'og:type': 'product',
      'og:url': url,
      'og:image': image,
      'og:locale': cfg.lang === 'ru' ? 'ru_RU' : 'en_US',
    };
    Object.entries(og).forEach(([property, content]) => {
      setMeta(`meta[property="${property}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', property);
        return m;
      }, content);
    });

    const twitter = {
      'twitter:card': 'summary_large_image',
      'twitter:title': `${p.name} — Nutralux`,
      'twitter:description': p.description,
      'twitter:image': image,
    };
    Object.entries(twitter).forEach(([name, content]) => {
      setMeta(`meta[name="${name}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute('name', name);
        return m;
      }, content);
    });

    let schema = document.getElementById('product-schema');
    if (!schema) {
      schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.id = 'product-schema';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description,
      image,
      url,
      category: p.category,
      brand: { '@type': 'Brand', name: 'Nutralux' },
    });

    const alt = document.getElementById('lang-switch');
    if (alt) alt.href = `${cfg.altPage}?slug=${encodeURIComponent(p.slug)}`;
  };

  /* Состав приходит одной строкой вида «Рыбий жир — 1000 мг; EPA — 180 мг».
     Разбираем её на отдельные строки: сплошной абзац читался тяжело. */
  const factValue = (value) => {
    const parts = String(value).split(';').map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) return escape(value);

    return `<ul class="fact-list">${parts.map((part) => {
      const m = part.match(/^(.*?)\s*[—–-]\s*([^—–-]+)$/);
      if (!m) return `<li>${escape(part)}</li>`;
      return `<li><b>${escape(m[1])}</b><span class="fact-amount">${escape(m[2])}</span></li>`;
    }).join('')}</ul>`;
  };

  const factRows = (facts) => (Array.isArray(facts) ? facts : [])
    .map((f) => `<div><dt>${escape(f.name)}</dt><dd>${factValue(f.value)}</dd></div>`)
    .join('');

  const relatedCards = (all, current) => {
    const same = all.filter((x) => x.category === current.category && x.slug !== current.slug);
    const pool = same.length ? same : all.filter((x) => x.slug !== current.slug);
    return pool.slice(0, 3).map((p) => `
      <article class="product-card">
        <a class="product-card__media" href="${cfg.selfPage}?slug=${encodeURIComponent(p.slug)}" tabindex="-1" aria-hidden="true">
          <img src="${escape(p.image)}" alt="" loading="lazy" decoding="async" width="1200" height="1200" />
        </a>
        <div class="product-card__body">
          <p class="product-card__cat">${escape(p.category)}</p>
          <h3><a href="${cfg.selfPage}?slug=${encodeURIComponent(p.slug)}">${escape(p.name)}</a></h3>
          <p>${escape(p.short)}</p>
        </div>
      </article>`).join('');
  };

  const view = (p, all) => {
    const order = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`${cfg.orderText} ${p.name}`)}`;
    const related = relatedCards(all, p);

    return `
      <nav class="breadcrumbs" aria-label="breadcrumb">
        <a href="${cfg.homePage}">${escape(cfg.labelHome)}</a><span>/</span>
        <a href="${cfg.catalogPage}">${escape(cfg.labelCatalog)}</a><span>/</span>
        ${escape(p.name)}
      </nav>

      <section class="product-wrap">
        <div class="product-gallery">
          <img src="${escape(p.image)}" alt="${escape(p.name)} — Nutralux" width="1200" height="1200" fetchpriority="high" />
        </div>

        <div class="product-info">
          <p class="eyebrow">${escape(p.category)}</p>
          <h1>${escape(p.name)}</h1>
          <p class="product-lead">${escape(p.short)}</p>
          <p class="product-description">${escape(p.description)}</p>

          <dl class="product-facts">${factRows(p.facts)}</dl>

          <div class="product-actions">
            <a class="btn" href="${order}" target="_blank" rel="noopener" data-magnetic>
              ${escape(cfg.labelOrder)} <i class="bx bxl-whatsapp" aria-hidden="true"></i>
            </a>
            <a class="btn btn--ghost" href="${cfg.catalogPage}" data-magnetic>${escape(cfg.labelBack)}</a>
          </div>

          <ul class="product-trust">
            ${cfg.trust.map((t) => `<li><i class="bx bx-check" aria-hidden="true"></i>${escape(t)}</li>`).join('')}
          </ul>

          <p class="product-note">${escape(cfg.labelNote)}</p>
        </div>
      </section>

      ${related ? `
      <section class="related">
        <div class="related-inner">
          <h2 class="heading">${escape(cfg.labelRelated)}</h2>
          <div class="related-grid">${related}</div>
        </div>
      </section>` : ''}
    `;
  };

  const missing = () => `
    <section class="product-missing">
      <h1>${escape(cfg.labelMissing)}</h1>
      <p>${escape(cfg.labelMissingText)}</p>
      <a class="btn" href="${cfg.catalogPage}">${escape(cfg.labelBack)}</a>
    </section>`;

  const load = async () => {
    const slug = new URL(window.location.href).searchParams.get('slug');
    if (!slug) {
      root.innerHTML = missing();
      return;
    }

    try {
      const resp = await fetch(cfg.source, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const items = await resp.json();
      const product = items.find((x) => String(x.slug) === slug);

      if (!product) {
        root.innerHTML = missing();
        return;
      }

      root.innerHTML = view(product, items);
      applySeo(product);
    } catch (err) {
      console.error('Товар не загрузился:', err);
      root.innerHTML = missing();
    }
  };

  load();
})();
