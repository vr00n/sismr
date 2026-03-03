(function () {
  'use strict';

  var API = 'https://api.github.com';
  var token = '';
  var repo = '';
  var content = null;
  var contentSha = '';
  var dirty = false;
  var pendingImages = [];

  // --- DOM refs ---
  var loginScreen = document.getElementById('loginScreen');
  var dashboard = document.getElementById('dashboard');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var publishBtn = document.getElementById('publishBtn');
  var statusBadge = document.getElementById('statusBadge');
  var logoutBtn = document.getElementById('logoutBtn');
  var galleryEditor = document.getElementById('galleryEditor');
  var addImageBtn = document.getElementById('addImageBtn');

  // --- Helpers ---
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o && o[k]; }, obj);
  }

  function setPath(obj, path, val) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k]; }, obj);
    target[last] = val;
  }

  function markDirty() {
    dirty = true;
    publishBtn.disabled = false;
    statusBadge.textContent = 'Unsaved';
    statusBadge.className = 'status-badge unsaved';
  }

  function markClean() {
    dirty = false;
    publishBtn.disabled = true;
    statusBadge.textContent = 'Saved';
    statusBadge.className = 'status-badge';
  }

  function apiCall(method, path, body) {
    var opts = {
      method: method,
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.message); });
      return r.json();
    });
  }

  // --- Auth ---
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    token = document.getElementById('token').value.trim();
    repo = document.getElementById('repo').value.trim();
    loginError.textContent = '';

    var btn = document.getElementById('loginBtn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;

    apiCall('GET', '/repos/' + repo)
      .then(function () { return loadContent(); })
      .then(function () {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        sessionStorage.setItem('sismr_token', token);
        sessionStorage.setItem('sismr_repo', repo);
        populateAll();
      })
      .catch(function (err) {
        loginError.textContent = 'Error: ' + err.message;
      })
      .finally(function () {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      });
  });

  // Auto-login from session
  var savedToken = sessionStorage.getItem('sismr_token');
  var savedRepo = sessionStorage.getItem('sismr_repo');
  if (savedToken && savedRepo) {
    token = savedToken;
    repo = savedRepo;
    document.getElementById('token').value = token;
    document.getElementById('repo').value = repo;
    loginForm.dispatchEvent(new Event('submit'));
  }

  logoutBtn.addEventListener('click', function () {
    sessionStorage.removeItem('sismr_token');
    sessionStorage.removeItem('sismr_repo');
    token = '';
    content = null;
    dashboard.style.display = 'none';
    loginScreen.style.display = 'flex';
  });

  // --- Load content.json from repo ---
  function loadContent() {
    return apiCall('GET', '/repos/' + repo + '/contents/content.json')
      .then(function (data) {
        contentSha = data.sha;
        content = JSON.parse(atob(data.content.replace(/\n/g, '')));
      });
  }

  // --- Populate form fields from content ---
  function populateAll() {
    document.querySelectorAll('[data-path]').forEach(function (el) {
      var val = getPath(content, el.dataset.path);
      if (val !== undefined) {
        if (el.tagName === 'IMG') {
          el.src = val;
        } else {
          el.value = val;
        }
      }
    });

    populateImagePreviews();
    populateStats();
    populateTimeline();
    populateCards();
    populateArticles();
    populateGallery();
    bindInputs();
  }

  function bindInputs() {
    document.querySelectorAll('[data-path]').forEach(function (el) {
      if (el.tagName === 'IMG') return;
      el.addEventListener('input', function () {
        setPath(content, el.dataset.path, el.value);
        markDirty();
      });
    });
  }

  function populateImagePreviews() {
    document.querySelectorAll('.image-upload').forEach(function (wrap) {
      var path = wrap.dataset.path;
      var img = wrap.querySelector('.image-preview');
      var btn = wrap.querySelector('.upload-btn');
      var input = wrap.querySelector('.image-input');
      var val = getPath(content, path);
      if (val) img.src = val;

      btn.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        handleImageSelect(this.files[0], function (dataUrl, fileName) {
          img.src = dataUrl;
          var newPath = 'images/' + fileName;
          setPath(content, path, newPath);
          pendingImages.push({ path: newPath, dataUrl: dataUrl });
          markDirty();
        });
      });
    });
  }

  function populateStats() {
    var container = document.querySelector('[data-array-path="hero.stats"]');
    if (!container) return;
    container.innerHTML = '';
    content.hero.stats.forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML =
        '<input type="text" value="' + escAttr(s.number) + '" placeholder="Number">' +
        '<input type="text" value="' + escAttr(s.label) + '" placeholder="Label">';
      row.querySelectorAll('input').forEach(function (inp, j) {
        inp.addEventListener('input', function () {
          content.hero.stats[i][j === 0 ? 'number' : 'label'] = inp.value;
          markDirty();
        });
      });
      container.appendChild(row);
    });
  }

  function populateTimeline() {
    var container = document.querySelector('[data-array-path="about.timeline"]');
    if (!container) return;
    container.innerHTML = '';
    content.about.timeline.forEach(function (item, i) {
      var div = createArrayItem('Timeline Item ' + (i + 1), [
        { label: 'Year', value: item.year, key: 'year' },
        { label: 'Title', value: item.title, key: 'title' },
        { label: 'Text', value: item.text, key: 'text', textarea: true }
      ], function (key, val) {
        content.about.timeline[i][key] = val;
        markDirty();
      });
      container.appendChild(div);
    });
  }

  function populateCards() {
    var container = document.querySelector('[data-array-path="activities.cards"]');
    if (!container) return;
    container.innerHTML = '';
    content.activities.cards.forEach(function (card, i) {
      var div = createArrayItem('Card ' + (i + 1), [
        { label: 'Title', value: card.title, key: 'title' },
        { label: 'Text', value: card.text, key: 'text', textarea: true }
      ], function (key, val) {
        content.activities.cards[i][key] = val;
        markDirty();
      });
      container.appendChild(div);
    });
  }

  function populateArticles() {
    var container = document.querySelector('[data-array-path="news.articles"]');
    if (!container) return;
    container.innerHTML = '';
    content.news.articles.forEach(function (art, i) {
      var div = createArrayItem('Article ' + (i + 1), [
        { label: 'Source', value: art.source, key: 'source' },
        { label: 'Date', value: art.date, key: 'date' },
        { label: 'Headline', value: art.headline, key: 'headline' },
        { label: 'URL', value: art.url, key: 'url' },
        { label: 'Excerpt', value: art.excerpt, key: 'excerpt', textarea: true },
        { label: 'Tag', value: art.tag, key: 'tag' }
      ], function (key, val) {
        content.news.articles[i][key] = val;
        markDirty();
      });
      container.appendChild(div);
    });
  }

  function populateGallery() {
    galleryEditor.innerHTML = '';
    content.gallery.images.forEach(function (img, i) {
      var div = document.createElement('div');
      div.className = 'gallery-image-item';

      var imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.alt;
      div.appendChild(imgEl);

      var fields = document.createElement('div');
      fields.className = 'gallery-image-fields';
      fields.innerHTML =
        '<div class="field"><label>Caption</label><input type="text" value="' + escAttr(img.caption) + '"></div>' +
        '<div class="field"><label>Alt Text</label><input type="text" value="' + escAttr(img.alt) + '"></div>' +
        '<div class="wide-toggle"><input type="checkbox" ' + (img.wide ? 'checked' : '') + '> <span>Wide (spans 2 columns)</span></div>' +
        '<div class="gallery-image-actions">' +
        '<label class="btn btn-secondary btn-sm">Replace Image<input type="file" accept="image/*" style="display:none"></label>' +
        '<button type="button" class="btn btn-danger btn-sm remove-gallery-btn">Remove</button>' +
        '</div>';

      var inputs = fields.querySelectorAll('input[type="text"]');
      inputs[0].addEventListener('input', function () { content.gallery.images[i].caption = this.value; markDirty(); });
      inputs[1].addEventListener('input', function () { content.gallery.images[i].alt = this.value; markDirty(); });

      fields.querySelector('input[type="checkbox"]').addEventListener('change', function () {
        content.gallery.images[i].wide = this.checked;
        markDirty();
      });

      fields.querySelector('input[type="file"]').addEventListener('change', function () {
        handleImageSelect(this.files[0], function (dataUrl, fileName) {
          imgEl.src = dataUrl;
          var newPath = 'images/' + fileName;
          content.gallery.images[i].src = newPath;
          pendingImages.push({ path: newPath, dataUrl: dataUrl });
          markDirty();
        });
      });

      fields.querySelector('.remove-gallery-btn').addEventListener('click', function () {
        content.gallery.images.splice(i, 1);
        markDirty();
        populateGallery();
      });

      div.appendChild(fields);
      galleryEditor.appendChild(div);
    });
  }

  addImageBtn.addEventListener('click', function () {
    content.gallery.images.push({
      src: '',
      alt: 'New image',
      caption: 'New image',
      wide: false
    });
    markDirty();
    populateGallery();
  });

  // --- Helper: create array item editor ---
  function createArrayItem(label, fields, onChange) {
    var div = document.createElement('div');
    div.className = 'array-item';

    var header = document.createElement('div');
    header.className = 'array-item-header';
    header.innerHTML = '<strong>' + label + '</strong>';
    div.appendChild(header);

    fields.forEach(function (f) {
      var wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = '<label>' + f.label + '</label>';
      var input;
      if (f.textarea) {
        input = document.createElement('textarea');
        input.rows = 2;
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.value = f.value || '';
      input.addEventListener('input', function () { onChange(f.key, input.value); });
      wrap.appendChild(input);
      div.appendChild(wrap);
    });

    return div;
  }

  // --- Image handling ---
  function handleImageSelect(file, callback) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      callback(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  }

  // --- Publish ---
  publishBtn.addEventListener('click', function () {
    if (!dirty) return;
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';
    statusBadge.textContent = 'Publishing...';
    statusBadge.className = 'status-badge publishing';

    var chain = Promise.resolve();

    // Upload pending images
    pendingImages.forEach(function (img) {
      chain = chain.then(function () { return uploadImage(img.path, img.dataUrl); });
    });

    // Save content.json
    chain = chain.then(function () { return saveContent(); });

    chain
      .then(function () {
        pendingImages = [];
        markClean();
        publishBtn.textContent = 'Publish Changes';
        alert('Published! Your site will update in about 30 seconds.');
      })
      .catch(function (err) {
        alert('Publish failed: ' + err.message);
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish Changes';
        statusBadge.textContent = 'Error';
        statusBadge.className = 'status-badge unsaved';
      });
  });

  function saveContent() {
    var body = {
      message: 'Update site content via admin panel',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      sha: contentSha
    };
    return apiCall('PUT', '/repos/' + repo + '/contents/content.json', body)
      .then(function (data) {
        contentSha = data.content.sha;
      });
  }

  function uploadImage(path, dataUrl) {
    var base64 = dataUrl.split(',')[1];
    return apiCall('GET', '/repos/' + repo + '/contents/' + path)
      .then(function (existing) {
        return apiCall('PUT', '/repos/' + repo + '/contents/' + path, {
          message: 'Update image: ' + path,
          content: base64,
          sha: existing.sha
        });
      })
      .catch(function () {
        return apiCall('PUT', '/repos/' + repo + '/contents/' + path, {
          message: 'Add image: ' + path,
          content: base64
        });
      });
  }

  // --- Tab switching ---
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // --- Escape HTML for attribute ---
  function escAttr(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
