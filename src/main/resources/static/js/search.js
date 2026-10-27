// 검색창: 카카오(주소·장소)와 우리 DB(가게 이름)를 함께 검색해 목록으로 보여 준다.
(function () {
    const MAX = 8;
    let input;
    let box;
    let timer;
  
    function highlight(text, query) {
      const frag = document.createDocumentFragment();
      const i = text.toLowerCase().indexOf(query.toLowerCase());
      if (i < 0) {
        frag.append(text);
        return frag;
      }
      const mark = document.createElement('span');
      mark.className = 'rounded-sm text-blue-600 inline-block';
      mark.textContent = text.slice(i, i + query.length);
      frag.append(text.slice(0, i), mark, text.slice(i + query.length));
      return frag;
    }
  
    function close() {
      box.classList.add('hidden');
      box.replaceChildren();
    }
  
    function moveTo(lat, lng) {
      window.PlaceMap.map.setLevel(3);
      window.PlaceMap.panTo(lat, lng);
      close();
    }
  
    function makeRow(titleNode, subText, onClick) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'flex w-full flex-col gap-1 border-b border-zinc-100 px-3 py-2 text-left hover:bg-zinc-50';
  
      const name = document.createElement('span');
      name.className = 'text-sm font-semibold text-zinc-900';
      name.append(titleNode);
  
      const sub = document.createElement('span');
      sub.className = 'text-2xs text-zinc-500';
      if (subText instanceof Node) sub.append(subText);
      else sub.textContent = subText;
  
      row.append(name, sub);
      row.addEventListener('click', onClick);
      return row;
    }
  
    function makeKakaoRow(item, query) {
      return makeRow(
        highlight(item.place_name, query),
        highlight(item.road_address_name || item.address_name, query),
        () => moveTo(Number(item.y), Number(item.x)) // y=위도, x=경도
      );
    }
  
    function makeDbRow(item, query) {
      const state = item.status === '영업/정상' ? '영업 중' : '폐업';
      const sub = [item.category, state, item.roadAddr].filter(Boolean).join(' · ');
      return makeRow(highlight(item.name, query), sub, () => {
        if (item.lat !== null && item.lng !== null) moveTo(item.lat, item.lng);
        else close();
        if (item.address && item.floor && window.PlaceDetail) {
          window.PlaceDetail.open({ address: item.address, floor: item.floor });
        }
      });
    }
  
    function render(kakaoItems, dbItems, query) {
      box.replaceChildren();
  
      if (dbItems.length === 0 && kakaoItems.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'px-3 py-4 text-center text-xs text-zinc-500';
        empty.textContent = '검색 결과가 없어요';
        box.append(empty);
      }
  
      if (kakaoItems.length > 0) {
        box.append(...kakaoItems.slice(0, MAX).map((it) => makeKakaoRow(it, query)));
      }
      if (dbItems.length > 0) {
        box.append(...dbItems.map((it) => makeDbRow(it, query)));
      }
      box.classList.remove('hidden');
    }
  
    function searchKakao(query) {
      return new Promise((resolve) => {
        const { maps } = window.kakao || {};
        if (!maps || !maps.services) return resolve([]);
        new maps.services.Places().keywordSearch(query, (data, status) => {
          resolve(status === maps.services.Status.OK ? data : []);
        });
      });
    }
  
    async function searchDb(query) {
      if (query.length < 2) return [];
      try {
        const res = await fetch('/api/search?' + new URLSearchParams({ q: query }));
        return res.ok ? await res.json() : [];
      } catch (err) {
        console.error('[search]', err);
        return [];
      }
    }
  
    async function search(query) {
      if (!window.PlaceMap) return;
      const [kakaoItems, dbItems] = await Promise.all([searchKakao(query), searchDb(query)]);
      if (input.value.trim() !== query) return; // 기다리는 사이 입력이 바뀌었으면 버린다
      render(kakaoItems, dbItems, query);
    }
  
    document.addEventListener('DOMContentLoaded', () => {
      input = document.getElementById('pc-search');
      box = document.querySelector('[data-search-results]');
      if (!input || !box) return;
  
      input.addEventListener('input', () => {
        clearTimeout(timer);
        const query = input.value.trim();
        if (!query) {
          close();
          return;
        }
        timer = setTimeout(() => search(query), 300);
      });
  
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter' && !e.isComposing) {
          clearTimeout(timer);
          const query = input.value.trim();
          if (query) search(query);
        }
      });
  
      document.addEventListener('click', (e) => {
        if (!box.contains(e.target) && e.target !== input) close();
      });
    });
  })();
  