
function setMapInfo(){
    try {
        // 지도가 초기화되어 있는지 확인
        if (Zinidata && Zinidata.map && Zinidata.map.map) {
            const center = Zinidata.map.map.getCenter();
            const zoom = Zinidata.map.map.getZoom();

            // 값이 유효한지 확인 후 저장
            if (center && typeof center.y === 'number' && typeof center.x === 'number') {
                localStorage.setItem('MAP_CENTER_LAT', center.y);
                localStorage.setItem('MAP_CENTER_LNG', center.x);
            }

            if (typeof zoom === 'number') {
                localStorage.setItem('MAP_ZOOM', zoom);
            }
        } else {
            console.warn('[menuMove] 지도가 아직 초기화되지 않았습니다.');
        }
    } catch (error) {
        console.error('[menuMove] 로컬 스토리지 저장 중 오류 발생:', error);
    }
}

function menuMove(url){
    setMapInfo();
    // URL 이동은 항상 실행
    if (Zinidata && Zinidata.navigation && Zinidata.navigation.go) {
        Zinidata.navigation.go(url);
    } else {
        console.error('[menuMove] Zinidata.navigation.go가 없습니다.');
    }
}

// .premiumRankColorBox 등급 클래스 자동적용 함수
function applyGradeClass($selector, grade) {
    const $target = $selector.closest(".premiumRankColorBox");
    $target.removeClass("prGradeAplus prGradeA prGradeB prGradeC prGradeD");
    if(grade) {
        let className;
        if(grade === "A+") {
            className = "prRankAplus";
        } else if(["A", "B", "C", "D"].includes(grade)) {
            className = "prRank" + grade;
        }

        if (className) {
            $target.addClass(className);
        }
    }
}

// terms 페이지에서 premiumReportHeader 숨기기
$(function () {
  const currentPath = window.location.pathname;
  if (currentPath === "/terms/service" || currentPath === "/terms/privacy") {
    $(".premiumReportHeader").remove();
  }
});
