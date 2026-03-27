// =============================================
// SISMR Inc. — Main JavaScript
// =============================================

(function () {
  'use strict';

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  navToggle.addEventListener('click', function () {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });

  // Close mobile menu on link click
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });

  // --- Scroll fade-in animations ---
  const fadeElements = document.querySelectorAll('.fade-in');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(function (el) {
    fadeObserver.observe(el);
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Contact form (mailto fallback) ---
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('name').value;
      var email = document.getElementById('email').value;
      var subject = document.getElementById('subject');
      var subjectText = subject.options[subject.selectedIndex].text;
      var message = document.getElementById('message').value;

      var mailtoBody =
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Subject: ' + subjectText + '\n\n' +
        message;

      var mailtoLink =
        'mailto:mlogierjr@aol.com' +
        '?subject=' + encodeURIComponent('Website Inquiry: ' + subjectText) +
        '&body=' + encodeURIComponent(mailtoBody);

      window.location.href = mailtoLink;
    });
  }

  // --- Gallery lightbox ---
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

  document.querySelectorAll('.gallery-item img').forEach(function (img) {
    img.addEventListener('click', function () {
      if (lightbox && lightboxImg) {
        lightboxImg.src = this.src;
        lightboxImg.alt = this.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lightboxClose) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // --- Load dynamic content from content.json ---
  fetch('content.json')
    .then(function (r) { return r.json(); })
    .then(function (c) {
      // Hero
      setText('.hero-badge', c.hero.badge);
      var titleEl = document.querySelector('.hero-title');
      if (titleEl) titleEl.innerHTML = c.hero.title + '<br><span class="hero-highlight">' + c.hero.titleHighlight + '</span>';
      setText('.hero-subtitle', c.hero.subtitle);
      setText('.hero-description', c.hero.description);
      setImg('.hero-image img', c.hero.heroImage, c.hero.heroImageAlt);

      var statEls = document.querySelectorAll('.hero-stats .stat');
      c.hero.stats.forEach(function (s, i) {
        if (statEls[i]) {
          statEls[i].querySelector('.stat-number').textContent = s.number;
          statEls[i].querySelector('.stat-label').textContent = s.label;
        }
      });

      // About
      setText('#about .section-title', c.about.title);
      setText('.about-text .lead', c.about.lead);
      var aboutPs = document.querySelectorAll('.about-text > p:not(.lead)');
      c.about.paragraphs.forEach(function (p, i) { if (aboutPs[i]) aboutPs[i].innerHTML = p; });
      var bq = document.querySelector('.about-text blockquote');
      if (bq) {
        bq.querySelector('p').innerHTML = c.about.quote;
        bq.querySelector('cite').textContent = c.about.quoteCite;
      }

      // Timeline
      var timeline = document.querySelector('.timeline');
      if (timeline && c.about.timeline) {
        timeline.innerHTML = '';
        c.about.timeline.forEach(function (t) {
          var item = document.createElement('div');
          item.className = 'timeline-item' + (t.active ? ' active' : '');
          item.innerHTML = '<div class="timeline-year">' + t.year + '</div>' +
            '<div class="timeline-content"><h4>' + t.title + '</h4><p>' + t.text + '</p></div>';
          timeline.appendChild(item);
        });
      }

      // Activities
      setText('#activities .section-title', c.activities.title);
      setText('#activities .section-subtitle', c.activities.subtitle);
      var actCards = document.querySelectorAll('.activity-card');
      c.activities.cards.forEach(function (card, i) {
        if (actCards[i]) {
          actCards[i].querySelector('h3').textContent = card.title;
          actCards[i].querySelector('p').innerHTML = card.text;
        }
      });

      // News
      setText('#news .section-title', c.news.title);
      var newsCards = document.querySelectorAll('.news-card');
      c.news.articles.forEach(function (art, i) {
        if (newsCards[i]) {
          newsCards[i].querySelector('.news-source').textContent = art.source;
          newsCards[i].querySelector('.news-date').textContent = art.date;
          var link = newsCards[i].querySelector('h3 a');
          link.textContent = art.headline;
          link.href = art.url;
          newsCards[i].querySelector('p').innerHTML = art.excerpt;
          newsCards[i].querySelector('.news-tag').textContent = art.tag;
        }
      });
      var nq = document.querySelector('.notable-quote');
      if (nq) {
        nq.querySelector('p').innerHTML = c.news.featuredQuote;
        nq.querySelector('cite').textContent = c.news.featuredQuoteCite;
      }

      // Gallery
      setText('#gallery .section-title', c.gallery.title);
      setText('#gallery .section-subtitle', c.gallery.subtitle);
      var grid = document.querySelector('.gallery-grid');
      if (grid && c.gallery.images) {
        grid.innerHTML = '';
        c.gallery.images.forEach(function (img) {
          var item = document.createElement('div');
          item.className = 'gallery-item' + (img.wide ? ' gallery-item-wide' : '');
          item.innerHTML = '<img src="' + img.src + '" alt="' + esc(img.alt) + '" loading="lazy">' +
            '<div class="gallery-caption">' + img.caption + '</div>';
          item.querySelector('img').addEventListener('click', function () {
            if (lightbox && lightboxImg) {
              lightboxImg.src = this.src;
              lightboxImg.alt = this.alt;
              lightbox.classList.add('active');
              document.body.style.overflow = 'hidden';
            }
          });
          grid.appendChild(item);
        });
      }

      // CTA
      setText('.banner-content h2', c.cta.title);
      setText('.banner-content p', c.cta.text);

      // Join
      setText('#join .section-title', c.join.title);
      setText('#join .section-subtitle', c.join.subtitle);

      // Contact
      if (c.contact.officers) {
        var contactItems = document.querySelectorAll('.contact-info .contact-item');
        c.contact.officers.forEach(function (officer, i) {
          if (contactItems[i]) {
            var h4 = contactItems[i].querySelector('h4');
            if (h4) h4.textContent = officer.name + ', ' + officer.title;
            var phoneEl = contactItems[i].querySelector('a[href^="tel:"]');
            if (phoneEl) { phoneEl.href = 'tel:+1' + officer.phone.replace(/[^0-9]/g, ''); phoneEl.textContent = officer.phone; }
            var emailEl = contactItems[i].querySelector('a[href^="mailto:"]');
            if (emailEl) { emailEl.href = 'mailto:' + officer.email; emailEl.textContent = officer.email; }
          }
        });
      }
      var fbLink = document.querySelector('.contact-item a[target="_blank"]');
      if (fbLink) { fbLink.href = c.contact.facebook; fbLink.textContent = c.contact.facebookLabel; }
    })
    .catch(function () { /* fallback to HTML content */ });

  function setText(sel, val) {
    var el = document.querySelector(sel);
    if (el && val) el.textContent = val;
  }
  function setImg(sel, src, alt) {
    var el = document.querySelector(sel);
    if (el && src) { el.src = src; if (alt) el.alt = alt; }
  }
  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Active nav link highlighting ---
  var sections = document.querySelectorAll('section[id]');

  function highlightNav() {
    var scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        document.querySelectorAll('.nav-link').forEach(function (link) {
          link.classList.remove('nav-active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('nav-active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
})();
