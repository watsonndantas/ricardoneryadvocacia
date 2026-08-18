/* =========================================================
   Recupere Instagram, WhatsApp e Facebook — Dr. Ricardo Nery
   Vanilla JS — sem dependências externas
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------
     1) BOTÃO FLUTUANTE DO WHATSAPP — animação de "pulo"
     A cada 5 segundos, aplica translateY via classe CSS
     ----------------------------------------------------- */
  const whatsappButton = document.getElementById('whatsapp-float');

  if (whatsappButton) {
    const BOUNCE_INTERVAL_MS = 5000;
    const BOUNCE_DURATION_MS = 600; // precisa bater com a duração da animação no CSS

    const triggerBounce = () => {
      whatsappButton.classList.add('bounce');

      // Remove a classe ao final da animação para permitir reexecução
      window.setTimeout(() => {
        whatsappButton.classList.remove('bounce');
      }, BOUNCE_DURATION_MS);
    };

    setInterval(triggerBounce, BOUNCE_INTERVAL_MS);
  }

  /* -----------------------------------------------------
     2) MODAL — Política de Privacidade
     ----------------------------------------------------- */
  const privacyLink = document.getElementById('privacy-link');
  const privacyModal = document.getElementById('privacy-modal');

  const openModal = () => {
    if (!privacyModal) return;
    privacyModal.classList.add('is-open');
    privacyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!privacyModal) return;
    privacyModal.classList.remove('is-open');
    privacyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (privacyLink) {
    privacyLink.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  /* -----------------------------------------------------
     3) SCROLL REVEAL — animação sutil de entrada das seções
     ----------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.quad');

  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    // Fallback: navegadores sem suporte exibem tudo imediatamente
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* -----------------------------------------------------
     4) ATRIBUIÇÃO DE CAMPANHA (UTM + clids) — tráfego pago
     Captura UTMs e IDs de clique (gclid/gbraid/wbraid/fbclid)
     da URL, guarda em sessionStorage e anexa um sufixo curto
     à mensagem do WhatsApp + eventos de analytics.
     ----------------------------------------------------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid'];
  const ATTR_KEYS = UTM_KEYS.concat(CLICK_ID_KEYS);
  const ATTR_STORAGE_KEY = 'rn_utm_params';

  const readAttrFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const attr = {};
    ATTR_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) attr[key] = value;
    });
    return attr;
  };

  let utmParams = {};
  try {
    const fromUrl = readAttrFromUrl();
    if (Object.keys(fromUrl).length) {
      // Mescla com o que já estava na sessão (ex.: UTM numa visita, gclid noutra)
      let previous = {};
      try {
        const stored = sessionStorage.getItem(ATTR_STORAGE_KEY);
        if (stored) previous = JSON.parse(stored) || {};
      } catch (e) { /* ignore */ }
      utmParams = Object.assign({}, previous, fromUrl);
      sessionStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(utmParams));
    } else {
      const stored = sessionStorage.getItem(ATTR_STORAGE_KEY);
      if (stored) utmParams = JSON.parse(stored);
    }
  } catch (e) {
    // sessionStorage indisponível (ex.: navegação privada) — segue sem atribuição
  }

  const shortId = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.length > 12 ? value.slice(0, 8) + '…' : value;
  };

  const utmMessageSuffix = () => {
    const parts = [];
    if (utmParams.utm_source) parts.push(`origem: ${utmParams.utm_source}`);
    if (utmParams.utm_campaign) parts.push(`campanha: ${utmParams.utm_campaign}`);
    if (utmParams.gclid) parts.push(`gclid: ${shortId(utmParams.gclid)}`);
    if (utmParams.gbraid) parts.push(`gbraid: ${shortId(utmParams.gbraid)}`);
    if (utmParams.wbraid) parts.push(`wbraid: ${shortId(utmParams.wbraid)}`);
    if (utmParams.fbclid) parts.push(`fbclid: ${shortId(utmParams.fbclid)}`);
    return parts.length ? `\n\n[${parts.join(' | ')}]` : '';
  };

  // Params enviados aos eventos (sem truncar — analytics precisam do valor completo)
  const attributionForEvents = () => Object.assign({}, utmParams);

  /* -----------------------------------------------------
     4.1) INSERÇÃO DINÂMICA DE PALAVRA-CHAVE (DKI) — Google Ads
     Quando o clique vem de um anúncio segmentado por palavra-chave
     (ex.: "conta banida", "conta hackeada"), troca o selo acima do
     título para usar exatamente o termo que a pessoa buscou. Isso
     aumenta a relevância percebida (e o Índice de Qualidade do
     anúncio, que reduz o custo por clique no Google Ads).
     Funciona com utm_term (padrão do ValueTrack {keyword} do Google
     Ads) ou com o parâmetro ?kw= usado manualmente em outras mídias.
     ----------------------------------------------------- */
  const KEYWORD_BADGES = [
    { match: /whatsapp/i, label: 'Especialista em WhatsApp banido' },
    { match: /facebook/i, label: 'Especialista em recuperação de Facebook' },
    { match: /instagram/i, label: 'Especialista em recuperação de Instagram' },
    { match: /banid|banimento/i, label: 'Especialista em conta banida' },
    { match: /suspens/i, label: 'Especialista em conta suspensa' },
    { match: /hack|invad|roubad|clonad/i, label: 'Especialista em conta hackeada' },
    { match: /desativad/i, label: 'Especialista em conta desativada' },
    { match: /liminar|urg[êe]ncia/i, label: 'Liminar para recuperação de conta' },
  ];

  const adKeyword = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_term') || params.get('kw') || utmParams.utm_term || '';
  })();

  if (adKeyword) {
    const badgeEl = document.querySelector('#hero .badge');
    const matchedBadge = KEYWORD_BADGES.find((entry) => entry.match.test(adKeyword));
    if (badgeEl && matchedBadge) {
      badgeEl.textContent = matchedBadge.label;
    }
  }

  /* -----------------------------------------------------
     5) RASTREAMENTO DE CONVERSÃO — GA4 + Meta Pixel + Google Ads
     Dispara eventos sempre que o visitante clica em qualquer
     CTA que leve ao WhatsApp (Hero, FAQ e botão flutuante).

     Google Ads: remarketing já roda com GOOGLE_ADS_ID sozinho.
     Evento conversion só dispara se GOOGLE_ADS_CONVERSION_LABEL
     estiver preenchido. Sem o rótulo, use click_whatsapp /
     generate_lead no GA4 e importe no painel do Ads.
     ----------------------------------------------------- */
  const siteConfig = window.SITE_CONFIG || {};
  const isPlaceholder = (value, placeholder) => !value || value === placeholder;

  const gaReady = !isPlaceholder(siteConfig.GA_MEASUREMENT_ID, 'G-XXXXXXXXXX');
  const pixelReady = !isPlaceholder(siteConfig.META_PIXEL_ID, '0000000000000000');
  const adsReady = !isPlaceholder(siteConfig.GOOGLE_ADS_ID, 'AW-XXXXXXXXXX');
  const adsConversionLabel = (siteConfig.GOOGLE_ADS_CONVERSION_LABEL || '').trim();

  if (!gaReady || !pixelReady) {
    console.warn(
      '[Analytics] Configure os IDs reais em window.SITE_CONFIG (no <head> do index.html) ' +
      'para ativar o Google Analytics 4 e/ou o Meta Pixel.'
    );
  }

  if (!adsReady) {
    console.warn(
      '[Google Ads] GOOGLE_ADS_ID ainda é placeholder (AW-XXXXXXXXXX). ' +
      'Cole o ID real em SITE_CONFIG para carregar o tag AW-*. ' +
      'Enquanto isso, use click_whatsapp / generate_lead no GA4 e vincule GA4↔Ads no painel.'
    );
  } else if (!adsConversionLabel) {
    console.info(
      '[Google Ads] Remarketing ativo (AW configurado). ' +
      'GOOGLE_ADS_CONVERSION_LABEL vazio — cole o rótulo em SITE_CONFIG para contar ' +
      'conversões de clique no WhatsApp no Ads, ou importe generate_lead / click_whatsapp do GA4.'
    );
  }

  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    link.addEventListener('click', () => {
      const ctaLabel = link.id || link.textContent.trim();
      const attr = attributionForEvents();

      // Anexa origem da campanha + clids à mensagem do WhatsApp
      const suffix = utmMessageSuffix();
      if (suffix) {
        try {
          const url = new URL(link.href);
          const currentText = url.searchParams.get('text') || '';
          url.searchParams.set('text', currentText + suffix);
          link.href = url.toString();
        } catch (e) {
          // href inválido — segue sem anexar atribuição
        }
      }

      console.log('[Conversão] Clique em CTA do WhatsApp:', ctaLabel, attr);

      // Google Analytics 4 — clique + lead (importáveis no Google Ads)
      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_whatsapp', {
          event_category: 'conversao',
          event_label: ctaLabel,
          ...attr,
        });
        window.gtag('event', 'generate_lead', {
          event_category: 'conversao',
          event_label: ctaLabel,
          currency: 'BRL',
          value: 0,
          ...attr,
        });
      }

      // Google Ads — conversão só com ID + rótulo reais (sem inventar rótulo)
      if (adsReady && adsConversionLabel && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: `${siteConfig.GOOGLE_ADS_ID}/${adsConversionLabel}`,
          event_category: 'conversao',
          event_label: ctaLabel,
        });
      }

      // Meta Pixel — Contact + Lead (com UTMs/clids quando existirem)
      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: ctaLabel, ...attr });
        window.fbq('track', 'Lead', { content_name: ctaLabel, ...attr });
      }
    });
  });

  /* -----------------------------------------------------
     6) RASTREAMENTO — cliques no link do Instagram
     Reforça autoridade/credibilidade e ajuda a medir se o
     perfil do Instagram (@advocaciaricardo) contribui para
     engajamento vindo de campanhas (Ads) e busca orgânica.
     ----------------------------------------------------- */
  document.querySelectorAll('a[href*="instagram.com"]').forEach((link) => {
    link.addEventListener('click', () => {
      const ctaLabel = link.id || link.textContent.trim();
      const attr = attributionForEvents();

      console.log('[Engajamento] Clique no Instagram:', ctaLabel, attr);

      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_instagram', {
          event_category: 'engajamento',
          event_label: ctaLabel,
          ...attr,
        });
      }

      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'ClickInstagram', { content_name: ctaLabel, ...attr });
      }
    });
  });

});
