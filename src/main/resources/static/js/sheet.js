/*
 * 아래에서 올라오는 시트
 * 열기: <button data-sheet-open="시트id">   닫기: [data-sheet-close], 바깥 어두운 영역, ESC
 * 시트: <div id="시트id" class="sheet" hidden>
 */
(function () {
  var opener = null;

  function open(id, trigger) {
    var sheet = document.getElementById(id);
    if (!sheet) return;
    opener = trigger;
    sheet.hidden = false;
    document.body.classList.add('overflow-hidden');
    var close = sheet.querySelector('[data-sheet-close]');
    if (close) close.focus();
  }

  function closeAll() {
    document.querySelectorAll('.sheet:not([hidden])').forEach(function (sheet) { sheet.hidden = true; });
    document.body.classList.remove('overflow-hidden');
    if (opener) { opener.focus(); opener = null; }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-sheet-open]');
    if (trigger) return open(trigger.getAttribute('data-sheet-open'), trigger);
    if (e.target.closest('[data-sheet-close]') || e.target.classList.contains('sheet')) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
})();
