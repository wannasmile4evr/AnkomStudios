// Sign Up / Log In modal. Forms are wired to the local Express + SQLite
// backend (server.js) further down.
(function () {
  var overlay = document.getElementById('authOverlay');
  if (!overlay) return;

  var openBtn = document.querySelector('[data-auth-open]');
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;

    // Lock background scroll without letting the page shift sideways:
    // if the vertical scrollbar was taking up space, add that same
    // amount back as right padding before removing it.
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
    document.body.style.overflow = 'hidden';

    overlay.hidden = false;
    var firstField = overlay.querySelector('input');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (openBtn) {
    openBtn.addEventListener('click', openModal);
  }

  overlay.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-auth-close')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  // Password show/hide toggle
  overlay.querySelectorAll('[data-auth-toggle-pw]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-auth-toggle-pw'));
      if (!input) return;
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      btn.classList.toggle('is-visible', !showing);
    });
  });

  // Forms wired to the local Express + SQLite backend (see server.js).
  ['authLoginForm', 'authSignupForm'].forEach(function (id) {
    var form = document.getElementById(id);
    if (!form) return;

    var status = document.createElement('p');
    status.className = 'auth-status';
    form.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('is-error');

      var email = form.querySelector('input[type="email"]').value;
      var password = form.querySelector('input[type="password"]').value;
      var endpoint = id === 'authLoginForm' ? '/api/login' : '/api/signup';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            status.textContent = result.data.error || 'Something went wrong.';
            status.classList.add('is-error');
            return;
          }
          status.textContent = result.data.message || 'Success!';
          if (id === 'authLoginForm') {
            setTimeout(closeModal, 800);
          }
        })
        .catch(function () {
          status.textContent = 'Network error — is the server running?';
          status.classList.add('is-error');
        });
    });
  });
})();