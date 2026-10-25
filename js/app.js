(() => {
  'use strict';

  const data = window.SITE_DATA || { records: [], assets: [] };
  const records = data.records || [];
  const assets = new Set(data.assets || []);
  const app = document.getElementById('site-app');
  const page = document.body.dataset.page || 'home';
  const pageFiles = {
    home: 'index.html',
    process: 'isleyis.html',
    store: 'hizmetler.html',
    prices: 'fiyatlar.html',
    gallery: 'galeri.html',
    forum: 'blog.html',
    contact: 'iletisim.html'
  };
  const defaultNav = [
    { id: 'home', label: 'Anasayfa', type: 'home' },
    { id: 'process', label: 'İşleyiş', type: 'process' },
    { id: 'store', label: 'Hizmetler', type: 'store' },
    { id: 'prices', label: 'Fiyatlar', type: 'prices' },
    { id: 'gallery', label: 'İşlerimiz', type: 'gallery' },
    { id: 'forum', label: 'Blog', type: 'forum' },
    { id: 'contact', label: 'İletişim', type: 'contact' }
  ];
  const navIcons = {
    home: '<path d="m7 13 9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H8a1 1 0 0 1-1-1z"/>',
    process: '<path d="M6 7h13a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h13"/><path d="m16 3 4 4-4 4m4 8 4 4-4 4"/>',
    store: '<path d="M4 10h24l-2 17H6z"/><path d="M7 10 10 4h12l3 6M11 15v7m10-7v7M4 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    prices: '<path d="M5 10V5h5l15 15-5 5z"/><circle cx="9" cy="9" r="1"/>',
    gallery: '<rect x="4" y="5" width="24" height="22" rx="3"/><circle cx="11" cy="12" r="2"/><path d="m6 24 7-7 5 5 4-4 5 5"/>',
    forum: '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H26v21H7.5A2.5 2.5 0 0 0 5 27.5z"/><path d="M5 6.5v21M10 9h11m-11 5h11m-11 5h8"/>',
    contact: '<rect x="4" y="6" width="24" height="19" rx="3"/><path d="m5 8 11 9L27 8"/>'
  };
  const pageRecord = id => records.find(record => record.type === 'sayfa' && record.data.sayfa === id)?.data || {};
  const typedRecords = type => records.filter(record => record.type === type);
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const text = value => html(value).replace(/\n/g, '<br>');
  const money = value => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)} ₺`;
  const safePath = source => typeof source === 'string'
    && /^(?:img|uploads)\/[A-Za-z0-9._/ -]+$/.test(source)
    && !source.split('/').includes('..');
  const assetImage = (source, alt = '', className = '', fallback = '') => {
    const original = safePath(source) && assets.has(source) ? source : '';
    const resolvedFallback = safePath(fallback) && assets.has(fallback) ? fallback : '';
    const chosen = original || resolvedFallback;
    if (!chosen) return '';
    const backup = original && resolvedFallback && original !== resolvedFallback
      ? ` data-fallback="${html(resolvedFallback)}"` : '';
    return `<img src="${html(chosen)}" alt="${html(alt)}" class="${html(className)}" loading="lazy"${backup}>`;
  };
  const rich = (source, missingImageFallback = '') => {
    const parser = new DOMParser();
    const document = parser.parseFromString(`<div>${String(source || '')}</div>`, 'text/html');
    const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'CODE', 'UL', 'OL', 'LI', 'A', 'IMG']);
    const clean = parent => {
      [...parent.children].forEach(element => {
        const tag = element.tagName;
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH'].includes(tag)) {
          element.remove();
          return;
        }
        clean(element);
        if (!allowed.has(tag)) {
          element.replaceWith(...element.childNodes);
          return;
        }
        const href = element.getAttribute('href') || '';
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        const list = element.getAttribute('data-list') || '';
        const imageSize = element.getAttribute('data-size') || '';
        [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
        if (tag === 'A' && /^(https?:|mailto:|tel:|#)/i.test(href)) {
          element.setAttribute('href', href);
          element.setAttribute('rel', 'noopener noreferrer');
        }
        if (tag === 'LI' && ['bullet', 'ordered'].includes(list)) element.setAttribute('data-list', list);
        if (tag === 'IMG') {
          if (!safePath(src)) {
            element.remove();
          } else {
            const fallback = safePath(missingImageFallback) && assets.has(missingImageFallback)
              ? missingImageFallback : '';
            const selectedSource = assets.has(src) ? src : fallback;
            if (!selectedSource) {
              element.remove();
              return;
            }
            element.setAttribute('src', selectedSource);
            element.setAttribute('alt', alt.slice(0, 180));
            element.className = 'content-image';
            element.dataset.size = ['half', 'quarter'].includes(imageSize) ? imageSize : 'half';
            if (selectedSource === src && fallback) element.dataset.fallback = fallback;
          }
        }
      });
    };
    const root = document.body.firstElementChild;
    clean(root);
    return root.innerHTML;
  };
  const renderRich = (value, missingImageFallback = '') => /<\/?[a-z][^>]*>/i.test(String(value || ''))
    ? rich(value, missingImageFallback) : text(value || '');

  const settings = pageRecord('site-customization');
  const footer = pageRecord('footer');
  const footerData = {
    brand: footer.brand || 'Sanatlan',
    text: footer.text || 'Grafik tasarım, web tasarım ve baskı çözümleri',
    phone: footer.phone || '+90 552 391 0092',
    email: footer.email || '',
    socials: Array.isArray(footer.socials) ? footer.socials : []
  };
  const defaultColors = {
    menu: '#7c5f2d', container: '#f5f1e7', h1: '#2a2a2a', h2: '#2a2a2a', text: '#333333'
  };
  const colors = Object.fromEntries(Object.entries(defaultColors).map(([key, fallback]) => {
    const value = settings.colors?.[key];
    return [key, /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback];
  }));
  const logo = assets.has(settings.logo) ? settings.logo : 'img/logo.png';
  const phoneDigits = footerData.phone.replace(/\D/g, '');
  const navItems = (() => {
    const saved = Array.isArray(settings.navigation) ? settings.navigation : [];
    const recognized = saved.filter(item => item && pageFiles[item.id] && item.visible !== false);
    const defaultsById = new Map(defaultNav.map(item => [item.id, item]));
    const items = recognized.map(item => ({ ...defaultsById.get(item.id), ...item }));
    if (!items.some(item => item.id === 'prices')) {
      const price = defaultNav.find(item => item.id === 'prices');
      const storeIndex = items.findIndex(item => item.id === 'store');
      items.splice(storeIndex < 0 ? items.length : storeIndex + 1, 0, price);
    }
    return items;
  })();

  const pricingPackages = [
    {
      name: 'Başlangıç', price: 4000, audience: 'Yeni açılan veya internette görünür olmak isteyen işletmeler için.',
      delivery: '7-10 iş günü',
      features: ['Google İşletme Profili kurulumu ve optimizasyonu', 'Kartvizit tasarımı ve 1.000 adet baskı', '2 sayfaya kadar menü tasarımı ve 20 adet baskı', '6 sosyal medya görseli', '2 revizyon turu']
    },
    {
      name: 'Profesyonel', price: 10000, featured: true,
      audience: 'Online varlığını kurmak ve profesyonel görünmek isteyen işletmeler için.',
      delivery: '3-4 hafta',
      features: ['6-10 sayfalık mobil uyumlu işletme sitesi, harita, iletişim formu ve temel SEO', 'QR menü', 'Dükkan fotoğraf çekimi (20 rötuşlu fotoğraf)', '15 ürün fotoğrafı', 'Google İşletme Profili kurulumu ve optimizasyonu', 'Kartvizit tasarımı ve 1.000 adet baskı', 'Menü tasarımı ve 20 adet baskı', '12 sosyal medya görseli']
    },
    {
      name: 'Premium', price: 20000,
      audience: 'Markasını büyütmek ve her gün yeni müşteri çekmek isteyen işletmeler için.',
      delivery: '5-6 hafta',
      features: ['Marka tasarımı (logo, renk ve yazı sistemi, marka rehberi)', 'İşletme web sitesi ve QR menü', 'Dükkan fotoğrafı ve 20 ürün fotoğrafı', 'Basılı set: 1.000 kartvizit, 20 menü ve 100 magnet', 'Ambalaj (kutu/poşet) tasarımı', '12 sosyal medya görseli', 'Google İşletme Profili optimizasyonu', 'Google Ads kurulumu ve 3 ay reklam yönetimi', 'Öncelikli destek']
    }
  ];
  const pricingGroups = [
    { name: 'Basılı tasarım ve baskı', services: [
      ['Kartvizit tasarımı + 1.000 adet baskı', 1800, 'set'],
      ['Broşür tasarımı + 1.000 adet baskı', 4500, 'set'],
      ['QR menü tasarımı', 1200, 'iş'],
      ['Menü tasarımı + 20 adet baskı', 2200, 'iş'],
      ['Ambalaj tasarımı', 3500, 'tasarım'],
      ['Tabela tasarımı', 2500, 'tasarım'],
      ['Magnet tasarımı + 100 adet baskı', 2800, 'set'],
      ['Folyo tasarım ve baskı', 1500, 'm²']
    ] },
    { name: 'Dijital tasarım ve marka', services: [
      ['Logo tasarımı', 3500, 'tasarım'],
      ['Marka kimliği ve rehberi', 8500, 'paket'],
      ['Afiş tasarımı', 1500, 'tasarım'],
      ['Banner tasarımı', 1200, 'tasarım'],
      ['Sosyal medya görseli', 600, 'görsel']
    ] },
    { name: 'Web sitesi', services: [
      ['E-ticaret sitesi', 35000, 'site'],
      ['İşletme sitesi', 15000, 'site'],
      ['Portföy sitesi', 12000, 'site']
    ] },
    { name: 'Fotoğraf ve dijital pazarlama', services: [
      ['Dükkan fotoğraf çekimi', 3500, 'çekim'],
      ['Ürün fotoğrafı (rötuşlu)', 400, 'fotoğraf'],
      ['Google İşletme Profili kurulumu ve optimizasyonu', 2500, 'iş'],
      ['Google Ads kurulumu', 4000, 'kurulum'],
      ['Google Ads reklam yönetimi', 6000, 'ay']
    ] }
  ];
  const servicePrices = new Map(pricingGroups.flatMap(group => group.services.map(item => [item[0].toLocaleLowerCase('tr'), item[1]])));
  const servicePriceAliases = new Map([
    ['kartvizit', 'Kartvizit tasarımı + 1.000 adet baskı'],
    ['broşür', 'Broşür tasarımı + 1.000 adet baskı'],
    ['qr menü', 'QR menü tasarımı'],
    ['menü', 'Menü tasarımı + 20 adet baskı'],
    ['magnet', 'Magnet tasarımı + 100 adet baskı'],
    ['folyo', 'Folyo tasarım ve baskı'],
    ['logo', 'Logo tasarımı'],
    ['marka tasarımı', 'Marka kimliği ve rehberi'],
    ['afiş', 'Afiş tasarımı'],
    ['banner', 'Banner tasarımı'],
    ['sosyal medya görseli', 'Sosyal medya görseli'],
    ['e-ticaret sitesi', 'E-ticaret sitesi'],
    ['işletme sitesi', 'İşletme sitesi'],
    ['portföy sitesi', 'Portföy sitesi']
  ]);
  const getServicePrice = name => {
    const key = String(name || '').toLocaleLowerCase('tr');
    return servicePrices.get(servicePriceAliases.get(key)?.toLocaleLowerCase('tr') || key);
  };
  const getServiceDefault = name => data.serviceDefaults?.[String(name || '').toLocaleLowerCase('tr')] || {};
  const storeImageFallback = {
    basılı: 'img/services/print-design.svg',
    dijital: 'img/services/brand-design.svg',
    'web sitesi': 'img/services/web-design.svg'
  };
  const categoryDescriptions = {
    basılı: 'Kartvizit, menü ve ambalajla markanı basılı dünyada görünür kıl.',
    dijital: 'Markanın dijitalde tutarlı ve akılda kalıcı görünmesi için özgün tasarımlar.',
    'web sitesi': 'Hedeflerine ve müşterilerine uygun, mobil uyumlu web çözümleri.'
  };
  const galleryFallbacks = {
    tisort: ['uploads/galeri/f946ff5b06d5ba85e591399c801c529b.jpg', 'uploads/galeri/04c43c250ea24164be79859f9f3a9448.jpg', 'uploads/galeri/eaa5b61a3caf90bd158611d88b0b7eee.jpg', 'uploads/galeri/4a7352d60ec2742c901188aee339b906.jpg', 'uploads/galeri/478a0df72d87c749f49b26b2b94e6139.jpg'],
    afis: ['uploads/galeri/51e6019547aefce6d503ef4be1c53bdf.jpg', 'uploads/galeri/e19294e66402ed947d132e6b69776310.jpg', 'uploads/galeri/b657b9d880092a38187c0e3b980812c6.jpg', 'uploads/galeri/8e3405e0a0df2261507dd10aa9789ba1.jpg', 'uploads/galeri/205bff5997a81bb76b32d2f55bf76353.jpg', 'uploads/galeri/70d532aa1ec178d11f74d11a489353cd.jpg', 'uploads/galeri/58cc9fd6bb735ccfda8e60c7eea82a5d.jpg', 'uploads/galeri/0d1fb3df10e51334be79859f9f3a9448.jpg', 'uploads/galeri/b5ed1e96449445ed16dc4d8a9e4b18d0.jpg', 'uploads/galeri/0e9b4492b0dee6eec73c52495325b622.jpg'],
    banner: ['uploads/galeri/a733b4d988c912526d2792f6fe1afccc.jpg', 'uploads/galeri/f7937f4c37ec796a21a1b6461d9fdaa2.jpg', 'uploads/galeri/5e5ef81758c7fed0366faa8c22affb5a.jpg'],
    kapak: ['uploads/galeri/215c274c2217871d88c05d1337fa538d.jpg'],
    menu: ['uploads/galeri/88c4485109555174ffa7542230362e19.jpg'],
    katolog: ['uploads/galeri/1a00c5f5ea64225761a2ef38145c7bf1.jpg'],
    portfolio: ['uploads/galeri/c442657fb12ac5967060b1ad5fc01fb9.jpg']
  };

  const renderHeader = () => {
    const links = navItems.map(item => {
      const href = pageFiles[item.id];
      const icon = navIcons[item.id] || '<circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="24" cy="16" r="1"/>';
      return `<a class="nav-link" href="${href}"${item.id === page ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false">${icon}</svg></span><span class="nav-label">${html(item.label)}</span></a>`;
    }).join('');
    return `<nav class="navbar" aria-label="Ana menü"><div class="logo"><a href="index.html" aria-label="Anasayfa">${assetImage(logo, footerData.brand)}</a></div>${links}</nav>`;
  };

  const renderFooter = () => {
    const socialIcons = { instagram: 'fa-instagram', facebook: 'fa-facebook-f', youtube: 'fa-youtube', tiktok: 'fa-tiktok', x: 'fa-x-twitter', whatsapp: 'fa-whatsapp' };
    const socials = footerData.socials.filter(item => item && socialIcons[item.platform] && /^https:\/\//i.test(item.url || ''))
      .map(item => `<a href="${html(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${html(item.platform)}" title="${html(item.platform)}"><i class="fa-brands ${socialIcons[item.platform]}" aria-hidden="true"></i></a>`).join('');
    return `<footer class="site-footer"><div class="site-footer-brand"><strong>${html(footerData.brand)}</strong><span>${html(footerData.text)}</span></div><div class="site-footer-contact">${footerData.phone ? `<a href="tel:${html(footerData.phone.replace(/[^\d+]/g, ''))}">${html(footerData.phone)}</a>` : ''}${footerData.email ? `<a href="mailto:${html(footerData.email)}">${html(footerData.email)}</a>` : ''}</div>${socials ? `<nav class="site-footer-socials" aria-label="Sosyal medya">${socials}</nav>` : ''}<span class="site-footer-copy">© ${new Date().getFullYear()} ${html(footerData.brand)}</span></footer>${phoneDigits ? `<a class="whatsapp-button" href="https://wa.me/${html(phoneDigits)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp üzerinden iletişim" title="WhatsApp üzerinden iletişim"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></a>` : ''}`;
  };

  const renderHome = () => {
    const content = pageRecord('home');
    const slides = (content.slides || []).filter(slide => slide && safePath(slide.image) && assets.has(slide.image)).slice(0, 6);
    const blocks = Array.isArray(content.blocks) ? content.blocks : [];
    const fallbacks = {
      'basılı yayınlar': 'img/services/print-design.svg',
      'dijital yayınlar': 'img/services/brand-design.svg',
      'anahtar teslim website': 'img/services/web-design.svg',
      'fotoğraf çekimi hizmeti': 'img/services/product-photography.svg'
    };
    const reviews = [
      { name: 'Örnek yorum', rating: 5, comment: 'Çok güzel olmuş, elinize sağlık.' },
      { name: 'Örnek yorum', rating: 5, comment: 'İstediğimiz gibi oldu, teşekkür ederiz.' },
      { name: 'Örnek yorum', rating: 5, comment: 'Hızlı ve özenli bir çalışma.' }
    ];
    const reviewMarkup = reviews.length ? `<div class="reviews-grid">${reviews.map(review => `<article class="review-item"><div class="review-stars" role="img" aria-label="5 üzerinden ${Number(review.rating) || 0} yıldız">${Array.from({ length: 5 }, (_, index) => `<i class="fa-solid fa-star${index < Number(review.rating) ? ' is-filled' : ''}" aria-hidden="true"></i>`).join('')}</div><div class="rich-content">${renderRich(review.comment)}</div>${assetImage(review.photo, review.name, 'review-photo')}<strong>${html(review.name)}</strong></article>`).join('')}</div>` : '<p class="reviews-empty">Henüz yorum eklenmedi.</p>';
    const slider = slides.length ? `<section class="home-slider" aria-label="Öne çıkan çalışmalar" data-slider><div class="home-slider-track">${slides.map((slide, index) => `<figure class="home-slide${index === 0 ? ' is-active' : ''}" aria-hidden="${index === 0 ? 'false' : 'true'}"><img src="${html(slide.image)}" alt="${html(slide.alt || slide.title || 'Sanatlan çalışması')}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}></figure>`).join('')}</div>${slides.length > 1 ? `<button class="home-slider-arrow previous" type="button" aria-label="Önceki görsel">‹</button><button class="home-slider-arrow next" type="button" aria-label="Sonraki görsel">›</button><button class="home-slider-toggle" type="button" aria-label="Slaytları duraklat" aria-pressed="false">Ⅱ</button><div class="home-slider-dots" role="group" aria-label="Slayt seçimi">${slides.map((_, index) => `<button type="button" data-slide="${index}" aria-label="${index + 1}. görsel" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`).join('')}</div>` : ''}</section>` : '';
    return `${slider}<header class="hero"><h1>${html(content.title || '')}</h1><p>${html(content.subtitle || '')}</p></header><main class="page-content">${blocks.map((block, index) => {
      const fallback = fallbacks[String(block.title || '').toLocaleLowerCase('tr')] || 'img/services/brand-design.svg';
      const image = block.image && assets.has(block.image) ? block.image : assets.has(fallback) ? fallback : '';
      return `<section class="content-block${index % 2 ? ' reverse' : ''}${image ? '' : ' text-only'}"><div><h2>${html(block.title)}</h2><div class="rich-content">${renderRich(block.body)}</div></div>${image ? `<img src="${html(image)}" alt="${html(block.alt || '')}" loading="lazy">` : ''}</section>`;
    }).join('')}</main><section class="page-content reviews-section" aria-labelledby="reviews-title"><h2 id="reviews-title">${html(pageRecord('reviews').title || 'Müşteri yorumları')}</h2>${reviewMarkup}</section>`;
  };

  const renderProcess = () => {
    const content = pageRecord('process');
    const imageFallbacks = ['img/services/brand-design.svg', 'img/services/web-design.svg', 'img/services/print-design.svg', 'img/services/product-photography.svg'];
    const steps = content.steps || [];
    return `<main class="page-content process-content"><h1>${html(content.title || 'İşleyiş')}</h1><ol class="process-steps">${steps.map((step, index) => `<li><h2>${html(step.title)}</h2>${step.body ? `<div class="rich-content">${renderRich(step.body, imageFallbacks[index])}</div>` : ''}</li>`).join('')}</ol></main>`;
  };

  const renderStore = () => {
    const content = pageRecord('store');
    const groups = Array.isArray(content.categories) ? content.categories : [];
    const categoryMarkup = groups.map((group, groupIndex) => {
      const key = String(group.title || '').toLocaleLowerCase('tr');
      const image = storeImageFallback[key] || 'img/services/brand-design.svg';
      const services = (group.items || []).map(item => {
        const defaults = getServiceDefault(item.altbaslik);
        const price = item.fiyat || defaults.fiyat || (getServicePrice(item.altbaslik)
          ? `${money(getServicePrice(item.altbaslik))} başlangıç`
          : 'Fiyat için iletişime geçin');
        const src = item.src && assets.has(item.src) ? item.src : assets.has(defaults.src) ? defaults.src : image;
        return `<div class="accordion-subheader" role="button" tabindex="0" data-price="${html(price)}" data-detail="${html(item.detay || defaults.detay || '')}" data-image="${html(src)}">${html(item.altbaslik)}</div>`;
      }).join('');
      return `<div class="accordion-item${groupIndex === 0 ? ' active' : ''}" id="store-category-${groupIndex}"><div class="accordion-header" role="button" tabindex="0">${assetImage(image, '', 'store-category-image')}<span class="store-category-copy"><h3>${html(group.title)}</h3><small>${html(categoryDescriptions[key] || 'İhtiyacına uygun tasarım ve üretim çözümleri.')}</small></span><span class="arrow" aria-hidden="true">▶</span></div><div class="accordion-content"${groupIndex === 0 ? ' style="max-height: 700px"' : ''}>${services}</div></div>`;
    }).join('');
    return `<main class="page-content store-content"><h1>Hizmetler</h1><div class="accordion-container"><div class="accordion">${categoryMarkup}</div><div id="dynamicContent"><p>Hizmet seçerek kapsam, teslim edilecekler ve başlangıç fiyatı hakkında bilgi alabilirsin.</p></div></div></main>`;
  };

  const renderPrices = () => {
    const packageCards = pricingPackages.map(pack => `<article class="pricing-package${pack.featured ? ' is-featured' : ''}">${pack.featured ? '<span class="pricing-badge">En çok tercih edilen</span>' : ''}<h3>${html(pack.name)}</h3><p class="pricing-audience">${html(pack.audience)}</p><p class="pricing-price">${money(pack.price)}<small> tek seferlik</small></p><ul>${pack.features.map(feature => `<li>${html(feature)}</li>`).join('')}</ul><p class="pricing-delivery">Tahmini teslim: ${html(pack.delivery)}</p><a class="pricing-button${pack.featured ? ' is-primary' : ''}" href="https://wa.me/${html(phoneDigits)}?text=${encodeURIComponent(`Merhaba, ${pack.name} paketi hakkında bilgi ve teklif almak istiyorum.`)}" target="_blank" rel="noopener noreferrer">WhatsApp'tan teklif al</a></article>`).join('');
    const groups = pricingGroups.map(group => `<article class="price-group"><h3>${html(group.name)}</h3><ul>${group.services.map(([name, price, unit]) => `<li><span>${html(name)}</span><strong>${money(price)}<small> / ${html(unit)}</small></strong></li>`).join('')}</ul></article>`).join('');
    const options = pricingGroups.map(group => `<optgroup label="${html(group.name)}">${group.services.map(([name, price, unit]) => `<option value="${html(name)}" data-price="${price}" data-unit="${html(unit)}">${html(name)} · ${money(price)} / ${html(unit)}</option>`).join('')}</optgroup>`).join('');
    const serviceGroups = pricingGroups.map(group => `<article class="pricing-service-group"><h3>${html(group.name)}</h3><ul>${group.services.map(([name, price, unit]) => `<li><span>${html(name)}</span><strong>${money(price)}<small> / ${html(unit)}</small></strong></li>`).join('')}</ul></article>`).join('');
    return `<main class="page-content pricing-page"><header class="pricing-intro"><p class="pricing-eyebrow">SANATLAN · TASARIM VE DİJİTAL ÇÖZÜMLER</p><h1>Şeffaf fiyatlar, sana özel çözümler</h1><p>İhtiyacına uygun hizmeti seç, tahmini bütçeni hesapla ve WhatsApp'tan teklif iste.</p></header><section class="pricing-packages" aria-labelledby="pricing-packages-title"><div class="pricing-section-heading"><p class="pricing-eyebrow">İŞLETME PAKETLERİ</p><h2 id="pricing-packages-title">Birlikte daha avantajlı</h2></div><div class="pricing-package-grid">${packageCards}</div></section><section class="pricing-services" aria-labelledby="pricing-services-title"><div class="pricing-section-heading"><p class="pricing-eyebrow">TEKİL HİZMETLER</p><h2 id="pricing-services-title">Hizmet fiyatları</h2><p>Belirtilen tutarlar başlangıç fiyatıdır. Baskı adedi, ölçü ve proje kapsamına göre net teklif hazırlanır.</p></div><div class="pricing-service-grid">${serviceGroups}</div></section><section class="pricing-calculator" aria-labelledby="pricing-calculator-title" data-pricing-calculator data-wa-number="${html(phoneDigits)}"><div class="pricing-section-heading"><p class="pricing-eyebrow">HIZLI HESAPLAMA</p><h2 id="pricing-calculator-title">Fiyatını kendin hesapla</h2><p>İstediğin hizmetleri ekle; toplam tutar yaklaşık bütçeni göstersin.</p></div><div class="pricing-calculator-box"><div class="pricing-rows" data-pricing-rows><div class="pricing-calculator-row"><label>Hizmet<select class="pricing-service-select" aria-label="Hizmet seçin"><option value="">Hizmet seçin</option>${options}</select></label><label class="pricing-quantity-label">Miktar<input class="pricing-quantity" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Adet"></label><p class="pricing-line-total" aria-live="polite">—</p><button class="pricing-remove" type="button" aria-label="Hizmeti kaldır">×</button></div></div><button class="pricing-add-button" type="button" data-pricing-add>+ Hizmet ekle</button><div class="pricing-total"><span>Yaklaşık toplam</span><strong data-pricing-total aria-live="polite">0 ₺</strong></div><p class="pricing-disclaimer" data-pricing-disclaimer>Net fiyat; ölçü, adet, malzeme ve proje detayları konuşulduktan sonra belirlenir. Fiyatlara KDV dahil değildir.</p><a class="pricing-button is-primary pricing-whatsapp" data-pricing-whatsapp href="https://wa.me/${html(phoneDigits)}?text=${encodeURIComponent('Merhaba, hizmetler için fiyat teklifi almak istiyorum.')}" target="_blank" rel="noopener noreferrer">Hesaplamayı WhatsApp'tan gönder</a></div></section><aside class="pricing-notes"><h2>Fiyatlandırma notları</h2><ul><li>Fiyatlara KDV dahil değildir; baskı adetleri ve teknik özelliklere göre değişebilir.</li><li>Google Ads bütçesi Google'a ödenir ve hizmet ücretine dahil değildir.</li><li>Premium pakette 3 aylık reklam yönetimi dahildir; devamı aylık 6.000 ₺'den başlar.</li><li>Alan adı, hosting, kargo ve ambalaj baskısı paketlere dahil değildir.</li><li>Her hizmet işletmenizin ihtiyacına göre özelleştirilebilir.</li></ul></aside></main>`;
  };

  const galleryEntries = typedRecords('galeri').slice().sort((a, b) => b.id - a.id);
  const renderGallery = () => {
    const gallerySettings = pageRecord('gallery');
    const selectedId = Number(new URLSearchParams(location.search).get('item'));
    if (selectedId) {
      const selected = galleryEntries.find(item => item.id === selectedId);
      if (!selected) return '<main class="content-wrap"><h1>Çalışma bulunamadı</h1><a class="text-link" href="galeri.html">← İşlerimize dön</a></main>';
      const item = selected.data;
      const image = resolveGalleryImage(item);
      const demoPath = assets.has(item.demo_path) ? item.demo_path : '';
      const video = embedVideo(item.video_src || (item.media_type === 'video' ? item.src : ''));
      const extraImage = item.kategori === 'kapak' && !assets.has(item.src)
        ? assetImage('uploads/galeri/cc1e4628db21f2eb06a31520d3554773.jpg', item.baslik, 'gallery-detail-image')
        : '';
      return `<main class="gallery-detail page-content${demoPath ? ' gallery-demo-detail' : ''}"><a class="text-link page-back-link" href="galeri.html">← İşlerimize dön</a>${image ? assetImage(image, item.baslik, 'gallery-detail-media') : ''}${extraImage}${video ? `<iframe class="gallery-detail-media" src="${html(video)}" title="${html(item.baslik || 'Video')}" loading="lazy" allowfullscreen></iframe>` : ''}<div class="rich-content">${renderRich(item.icerik)}</div>${demoPath ? `<section class="gallery-demo-embed" aria-label="Web sitesi demosu"><iframe src="${html(demoPath)}" title="${html(item.baslik || 'Web sitesi demosu')}" sandbox="allow-forms allow-scripts" referrerpolicy="no-referrer"></iframe></section>` : ''}</main>`;
    }
    const filters = Array.isArray(gallerySettings.filters) ? gallerySettings.filters : [];
    const buttons = filters.map(filter => `<button type="button" data-filter="${html(filter.id)}">${html(filter.label)} <span>${galleryEntries.filter(entry => entry.data.kategori === filter.id).length}</span></button>`).join('');
    const cards = galleryEntries.map(entry => {
      const item = entry.data;
      const category = String(item.kategori || '');
      const image = resolveGalleryImage(item);
      const title = item.baslik && item.baslik !== '.' ? item.baslik : 'Çalışmayı incele';
      return `<a class="item gallery-card ${html(category)}" data-category="${html(category)}" href="galeri.html?item=${entry.id}">${image ? assetImage(image, title) : '<span class="gallery-card-placeholder" aria-hidden="true">◇</span>'}<span class="gallery-card-title">${html(title)}</span></a>`;
    }).join('');
    return `<header class="gallery-heading"><h1>${html(gallerySettings.title || 'İşlerimiz')}</h1></header><main class="container gallery-container"><div class="filters"><button type="button" class="active" data-filter="all">Tümü <span>${galleryEntries.length}</span></button>${buttons}</div><div class="gallery gallery-grid">${cards}</div></main>`;
  };
  function resolveGalleryImage(item) {
    const source = item.src || '';
    if (safePath(source) && assets.has(source)) return source;
    const category = String(item.kategori || '');
    const choices = galleryFallbacks[category] || [];
    const usable = choices.filter(path => assets.has(path));
    if (usable.length) {
      const index = Math.max(0, galleryEntries.findIndex(entry => entry.data.kategori === category && entry.data.src === source));
      return usable[index % usable.length];
    }
    const generic = ['img/karakalem/1k.jpg', 'img/yagliboya/1y.jpg', 'img/digital/1d.jpg'];
    return generic.find(path => assets.has(path)) || '';
  }
  function embedVideo(source) {
    try {
      const url = new URL(source);
      const host = url.hostname.toLowerCase();
      let id = '';
      if (host === 'youtu.be') id = url.pathname.slice(1);
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) id = url.searchParams.get('v') || url.pathname.split('/').pop();
      if (/^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
      if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
        id = url.pathname.split('/').filter(Boolean).pop() || '';
        if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      }
    } catch {}
    return '';
  }

  const forumEntries = typedRecords('forum').slice().sort((a, b) => a.id - b.id);
  const renderForum = () => {
    const postId = Number(new URLSearchParams(location.search).get('post'));
    const post = forumEntries.find(entry => entry.id === postId);
    if (postId && !post) return '<main class="content-wrap"><h1>Blog yazısı bulunamadı</h1><a class="text-link" href="blog.html">← Blog yazılarına dön</a></main>';
    if (post) {
      const fallback = { 5: 'img/blog/logo-design.svg', 6: 'img/blog/web-design.svg', 7: 'img/blog/print-design.svg' }[post.id];
      const image = assets.has(post.data.src) ? post.data.src : fallback;
      return `<main class="page-content blog-page"><article class="blog-article"><a class="text-link page-back-link" href="blog.html">← Blog yazılarına dön</a><h1>${html(post.data.baslik)}</h1>${post.data.altbaslik ? `<p class="blog-subtitle">${html(post.data.altbaslik)}</p>` : ''}${assetImage(image, post.data.baslik, 'blog-cover')}<div class="rich-content">${renderRich(post.data.icerik)}</div></article></main>`;
    }
    return `<main class="page-content blog-page"><h1>Blog</h1><div class="blog-list">${forumEntries.map(entry => {
      const fallback = { 5: 'img/blog/logo-design.svg', 6: 'img/blog/web-design.svg', 7: 'img/blog/print-design.svg' }[entry.id];
      const image = assets.has(entry.data.src) ? entry.data.src : fallback;
      return `<article class="blog-list-item"><a href="blog.html?post=${entry.id}" tabindex="-1" aria-hidden="true">${assetImage(image, '')}</a><div><h2><a href="blog.html?post=${entry.id}">${html(entry.data.baslik)}</a></h2>${entry.data.altbaslik ? `<p>${html(entry.data.altbaslik)}</p>` : ''}</div></article>`;
    }).join('')}</div></main>`;
  };

  const renderContact = () => {
    const contact = pageRecord('contact');
    const validMap = /^https:\/\/www\.google\.com\/maps\/embed\?/.test(contact.map_url || '');
    return `<main class="page-content contact-content"><h1>${html(contact.title || 'İletişim Bilgileri')}</h1><div class="contact-layout"><div class="contact-map">${validMap ? `<iframe title="Konum haritası" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="${html(contact.map_url)}"></iframe>` : ''}</div><section><p><strong>Adres:</strong> ${html(contact.address || '')}</p><p><strong>Telefon:</strong> ${html(contact.phone || '')}</p><p><strong>E-posta:</strong> ${html(contact.email || '')}</p><div class="rich-content">${renderRich(contact.description)}</div></section></div></main>`;
  };

  const renderPage = () => {
    const content = {
      home: renderHome,
      process: renderProcess,
      store: renderStore,
      prices: renderPrices,
      gallery: renderGallery,
      forum: renderForum,
      contact: renderContact
    }[page] || renderHome;
    app.innerHTML = `${renderHeader()}${content()}${renderFooter()}`;
    document.documentElement.style.setProperty('--site-menu', colors.menu);
    document.documentElement.style.setProperty('--site-container', colors.container);
    document.documentElement.style.setProperty('--site-h1', colors.h1);
    document.documentElement.style.setProperty('--site-h2', colors.h2);
    document.documentElement.style.setProperty('--site-text', colors.text);
    bindInteractions();
  };

  function bindInteractions() {
    document.querySelectorAll('img[data-fallback]').forEach(image => {
      image.addEventListener('error', () => {
        const fallback = image.dataset.fallback;
        if (fallback) {
          image.removeAttribute('data-fallback');
          image.src = fallback;
        }
      }, { once: true });
    });

    const slides = [...document.querySelectorAll('.home-slide')];
    if (slides.length > 1) {
      let current = 0;
      const showSlide = index => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, position) => {
          slide.classList.toggle('is-active', position === current);
          slide.setAttribute('aria-hidden', String(position !== current));
        });
        document.querySelectorAll('.home-slider-dots button').forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === current)));
      };
      document.querySelector('.home-slider-arrow.previous')?.addEventListener('click', () => showSlide(current - 1));
      document.querySelector('.home-slider-arrow.next')?.addEventListener('click', () => showSlide(current + 1));
      document.querySelectorAll('.home-slider-dots button').forEach(dot => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slide))));
      window.setInterval(() => showSlide(current + 1), 6000);
    }

    const filterButtons = [...document.querySelectorAll('.gallery-container .filters button')];
    filterButtons.forEach(button => button.addEventListener('click', () => {
      const selected = button.dataset.filter;
      filterButtons.forEach(item => item.classList.toggle('active', item === button));
      document.querySelectorAll('.gallery-container .gallery-card[data-category]').forEach(card =>
        card.classList.toggle('hide', selected !== 'all' && card.dataset.category !== selected));
    }));

    const showStoreItem = item => {
      const dynamicContent = document.getElementById('dynamicContent');
      if (!dynamicContent) return;
      const source = safePath(item.dataset.image) && assets.has(item.dataset.image) ? item.dataset.image : '';
      const media = source ? `<div class="store-detail-media">${assetImage(source, item.textContent.trim())}</div>` : '';
      const title = item.textContent.trim();
      dynamicContent.innerHTML = `<article class="store-detail-layout">${media}<div class="store-detail-copy"><h2 class="store-detail-title">${html(title)}</h2><p class="store-detail-price">${html(item.dataset.price || 'Fiyat için bilgi alın')}</p><div class="rich-content store-item-detail">${renderRich(item.dataset.detail || '')}</div></div></article>`;
    };
    const accordionHeaders = [...document.querySelectorAll('.accordion-header')];
    accordionHeaders.forEach(header => {
      const toggle = () => {
        const target = header.parentElement;
        const content = target.querySelector('.accordion-content');
        const open = !target.classList.contains('active');
        document.querySelectorAll('.accordion-item').forEach(item => {
          item.classList.remove('active');
          item.querySelector('.accordion-content').style.maxHeight = '';
        });
        if (open) {
          target.classList.add('active');
          content.style.maxHeight = `${content.scrollHeight}px`;
        }
      };
      header.addEventListener('click', toggle);
      header.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
    document.querySelectorAll('.accordion-subheader').forEach(item => {
      item.addEventListener('click', event => {
        event.stopPropagation();
        document.querySelectorAll('.accordion-subheader').forEach(button => button.classList.toggle('selected', button === item));
        showStoreItem(item);
      });
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          item.click();
        }
      });
    });
    const firstStoreItem = document.querySelector('.accordion-subheader');
    if (firstStoreItem) showStoreItem(firstStoreItem);

    const calculator = document.querySelector('.pricing-page');
    if (calculator) bindCalculator(calculator);
  }

  function bindCalculator(root) {
    const rowsContainer = root.querySelector('[data-pricing-rows]');
    const firstRow = rowsContainer.querySelector('.pricing-calculator-row');
    const addButton = root.querySelector('[data-pricing-add]');
    const totalOutput = root.querySelector('[data-pricing-total]');
    const quoteLink = root.querySelector('[data-pricing-whatsapp]');
    const moneyFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
    const selectMarkup = root.querySelector('.pricing-service-select').innerHTML;
    const allRows = () => [...rowsContainer.querySelectorAll('.pricing-calculator-row')];
    const update = () => {
      let total = 0;
      let hasSelection = false;
      const lines = ['Merhaba, aşağıdaki hizmetler için teklif almak istiyorum.'];
      allRows().forEach(row => {
        const select = row.querySelector('.pricing-service-select');
        const quantityInput = row.querySelector('.pricing-quantity');
        const option = select.selectedOptions[0];
        const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput.value, 10) || 1));
        const lineOutput = row.querySelector('.pricing-line-total');
        if (!select.value) {
          lineOutput.textContent = '—';
          return;
        }
        hasSelection = true;
        const amount = Number(option.dataset.price) * quantity;
        total += amount;
        lineOutput.textContent = `${moneyFormat.format(amount)} ₺`;
        lines.push(`${select.value} × ${quantity}: ${moneyFormat.format(amount)} ₺`);
      });
      totalOutput.textContent = `${moneyFormat.format(total)} ₺`;
      if (hasSelection) lines.push(`Yaklaşık toplam: ${moneyFormat.format(total)} ₺`);
      quoteLink.href = `https://wa.me/${encodeURIComponent(phoneDigits)}?text=${encodeURIComponent(lines.join('\n'))}`;
    };
    const bindRow = row => {
      row.querySelector('.pricing-service-select').addEventListener('change', update);
      row.querySelector('.pricing-quantity').addEventListener('input', update);
      row.querySelector('.pricing-remove').addEventListener('click', () => {
        if (row === firstRow) row.querySelector('.pricing-service-select').value = '';
        else row.remove();
        update();
      });
    };
    bindRow(firstRow);
    addButton.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'pricing-calculator-row';
      row.innerHTML = `<label>Hizmet<select class="pricing-service-select">${selectMarkup}</select></label><label class="pricing-quantity-label">Miktar<input class="pricing-quantity" type="number" min="1" max="99" value="1"></label><p class="pricing-line-total">—</p><button class="pricing-remove" type="button" aria-label="Hizmeti kaldır">×</button>`;
      rowsContainer.append(row);
      bindRow(row);
    });
    update();
  }

  renderPage();
})();
