/**
 * domGuard.js — Capa de protección del DOM contra extensiones de navegador.
 *
 * Extensiones como Google Translate, Grammarly y similares manipulan
 * el DOM inyectando nodos <font>, <span>, etc. dentro de elementos
 * que React controla, provocando el error:
 *   "NotFoundError: Failed to execute 'insertBefore' on 'Node'"
 *
 * Este módulo parchea Node.prototype.removeChild e insertBefore para
 * fallar silenciosamente cuando el nodo hijo ya no pertenece al padre
 * (porque la extensión lo movió). También expone un MutationObserver
 * opcional que limpia nodos huérfanos inyectados por extensiones.
 */

const EXTENSION_SELECTORS =
  "font[style], font[class], grammarly-extension, grammarly-desktop-integration";

let _installed = false;

/**
 * Instala los parches una sola vez.
 * Seguro llamar múltiples veces; las subsiguientes son no-op.
 */
export function installDomGuard() {
  if (_installed) return;
  _installed = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function safeRemoveChild(child) {
    if (child && child.parentNode !== this) {
      // El nodo ya fue movido/eliminado por una extensión — ignorar.
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function safeInsertBefore(newNode, refNode) {
    if (refNode && refNode.parentNode !== this) {
      // refNode ya no pertenece a este padre — insertar al final.
      return originalInsertBefore.call(this, newNode, null);
    }
    return originalInsertBefore.call(this, newNode, refNode);
  };
}

/**
 * Crea un MutationObserver que elimina nodos inyectados por extensiones
 * dentro del contenedor proporcionado.
 *
 * @param {HTMLElement} container — El elemento raíz a observar.
 * @returns {() => void} Función de limpieza para desconectar el observer.
 */
export function observeExtensionNodes(container) {
  if (!container) return () => {};

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.matches?.(EXTENSION_SELECTORS)
        ) {
          node.remove();
        }
      }
    }
  });

  observer.observe(container, { childList: true, subtree: true });

  return () => observer.disconnect();
}
