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
  const revealTargets = document.querySelectorAll(
    '.step, .authority__photo, .authority__content, .hero__inner'
  );

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
     4) RASTREAMENTO DE CONVERSÃO — Google Analytics 4 + Meta Pixel
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
      console.log('[Conversão] Clique em CTA do WhatsApp:', ctaLabel);

      // Google Analytics 4
      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_whatsapp', {
          event_category: 'conversao',
          event_label: ctaLabel,
        });
      }

      // Meta Pixel
      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: ctaLabel });
      }
    });
  });

});
