/* ============================================================
   AgroLink — preloader
   Runs first, owns the intro timeline, then hands control to main.js
   via the `agrolink:intro-done` event on document.
   ============================================================ */
(function () {
  'use strict';

  var root      = document.documentElement;
  var body      = document.body;
  var preloader = document.getElementById('preloader');
  var countEl   = document.getElementById('preloaderCount');
  var barEl     = document.getElementById('preloaderBar');
  var wordEl    = document.querySelector('[data-preload-word]');
  var markEl    = document.querySelector('.preloader__mark');
  var labelEl   = document.querySelector('[data-preload-fade]');
  var curtainEl = document.querySelector('.preloader__curtain');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  // Mark the document as JS-driven so CSS can hide animated elements.
  root.classList.add('js-ready');
  body.classList.add('is-locked');

  function finish() {
    body.classList.remove('is-locked');
    if (preloader) {
      preloader.classList.add('is-done');
      preloader.style.display = 'none';
    }
    document.dispatchEvent(new CustomEvent('agrolink:intro-done'));
  }

  // --- graceful fallbacks -------------------------------------------------
  if (!preloader || !hasGsap) {
    finish();
    return;
  }

  if (reduced) {
    gsap.to(preloader, {
      opacity: 0,
      duration: 0.3,
      delay: 0.15,
      onComplete: finish
    });
    return;
  }

  // --- split the brand word into characters -------------------------------
  if (wordEl) {
    var letters = wordEl.textContent.trim().split('');
    wordEl.textContent = '';
    letters.forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      wordEl.appendChild(span);
    });
  }

  var chars = wordEl ? wordEl.querySelectorAll('.ch') : [];
  var progress = { value: 0 };

  var tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: finish
  });

  tl.to(markEl, { opacity: 1, y: 0, duration: 0.8 })
    .to(chars, {
      opacity: 1,
      y: '0%',
      rotate: 0,
      duration: 1,
      stagger: 0.045
    }, '-=0.55')
    .to(labelEl, { opacity: 1, duration: 0.7 }, '-=0.7')

    // counter + bar move together, deliberately eased so it feels weighted
    .to(progress, {
      value: 100,
      duration: 2.1,
      ease: 'power2.inOut',
      onUpdate: function () {
        var v = Math.round(progress.value);
        if (countEl) countEl.textContent = v;
        if (barEl) barEl.style.width = v + '%';
      }
    }, '-=0.4')

    // brief settle before the exit
    .to({}, { duration: 0.25 })

    // exit: content lifts out, then the whole panel wipes upward
    .to([markEl, wordEl, labelEl, document.querySelector('.preloader__count')], {
      y: -34,
      opacity: 0,
      duration: 0.7,
      stagger: 0.05,
      ease: 'power3.inOut'
    })
    .to('.preloader__track', {
      scaleY: 0,
      opacity: 0,
      transformOrigin: 'center',
      duration: 0.5,
      ease: 'power3.inOut'
    }, '-=0.55')
    .set(curtainEl, { opacity: 1 })
    .to(preloader, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 1.05,
      ease: 'expo.inOut'
    }, '-=0.1');
})();
