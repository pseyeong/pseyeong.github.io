// 지도 영역이 바뀔 때마다 /api/places 를 호출해 자리 마커를 그린다.
(function () {
    let overlays = [];
    let controller = null;
  
    function sizeClass(count) {
      return count >= 6 ? 'size-[22px] bg-orange-500' : 'size-4 bg-primary-500';
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
        sub.textContent = (store.category ? store.category + ' · ' : '')
          + ym(store.openedAt) + ' – ' + (isOpen ? '영업 중' : ym(store.closedAt));
        info.append(name, sub);
    
        const term = document.createElement('span');
        term.className = 'shrink-0 text-2xs font-semibold';
        term.textContent = isOpen
          ? duration(store.openedAt, null) + '째'
          : (store.closedAt ? duration(store.openedAt, store.closedAt) : '');
    
        row.append(dot, info, term);
        return row;
      }
    
      function renderList(stores) {
        const rows = [...stores].reverse().map(makeRow); // API는 오래된 순 → 최근 순으로 뒤집기
        document.querySelectorAll('[data-detail-list]').forEach((box) => {
          box.replaceChildren(...rows.map((r) => r.cloneNode(true)));
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
          window.PlaceMap.map.setLevel(3);
          window.PlaceMap.panTo(spot.lat, spot.lng);
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
    

    function showDetail(spot, stores) {
        setText('[data-detail-title]', spot.address.replace('서울특별시 ', '') + ', ' + spot.floor);
        setText('[data-detail-count]', stores.length);
        renderList(stores);
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
    

    async function selectSpot(spot) {
        const params = new URLSearchParams({ address: spot.address, floor: spot.floor });
        try {
            const res = await fetch('/api/places/stores?' + params);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const stores = await res.json();
            showDetail(spot, stores);
        } catch (err) {
            console.error('[places]', err);
        }
    }
    
  
    function draw(spots) {
      const { maps } = window.kakao;
      const map = window.PlaceMap.map;
      clear();
  
      spots.forEach((s) => {
        const el = document.createElement('div');
        el.className = 'rounded-full border-2 border-white shadow ' + sizeClass(s.count);
        el.title = s.address + ' ' + s.floor + ' · ' + s.count + '곳';
        el.classList.add('cursor-pointer');
        el.addEventListener('click', () => selectSpot(s));  
  
        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(s.lat, s.lng),
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });
        overlay.setMap(map);
        overlays.push(overlay);
      });
      renderRanking(spots);
    }
  
    document.addEventListener('map:idle', async (e) => {
      if (controller) controller.abort();
      controller = new AbortController();
  
      const params = new URLSearchParams({ ...e.detail, limit: 200 });
      try {
        const res = await fetch('/api/places?' + params, { signal: controller.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        draw(await res.json());
      } catch (err) {
        if (err.name !== 'AbortError') console.error('[places]', err);
      }
    });

      // 다른 스크립트(search.js 등)에서 상세 패널을 열 수 있게 노출한다.
    window.PlaceDetail = { open: selectSpot };

  })();
  