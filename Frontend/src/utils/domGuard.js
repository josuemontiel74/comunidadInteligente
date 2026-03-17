/**
 * Utility para proteger la aplicación contra manipulación del DOM
 * por extensiones como Google Translate, Grammarly, etc.
 *
 * Previene la desincronización entre VDOM y DOM real
 */

import { useEffect } from 'react';

/**
 * Hook para desabilitar Google Translate y extensiones similares.
 * Agregarlo en el componente raíz (App.jsx o main.jsx)
 *
 * @example
 * useEffect(() => {
 *   disableGoogleTranslate();
 *   preventDOMManipulation();
 * }, []);
 */

export const disableGoogleTranslate = () => {
  // Ocultar elemento de Google Translate si existe
  const googleTranslateElement = document.getElementById('google_translate_element');
  if (googleTranslateElement) {
    googleTranslateElement.style.display = 'none';
  }

  // Agregar atributo notranslate a la aplicación
  const appRoot = document.getElementById('root');
  if (appRoot) {
    appRoot.setAttribute('translate', 'no');
    appRoot.classList.add('notranslate');
  }

  // Prevenir script de Google Translate
  if (window.hasOwnProperty('google') && window.google.translate) {
    window.google.translate.TranslatorInit.getInstance().restorePageFromFile();
  }
};

/**
 * Monitorea cambios directos al DOM y los reporta
 * (SOLO para desarrollo - no usar en producción sin logging)
 */
export const preventDOMManipulation = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Observar cambios en el DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Ignorar cambios que React hace
      if (mutation.target.getAttribute('data-react-root')) return;

      // Ignorar atributos que extensiones typicamente modifican
      if (mutation.type === 'attributes') {
        const ignoredAttrs = [
          'lang',
          'class',
          'style',
          'data-gtranslate-element-id',
        ];
        if (ignoredAttrs.includes(mutation.attributeName)) return;
      }

      // Log de cambios sospechosos
      console.warn(
        '[DOM-GUARD] Cambio externo detectado:',
        mutation.type,
        mutation.attributeName,
        mutation.target
      );
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['lang', 'translate', 'class'],
  });

  return () => observer.disconnect();
};

/**
 * Wrapper para renderizar html seguro evitando inyecciones
 * y manipulación de DOM por extensiones
 */
export const createSafeElement = (tag, props, ...children) => {
  const element = document.createElement(tag);

  // No permitir atributos sospechosos
  const blockedAttrs = ['onclick', 'onload', 'onerror', 'data-gtranslate'];

  Object.entries(props || {}).forEach(([key, value]) => {
    if (blockedAttrs.includes(key.toLowerCase())) {
      console.warn(
        `[DOM-GUARD] Atributo bloqueado: ${key}. Posible inyección.`
      );
      return;
    }

    if (key === 'className') {
      element.className = value;
    } else if (key === 'style') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-') || key === 'id') {
      element.setAttribute(key, value);
    }
  });

  // Agregar atributo para identificar elementos controlados por React
  element.setAttribute('data-react-safe', 'true');

  return element;
};

/**
 * Restaurar el DOM si fue corrompido por extensiones
 * Útil cuando detectas el error "insertBefore"
 */
export const restoreDOMIntegrity = () => {
  const root = document.getElementById('root');

  if (!root) {
    console.error('[DOM-GUARD] No se encontró elemento root');
    return false;
  }

  // Remover elementos insertados por extensiones
  const botsToRemove = [
    '[id^="google_translate"]',
    '[class*="gTranslatorPanel"]',
    '[class*="grammarly"]',
    '[data-gtranslate-element-id]',
  ];

  botsToRemove.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
        console.warn(
          '[DOM-GUARD] Elemento de extensión removido:',
          el.tagName,
          el.className
        );
      } catch (e) {
        console.error('[DOM-GUARD] Error removiendo elemento:', e);
      }
    });
  });

  return true;
};

/**
 * Hook para usar en componentes React
 * Evita re-renders causados por manipulación externa
 */
export const useProtectedDOM = () => {
  useEffect(() => {
    // Ejecutar protecciones al montar
    disableGoogleTranslate();

    // Restaurar integridad cada 5 segundos (desarrollo)
    const interval =
      process.env.NODE_ENV === 'development'
        ? setInterval(() => {
            if (
              document.querySelectorAll('[id^="google_translate"]').length > 0
            ) {
              console.warn('[DOM-GUARD] Extensión detectada, limpiando...');
              restoreDOMIntegrity();
            }
          }, 5000)
        : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);
};

/**
 * Configuración para agregar a index.html HEAD
 * para prevenir ciertas extensiones:
 *
 * <meta name="google" content="notranslate" />
 * <meta name="translated" content="no" />
 * <meta http-equiv="Content-Security-Policy"
 *   content="script-src 'self' 'unsafe-inline' https://translate.googleapis.com; ...">
 */
