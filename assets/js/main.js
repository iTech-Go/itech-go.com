/* iTech-Go — site behaviour (no dependencies) */
(function () {
  'use strict';

  // Theme toggle ----------------------------------------------------------
  var root = document.documentElement;
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0B1020' : '#F6F8FD');
    });
  });

  // Mobile nav ------------------------------------------------------------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal ---------------------------------------------------------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Forms (Web3Forms) -----------------------------------------------------
  // Set data-key on the <form> to your Web3Forms access key (free at web3forms.com).
  // Until a key is set, submissions fall back to opening the user's mail client.
  document.querySelectorAll('form[data-web3forms]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var key = form.getAttribute('data-key') || '';

    function say(msg, cls) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status ' + (cls || '');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return; // honeypot
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var data = new FormData(form);
      if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        // Fallback: mailto
        var subject = encodeURIComponent(data.get('subject') || 'Website enquiry');
        var lines = [];
        data.forEach(function (v, k) { if (k !== 'access_key' && k !== 'botcheck') lines.push(k + ': ' + v); });
        window.location.href = 'mailto:accounts@itech-go.com?subject=' + subject + '&body=' + encodeURIComponent(lines.join('\n'));
        say('Opening your email app…', 'ok');
        return;
      }

      data.append('access_key', key);
      if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = 'Sending…'; }
      say('');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) { form.reset(); say('Thanks — we received your message and will reply within one business day.', 'ok'); }
          else { say(res.message || 'Something went wrong. Please email accounts@itech-go.com.', 'err'); }
        })
        .catch(function () { say('Network error. Please email accounts@itech-go.com.', 'err'); })
        .finally(function () { if (button) { button.disabled = false; button.textContent = button.dataset.label; } });
    });
  });
})();
