/* ============================================================
   AgroLink — main interaction layer
   Smooth scroll, header, cursor, magnetic buttons, scroll scenes.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST   = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var lenis = null;

  /* ==========================================================
     1. SMOOTH SCROLL (Lenis) + ScrollTrigger sync
     ========================================================== */
  function initSmoothScroll() {
    var Ctor = window.Lenis || (window.lenis && window.lenis.default);
    if (!Ctor || reduced) return;

    lenis = new Ctor({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) {
        lenis.raf(t);
        requestAnimationFrame(raf);
      });
    }
  }

  function scrollTo(target) {
    if (lenis) {
      lenis.scrollTo(target, { offset: -70, duration: 1.3 });
    } else {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ==========================================================
     2. ANCHOR LINKS
     ========================================================== */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || !document.querySelector(hash)) return;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeMenu();
        scrollTo(hash);
      });
    });
  }

  /* ==========================================================
     3. HEADER — hide on scroll down, reveal on scroll up
     ========================================================== */
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var last = 0;
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;

      header.classList.toggle('is-solid', y > 80);

      if (y > 260 && y > last && !document.body.classList.contains('menu-open')) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }

      last = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ==========================================================
     4. MOBILE MENU
     ========================================================== */
  var burger = document.getElementById('burger');
  var menu   = document.getElementById('mobileMenu');

  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked', 'menu-open');
    if (lenis) lenis.start();
  }

  function initMenu() {
    if (!burger || !menu) return;

    menu.querySelectorAll('.menu__link').forEach(function (link, i) {
      link.style.setProperty('--i', i);
    });

    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
      document.body.classList.toggle('menu-open', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ==========================================================
     5. CUSTOM CURSOR
     ========================================================== */
  function initCursor() {
    var cursor = document.getElementById('cursor');
    if (!cursor || isTouch || reduced || !hasGsap) return;

    var label = cursor.querySelector('.cursor__label');
    var dot   = cursor.querySelector('.cursor__dot');
    var ring  = cursor.querySelector('.cursor__ring');

    var xTo    = gsap.quickTo(dot, 'x', { duration: 0.14, ease: 'power3' });
    var yTo    = gsap.quickTo(dot, 'y', { duration: 0.14, ease: 'power3' });
    var xRing  = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    var yRing  = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

    var shown = false;
    window.addEventListener('mousemove', function (e) {
      if (!shown) {
        gsap.to(cursor, { opacity: 1, duration: 0.4 });
        shown = true;
      }
      xTo(e.clientX); yTo(e.clientY);
      xRing(e.clientX); yRing(e.clientY);
    });

    document.addEventListener('mouseleave', function () {
      gsap.to(cursor, { opacity: 0, duration: 0.3 });
      shown = false;
    });

    // labelled hover targets (product cards)
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (label) label.textContent = el.getAttribute('data-cursor');
        cursor.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hover');
      });
    });

    // generic interactive targets
    document.querySelectorAll('a, button').forEach(function (el) {
      if (el.closest('[data-cursor]')) return;
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-link'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-link'); });
    });
  }

  /* ==========================================================
     6. MAGNETIC ELEMENTS
     ========================================================== */
  function initMagnetic() {
    if (isTouch || reduced || !hasGsap) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = el.classList.contains('icon-btn') ? 0.4 : 0.28;
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ==========================================================
     7. TEXT SPLITTING — line reveal
     ========================================================== */
  var splits = [];

  function buildSplits() {
    if (typeof window.SplitType === 'undefined') return;

    splits.forEach(function (s) { s.revert(); });
    splits = [];

    document.querySelectorAll('[data-split-lines]').forEach(function (el) {
      var split = new SplitType(el, { types: 'lines', lineClass: 'split-line' });
      splits.push(split);

      split.lines.forEach(function (line) {
        var mask = document.createElement('span');
        mask.className = 'line-mask';
        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });
    });
  }

  function animateSplits() {
    document.querySelectorAll('[data-split-lines]').forEach(function (el) {
      var lines = el.querySelectorAll('.split-line');
      if (!lines.length) return;

      gsap.set(lines, { yPercent: 115, opacity: 0 });

      var isHero = el.closest('.hero');

      gsap.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: isHero ? undefined : {
          trigger: el,
          start: 'top 86%',
          once: true
        },
        delay: isHero ? 0.05 : 0
      });
    });
  }

  /* ==========================================================
     8. FADE-UP ELEMENTS
     ========================================================== */
  function initFades() {
    document.querySelectorAll('[data-fade]').forEach(function (el) {
      var inHero = el.closest('.hero');

      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'expo.out',
        delay: inHero ? 0.35 : 0,
        scrollTrigger: inHero ? undefined : {
          trigger: el,
          start: 'top 90%',
          once: true
        }
      });
    });
  }

  /* ==========================================================
     9. PARALLAX
     ========================================================== */
  function initParallax() {
    if (reduced) return;

    var strong = window.innerWidth > 640 ? 14 : 7;
    var soft   = window.innerWidth > 640 ? 9 : 4;

    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      gsap.fromTo(el,
        { yPercent: -strong },
        {
          yPercent: strong,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
    });

    document.querySelectorAll('[data-parallax-soft]').forEach(function (el) {
      gsap.fromTo(el,
        { yPercent: -soft },
        {
          yPercent: soft,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') || el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
    });
  }

  /* ==========================================================
     10. IMAGE REVEAL (mask wipe + scale settle)
     ========================================================== */
  function initImageReveal() {
    if (reduced) return;

    document.querySelectorAll('[data-reveal-img]').forEach(function (wrap) {
      var img = wrap.querySelector('img');
      if (!img) return;

      var tl = gsap.timeline({
        scrollTrigger: { trigger: wrap, start: 'top 82%', once: true }
      });

      tl.fromTo(wrap,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut' })
        .to(img, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0.1);
    });
  }

  /* ==========================================================
     11. COUNTERS
     ========================================================== */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduced) {
        el.textContent = target.toLocaleString('en-US') + suffix;
        return;
      }

      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: function () {
          el.textContent = Math.round(obj.v).toLocaleString('en-US') + suffix;
        }
      });
    });
  }

  /* ==========================================================
     12. PROGRESS BARS
     ========================================================== */
  function initBars() {
    document.querySelectorAll('[data-bar]').forEach(function (el) {
      var pct = el.getAttribute('data-bar') + '%';

      if (reduced) { el.style.width = pct; return; }

      gsap.fromTo(el, { width: '0%' }, {
        width: pct,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
  }

  /* ==========================================================
     13. MARQUEE — infinite loop, direction follows scroll
     ========================================================== */
  function initMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track || reduced || !hasGsap) return;

    var group = track.querySelector('.marquee__group');
    if (!group) return;

    var loop = gsap.to(track, {
      x: function () { return -group.offsetWidth; },
      duration: 22,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: function (x) {
          var w = group.offsetWidth;
          return (parseFloat(x) % w) + 'px';
        }
      }
    });

    if (!hasST) return;

    ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        var dir = self.direction === -1 ? -1 : 1;
        gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(self.getVelocity() / 1400), 3)), duration: 0.4, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.35, overwrite: 'auto' });
      }
    });
  }

  /* ==========================================================
     14. WORLD MAP — dot matrix built from land boxes
     Equirectangular: 800 x 307 covers lon -180..180, lat 80..-58.
     ========================================================== */
  function initMap() {
    var svg = document.getElementById('worldMap');
    if (!svg) return;

    var land = svg.querySelector('.map__land');
    var pinsG = svg.querySelector('.map__pins');
    if (!land || !pinsG) return;

    // [latMin, latMax, lonMin, lonMax]
    var LAND = [
      [60, 80, -55, -20],    // Greenland
      [55, 72, -168, -60],   // Alaska + northern Canada
      [48, 60, -130, -58],   // Canada
      [30, 49, -124, -72],   // United States
      [18, 30, -112, -95],   // Mexico north
      [15, 22, -100, -88],   // Mexico south
      [8, 17, -90, -78],     // Central America
      [17, 23, -84, -66],    // Caribbean
      [0, 12, -78, -52],     // northern South America
      [-12, 0, -80, -36],
      [-24, -12, -70, -36],  // Brazil
      [-35, -24, -70, -50],
      [-52, -35, -74, -58],  // Chile / Argentina
      [58, 71, 5, 32],       // Scandinavia
      [45, 58, -6, 40],      // Europe
      [36, 45, -10, 30],     // southern Europe
      [45, 60, 20, 55],      // eastern Europe
      [20, 34, -16, 32],     // Sahara
      [5, 20, -16, 42],      // Sahel
      [-8, 5, 8, 42],        // central Africa
      [-26, -8, 12, 40],     // southern Africa
      [-34, -26, 16, 32],
      [-25, -12, 44, 50],    // Madagascar
      [55, 73, 40, 180],     // Siberia
      [42, 55, 45, 140],
      [22, 42, 75, 122],     // China
      [15, 38, 35, 60],      // Middle East
      [20, 30, 70, 88],      // India north
      [8, 20, 72, 84],       // India south
      [5, 22, 95, 110],      // SE Asia
      [-9, 5, 98, 140],      // Indonesia
      [6, 18, 120, 126],     // Philippines
      [32, 45, 130, 145],    // Japan
      [-38, -12, 114, 152],  // Australia
      [-46, -35, 166, 178]   // New Zealand
    ];

    // water carved back out of the boxes above
    var SEA = [
      [18, 30, -97, -82],    // Gulf of Mexico
      [55, 65, -95, -75],    // Hudson Bay
      [12, 20, -84, -70],    // Caribbean Sea
      [8, 20, 84, 94]        // Bay of Bengal
    ];

    var PINS = [
      [45, 5], [37, -120], [-15, -47], [-1, 37], [30, 75], [-32, 148]
    ];

    var STEP = 5;
    var NS = 'http://www.w3.org/2000/svg';

    function x(lon) { return (lon + 180) / 360 * 800; }
    function y(lat) { return (80 - lat) / 138 * 307; }

    function inside(boxes, lat, lon) {
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3]) return true;
      }
      return false;
    }

    var frag = document.createDocumentFragment();
    for (var lat = 80; lat >= -58; lat -= STEP) {
      for (var lon = -180; lon <= 180; lon += STEP) {
        if (!inside(LAND, lat, lon) || inside(SEA, lat, lon)) continue;
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x(lon).toFixed(1));
        c.setAttribute('cy', y(lat).toFixed(1));
        c.setAttribute('r', '1.9');
        frag.appendChild(c);
      }
    }
    land.appendChild(frag);

    PINS.forEach(function (p, i) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pin');
      g.style.setProperty('--d', (i * 0.4) + 's');

      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'pin__halo');
      halo.setAttribute('cx', x(p[1]).toFixed(1));
      halo.setAttribute('cy', y(p[0]).toFixed(1));
      halo.setAttribute('r', '11');

      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'pin__dot');
      dot.setAttribute('cx', x(p[1]).toFixed(1));
      dot.setAttribute('cy', y(p[0]).toFixed(1));
      dot.setAttribute('r', '4');

      g.appendChild(halo);
      g.appendChild(dot);
      pinsG.appendChild(g);
    });
  }

  /* ==========================================================
     15. PROCESS — active step + progress line
     ========================================================== */
  function initProcess() {
    var steps = document.querySelectorAll('[data-step]');
    var bar   = document.getElementById('processBar');
    if (!steps.length || !hasST) return;

    steps.forEach(function (step) {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: function (self) {
          step.classList.toggle('is-active', self.isActive);
        }
      });
    });

    if (!bar) return;

    ScrollTrigger.create({
      trigger: '.process__steps',
      start: 'top 70%',
      end: 'bottom 70%',
      onUpdate: function (self) {
        bar.style.width = (self.progress * 100).toFixed(1) + '%';
      }
    });
  }

  /* ==========================================================
     BOOT
     ========================================================== */
  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    initSmoothScroll();
    initAnchors();
    initHeader();
    initMenu();
    initCursor();
    initMagnetic();
    initMap();

    if (!hasGsap) {
      // Nothing to animate — make sure everything is visible.
      root.classList.remove('js-ready');
      return;
    }

    // Line-splitting only exists to drive the reveal — skip it entirely when
    // motion is unwanted so the headings stay as plain, selectable text.
    if (!reduced) {
      buildSplits();
      animateSplits();
    }
    initFades();
    initImageReveal();
    initCounters();
    initBars();
    initMarquee();

    if (hasST) {
      initParallax();
      initProcess();
      ScrollTrigger.refresh();
    }

    // Re-split headings after a resize so line masks stay correct.
    var resizeTimer;
    window.addEventListener('resize', function () {
      if (reduced) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildSplits();
        document.querySelectorAll('.split-line').forEach(function (l) {
          gsap.set(l, { yPercent: 0, opacity: 1 });
        });
        if (hasST) ScrollTrigger.refresh();
      }, 250);
    });

    // Fonts can shift line breaks — refresh once they settle.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (hasST) ScrollTrigger.refresh();
      });
    }
  }

  document.addEventListener('agrolink:intro-done', boot, { once: true });

  // Safety net: if the preloader never fires (script error, blocked CDN),
  // boot anyway so the page is never left hidden or locked.
  setTimeout(function () {
    if (booted) return;
    document.body.classList.remove('is-locked');
    var pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
    boot();
  }, 6000);
})();
