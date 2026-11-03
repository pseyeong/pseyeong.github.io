// 카카오 지도 SDK 불러오기 (모든 프로젝트 공통). 지도 동작은 프로젝트마다 따로 만든다.
// 사용: window.loadKakaoMaps(key).then(() => { new kakao.maps.Map(...) })
// - 같은 페이지에서 여러 번 불러도 SDK 는 한 번만 받는다.
// - services(장소 검색), clusterer(마커 묶기) 라이브러리를 함께 받는다.
(function () {
  let loading = null;

  window.loadKakaoMaps = function (key) {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      if (!key) return reject(new Error('카카오 지도 키가 없습니다. 환경변수 KAKAO_MAP_KEY 를 설정하세요.'));
      if (window.kakao && window.kakao.maps) return window.kakao.maps.load(resolve);

      const script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(key)
        + '&autoload=false&libraries=services,clusterer';
      script.onload = () => window.kakao.maps.load(resolve);
      script.onerror = () => reject(new Error('카카오 지도 SDK 로드 실패 (키, 등록된 도메인 확인)'));
      document.head.appendChild(script);
    });
    return loading;
  };
})();
