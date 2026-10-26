// 카카오 지도 초기화.
// - 키: #map 의 data-kakao-key (서버 설정 kakao.map.key ← 환경변수 KAKAO_MAP_KEY)
// - 컨테이너: #kakao-map
// - 다른 스크립트에서는 window.PlaceMap 으로 접근, 이동/줌이 끝나면 document 에 'map:idle' 이벤트 발생
(function () {
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청
  const DEFAULT_LEVEL = 4;

  const root = document.getElementById('map');
  const container = document.getElementById('kakao-map');
  if (!root || !container) return;

  const key = root.dataset.kakaoKey;
  if (!key) {
    console.warn('[kakaoMap] 카카오 지도 키가 없습니다. 환경변수 KAKAO_MAP_KEY 를 설정하세요.');
    return;
  }

  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) return resolve();
      const script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(key)
        + '&autoload=false&libraries=services,clusterer';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('카카오 지도 SDK 로드 실패 (키, 등록된 도메인 확인)'));
      document.head.appendChild(script);
    });
  }

  function init() {
    const { maps } = window.kakao;
    const map = new maps.Map(container, {
      center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      level: DEFAULT_LEVEL,
    });

    document.querySelectorAll('[data-map-placeholder]').forEach((el) => el.classList.add('!hidden'));

    let myMarker = null;

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
      locate() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const here = new maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            if (!myMarker) myMarker = new maps.Marker({ map, position: here });
            else myMarker.setPosition(here);
            map.setLevel(3);
            map.panTo(here);
          },
          () => console.warn('[kakaoMap] 위치 정보를 가져오지 못했습니다.'),
          { enableHighAccuracy: true, timeout: 8000 }
        );
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

    // 처음 타일 로딩이 끝났을 때 한 번 알려서, 움직이지 않아도 첫 화면에 점이 찍히게 한다.
    maps.event.addListener(map, 'tilesloaded', function once() {
      maps.event.removeListener(map, 'tilesloaded', once);
      notifyIdle();
    });


    // 레이아웃(바텀시트/패널 등)이 바뀌어 컨테이너 크기가 달라지면 지도를 다시 맞춘다.
    new ResizeObserver(() => map.relayout()).observe(container);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadSdk()
      .then(() => window.kakao.maps.load(init))
      .catch((err) => console.error('[kakaoMap]', err));
  });
})();
