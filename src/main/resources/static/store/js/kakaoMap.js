// 카카오 지도 초기화.
// - 키: #map 의 data-kakao-key (서버 설정 kakao.map.key ← 환경변수 KAKAO_MAP_KEY)
// - 컨테이너: #kakao-map
// - 다른 스크립트에서는 window.PlaceMap 으로 접근, 이동/줌이 끝나면 document 에 'map:idle' 이벤트 발생
(function () {
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청
  const DEFAULT_LEVEL = 4;
  const SEOUL = { south: 37.41, north: 37.72, west: 126.73, east: 127.27 }; // 데이터가 있는 범위 (현 위치 버튼용)

  const root = document.getElementById('map');
  const container = document.getElementById('kakao-map');
  if (!root || !container) return;

  const key = root.dataset.kakaoKey;
  if (!key) {
    console.warn('[kakaoMap] 카카오 지도 키가 없습니다. 환경변수 KAKAO_MAP_KEY 를 설정하세요.');
    return;
  }

  function init() {
    const { maps } = window.kakao;
    const map = new maps.Map(container, {
      center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      level: DEFAULT_LEVEL,
    });

    document.querySelectorAll('[data-map-placeholder]').forEach((el) => el.classList.add('!hidden'));

    let searchMarker = null; // 검색한 위치 표시 (검은 점, 하나만)

    const api = {
      map,
      panTo(lat, lng) {
        map.panTo(new maps.LatLng(lat, lng));
      },
      zoomIn() {
        map.setLevel(map.getLevel() - 1, { animate: true });
      },
      zoomOut() {
        map.setLevel(map.getLevel() + 1, { animate: true });
      },
      bounds() {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        return { swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() };
      },
      // 현 위치로 중심만 옮긴다 (확대 단계·마커는 그대로).
      // PC 는 IP 로 위치를 추정해서 해외로 잡히기도 하는데, 카카오맵은 국외를 그리지 못해 지도가 사라져 보인다.
      // 그래서 서비스 지역(서울) 밖이면 옮기지 않고 안내만 한다.
      locate() {
        if (!navigator.geolocation) {
          alert('이 브라우저에서는 현재 위치를 쓸 수 없어요.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const inSeoul = lat >= SEOUL.south && lat <= SEOUL.north && lng >= SEOUL.west && lng <= SEOUL.east;
            if (!inSeoul) {
              alert('현재 위치가 서비스 지역(서울) 밖으로 잡혔어요.');
              return;
            }
            map.panTo(new maps.LatLng(lat, lng));
          },
          (err) => {
            console.warn('[kakaoMap] 위치 정보를 가져오지 못했습니다.', err.code);
            // 1: 권한 거부, 그 외: 시간 초과·위치 못 찾음
            alert(err.code === 1
              ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 권한을 허용해 주세요.'
              : '현재 위치를 찾지 못했어요. 잠시 후 다시 시도해 주세요.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      },
       // 검색한 위치에 검은 점을 찍는다. 이미 있으면 위치만 옮긴다.
       mark(lat, lng) {
        const position = new maps.LatLng(lat, lng);
        if (!searchMarker) {
          const el = document.createElement('div');
          el.className = 'pointer-events-none text-2xl leading-none text-[#fb0b0b] drop-shadow';
          el.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
          // 핀 끝이 좌표를 가리키도록 yAnchor=1
          searchMarker = new maps.CustomOverlay({ position, content: el, xAnchor: 0.5, yAnchor: 1, zIndex: 10 });
        }
        searchMarker.setPosition(position);
        searchMarker.setMap(map);
      },
      unmark() {
        if (searchMarker) searchMarker.setMap(null);
      },
    };
    window.PlaceMap = api;

    document.querySelectorAll('[data-map-zoom-in]').forEach((el) => el.addEventListener('click', api.zoomIn));
    document.querySelectorAll('[data-map-zoom-out]').forEach((el) => el.addEventListener('click', api.zoomOut));
    document.querySelectorAll('[data-map-locate]').forEach((el) => el.addEventListener('click', api.locate));

    function notifyIdle() {
      document.dispatchEvent(new CustomEvent('map:idle', { detail: api.bounds() }));
    }

    maps.event.addListener(map, 'idle', notifyIdle);
    // 지도 빈 곳을 클릭하면 검색 점을 지우고, 다른 스크립트(바텀시트)에도 알린다
    maps.event.addListener(map, 'click', () => {
      api.unmark();
      document.dispatchEvent(new CustomEvent('map:click'));
    });
    // 사용자가 지도를 끌기 시작하면 알린다 (panTo 같은 코드 이동에는 오지 않는다)
    maps.event.addListener(map, 'dragstart', () => {
      document.dispatchEvent(new CustomEvent('map:dragstart'));
    });


    // 처음 타일 로딩이 끝났을 때 한 번 알려서, 움직이지 않아도 첫 화면에 점이 찍히게 한다.
    maps.event.addListener(map, 'tilesloaded', function once() {
      maps.event.removeListener(map, 'tilesloaded', once);
      notifyIdle();
    });


    // 레이아웃(바텀시트/패널 등)이 바뀌어 컨테이너 크기가 달라지면 지도를 다시 맞춘다.
    new ResizeObserver(() => map.relayout()).observe(container);
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.loadKakaoMaps(key) // common/js/kakaoLoader.js
      .then(init)
      .catch((err) => console.error('[kakaoMap]', err));
  });
})();
