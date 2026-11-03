// 월 선택 달력: [data-month-picker] 안의 버튼을 누르면 연도 + 12개월 판이 뜬다.
// 고른 값은 숨은 input 에 "YYYY-MM" 으로 넣어서 폼 전송(FormData)은 예전 type=month 와 같다.
// 이번 달보다 미래는 고를 수 없다.
(() => {
  const MIN_YEAR = 1990;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function setup(picker) {
    const input = picker.querySelector('input[type="hidden"]');
    const trigger = picker.querySelector('[data-month-trigger]');
    const label = picker.querySelector('[data-month-label]');
    const popup = picker.querySelector('[data-month-popup]');
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    let year = thisYear; // 지금 보고 있는 연도

    function setValue(value) {
      input.value = value;
      label.textContent = value ? value.replace('-', '년 ') + '월' : label.dataset.placeholder;
      trigger.classList.toggle('is-empty', !value);
    }

    function close() {
      popup.classList.add('hidden');
    }

    function render() {
      const [selYear, selMonth] = input.value ? input.value.split('-').map(Number) : [];

      const head = document.createElement('div');
      head.className = 'mb-3 flex items-center justify-between';
      const title = document.createElement('span');
      title.className = 'text-md font-semibold text-zinc-900';
      title.textContent = year + '년';
      const nav = document.createElement('div');
      nav.className = 'flex gap-1';
      [['fa-chevron-left', -1, year <= MIN_YEAR, '이전 해'], ['fa-chevron-right', 1, year >= thisYear, '다음 해']]
        .forEach(([icon, step, disabled, name]) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'month-nav';
          btn.disabled = disabled;
          btn.setAttribute('aria-label', name);
          btn.innerHTML = '<i class="fa-solid ' + icon + ' text-xs"></i>';
          btn.addEventListener('click', () => { year += step; render(); });
          nav.append(btn);
        });
      head.append(title, nav);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-4 gap-1';
      for (let m = 1; m <= 12; m++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'month-cell';
        cell.textContent = m + '월';
        cell.disabled = year === thisYear && m > thisMonth;
        cell.classList.toggle('is-current', year === thisYear && m === thisMonth);
        cell.classList.toggle('is-selected', year === selYear && m === selMonth);
        cell.addEventListener('click', () => {
          setValue(year + '-' + pad(m));
          close();
        });
        grid.append(cell);
      }

      const foot = document.createElement('div');
      foot.className = 'mt-3 flex justify-end';
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'text-xs text-zinc-500 underline underline-offset-2';
      clear.textContent = '지우기';
      clear.addEventListener('click', () => { setValue(''); close(); });
      foot.append(clear);

      popup.replaceChildren(head, grid, foot);
    }

    trigger.addEventListener('click', () => {
      const opening = popup.classList.contains('hidden');
      document.querySelectorAll('[data-month-popup]').forEach((p) => p.classList.add('hidden')); // 하나만 열기
      if (!opening) return;
      year = input.value ? Number(input.value.slice(0, 4)) : thisYear;
      render();
      popup.classList.remove('hidden');
    });

    // 바깥을 누르거나 Esc 면 닫는다. 팝업 안의 클릭은 다시 그려지며 대상이 사라질 수 있어 picker 기준으로 본다.
    document.addEventListener('click', (e) => {
      if (!picker.contains(e.target) && e.target.isConnected) close();
    });
    picker.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // form.reset() 은 숨은 input 값을 지우지 않아서 직접 비운다
    const form = picker.closest('form');
    if (form) form.addEventListener('reset', () => { setValue(''); close(); });

    setValue('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-month-picker]').forEach(setup);
  });
})();
