// hoverpic-slim.js
// Copyright (c) 2026 Jonathan Sykes. MIT License.
//
// Shows a picture near the cursor while hovering over a span, or near the
// finger while a touch is held on it. Needs hoverpic-slim.css.
//
// MARKUP
//   <span class="hoverpic" data-hoverpic="image/11a.jpg">Pic 11a</span>
//   - data-hoverpic: path or URL of the image (required). Relative paths are
//     resolved against the page, as for any <img src>.
//   - The span's text can be anything; it is also used as the picture's alt text.
//   - If the image fails to load, nothing is shown.
//   Example in an Exolve clue:
//     11 <span class="hoverpic" data-hoverpic="image/11a.jpg">Pic 11a</span>, ancient goddess (4)
//
// ADDING TO A PAGE
//   <link rel="stylesheet" href="hoverpic-slim.css">   in <head>
//   <script src="hoverpic-slim.js"></script>           anywhere (no setup call needed)
//   Spans added after the page loads (e.g. Exolve's rendered clues and its
//   current-clue strip) work too: the script listens on the document, not on
//   individual spans.
//
// BEHAVIOUR
//   Mouse/pen: picture at the lower right of the pointer, follows it, flips at
//              the screen edges, hides when the pointer leaves the span or the
//              page scrolls.
//   Touch:     press and hold for LONG_PRESS_MS shows it; lifting the finger
//              hides it. Placed above the finger (shrunk to fit if needed), or
//              beside it when there is too little room above (e.g. a strip at
//              the top of the screen); never below, where the hand is. A quick
//              tap or a scroll behaves normally. The browser's long-press menu
//              and text selection are suppressed on these spans.
//   Size, border and shadow of the picture are set in hoverpic-slim.css.
(function () {
  'use strict';

  const SELECTOR = '.hoverpic[data-hoverpic]';
  const LONG_PRESS_MS = 350;      // touch hold time before the picture appears
  const GAP = 16;                 // px between pointer and picture
  const MIN_TOUCH_SIZE = 100;     // px; less room than this above the finger -> go beside it
  const MOVE_TOLERANCE = 10;      // px a held finger may drift before it counts as a scroll

  let popup = null;
  let activeSpan = null;
  let lastX = 0, lastY = 0, lastIsTouch = false;
  let startX = 0, startY = 0;
  let pressTimer = null;

  function getPopup() {
    if (!popup) {
      popup = document.createElement('img');
      popup.className = 'hoverpic-popup';
      popup.alt = '';
      document.body.appendChild(popup);
    }
    return popup;
  }

  function show(span, x, y, isTouch) {
    activeSpan = span;
    lastX = x; lastY = y; lastIsTouch = isTouch;
    const img = getPopup();
    const src = span.getAttribute('data-hoverpic').trim();
    img.classList.remove('visible');              // don't show the previous picture meanwhile
    img.alt = span.textContent.trim();
    const place = () => {
      if (activeSpan !== span) return;            // pointer has moved on
      img.classList.add('visible');
      position();
    };
    if (img.getAttribute('src') === src && img.complete && img.naturalWidth) {
      place();
    } else {
      img.onload = place;
      img.onerror = null;                         // failed load: stay hidden
      img.src = src;
    }
  }

  function hide() {
    activeSpan = null;
    if (popup) popup.classList.remove('visible');
  }

  // Mouse: lower right of the pointer, flipping if it would leave the screen.
  // Touch: never below the finger. Above it if there is room, shrinking to fit;
  // otherwise beside it, on the side with more room, shrinking to fit.
  function position() {
    if (!popup || !popup.classList.contains('visible')) return;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    popup.style.height = '';                      // measure at the CSS-limited size
    let w = popup.offsetWidth, h = popup.offsetHeight;
    let left, top;
    if (lastIsTouch) {
      const fingerGap = GAP * 3;
      const roomAbove = lastY - fingerGap - 4;
      if (roomAbove >= MIN_TOUCH_SIZE) {
        [w, h] = shrinkTo(w, h, Math.min(1, roomAbove / h));
        left = lastX - w / 2;
        top = lastY - fingerGap - h;
      } else {
        const sideGap = GAP * 2;
        const roomRight = vw - lastX - sideGap - 4;
        const roomLeft = lastX - sideGap - 4;
        const room = Math.max(roomLeft, roomRight);
        [w, h] = shrinkTo(w, h, Math.min(1, room / w, (vh - 8) / h));
        left = roomRight >= roomLeft ? lastX + sideGap : lastX - sideGap - w;
        top = lastY - h / 2;
      }
    } else {
      left = lastX + GAP;
      top = lastY + GAP;
      if (left + w > vw) left = lastX - GAP - w;
      if (top + h > vh) top = lastY - GAP - h;
    }
    left = Math.max(4, Math.min(left, vw - w - 4));
    top = Math.max(4, Math.min(top, vh - h - 4));
    popup.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  // Scale the popup (border included) by k, keeping its aspect ratio.
  function shrinkTo(w, h, k) {
    if (k >= 1) return [w, h];
    const border = popup.offsetHeight - popup.clientHeight;
    popup.style.height = `${Math.max(1, h * k - border)}px`;
    return [popup.offsetWidth, popup.offsetHeight];
  }

  const spanFrom = target => (target instanceof Element ? target.closest(SELECTOR) : null);

  // --- Mouse / pen hover ---
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const span = spanFrom(e.target);
    if (span && span !== activeSpan) show(span, e.clientX, e.clientY, false);
  });
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || !activeSpan) return;
    lastX = e.clientX; lastY = e.clientY;
    position();
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch' || !activeSpan) return;
    if (!activeSpan.contains(e.relatedTarget)) hide();
  });

  // --- Touch: press and hold ---
  document.addEventListener('touchstart', e => {
    const span = spanFrom(e.target);
    if (!span || e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = lastX = t.clientX;
    startY = lastY = t.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => show(span, lastX, lastY, true), LONG_PRESS_MS);
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (!activeSpan) {
      // Small wobble is still a hold; a real move is a scroll, so cancel.
      if (Math.hypot(t.clientX - startX, t.clientY - startY) > MOVE_TOLERANCE) clearTimeout(pressTimer);
      lastX = t.clientX; lastY = t.clientY;
      return;
    }
    lastX = t.clientX; lastY = t.clientY;
    position();
    e.preventDefault();          // keep the page still while the picture is up
  }, { passive: false });
  const endTouch = () => {
    clearTimeout(pressTimer);
    if (lastIsTouch) hide();
  };
  document.addEventListener('touchend', endTouch);
  document.addEventListener('touchcancel', endTouch);
  document.addEventListener('contextmenu', e => {
    if (spanFrom(e.target)) e.preventDefault();   // Android long-press menu
  });

  window.addEventListener('scroll', () => { if (!lastIsTouch) hide(); }, { passive: true });
})();
