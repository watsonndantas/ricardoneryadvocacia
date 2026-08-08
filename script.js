/* =========================================================
   Recupere seu Instagram Hoje — Dr. Ricardo Nery
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
     4) ATRIBUIÇÃO DE CAMPANHA (UTM) — para medir retorno de Ads
     Captura utm_source/utm_medium/utm_campaign da URL (quando o
     visitante vem de um anúncio) e guarda na sessão. Isso permite
     saber, mesmo depois que a conversa segue no WhatsApp, qual
     campanha/anúncio gerou aquele contato.
     ----------------------------------------------------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const UTM_STORAGE_KEY = 'rn_utm_params';

  const readUtmFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    UTM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });
    return utm;
  };

  let utmParams = {};
  try {
    const fromUrl = readUtmFromUrl();
    if (Object.keys(fromUrl).length) {
      utmParams = fromUrl;
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    } else {
      const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
      if (stored) utmParams = JSON.parse(stored);
    }
  } catch (e) {
    // sessionStorage indisponível (ex.: navegação privada) — segue sem UTM
  }

  const utmMessageSuffix = () => {
    if (!utmParams.utm_source && !utmParams.utm_campaign) return '';
    const parts = [];
    if (utmParams.utm_source) parts.push(`origem: ${utmParams.utm_source}`);
    if (utmParams.utm_campaign) parts.push(`campanha: ${utmParams.utm_campaign}`);
    return parts.length ? `\n\n[${parts.join(' | ')}]` : '';
  };

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
    { match: /banid|banimento/i, label: 'Especialista em conta banida no Instagram' },
    { match: /suspens/i, label: 'Especialista em conta suspensa no Instagram' },
    { match: /hack|invad|roubad|clonad/i, label: 'Especialista em conta hackeada no Instagram' },
    { match: /desativad/i, label: 'Especialista em conta desativada no Instagram' },
    { match: /liminar|urg[êe]ncia/i, label: 'Liminar para recuperação de conta no Instagram' },
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
     5) RASTREAMENTO DE CONVERSÃO — Google Analytics 4 + Meta Pixel
     Dispara um evento sempre que o visitante clica em qualquer
     CTA que leve ao WhatsApp (Hero, Autoridade e botão flutuante).
     ----------------------------------------------------- */
  const siteConfig = window.SITE_CONFIG || {};
  const isPlaceholder = (value, placeholder) => !value || value === placeholder;

  const gaReady = !isPlaceholder(siteConfig.GA_MEASUREMENT_ID, 'G-XXXXXXXXXX');
  const pixelReady = !isPlaceholder(siteConfig.META_PIXEL_ID, '0000000000000000');

  if (!gaReady || !pixelReady) {
    console.warn(
      '[Analytics] Configure os IDs reais em window.SITE_CONFIG (no <head> do index.html) ' +
      'para ativar o Google Analytics 4 e/ou o Meta Pixel.'
    );
  }

  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    link.addEventListener('click', () => {
      const ctaLabel = link.id || link.textContent.trim();

      // Anexa a origem da campanha à mensagem, se o clique vier de um anúncio
      const suffix = utmMessageSuffix();
      if (suffix) {
        try {
          const url = new URL(link.href);
          const currentText = url.searchParams.get('text') || '';
          url.searchParams.set('text', currentText + suffix);
          link.href = url.toString();
        } catch (e) {
          // href inválido — segue sem anexar UTM
        }
      }

      console.log('[Conversão] Clique em CTA do WhatsApp:', ctaLabel, utmParams);

      // Google Analytics 4
      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_whatsapp', {
          event_category: 'conversao',
          event_label: ctaLabel,
          ...utmParams,
        });
      }

      // Meta Pixel — Contact (contato) + Lead (sinal usado para otimizar campanhas)
      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: ctaLabel, ...utmParams });
        window.fbq('track', 'Lead', { content_name: ctaLabel, ...utmParams });
      }
    });
  });

});
