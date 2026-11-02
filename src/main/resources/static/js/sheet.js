// 모바일 바텀시트 (네이버 지도 앱 방식)
// - 1단계: 화면 1/4 · 2단계: 1/2 · 3단계: 위까지(is-open, handleHide)
// - 시트 어디를 잡고 끌어도 움직인다. 1단계에선 더 못 내리고, 3단계에선 더 못 올린다.
// - 본문(data-sheet-body)은 3단계에 멈춰 있을 때만 스크롤된다.
//   3단계에서 본문이 맨 위일 때 아래로 끌면 시트가 내려가고, 아니면 본문이 스크롤된다.
// - 끌거나 움직이는 동안(is-moving)은 본문 터치를 막고, 멈추면 다시 누를 수 있다.
(() => {
  const STOPS = [0.75, 0.5, 0]; // 단계별 translateY (시트 높이 대비)
  const OPEN = STOPS.length - 1;
  const START = 1;              // 처음/시트가 바뀔 때는 2단계
  const DRAG_MIN = 6;           // 이만큼(px) 움직여야 끌기로 본다 (그 전엔 탭)
  const FLICK = 0.4;            // 이 속도(px/ms) 이상 튕기면 그 방향 다음 단계로

  const mobile = window.matchMedia('(max-width: 1023px)');

  function setup(sheet) {
    const body = sheet.querySelector('[data-sheet-body]');
    let step = START;
    let touch = null; // 손가락을 댄 동안의 상태

    const offsetOf = (i) => sheet.offsetHeight * STOPS[i];
    const currentOffset = () => new DOMMatrix(getComputedStyle(sheet).transform).m42;

    function moveTo(i, animate = true) {
      const before = sheet.style.transform;
      step = i;
      sheet.style.transform = 'translateY(' + STOPS[i] * 100 + '%)';
      sheet.classList.toggle('is-open', i === OPEN);
      sheet.classList.toggle('handleHide', i === OPEN);
      if (i !== OPEN) body.scrollTop = 0;

      // 위치가 그대로면 transitionend 가 오지 않으니 바로 멈춘 상태로
      if (animate && before !== sheet.style.transform) sheet.classList.add('is-moving');
      else sheet.classList.remove('is-moving');
    }

    // 놓은 위치와 속도로 다음 단계를 고른다
    function pickStep(offset, velocity) {
      const offsets = STOPS.map((_, i) => offsetOf(i));
      if (velocity < -FLICK) { // 위로 튕김: 지금 위치보다 위에 있는 단계 중 가장 가까운 것
        const up = offsets.findIndex((o) => o < offset - 1);
        if (up !== -1) return up;
      }
      if (velocity > FLICK) { // 아래로 튕김: 지금 위치보다 아래에 있는 단계 중 가장 가까운 것
        for (let i = OPEN; i >= 0; i--) if (offsets[i] > offset + 1) return i;
      }
      let nearest = 0;
      offsets.forEach((o, i) => {
        if (Math.abs(o - offset) < Math.abs(offsets[nearest] - offset)) nearest = i;
      });
      return nearest;
    }

    sheet.addEventListener('transitionend', (e) => {
      if (e.target === sheet && e.propertyName === 'transform') sheet.classList.remove('is-moving');
    });

    sheet.addEventListener('touchstart', (e) => {
      if (!mobile.matches || e.touches.length > 1) return;
      const y = e.touches[0].clientY;
      touch = { startY: y, startOffset: currentOffset(), inBody: body.contains(e.target),
                dragging: false, lastY: y, lastT: e.timeStamp, velocity: 0 };
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      if (!touch) return;
      const y = e.touches[0].clientY;

      if (!touch.dragging) {
        const dy = y - touch.startY;
        if (Math.abs(dy) < DRAG_MIN) return;
        // 3단계 본문: 위로 밀거나, 이미 스크롤돼 있으면 본문 스크롤에 맡긴다
        if (step === OPEN && touch.inBody && (dy < 0 || body.scrollTop > 0)) {
          touch = null;
          return;
        }
        touch.dragging = true;
        touch.startY = y; // 여기서부터 따라가야 시트가 덜컥 튀지 않는다
        sheet.classList.add('is-dragging', 'is-moving');
      }

      e.preventDefault(); // 끄는 동안은 페이지/본문 스크롤과 클릭을 막는다
      const offset = Math.min(offsetOf(0), Math.max(offsetOf(OPEN), touch.startOffset + y - touch.startY));
      sheet.style.transform = 'translateY(' + offset + 'px)';

      const dt = e.timeStamp - touch.lastT;
      if (dt > 0) touch.velocity = (y - touch.lastY) / dt;
      touch.lastY = y;
      touch.lastT = e.timeStamp;
    }, { passive: false });

    function release() {
      if (!touch) return;
      const { dragging, velocity } = touch;
      touch = null;
      if (!dragging) return;
      const offset = currentOffset();
      sheet.classList.remove('is-dragging');
      moveTo(pickStep(offset, velocity));
    }
    sheet.addEventListener('touchend', release);
    sheet.addEventListener('touchcancel', release);

    // 탭을 바꾸면 새 내용은 맨 위부터
    sheet.querySelectorAll('[data-pc-tab]').forEach((tab) => {
      tab.addEventListener('click', () => { body.scrollTop = 0; });
    });

    // 자리를 고르면(sheet:show) 1단계로 내려가 있던 시트를 2단계로 올린다
    document.addEventListener('sheet:show', () => {
      if (step < START) moveTo(START);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mo-sheet]').forEach(setup);
  });
})();
