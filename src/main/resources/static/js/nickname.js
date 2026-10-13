/*
 * 닉네임 수정 (docs/design/mobile/D9Nickname.dc.html)
 * - 입력하는 동안 규칙(2~12자, 한글·영문·숫자)은 바로, 금칙어·중복·30일 제한은 서버(/api/me/nickname/check)에 물어 알려준다.
 * - 랜덤 뽑기는 서버가 지금 쓸 수 있는 닉네임을 골라 준다.
 * - 저장은 서버가 모든 규칙을 다시 검사하고, 마지막으로 DB 고유 제약이 중복을 막는다.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-nick-form]');
  if (!root) return;

  var input = root.querySelector('[data-nick-input]');
  var msg = root.querySelector('[data-nick-msg]');
  var count = root.querySelector('[data-nick-count]');
  var randomButton = root.querySelector('[data-nick-random]');
  var saveButton = root.querySelector('[data-nick-save]');
  var current = root.dataset.current;
  var lockDays = parseInt(root.dataset.lockDays, 10) || 0;

  var token = metaContent('_csrf');
  var header = metaContent('_csrf_header');
  var requestId = 0;
  var valid = false;

  function metaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.content : '';
  }

  function show(text, ok) {
    msg.textContent = text;
    msg.className = 'font-medium ' + (ok === null ? 'text-ink-sub' : ok ? 'text-ink' : 'text-accent');
    input.classList.remove('border-line', 'border-primary', 'border-accent');
    input.classList.add(ok === null ? 'border-line' : ok ? 'border-primary' : 'border-accent');
    valid = ok === true;
    saveButton.disabled = !valid;
  }

  /** 서버에 가지 않아도 알 수 있는 규칙 */
  function localError(value) {
    if (value.length < 2) return '2자 이상 입력해 주세요';
    if (value.length > 12) return '12자 이하로 입력해 주세요';
    if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) return '한글·영문·숫자만 쓸 수 있어요';
    return null;
  }

  function check() {
    var value = input.value;
    count.textContent = value.length;
    if (value === current) { show('', null); return; }
    var error = localError(value);
    if (error) { show(error, false); return; }

    var id = ++requestId;
    fetch('/api/me/nickname/check?value=' + encodeURIComponent(value))
      .then(function (res) { return res.ok ? res.json() : { ok: false, message: '확인하지 못했어요. 잠시 후 다시 시도해 주세요' }; })
      .then(function (data) { if (id === requestId) show(data.message, data.ok); })
      .catch(function () { if (id === requestId) show('네트워크 오류가 났어요', false); });
  }

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    count.textContent = input.value.length;
    saveButton.disabled = true; // 검사가 끝나기 전에는 저장하지 못하게
    timer = setTimeout(check, 250);
  });

  randomButton.addEventListener('click', function () {
    randomButton.disabled = true;
    fetch('/api/me/nickname/random')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.nickname) { input.value = data.nickname; check(); }
        else show(data.message || '닉네임을 뽑지 못했어요', false);
      })
      .catch(function () { show('네트워크 오류가 났어요', false); })
      .then(function () { randomButton.disabled = false; });
  });

  saveButton.addEventListener('click', function () {
    if (!valid) return;
    saveButton.disabled = true;
    var headers = { 'Content-Type': 'application/json' };
    headers[header] = token;
    fetch('/api/me/nickname', { method: 'PUT', headers: headers, body: JSON.stringify({ nickname: input.value }) })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = {};
          try { data = text ? JSON.parse(text) : {}; } catch (e) { /* HTML 오류 화면 등 */ }
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (res) {
        if (res.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
        if (!res.ok) {
          // 검사 후 저장 사이에 누가 먼저 가져간 경우도 여기서 안내된다 (DB 고유 제약)
          show(res.data.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요', false);
          return;
        }
        current = res.data.nickname;
        location.href = '/my'; // 바뀐 닉네임이 보이는 마이페이지로
      })
      .catch(function () { show('네트워크 오류가 났어요', false); });
  });

  // 처음 상태
  count.textContent = input.value.length;
  saveButton.disabled = true;
  if (lockDays > 0) { // 변경 후 30일이 지나지 않았다
    input.disabled = true;
    randomButton.disabled = true;
    show('닉네임은 ' + lockDays + '일 뒤에 다시 바꿀 수 있어요', false);
  }
})();
