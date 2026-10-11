/* ============================================================
   Kebab mobile menu — toggle, overlay, Esc, focus trap, aria
   Vanilla JS, no dependencies. Safe to drop into Dawn's theme.js
   or load as a separate deferred script.
   ============================================================ */
(function () {
  'use strict';

  var root = document.querySelector('[data-mg-kebab]');
  if (!root) return;

  var toggle = root.querySelector('[data-mg-kebab-toggle]');
  var panel = root.querySelector('[data-mg-kebab-panel]');
  var overlay = root.querySelector('[data-mg-kebab-overlay]');
  if (!toggle || !panel || !overlay) return;

  var lastFocused = null;

  function focusable() {
    return panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  }

  function open() {
    lastFocused = document.activeElement;
    root.classList.add('is-open');
    document.body.classList.add('mg-kebab-open');
    panel.hidden = false;
    overlay.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    var items = focusable();
    if (items.length) items[0].focus();
    document.addEventListener('keydown', onKeydown, true);
  }

  function close() {
    root.classList.remove('is-open');
    document.body.classList.remove('mg-kebab-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown, true);
    // let the 200ms transition finish before hiding
    window.setTimeout(function () {
      if (!root.classList.contains('is-open')) {
        panel.hidden = true;
        overlay.hidden = true;
      }
    }, 200);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function isOpen() {
    return root.classList.contains('is-open');
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;

    var items = focusable();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  toggle.addEventListener('click', function () {
    isOpen() ? close() : open();
  });

  overlay.addEventListener('click', close);

  // Close after navigating (page unload will happen, but be safe for hash links)
  panel.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (link) close();
  });

  // If viewport crosses into desktop range, force-close
  var mq = window.matchMedia('(min-width: 750px)');
  function onResize() {
    if (mq.matches && isOpen()) close();
  }
  if (mq.addEventListener) mq.addEventListener('change', onResize);
  else if (mq.addListener) mq.addListener(onResize);
})();
