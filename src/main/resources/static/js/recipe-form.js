/*
 * 레시피 작성·수정 화면 (docs/design/mobile/D6Write.dc.html)
 * - 재료는 자동완성(/api/ingredients/suggest)으로 고르고, 목록에 없으면 기타 재료(단가 제외)로 직접 입력한다.
 * - 입력하는 동안 예상 1인분 단가를 바로 계산한다. (기본 양념·기타 재료는 단가에서 제외: DB 규칙과 같다)
 * - 사진은 브라우저에서 용량을 줄인 뒤 /api/uploads/images 로 올리고, 돌려받은 공개 주소를 저장한다.
 * - 새 레시피는 작성 중 내용을 브라우저(localStorage)에 임시저장한다.
 * - 저장은 JSON 으로 /api/recipes 에 보낸다. 최종 검증은 서버가 다시 한다.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-recipe-form]');
  if (!root) return;

  var mode = root.dataset.mode; // 'new' | 'edit'
  var recipeId = root.dataset.recipeId;
  var DRAFT_KEY = 'hankki:recipe-draft:new';
  var csrfToken = metaContent('_csrf');
  var csrfHeader = metaContent('_csrf_header');

  function metaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.content : '';
  }
  function $(selector, ctx) { return (ctx || root).querySelector(selector); }
  function $$(selector, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(selector)); }
  function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  // ---------------------------------------------------------------- 상태
  function blankState() {
    return {
      title: '', servings: 1, cookMinutes: '', tool: '프라이팬', coverImage: null,
      ingredients: [],
      steps: [{ content: '', image: null }, { content: '', image: null }]
    };
  }

  var state = blankState();
  var draftStatus = $('[data-draft-status]');

  if (window.__RECIPE__) { // 수정: 서버가 준 기존 내용
    var r = window.__RECIPE__;
    state.title = r.title;
    state.servings = r.servings;
    state.cookMinutes = r.cookMinutes;
    state.tool = r.tool;
    state.coverImage = r.coverImage || null;
    state.ingredients = (r.ingredients || []).map(function (i) {
      return {
        ingredientId: i.ingredientId, name: i.name, custom: !!i.custom, unit: i.unit,
        unitPrice: i.unitPrice || 0, basic: !!i.basic,
        quantity: i.quantity == null ? '' : String(i.quantity), displayAmount: i.displayAmount || ''
      };
    });
    state.steps = (r.steps || []).map(function (s) { return { content: s.content, image: s.image || null }; });
    if (!state.steps.length) state.steps = blankState().steps;
  } else if (mode === 'new') { // 새 레시피: 임시저장된 내용이 있으면 불러온다
    var draft = readDraft();
    if (draft) {
      state = draft;
      setDraftStatus('임시저장 내용을 불러왔어요');
    }
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && Array.isArray(data.ingredients) && Array.isArray(data.steps) ? data : null;
    } catch (e) { return null; }
  }
  function setDraftStatus(text) { if (draftStatus) draftStatus.textContent = text; }
  var saveDraft = debounce(function () {
    if (mode !== 'new') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      setDraftStatus('임시저장됨');
    } catch (e) { /* 저장 공간이 없거나 막혀 있으면 조용히 넘어간다 */ }
  }, 600);
  function changed() { updatePrice(); saveDraft(); }

  // ---------------------------------------------------------------- 기본 정보
  var titleInput = $('[data-title]');
  var servingsInput = $('[data-servings]');
  var minutesInput = $('[data-minutes]');

  titleInput.value = state.title;
  servingsInput.value = state.servings;
  minutesInput.value = state.cookMinutes;
  titleInput.addEventListener('input', function () { state.title = titleInput.value; changed(); });
  servingsInput.addEventListener('input', function () { state.servings = servingsInput.value; changed(); });
  minutesInput.addEventListener('input', function () { state.cookMinutes = minutesInput.value; changed(); });

  var toolButtons = $$('[data-tool]');
  function renderTools() {
    toolButtons.forEach(function (b) { b.classList.toggle('chip-active', b.dataset.tool === state.tool); });
  }
  toolButtons.forEach(function (b) {
    b.addEventListener('click', function () { state.tool = b.dataset.tool; renderTools(); changed(); });
  });
  renderTools();

  // ---------------------------------------------------------------- 사진
  var fileInput = $('[data-file-input]');
  var onPicked = null;
  var busy = false;

  function pickImage(callback) {
    if (busy) return;
    onPicked = callback;
    fileInput.value = '';
    fileInput.click();
  }

  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    var callback = onPicked;
    if (!file || !callback) return;
    setBusy(true);
    hideError();
    shrink(file)
      .then(upload)
      .then(function (url) { callback(url); changed(); })
      .catch(function (e) { showError(e.message || '사진을 올리지 못했어요.'); })
      .then(function () { setBusy(false); });
  });

  /** 긴 변 1280px, JPEG 로 줄인다. 올리는 용량과 저장소 비용을 아낀다. */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // 투명 PNG 가 검게 나오지 않도록
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          blob ? resolve(blob) : reject(new Error('사진을 처리하지 못했어요.'));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('이 사진은 읽을 수 없어요. JPG, PNG, WEBP 사진을 올려 주세요.'));
      };
      img.src = url;
    });
  }

  function upload(blob) {
    var body = new FormData();
    body.append('file', blob, 'photo.jpg');
    var headers = {};
    headers[csrfHeader] = csrfToken;
    return fetch('/api/uploads/images', { method: 'POST', headers: headers, body: body })
      .then(readJson)
      .then(function (res) {
        if (res.status === 401) { goLogin(); throw new Error('로그인이 필요해요.'); }
        if (!res.ok) throw new Error(res.data.message || '사진을 올리지 못했어요.');
        return res.data.url;
      });
  }

  var coverButton = $('[data-cover]');
  var coverImg = $('[data-cover-img]');
  var coverLabel = $('[data-cover-label]');
  var coverRemove = $('[data-cover-remove]');

  function renderCover() {
    var has = !!state.coverImage;
    coverImg.hidden = !has;
    if (has) coverImg.src = state.coverImage;
    coverLabel.textContent = has ? '' : '대표 사진 올리기';
    coverRemove.hidden = !has;
  }
  coverButton.addEventListener('click', function () {
    pickImage(function (url) { state.coverImage = url; renderCover(); });
  });
  coverRemove.addEventListener('click', function () { state.coverImage = null; renderCover(); changed(); });
  renderCover();

  // ---------------------------------------------------------------- 재료
  var ingredientList = $('[data-ingredient-list]');
  var ingredientTemplate = $('#tpl-ingredient');
  var totalEl = $('[data-total]');

  function costOf(item) {
    if (item.custom || item.basic) return 0;
    var q = parseFloat(item.quantity);
    return q > 0 ? q * item.unitPrice : 0;
  }
  function costLabel(item) {
    if (item.custom) return '단가 제외';
    if (item.basic) return '기본 양념';
    var cost = costOf(item);
    return cost > 0 ? fmt(cost) + '원' : '';
  }

  /** 예상 1인분 단가 = 재료 금액 합 ÷ 인분 수 (기본 양념·기타 재료 제외) */
  function updatePrice() {
    var servings = parseInt(state.servings, 10);
    if (!(servings > 0)) servings = 1;
    var sum = state.ingredients.reduce(function (acc, i) { return acc + costOf(i); }, 0);
    totalEl.textContent = '약 ' + fmt(sum / servings) + '원';
    $$('[data-ingredient-list] > div').forEach(function (row, index) {
      var item = state.ingredients[index];
      if (item) $('[data-cost]', row).textContent = costLabel(item);
    });
  }

  function renderIngredients() {
    ingredientList.innerHTML = '';
    state.ingredients.forEach(function (item, index) {
      var row = ingredientTemplate.content.firstElementChild.cloneNode(true);
      $('[data-name]', row).textContent = item.name;
      var qty = $('[data-qty]', row);
      var display = $('[data-display]', row);

      if (item.custom || item.basic) {
        // 단가에 들어가지 않는 재료는 사용량을 받지 않는다 (기본 양념은 사용량을 적으면 그대로 저장)
        if (item.custom) $('[data-qty-box]', row).hidden = true;
      }
      $('[data-qty-label]', row).textContent = '사용량' + (item.unit ? ' (' + item.unit + ')' : '');
      qty.value = item.quantity;
      display.value = item.displayAmount;

      qty.addEventListener('input', function () { item.quantity = qty.value; changed(); });
      display.addEventListener('input', function () { item.displayAmount = display.value; changed(); });
      $('[data-remove]', row).addEventListener('click', function () {
        state.ingredients.splice(index, 1);
        renderIngredients();
        changed();
      });
      ingredientList.appendChild(row);
    });
    updatePrice();
  }

  // 재료 자동완성
  var searchInput = $('[data-ing-search]');
  var results = $('[data-ing-results]');

  function hideResults() { results.hidden = true; results.innerHTML = ''; }

  function priceLabel(item) {
    var p = Number(item.unitPrice);
    if (item.unit === '개') return '개당 ' + fmt(p) + '원';
    return '100' + item.unit + '당 ' + fmt(p * 100) + '원';
  }

  var rowClass = 'flex min-h-field w-full items-center justify-between gap-2 border-0 bg-surface px-3.5 text-left text-body hover:bg-page';

  function showResults(query, items) {
    results.innerHTML = '';
    items.forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = rowClass;
      var left = document.createElement('span');
      var name = document.createElement('b');
      name.textContent = item.name;
      left.appendChild(name);
      if (item.alias) left.appendChild(document.createTextNode(' · ' + item.alias));
      var right = document.createElement('span');
      right.className = 'text-caption text-ink-sub';
      right.textContent = item.basic ? '기본 양념' : priceLabel(item);
      button.appendChild(left);
      button.appendChild(right);
      button.addEventListener('mousedown', function (e) { e.preventDefault(); addRegistered(item); });
      results.appendChild(button);
    });

    var custom = document.createElement('button');
    custom.type = 'button';
    custom.className = rowClass + ' border-t border-line text-caption text-ink-sub';
    custom.textContent = '목록에 없어요 · "' + query + '" 기타 재료로 직접 입력 (단가 제외)';
    custom.addEventListener('mousedown', function (e) { e.preventDefault(); addCustom(query); });
    results.appendChild(custom);
    results.hidden = false;
  }

  function afterAdd() {
    searchInput.value = '';
    hideResults();
    renderIngredients();
    changed();
    var rows = $$('[data-ingredient-list] > div');
    var last = rows[rows.length - 1];
    if (last) {
      var field = $('[data-qty-box]', last).hidden ? $('[data-display]', last) : $('[data-qty]', last);
      field.focus();
    }
  }

  function addRegistered(item) {
    var exists = state.ingredients.some(function (i) { return i.ingredientId === item.id; });
    if (!exists) {
      state.ingredients.push({
        ingredientId: item.id, name: item.name, custom: false, unit: item.unit,
        unitPrice: Number(item.unitPrice), basic: !!item.basic, quantity: '', displayAmount: ''
      });
    }
    afterAdd();
  }

  function addCustom(name) {
    state.ingredients.push({
      ingredientId: null, name: name.slice(0, 30), custom: true, unit: null,
      unitPrice: 0, basic: false, quantity: '', displayAmount: ''
    });
    afterAdd();
  }

  searchInput.addEventListener('input', debounce(function () {
    var query = searchInput.value.trim();
    if (!query) return hideResults();
    fetch('/api/ingredients/suggest?includeBasic=true&q=' + encodeURIComponent(query))
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (items) { if (searchInput.value.trim() === query) showResults(query, items); })
      .catch(hideResults);
  }, 150));
  searchInput.addEventListener('blur', hideResults);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === 'Escape') hideResults();
  });

  // ---------------------------------------------------------------- 조리 순서
  var stepList = $('[data-step-list]');
  var stepTemplate = $('#tpl-step');

  function renderSteps() {
    stepList.innerHTML = '';
    state.steps.forEach(function (step, index) {
      var row = stepTemplate.content.firstElementChild.cloneNode(true);
      $('[data-no]', row).textContent = index + 1;
      var content = $('[data-content]', row);
      content.value = step.content;
      content.setAttribute('aria-label', (index + 1) + '단계 설명');
      if (index > 0) content.placeholder = '다음 단계를 적어 주세요';
      content.addEventListener('input', function () { step.content = content.value; changed(); });

      var photo = $('[data-photo]', row);
      var img = $('[data-photo-img]', row);
      var label = $('[data-photo-label]', row);
      photo.setAttribute('aria-label', (index + 1) + '단계 사진 ' + (step.image ? '바꾸기' : '추가'));
      img.hidden = !step.image;
      if (step.image) { img.src = step.image; label.textContent = ''; }
      photo.addEventListener('click', function () {
        if (step.image && window.confirm('이 사진을 지울까요? "취소"를 누르면 다른 사진으로 바꿀 수 있어요.')) {
          step.image = null;
          renderSteps();
          changed();
          return;
        }
        pickImage(function (url) { step.image = url; renderSteps(); });
      });
      stepList.appendChild(row);
    });
  }
  $('[data-add-step]').addEventListener('click', function () {
    state.steps.push({ content: '', image: null });
    renderSteps();
    changed();
    var areas = $$('[data-content]', stepList);
    areas[areas.length - 1].focus();
  });

  // ---------------------------------------------------------------- 저장
  var submitButton = $('[data-submit]');
  var errorBox = $('[data-form-error]');

  function setBusy(value) {
    busy = value;
    submitButton.disabled = value;
    submitButton.dataset.label = submitButton.dataset.label || submitButton.textContent;
    submitButton.textContent = value ? '처리 중...' : submitButton.dataset.label;
  }
  function showError(message) { errorBox.textContent = message; errorBox.hidden = false; errorBox.scrollIntoView({ block: 'nearest' }); }
  function hideError() { errorBox.hidden = true; errorBox.textContent = ''; }

  function validate() {
    var problems = [];
    if (!state.title.trim()) problems.push('제목을 입력해 주세요.');
    if (!(parseInt(state.servings, 10) >= 1)) problems.push('인분을 1 이상으로 적어 주세요.');
    if (!(parseInt(state.cookMinutes, 10) >= 1)) problems.push('조리시간을 1분 이상으로 적어 주세요.');
    if (!state.ingredients.length) problems.push('재료를 하나 이상 넣어 주세요.');
    state.ingredients.forEach(function (i) {
      if (!i.custom && !(parseFloat(i.quantity) > 0)) problems.push('"' + i.name + '"의 사용량을 적어 주세요.');
    });
    if (!state.steps.some(function (s) { return s.content.trim(); })) problems.push('조리 순서를 하나 이상 적어 주세요.');
    return problems;
  }

  function payload() {
    return {
      title: state.title.trim(),
      servings: parseInt(state.servings, 10),
      cookMinutes: parseInt(state.cookMinutes, 10),
      tool: state.tool,
      coverImage: state.coverImage,
      ingredients: state.ingredients.map(function (i) {
        return {
          ingredientId: i.custom ? null : i.ingredientId,
          customName: i.custom ? i.name : null,
          quantity: i.custom ? null : parseFloat(i.quantity),
          displayAmount: i.displayAmount.trim() || null
        };
      }),
      steps: state.steps
        .filter(function (s) { return s.content.trim(); })
        .map(function (s) { return { content: s.content.trim(), image: s.image }; })
    };
  }

  function readJson(res) {
    return res.text().then(function (text) {
      var data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { /* HTML 오류 화면 등 */ }
      return { ok: res.ok, status: res.status, data: data };
    });
  }

  function goLogin() {
    location.href = '/login?next=' + encodeURIComponent(location.pathname);
  }

  function send(method, url, body) {
    var headers = { 'Content-Type': 'application/json' };
    headers[csrfHeader] = csrfToken;
    return fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined }).then(readJson);
  }

  submitButton.addEventListener('click', function () {
    if (busy) return;
    hideError();
    var problems = validate();
    if (problems.length) return showError(problems.join('\n'));

    setBusy(true);
    var editing = mode === 'edit';
    send(editing ? 'PUT' : 'POST', editing ? '/api/recipes/' + recipeId : '/api/recipes', payload())
      .then(function (res) {
        if (res.status === 401) return goLogin();
        if (!res.ok) {
          var lines = [res.data.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'];
          Object.keys(res.data.fields || {}).forEach(function (key) { lines.push('· ' + res.data.fields[key]); });
          setBusy(false);
          return showError(lines.join('\n'));
        }
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
        location.href = '/recipes/' + res.data.id;
      })
      .catch(function () { setBusy(false); showError('네트워크 오류가 났어요. 잠시 후 다시 시도해 주세요.'); });
  });

  var deleteButton = $('[data-delete]');
  if (deleteButton) {
    deleteButton.addEventListener('click', function () {
      if (!window.confirm('이 레시피를 삭제할까요? 삭제하면 되돌릴 수 없어요.')) return;
      setBusy(true);
      send('DELETE', '/api/recipes/' + recipeId)
        .then(function (res) {
          if (res.status === 401) return goLogin();
          if (!res.ok) { setBusy(false); return showError(res.data.message || '삭제하지 못했어요.'); }
          location.href = '/recipes';
        })
        .catch(function () { setBusy(false); showError('네트워크 오류가 났어요. 잠시 후 다시 시도해 주세요.'); });
    });
  }

  renderIngredients();
  renderSteps();
})();
