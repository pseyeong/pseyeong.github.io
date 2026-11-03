// 검색창: 카카오(주소·장소)와 우리 DB(가게 이름)를 함께 검색해 목록으로 보여 준다.
// PC 헤더 검색창(드롭다운)과 모바일 검색 화면(전체 목록)이 같은 코드를 쓴다.
(function () {
    const MAX = 8;

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
        const res = await fetch('/store/api/search?' + new URLSearchParams({ q: query }));
        return res.ok ? await res.json() : [];
      } catch (err) {
        console.error('[search]', err);
        return [];
      }
    }

    // input 에 검색을 붙이고 결과를 box 에 그린다.
    // onClose: 결과를 고른 뒤 할 일 (PC: 드롭다운 닫기, 모바일: 검색 화면 닫기)
    function bind(input, box, onClose) {
      let timer;

      function close() {
        box.replaceChildren();
        onClose();
      }

      function moveTo(lat, lng) {
        window.PlaceMap.map.setLevel(3);
        window.PlaceMap.panTo(lat, lng);
        window.PlaceMap.mark(lat, lng);
        close();
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

      async function search(query) {
        if (!window.PlaceMap) return;
        const [kakaoItems, dbItems] = await Promise.all([searchKakao(query), searchDb(query)]);
        if (input.value.trim() !== query) return; // 기다리는 사이 입력이 바뀌었으면 버린다
        render(kakaoItems, dbItems, query);
      }

      input.addEventListener('input', () => {
        clearTimeout(timer);
        const query = input.value.trim();
        if (!query) { // 지우면 목록만 비운다 (모바일 검색 화면은 그대로)
          box.replaceChildren();
          box.classList.add('hidden');
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
          input.blur(); // 모바일: 키보드를 내려 결과가 보이게
        }
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      // PC: 헤더 아래 드롭다운
      const pcInput = document.getElementById('pc-search');
      const pcBox = document.querySelector('[data-search-results]');
      if (pcInput && pcBox) {
        bind(pcInput, pcBox, () => pcBox.classList.add('hidden'));
        document.addEventListener('click', (e) => {
          if (!pcBox.contains(e.target) && e.target !== pcInput) pcBox.classList.add('hidden');
        });
      }

      // 모바일: 검색 화면 전체에 목록, 고르면 검색 화면을 닫는다
      const mInput = document.getElementById('m-search');
      const mBox = document.querySelector('[data-m-search-results]');
      if (mInput && mBox) {
        bind(mInput, mBox, () => { document.documentElement.dataset.search = 'closed'; });
        // 검색 화면이 열리면 바로 입력할 수 있게
        document.querySelectorAll('[data-open-search]').forEach((el) => {
          el.addEventListener('click', () => setTimeout(() => mInput.focus(), 0));
        });
      }
    });
  })();
