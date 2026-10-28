// 지도 영역이 바뀔 때마다 /api/places 를 호출해 자리 마커를 그린다.
(function () {
    let overlays = [];
    let controller = null;
    let vacantOnly = false; // "빈 자리만" 필터 상태
  
    // 점 모양 정의: 위에서부터 먼저 맞는 단계가 적용된다. 범례도 이 배열로 그린다.
    const LEVELS = [
      { label: '빈 자리', cls: 'size-4 border-1 border-white bg-zinc-800/40 hover:scale-110', match: (s) => s.openCount === 0 },
      { label: '8~10곳', cls: 'size-4 border-1 border-white bg-[#0e334f]/90 hover:scale-110', match: (s) => s.count >= 8 },
      { label: '6~7곳', cls: 'size-4 border-1 border-white bg-[#1199b7]/90 hover:scale-110', match: (s) => s.count >= 6 },
      { label: '4~5곳', cls: 'size-4 border-1 border-white bg-[#76c9c6e6]/90 hover:scale-110', match: (s) => s.count >= 4 },
      { label: '3곳', cls: 'size-4 border-1 border-white bg-primary-500/90 hover:scale-110', match: () => true },
        ];
    
        const shown = new Set(LEVELS); // 범례에서 켜 둔 단계 (처음엔 전부)
        let lastSpots = [];            // 마지막으로 받아 온 점 (범례를 누르면 이걸로 다시 그린다)
    
        function levelOf(spot) {
          return LEVELS.find((l) => l.match(spot));
        }
    
        function markerClass(spot) {
          return levelOf(spot).cls;
        }
    
    
        function renderLegend() {
          const root = document.getElementById('map');
          if (!root) return;
    
          const box = document.createElement('div');
          box.className = 'absolute bottom-3 right-3 z-10 flex gap-1 rounded-lg bg-white/90 p-2 text-2xs text-zinc-700 shadow';
    
          // 범례는 빈 자리를 맨 뒤에 보여 준다 (판정 순서와 별개)
          [...LEVELS.slice(1), LEVELS[0]].forEach((l) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'flex items-center gap-1 rounded px-1 hover:bg-zinc-100';
            row.setAttribute('aria-pressed', 'true');
            row.addEventListener('click', () => {
              if (shown.has(l)) shown.delete(l);
              else shown.add(l);
              const on = shown.has(l);
              row.setAttribute('aria-pressed', String(on));
              row.classList.toggle('opacity-40', !on); // 꺼진 항목은 흐리게
              draw(lastSpots);
            });
    
            const slot = document.createElement('span');
            slot.className = 'flex w-[26px] justify-center'; // 크기가 달라도 글자 줄이 맞도록 고정 폭
            const dot = document.createElement('span');
            dot.className = 'rounded-full shadow ' + l.cls;
            slot.append(dot);
    
            const label = document.createElement('span');
            label.textContent = l.label;
    
            row.append(slot, label);
            box.append(row);
          });
    
          root.append(box);
        }
    
      

  
    function clear() {
      overlays.forEach((o) => o.setMap(null));
      overlays = [];
    }

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach((el) => {
          el.textContent = text;
        });
    }

    function ym(date) {
        return date ? date.slice(0, 4) + '.' + date.slice(5, 7) : '?';
    }
  
    // 개업일~폐업일(없으면 오늘) 사이를 "3년 5개월" 형태로
    function duration(openedAt, closedAt) {
      if (!openedAt) return '';
      const from = new Date(openedAt);
      const to = closedAt ? new Date(closedAt) : new Date();
      const months = Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
      const y = Math.floor(months / 12);
      const m = months % 12;
      return ((y ? y + '년 ' : '') + (m || !y ? m + '개월' : '')).trim();
    }
  
     // ["105호","106호"] -> "105·106호"
    function unitLabel(units) {
      if (!units || !units.length) return '';
      return units.map((u) => u.replace(/호$/, '')).join('·') + '호';
    }
    
    function makeRow(store) {
      const isOpen = store.status === '영업/정상';
  
      const row = document.createElement('div');
      row.className = 'sign-row';
  
      const dot = document.createElement('span');
      dot.className = 'h-3 w-3 shrink-0 rounded-xs ' + (isOpen ? 'bg-blue-600/30' : 'bg-zinc-800/30');
  
      const info = document.createElement('div');
      info.className = 'flex min-w-0 flex-1 flex-col';
      const name = document.createElement('span');
      name.className = 'text-sm font-semibold';
      name.textContent = store.name;
      const sub = document.createElement('span');
      sub.className = 'text-2xs text-zinc-500';
      sub.textContent = (store.units ? unitLabel(store.units) + ' · ' : '')
      + (store.category ? store.category + ' · ' : '')
      + ym(store.openedAt) + ' – ' + (isOpen ? '영업 중' : ym(store.closedAt))
      + (store.ownerChanged ? ' · 영업자 변경 추정' : '');



      info.append(name, sub);
  
      const term = document.createElement('span');
      term.className = 'shrink-0 text-2xs font-semibold';
      term.textContent = isOpen
        ? duration(store.openedAt, null) + '째'
        : (store.closedAt ? duration(store.openedAt, store.closedAt) : '');
  
      row.append(dot, info, term);
      return row;
    }
    
    function makeGapRow(gap) {
      const row = document.createElement('div');
      row.className = 'sign-row';

      const dot = document.createElement('span');
      dot.className = 'h-3 w-3 shrink-0 rounded-xs border border-dashed border-zinc-400';

      const info = document.createElement('div');
      info.className = 'flex min-w-0 flex-1 flex-col';
      const name = document.createElement('span');
      name.className = 'text-sm text-zinc-500';
      name.textContent = '기록 없음';
      const sub = document.createElement('span');
      sub.className = 'text-2xs text-zinc-500';
      sub.textContent = ym(gap.from) + ' – ' + ym(gap.to) + ' · 인허가 대상이 아닌 업종이었을 수 있어요';
      info.append(name, sub);

      const term = document.createElement('span');
      term.className = 'shrink-0 text-2xs font-semibold text-zinc-500';
      term.textContent = fmtMonths(gap.months);

      row.append(dot, info, term);
      return row;
    }

    // 가게와 빈 기간을 시간 순으로 합쳐 최근 것이 위로 오게 보여 준다.
    function renderList(stores, gaps) {
      const entries = [
        ...stores.map((s) => ({ key: (s.openedAt || '') + '1', node: makeRow(s) })),
        ...gaps.map((g) => ({ key: g.to + '0', node: makeGapRow(g) })), // 같은 날이면 가게 아래에
      ].sort((a, b) => (a.key < b.key ? 1 : -1));

      document.querySelectorAll('[data-detail-list]').forEach((box) => {
        box.replaceChildren(...entries.map((e) => e.node.cloneNode(true)));
      });
    }

    

      // 개업일~폐업일(없으면 오늘) 사이의 개월 수
    function monthsBetween(openedAt, closedAt) {
        if (!openedAt) return null;
        const from = new Date(openedAt);
        const to = closedAt ? new Date(closedAt) : new Date();
        return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
    }

    // 개월 수를 "3년 5개월" 형태로
    function fmtMonths(months) {
        const y = Math.floor(months / 12);
        const m = months % 12;
        return ((y ? y + '년 ' : '') + (m || !y ? m + '개월' : '')).trim();
    }

    function renderStats(stores) {
        const spans = stores
        .map((s) => {
            const isOpen = s.status === '영업/정상';
            if (!isOpen && !s.closedAt) return null; // 폐업인데 폐업일이 없으면 계산 불가
            return monthsBetween(s.openedAt, isOpen ? null : s.closedAt);
        })
        .filter((v) => v !== null);

        const avg = spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null;
        const max = spans.length ? Math.max(...spans) : null;
        const isOpenNow = stores.some((s) => s.status === '영업/정상');

        setText('[data-stat-avg]', avg === null ? '-' : fmtMonths(avg));
        setText('[data-stat-max]', max === null ? '-' : fmtMonths(max));
        setText('[data-stat-state]', isOpenNow ? '영업 중' : '빈 자리');
    }

    function renderTimeline(stores) {
        const dated = stores.filter((s) => s.openedAt);
        if (!dated.length) return;
    
        const start = Math.min(...dated.map((s) => new Date(s.openedAt).getTime()));
        const end = Date.now();
        const total = Math.max(end - start, 1);
    
        const bars = dated.map((s) => {
          const isOpen = s.status === '영업/정상';
          const from = new Date(s.openedAt).getTime();
          const to = isOpen ? end : (s.closedAt ? new Date(s.closedAt).getTime() : from);
    
          const bar = document.createElement('div');
          bar.className = 'absolute bottom-1-5 top-1-5 rounded-sm ring-1 ring-white ' + (isOpen ? 'bg-blue-600/30' : 'bg-zinc-800/30');
          bar.style.left = ((from - start) / total * 100) + '%';
          bar.style.width = Math.max((to - from) / total * 100, 0.8) + '%';
          bar.title = s.name;
          return bar;
        });
    
        document.querySelectorAll('[data-detail-timeline]').forEach((box) => {
          box.replaceChildren(...bars.map((b) => b.cloneNode(true)));
        });
        setText('[data-timeline-start]', new Date(start).getFullYear());
        setText('[data-timeline-end]', new Date(end).getFullYear());
    }
    
    function makeRankRow(spot, index) {
        const row = document.createElement('a');
        row.href = '#';
        row.className = 'flex min-h-[50px] items-center gap-3 border-b border-zinc-100 py-2 text-zinc-900 no-underline';
    
        const rank = document.createElement('span');
        rank.className = 'w-5 text-xs text-zinc-500';
        rank.textContent = index + 1;
    
        const info = document.createElement('div');
        info.className = 'flex min-w-0 flex-1 flex-col gap-1';
        const title = document.createElement('span');
        title.className = 'truncate text-sm font-semibold';
        title.textContent = spot.address.replace('서울특별시 ', '') + ', ' + spot.floor;
        const sub = document.createElement('span');
        sub.className = 'text-2xs text-zinc-500';
        sub.textContent = '폐업 ' + spot.closed + '곳';
        info.append(title, sub);
    
        const count = document.createElement('span');
        count.className = 'text-base font-bold';
        count.textContent = spot.count + '곳';
    
        row.append(rank, info, count);
        row.addEventListener('click', (e) => {
          e.preventDefault();
          const search = document.getElementById('pc-search');
          if (search) search.value = ''; // 랭킹으로 고르면 검색어는 지운다
          window.PlaceMap.map.setLevel(3);
          window.PlaceMap.panTo(spot.lat, spot.lng);
          window.PlaceMap.mark(spot.lat, spot.lng);
          selectSpot(spot);
        });    
    
        return row;
      }
    
      function renderRanking(spots) {
        const top = spots.slice(0, 20);
        document.querySelectorAll('[data-ranking-list]').forEach((box) => {
          if (top.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'py-6 text-center text-xs text-zinc-500';
            empty.textContent = '이 영역에는 회전문 자리가 없어요';
            box.replaceChildren(empty);
            return;
          }
          box.replaceChildren(...top.map(makeRankRow));
        });
      }
    

      function showDetail(spot, stores, gaps, unit) {
        setText('[data-detail-title]', spot.address.replace('서울특별시 ', '') + ', ' + spot.floor + (unit ? ' ' + unit : ''));
        setText('[data-detail-count]', stores.length);
        renderList(stores, gaps);
        renderStats(stores);
        renderTimeline(stores);

        const isOpen = stores.some((s) => s.status === '영업/정상');
        setText('[data-detail-nth]', isOpen
            ? '지금 가게가 ' + stores.length + '번째예요'
            : '지금은 비어 있는 자리예요');

        document.querySelectorAll('[data-detail-sample]').forEach((el) => el.classList.add('hidden'));

        // 상세 화면 열기 (모바일: 시트, PC: 탭)
        document.documentElement.dataset.sheet = 'detail';
        const pcTab = document.querySelector('[data-pc-tab="detail"]');
        if (pcTab) pcTab.click();
    }
    

    let currentSpot = null;  // 지금 상세에 열린 자리
    let currentUnits = [];   // 그 층에서 확인된 호 목록

    async function loadHistory(spot, unit) {
        const params = new URLSearchParams({ building: spot.address, floor: spot.floor });
        if (unit) params.set('unit', unit);
        const res = await fetch('/api/places/history?' + params);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    // 호 칩: "전체" + 호 목록. 호가 없는 층이면 숨긴다.
    function renderUnits(active) {
        document.querySelectorAll('[data-detail-units]').forEach((box) => {
            box.classList.toggle('hidden', currentUnits.length === 0);
            const chips = [null, ...currentUnits].map((u) => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'chip ' + (u === active ? 'chip-active' : 'chip-idle');
                chip.textContent = u || '전체';
                chip.addEventListener('click', () => selectUnit(u));
                return chip;
            });
            box.replaceChildren(...chips);
        });
    }

    async function selectSpot(spot) {
        try {
            const history = await loadHistory(spot);
            currentSpot = spot;
            currentUnits = [...new Set(history.records.flatMap((r) => r.units || []))]
            .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

            renderUnits(null);
            showDetail(spot, history.records, history.gaps, null);
        } catch (err) {
            console.error('[places]', err);
        }
    }

    async function selectUnit(unit) {
        if (!currentSpot) return;
        try {
            const history = await loadHistory(currentSpot, unit);
            renderUnits(unit);
            showDetail(currentSpot, history.records, history.gaps, unit);
        } catch (err) {
            console.error('[places]', err);
        }
    }


    
  
    function draw(spots) {
      if (!window.PlaceMap) return; // 지도가 준비되기 전에 범례를 누른 경우
      const { maps } = window.kakao;
      const map = window.PlaceMap.map;
      lastSpots = spots;
      clear();

      const visible = spots.filter((s) => shown.has(levelOf(s))); // 범례에서 켠 단계만

      visible.forEach((s) => {
        const el = document.createElement('div');
        el.className = 'rounded-full shadow ' + markerClass(s);
        el.title = s.address + ' ' + s.floor + ' · ' + s.count + '곳' + (s.openCount === 0 ? ' · 빈 자리' : '');
        el.classList.add('cursor-pointer');
        el.addEventListener('click', () => {
          window.PlaceMap.unmark(); // 다른 자리를 고르면 검색 점은 지운다
          selectSpot(s);
        });

        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(s.lat, s.lng),
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });
        overlay.setMap(map);
        overlays.push(overlay);
      });
      renderRanking(visible);
    }

  
    // 현재 지도 영역(bounds)의 자리를 불러와 그린다. 필터 상태(vacantOnly)도 함께 보낸다.
    async function load(bounds) {
      if (controller) controller.abort();
      controller = new AbortController();

      const params = new URLSearchParams({ ...bounds, limit: 200, vacantOnly });
      try {
        const res = await fetch('/api/places?' + params, { signal: controller.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        draw(await res.json());
      } catch (err) {
        if (err.name !== 'AbortError') console.error('[places]', err);
      }
    }

    // PC 체크박스와 모바일 칩의 모양을 상태에 맞추고, 지도를 다시 조회한다.
    function setVacantOnly(value) {
      vacantOnly = value;
      document.querySelectorAll('[data-vacant-toggle]').forEach((el) => {
        if (el.type === 'checkbox') {
          el.checked = value;
        } else {
          el.classList.toggle('chip-active', value);
          el.classList.toggle('chip-idle', !value);
        }
      });
      if (window.PlaceMap) load(window.PlaceMap.bounds());
    }

    document.addEventListener('map:idle', (e) => load(e.detail));

    document.querySelectorAll('[data-vacant-toggle]').forEach((el) => {
      el.addEventListener('click', () => setVacantOnly(!vacantOnly));
    });
    

    window.PlaceDetail = { open: selectSpot };
    renderLegend();

  })();
  