/**
 * ============================================
 * 지니데이타 지도 공통 모듈 (Map Common)
 * ============================================
 *
 * 🎯 지도 공통 기능 책임
 * ✅ 네이버 지도 초기화 및 설정
 * ✅ 마우스 이벤트 처리 (On/Off 가능)
 * ✅ 행정동 경계 표시 및 Point-in-Polygon 체크
 * ✅ 페이지별 커스터마이징 지원
 *
 * @author NICE ZiniData 개발팀
 * @since 1.0
 * @refactored 2024.12
 */

$(document).ready(function () {
  // ============================== 모듈 의존성 체크 ==============================
  if (typeof Zinidata === "undefined" || !Zinidata.device) {
    console.error("[MAP-COMMON] Core 모듈이 먼저 로드되어야 합니다.");
    return;
  }

  // ============================== 지도 공통 기능 ==============================
  Zinidata.map = {
    // 지도 관련 변수들
    map: null,
    currentPolygon: null,
    currentInfoWindow: null,
    currentSelectionMarker: null,
    currentSelectionMarkers: [],
    currentClusterMarkers: [],
    currentRadiusMarker: null,
    lastRadiusCircleOptions: null,
    userGpsLocationMarker: null,
    userGpsHideTimerId: null,
    _gpsRequestSeq: 0,
    // hover 요청 제어는 throttle로 일원화
    throttledLoadAdmi: null,
    config: {},
    selectionLocked: false,
    // 테마 레이어 관리
    trafficLayer: null,

    // 지도 초기화 메인 함수
    init: function (options = {}) {
      const self = this;

      return new Promise((resolve, reject) => {
        // 기본 설정과 사용자 옵션 병합
        self.config = {
          pageType: "default", // 페이지 타입 ('summary', 'flowpop', 'density' 등)
          enableMouseTracking: true, // 마우스 이동 추적 활성화
          enableAdmiDisplay: false, // 행정동 경계 표시 활성화
          enableClickToDraw: false, // 지도 클릭 시 행정동 그리기 활성화
          enableUserLocation: true, // 사용자 GPS 위치 기반 초기화 활성화
          center: [37.531211, 126.914977], // 지도 중심점 [lat, lng] (국회의사당)
          zoom: 13, // 초기 줌 레벨
          minZoom: 6, // 최소 줌 레벨
          maxZoom: 21, // 최대 줌 레벨
          debounceTime: 100, // 마우스 이벤트 디바운스 시간 (ms)
          requestInterval: 500, // API 요청 최소 간격 (ms)
          customEvents: [], // 커스텀 이벤트 배열
          useCustomControls: true, // 커스텀 컨트롤 사용 여부(전 페이지 공통)
          disableKineticPan: true,

          ...options,
        };

        console.log(
          `[MAP-COMMON] 지도 초기화 시작 - 페이지: ${self.config.pageType}`,
        );

        // 초기화 완료 콜백 저장
        self._initResolve = resolve;
        self._initReject = reject;

        // 사용자 GPS 위치 기반 초기화가 활성화된 경우 위치 조회 후 지도 초기화
        if (self.config.enableUserLocation) {
          self.initMapWithUserGPSLocation();
        } else {
          self.initMap();
        }
      });
    },

    // 사용자 GPS 위치 기반 지도 초기화
    initMapWithUserGPSLocation: function () {
      const self = this;

      // HTML5 Geolocation API 사용
      if (navigator.geolocation) {
        console.log("[MAP-COMMON] GPS 위치 조회 시작...");

        navigator.geolocation.getCurrentPosition(
          // 성공 시
          function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            // console.log("[MAP-COMMON] 사용자 GPS 위치 조회 성공:", {
            //   lat: userLat,
            //   lng: userLng,
            //   accuracy: accuracy + "m",
            // });

            // 사용자 위치로 중심점 업데이트
            self.config.center = [userLat, userLng];

            // 지도 초기화
            self.initMap();
          },
          // 실패 시
          function (error) {
            console.warn("[MAP-COMMON] GPS 위치 조회 실패:", error.message);
            console.log("[MAP-COMMON] 기본 위치로 지도 초기화");
            self.initMap();
          },
          // 옵션
          {
            enableHighAccuracy: true, // 높은 정확도
            timeout: 10000, // 10초 타임아웃
            maximumAge: 60000, // 1분 이내 캐시된 위치 허용
          },
        );
      } else {
        console.log(
          "[MAP-COMMON] GPS 위치 조회를 지원하지 않는 브라우저, 기본 위치로 초기화",
        );
        self.initMap();
      }
    },

    // 네이버 지도 초기화
    initMap: function () {
      const self = this;

      function createMap() {
        if (typeof naver !== "undefined" && naver.maps) {
          // 페이지별 지도 옵션 설정
          const mapOptions = self.getMapOptions();

          // 지도 생성
          self.map = new naver.maps.Map("mapContainer", mapOptions);

          // 지도 타입 고정 (일반 지도로 고정)
          if (self.config.mapTypeControl === false) {
            self.map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
            // 지도 타입 변경 이벤트 차단
            naver.maps.Event.addListener(
              self.map,
              "maptypeid_changed",
              function () {
                if (self.map.getMapTypeId() !== naver.maps.MapTypeId.NORMAL) {
                  self.map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
                }
              },
            );
          }

          // 이벤트 설정
          self.setupEvents();

          // 초기화 완료 로그
          console.log(
            `[MAP-COMMON] 네이버 지도 초기화 완료 - ${self.config.pageType} 페이지`,
          );

          // 커스텀 초기화 콜백 실행
          if (typeof window.onMapInitialized === "function") {
            window.onMapInitialized(self.map);
          }
          // 모든 페이지에서 커스텀 컨트롤 사용 (옵션으로 제어)
          if (
            self.config.useCustomControls &&
            typeof self.createSummaryControls === "function"
          ) {
            try {
              self.createSummaryControls();
            } catch (e) {
              console.warn("[MAP-COMMON] 커스텀 컨트롤 생성 오류:", e);
            }
          }

          // Promise resolve (초기화 완료)
          if (self._initResolve) {
            self._initResolve(self.map);
            self._initResolve = null;
            self._initReject = null;
          }
        } else {
          // API가 아직 로드되지 않았으면 100ms 후 재시도
          setTimeout(createMap, 100);
        }
      }

      createMap();

      $(document).on("keyup", function (e) {
        // esc 키 눌렀을떄 작동
        if (e.key === "Escape" || e.keyCode === 27) {
          if (meterGubun === "A") areaExit();
          if (meterGubun === "D") distExit();
          if (meterGubun === "R") radiusExit();

          // 분석을 위한 면적 그리기
          if (isSelectingArea) {
            // 선택 종료
            cancelAreaSelection();
          }
        }
      });

      $(".themeBtnBox .mapIconBtn").on("click touch", function () {
        var themeBtn = $(".themeBtnBox .mapIconBtn");
        themeBtn.toggleClass("active");
        if (themeBtn.hasClass("active")) {
          themeBtn.next().removeClass("hidden");
        } else {
          themeBtn.next().addClass("hidden");
        }
      });

      $(".mapIconBtn.roadViewIconBox").on("click touch", function () {
        const $btn = $(this);
        const isActive = $btn.hasClass("active");
        roadViewMarkerSw = false;

        $btn.toggleClass("active");
        // toggle 기능: active 클래스 추가/제거
        if (!isActive) {
          $btn.addClass("active");

          roadView = true;
          if (!Zinidata.map.streetLayer) {
            Zinidata.map.streetLayer = new naver.maps.StreetLayer();
          }
          Zinidata.map.streetLayer.setMap(Zinidata.map.map);

          // 위치 마커 제거
          clearClickedLocaMarkers();

          // 반경, 면적, 거리 버튼 안되도록, 해당 기능도 진행 중이였으면 전부 초기화
          $(".radiusIconBox").addClass("disabled");
          $(".areaIconBox").addClass("disabled");
          $(".distanceIconBox").addClass("disabled");

          areaExit();
          distExit();
          radiusExit();
        } else {
          roadView = false;
          Zinidata.map.streetLayer.setMap(null);
          $(".viewer").removeClass("active");

          $btn.removeClass("active");
          if (Zinidata.map.streetLayer) {
            Zinidata.map.streetLayer.setMap(null);
          }

          // 로드뷰 마커 제거
          roadViewPopClose();

          // 반경, 면적, 거리 버튼 다시 활성화
          $(".radiusIconBox").removeClass("disabled");
          $(".areaIconBox").removeClass("disabled");
          $(".distanceIconBox").removeClass("disabled");
        }
      });

      // 지적편집도
      $(".mapIconBtn.landBtn").on("click", function () {
        if (cadastralLayer.getMap()) {
          cadastralLayer.setMap(null);
          $(this).removeClass("active");
          $(".landTextPopup, .landPopup").removeClass("active");
          if (!isMobile) {
            $(".areaGasCheckFilterWrap").css("right", "72px");
          }
        } else {
          cadastralLayer.setMap(Zinidata.map.map);
          $(this).addClass("active");
          $(".landTextPopup, .landPopup").addClass("active");
          if (!isMobile) {
            const landWidth = $(".landPopup").width() + 88;
            $(".areaGasCheckFilterWrap").css("right", landWidth + "px");
          }
        }
      });

      //경쟁사
      $(".rivalStoreSwitchBtn").on("click touch", function () {
        $(this).toggleClass("active");
        if ($(this).hasClass("active")) {
          $(".rivalStoreWrap").removeClass("hidden");
          if (typeof callRivalStoreOnMapApi === "function") {
            callRivalStoreOnMapApi();
          }
        } else {
          $(".rivalStoreWrap").addClass("hidden");
          if (typeof clearRivalStoreMarkers === "function") {
            clearRivalStoreMarkers();
          }
        }
      });

      //유동인구 보기
      $(".flowToggleBtn button").on("click touch", function () {
        flowPopSw = !flowPopSw;
        $(this).toggleClass("active");
        if ($(this).hasClass("active")) {
          $('.map_user_graph').addClass('active');  
          removeHousMarker();
        } else {
          $('.map_user_graph').removeClass('active');
          Zinidata.map.clearFlowPopGeomList();
          if(!common.isEmpty(housData)) {
            setHousMarker(housData);
          }
        }

        // #mapWsReport + gubun=radius 일 때: 유동인구 ON이면 반경 원 임시 해제, OFF면 복원
        const $wsReport = $("#mapWsReport");
        const isWsReportVisible =
          $wsReport.length > 0 &&
          !$wsReport.hasClass("hidden") &&
          $wsReport.is(":visible");
        const isRadiusGubun = sessionStorage.getItem("gubun") === "radius";
        const isWsFlowToggle = $(this).closest("#mapWsReport").length > 0;
        if (isWsReportVisible && isRadiusGubun && isWsFlowToggle) {
          if (flowPopSw) {
            Zinidata.map.clearRadiusCircle();
          } else {
            Zinidata.map.restoreRadiusCircle();
          }
        }

        setFlowPop50x50(window.flowPop50x50);
      });

      $(".landGubunShowHideBtn").on("click touch", function () {
        $(".landPopup").toggleClass("lineHidden");
      });

      $(".landModalCloseBtn").on("click touch", function () {
        $(".landTextPopup").removeClass("active");
      });

      //지적편집도 show Hide
      $(".landPopup .landBtn").on("click touch", function () {
        $(".landLegendText").toggleClass("dpl_n");
        $(".landPopupInner").toggleClass("active");
        $(this).toggleClass("on");
        $(".landPopup").toggleClass("show");
      });

      $(".landGubunTab li").on("click touch", function () {
        $(".landGubunTab li").removeClass("active");
        $(this).addClass("active");
        var idx = $(".landGubunTab li").index(this);
        $(".landGubunBox").removeClass("active");
        $(".landGubunBox").eq(idx).addClass("active");
      });

      // GPS
      $(".mapIconBtn.gpsBtn").on("click", function () {
        const pinHtml =
          '<div class="locationPin pinShow -translate-x-1/2">' +
          '<img src="/assets/images/icons/location_pin.svg" alt="" />' +
          '<div class="locationPinAni"></div>' +
          "</div>";

        Zinidata.map._gpsRequestSeq += 1;
        const requestSeq = Zinidata.map._gpsRequestSeq;

        if (Zinidata.map.userGpsHideTimerId != null) {
          clearTimeout(Zinidata.map.userGpsHideTimerId);
          Zinidata.map.userGpsHideTimerId = null;
        }
        if (Zinidata.map.userGpsLocationMarker) {
          Zinidata.map.userGpsLocationMarker.setMap(null);
          Zinidata.map.userGpsLocationMarker = null;
        }

        if (navigator.geolocation) {
          console.log("[MAP-COMMON] 사용자 GPS 위치 조회 시작... 지도 이동");

          navigator.geolocation.getCurrentPosition(function (position) {
            if (requestSeq !== Zinidata.map._gpsRequestSeq) {
              return;
            }
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const map = Zinidata.map.map;
            if (!map || typeof naver === "undefined" || !naver.maps) return;

            const zoom = typeof map.getZoom === "function" ? map.getZoom() : 15;
            mapMove(userLng, userLat, zoom);

            self.config.center = [userLat, userLng];

            Zinidata.map.userGpsLocationMarker = new naver.maps.Marker({
              map: map,
              position: new naver.maps.LatLng(userLat, userLng),
              icon: {
                content: pinHtml,
                size: new naver.maps.Size(34, 34),
                anchor: new naver.maps.Point(17, 34),
              },
            });

            Zinidata.map.userGpsHideTimerId = setTimeout(function () {
              Zinidata.map.userGpsHideTimerId = null;
              if (requestSeq !== Zinidata.map._gpsRequestSeq) {
                return;
              }
              if (Zinidata.map.userGpsLocationMarker) {
                Zinidata.map.userGpsLocationMarker.setMap(null);
                Zinidata.map.userGpsLocationMarker = null;
              }
            }, 2000);
          });
        } else {
          console.log("[MAP-COMMON] GPS 위치 조회를 지원하지 않는 브라우저");
        }
      });

      // 지도 타입 변경(일반/위성)
      $(".mapChangeBtn").on("pointerup", function () {
        $(".mapChangeBtn").removeClass("active");
        $(this).addClass("active");
        $(".labelCheckBox").removeClass("!inline-flex");
        let mapType = $(this).data("gubun");
        if (mapType == "NORMAL") {
          Zinidata.map.map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
          $(".labelCheckBox").removeClass("!inline-flex");
        } else if (mapType == "SATELLITE") {
          Zinidata.map.map.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
          $(".labelCheckBox").addClass("!inline-flex");
        } else if (mapType == "TERRAIN") {
          Zinidata.map.map.setMapTypeId(naver.maps.MapTypeId.TERRAIN);
          $(".labelCheckBox").removeClass("!inline-flex");
        }
      });

      // 위성지도 라벨표시
      $("#labelCheck").on("click", function () {
        if ($(this).prop("checked")) {
          Zinidata.map.map.setMapTypeId(naver.maps.MapTypeId.HYBRID);
        } else {
          Zinidata.map.map.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
        }
      });

      $(".mapThemeBtn").on("pointerup", function () {
        const $btn = $(this);
        const mapType = $btn.data("gubun");
        const isActive = $btn.hasClass("active");

        // toggle 기능: active 클래스 추가/제거
        if (isActive) {
          $btn.removeClass("active");
        } else {
          // 다른 버튼들의 active 제거
          $(".mapThemeBtn").removeClass("active");
          $btn.addClass("active");
        }

        // 각 테마별 처리
        if (mapType == "TRAFFIC") {
          if (!isActive) {
            // 활성화: 교통정보 레이어 추가
            if (!Zinidata.map.trafficLayer) {
              Zinidata.map.trafficLayer = new naver.maps.TrafficLayer({
                interval: 300000, // 5분마다 새로고침
              });
            }
            Zinidata.map.trafficLayer.setMap(Zinidata.map.map);
          } else {
            // 비활성화: 교통정보 레이어 제거
            if (Zinidata.map.trafficLayer) {
              Zinidata.map.trafficLayer.setMap(null);
            }
          }
        } else if (mapType == "BICYCLE") {
          if (!isActive) {
            if (!Zinidata.map.bicycleLayer) {
              Zinidata.map.bicycleLayer = new naver.maps.BicycleLayer();
            }
            Zinidata.map.bicycleLayer.setMap(Zinidata.map.map);
          } else {
            // 비활성화: 교통정보 레이어 제거
            if (Zinidata.map.bicycleLayer) {
              Zinidata.map.bicycleLayer.setMap(null);
            }
          }
        }
      });

      // 영업범위, 선택한 매장만 보기 필터 스위치 버튼
      $(".switchBoxBtn").on("click", function () {
        $(this).toggleClass("active");
        $(".mapMarkerSwitchBox").toggleClass("hidden");
      });

      // 영업 범위 보기
      $(".switchBtn.areaSwitchBtn").on("click touch", function () {
        const $btn = $(this);
        const isActive = $btn.hasClass("active");
        if (isActive) {
          $btn.removeClass("active");
          $btn.addClass("off");
          clearRecordedAptGeom();
        } else {
          $btn.addClass("active");
          callRequestMapApi();
        }
      });

      // 선택한 매장만 보기
      $(".switchBtn.selectedStoreSwitchBtn").on("click touch", function () {
        const $btn = $(this);
        const isActive = $btn.hasClass("active");
        if (isActive) {
          $btn.removeClass("active");
          $btn.addClass("off");
          selectedStoreSw = false;
        } else {
          $btn.addClass("active");
          if (selectedGubun != "radius") {
            selectedStoreSw = true;
          } else {
            return;
          }
        }
        callRequestMapApi();
      });

      // 메모 등록·수정 (다중 블록 공통)
      const $memoPopup = $(".memoPopup");
      const $memoTextarea = $(".memoTextareaWrap textarea");

      const getMemoContext = ($el) => {
        const $memoAdd = $el.closest(".memoAdd");
        return { $memoAdd, $memoText: $memoAdd.siblings(".memoText") };
      };

      const openMemoPopup = (ctx, content = "", mode = "insert") => {
        $memoPopup.find(".memoSaveBtn").attr("data-mode", mode);
        $memoTextarea.val(content);
        $(".textareaCount span").text(content.length);
        $memoPopup.data("memoCtx", ctx).addClass("active");
        $memoTextarea.focus();
      };

      const closeMemoPopup = () =>
        $memoPopup.removeClass("active").removeData("memoCtx");

      $memoTextarea.on("input", function () {
        $(".textareaCount span").text($(this).val().length);
      });

      $(".memoPopupClose, .memoPopup .modalBg").on("click", closeMemoPopup);

      $(".memoAddBtn").on("click", function () {
        openMemoPopup(getMemoContext($(this)), "", "insert");
      });

      $(".memoUpdateBtn").on("click", function () {
        const ctx = getMemoContext($(this));
        openMemoPopup(
          ctx,
          ctx.$memoText.find(".memoTextContent").text().trim(),
          "update",
        );
      });

      $(".memoSaveBtn").on("click", function () {
        const ctx = $memoPopup.data("memoCtx");
        if (!ctx) return;

        const value = $memoTextarea.val();
        const mode = $memoPopup.find(".memoSaveBtn").attr("data-mode");
        let memoId = "";

        if (mode == "insert") {
          // 매장 메모 등록 API 호출
          Zinidata.api({
            url: "/api/report/memo/insert",
            method: "POST",
            data: {
              storeCd: selectedStoreCd != null ? selectedStoreCd : null,
              memo: value,
              regBy: window.strMemNm != null ? window.strMemNm : null,
            },
            success: function (response) {
              if (response.success && response.data) {
                memoId = response.data.id;
                closeMemoPopup();
                ctx.$memoAdd.find(".memoAddBtn").addClass("!hidden");
                ctx.$memoAdd
                  .find(".changeMemoBtn")
                  .removeClass("hidden")
                  .attr("data-id", memoId);
                ctx.$memoText
                  .removeClass("hidden")
                  .find(".memoTextContent")
                  .text(value);
                ctx.$memoText
                  .find(".memoTextDateWriter")
                  .text(window.strMemNm != null ? window.strMemNm : "");
                ctx.$memoText
                  .find(".memoTextDate")
                  .text(formatDate(new Date()) + " 작성됨");
              }
            },
            error: function (error) {
              console.log(error);
              Zinidata.showAlert("매장 메모 등록에 실패했습니다.", "error");
            },
          });
        } else if (mode == "update") {
          memoId =
            selectedGubun == "WS"
              ? $("#mapWsReport .changeMemoBtn").attr("data-id")
              : $("#mapOpReport .changeMemoBtn").attr("data-id");
          // 메모 수정 API 호출
          Zinidata.api({
            url: "/api/report/memo/update",
            method: "POST",
            data: {
              storeCd: selectedStoreCd != null ? selectedStoreCd : null,
              id: memoId,
              memo: value,
              updBy: window.strMemNm != null ? window.strMemNm : null,
            },
            success: function (response) {
              if (response.success && response.data) {
                closeMemoPopup();
                ctx.$memoAdd.find(".memoAddBtn").addClass("!hidden");
                ctx.$memoAdd
                  .find(".changeMemoBtn")
                  .removeClass("hidden")
                  .attr("data-id", response.data.id);
                ctx.$memoText
                  .removeClass("hidden")
                  .find(".memoTextContent")
                  .text(value);
                ctx.$memoText
                  .find(".memoTextDateWriter")
                  .text(window.strMemNm != null ? window.strMemNm : "");
                ctx.$memoText
                  .find(".memoTextDate")
                  .text(formatDate(new Date()) + " 수정됨");
              } else {
                Zinidata.showAlert("매장 메모 수정에 실패했습니다.", "error");
              }
            },
            error: function (error) {
              console.log(error);
              Zinidata.showAlert("매장 메모 수정에 실패했습니다.", "error");
            },
          });
        }
      });

      const $memoDeleteModal = $(".memoDeleteModal");

      const closeMemoDeleteModal = () =>
        $memoDeleteModal.removeClass("active").removeData("memoCtx");

      const resetMemo = (ctx) => {
        if (!ctx) return;
        ctx.$memoAdd.find(".memoAddBtn").removeClass("!hidden");
        ctx.$memoAdd
          .find(".changeMemoBtn")
          .addClass("hidden")
          .removeAttr("data-id");
        ctx.$memoText.addClass("hidden").find(".memoTextContent").text("");
        ctx.$memoText.find(".memoTextDateWriter, .memoTextDate").text("");
      };

      $(".changeMemoBtn .memoDeleteBtn").on("click", function () {
        $memoDeleteModal
          .data("memoCtx", getMemoContext($(this)))
          .addClass("active");
      });

      $(".memoDeleteCancelBtn, .memoDeleteModal .modalBg").on(
        "click",
        closeMemoDeleteModal,
      );

      $(".memoDeleteModal .memoDeleteBtn").on("click", function () {
        const ctx = $memoDeleteModal.data("memoCtx");
        closeMemoDeleteModal();
        const memoId =
          selectedGubun == "WS"
            ? $("#mapWsReport .changeMemoBtn").attr("data-id")
            : $("#mapOpReport .changeMemoBtn").attr("data-id");

        // 메모 삭제 API 호출
        Zinidata.api({
          url: "/api/report/memo/delete",
          method: "POST",
          data: {
            storeCd: selectedStoreCd != null ? selectedStoreCd : null,
            id: memoId,
            updBy: window.strMemNm != null ? window.strMemNm : null,
          },
          success: function (response) {
            closeMemoDeleteModal();
            resetMemo(ctx);
          },
          error: function (error) {
            console.log(error);
          },
        });
      });
    },

    // 페이지별 지도 옵션 설정
    getMapOptions: function () {
      const baseOptions = {
        center: new naver.maps.LatLng(
          this.config.center[0],
          this.config.center[1],
        ),
        zoom: this.config.zoom,
        zoomControl:
          this.config.zoomControl !== undefined
            ? this.config.zoomControl
            : this.config.useCustomControls
              ? false
              : true,
        zoomControlOptions: {
          style: naver.maps.ZoomControlStyle.SMALL,
          position: naver.maps.Position.BOTTOM_RIGHT,
        },
        mapTypeControl:
          this.config.mapTypeControl !== undefined
            ? this.config.mapTypeControl
            : this.config.useCustomControls
              ? false
              : true,
        mapTypeControlOptions: {
          style: naver.maps.MapTypeControlStyle.BUTTON,
          position: naver.maps.Position.BOTTOM_RIGHT,
        },
        scaleControl:
          this.config.scaleControl !== undefined
            ? this.config.scaleControl
            : false,
        logoControl:
          this.config.logoControl !== undefined
            ? this.config.logoControl
            : true,
        logoControlOptions: {
          position: naver.maps.Position.BOTTOM_RIGHT,
        },
        mapDataControl:
          this.config.mapDataControl !== undefined
            ? this.config.mapDataControl
            : false,
        minZoom: this.config.minZoom,
        maxZoom: this.config.maxZoom,
      };

      // 페이지별 특화 설정
      switch (this.config.pageType) {
        case "summary":
          return {
            ...baseOptions,
            // 종합보고서 특화 설정
            zoom: 13,
            minZoom: 6,
            maxZoom: 21,
          };

        case "flowpop":
          return {
            ...baseOptions,
            // 유동인구 특화 설정 (PC/모바일 구분)
            center: new naver.maps.LatLng(37.531211, 126.914977),
            zoom: typeof window !== "undefined" && window.isMobile ? 12 : 15, // PC: 15, 모바일: 14
            minZoom: 8,
            maxZoom: 19,
          };

        case "density":
          return {
            ...baseOptions,
            // 점포밀집도 특화 설정 (PC/모바일 구분)
            center: new naver.maps.LatLng(37.531211, 126.914977),
            zoom: typeof window !== "undefined" && window.isMobile ? 12 : 15, // PC: 15, 모바일: 12
            minZoom: 8,
            maxZoom: 19,
          };

        default:
          return baseOptions;
      }
    },

    // 이벤트 설정
    setupEvents: function () {
      // 기존 이벤트 리스너 모두 제거 (중복 방지)
      if (this.map && this._clickListener) {
        naver.maps.Event.removeListener(this._clickListener);
      }

      // 기본 클릭 이벤트 (옵션에 따라 활성화)
      if (this.config.enableClickToDraw) {
        let lastClickTime = 0;
        this._clickListener = naver.maps.Event.addListener(
          this.map,
          "click",
          (e) => {
            const now = Date.now();
            // 300ms 내 중복 클릭 방지
            if (now - lastClickTime < 300) {
              console.log(
                "[MAP-COMMON] 중복 클릭 방지:",
                now - lastClickTime + "ms",
              );
              return;
            }
            lastClickTime = now;

            const lat = e.coord.lat();
            const lng = e.coord.lng();
            this.selectRegionByPoint(lat, lng);
            try {
              if (typeof window.showMobileSearchPanel === "function")
                window.showMobileSearchPanel();
            } catch (_) {}
            if (typeof window.onMapClick === "function") {
              window.onMapClick(lat, lng);
            }
          },
        );
      } else {
        this._clickListener = naver.maps.Event.addListener(
          this.map,
          "click",
          function (e) {
            strMapClickXaxis = e.coord.x;
            strMapClickYaxis = e.coord.y;

            if (!isMobile) {
              // 지도 클릭 마커
              // if() {
              // }
              // if(meterGubun === "A"){
              //     if(isRadius) {
              //         $('.radiusPopup').addClass('active');
              //         mapPopClose();
              //         searchCoordinateToAddress(e.coord, areaMapClickMarker);
              //     }
              // }
            }
          },
        );
      }

      // 마우스 이동 이벤트 (옵션에 따라 활성화)
      if (this.config.enableMouseTracking) {
        this.setupMouseTracking();
      }

      // 커스텀 이벤트 설정
      this.setupCustomEvents();
    },

    // 마우스 추적 이벤트 설정
    setupMouseTracking: function () {
      // 스로틀 함수 초기화(요청 최소 간격은 config.requestInterval 기준)
      this.throttledLoadAdmi = Zinidata.performance.debounce((lat, lng) => {
        // this.loadAdmiDistrict(lat, lng);
      }, this.config.requestInterval);

      naver.maps.Event.addListener(this.map, "mousemove", (e) => {
        cLat = e.coord.lat();
        cLng = e.coord.lng();
        // 현재 마우스 위치 저장
        window.currentMousePos = new naver.maps.LatLng(cLat, cLng);

        // 행정동 표시가 활성화된 경우에만 처리 + 선택 확정 시 중단
        // if (!this.config.enableAdmiDisplay || this.selectionLocked) return;

        // 현재 폴리곤 내부에 있으면 DB 조회 안함
        if (
          this.currentPolygon &&
          this.isPointInPolygon(cLat, cLng, this.currentPolygon)
        ) {
          return; // DB 조회 없이 바로 리턴
        }

        // 폴리곤 외부거나 폴리곤이 없으면 스로틀된 DB 조회 호출
        if (typeof this.throttledLoadAdmi === "function") {
          // this.throttledLoadAdmi(lat, lng);
        } else {
          // 가드: 스로틀 초기화 전이라면 즉시 호출(초기 로드 구간 보호)
          // this.loadAdmiDistrict(cLat, cLng);
        }

        if (isMobile) {
          if (meterGubun === "D") {
            getDistMousemove(cLat, cLng);

            if (!common.isEmpty(beforYaxis)) {
              // 새로운 가이드라인 생성
              if (guideLine) {
                guideLine.setMap(null);
              }
              guideLine = new naver.maps.Polyline({
                map: Zinidata.map.map,
                path: [
                  new naver.maps.LatLng(beforYaxis, beforXaxis),
                  new naver.maps.LatLng(cLat, cLng),
                ],
                strokeColor: "#FF4372",
                strokeOpacity: 0.3,
                strokeWeight: 1,
                clickable: true,
              });

              naver.maps.Event.addListener(
                guideLine,
                "rightclick",
                function (e) {
                  distExit();
                },
              );
            }
          } else if (meterGubun === "R") {
            if (!common.isEmpty(strStartPointX)) {
              getRadiusMousemove(cLat, cLng);
              // 가이드라인이 이미 있다면 삭제
              if (rGuideLine) {
                rGuideLine.setMap(null);
              }
              if (!common.isEmpty(rLastClickCoord)) {
                // 새로운 가이드라인 생성
                rGuideLine = new naver.maps.Polyline({
                  map: Zinidata.map.map,
                  path: [rLastClickCoord, new naver.maps.LatLng(cLat, cLng)],
                  strokeColor: "rgb(0, 205, 24)",
                  strokeOpacity: 0.7,
                  strokeWeight: 1,
                  clickable: true,
                });

                naver.maps.Event.addListener(
                  rGuideLine,
                  "rightclick",
                  function (e) {
                    radiusExit();
                  },
                );
              }
            }
          } else if (meterGubun === "A") {
            getAreaMousemove(cLat, cLng);
          } else if (isSelectingArea) {
            getAnalysisAreaMousemove(e.coord);
          } else if (isAreaGeom) {
            getAreaGeom(cLat, cLng);
          }
        } else {
          return;
        }
      });

      console.log("[MAP-COMMON] 마우스 추적 이벤트 활성화");
    },

    // 커스텀 이벤트 설정
    setupCustomEvents: function () {
      const customEvents = this.config.customEvents || [];

      customEvents.forEach((eventName) => {
        naver.maps.Event.addListener(this.map, eventName, (e) => {
          // 커스텀 이벤트 콜백 실행
          const callbackName = `onMap${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
          if (typeof window[callbackName] === "function") {
            window[callbackName](e);
          }
        });
      });
    },

    // Point-in-Polygon 체크 (Ray Casting Algorithm)
    isPointInPolygon: function (lat, lng, polygon) {
      if (!polygon) return false;

      try {
        const point = new naver.maps.LatLng(lat, lng);
        const paths = polygon.getPaths();

        if (!paths || paths.length === 0) return false;

        // MultiPolygon 대응 - 모든 path 확인
        for (let i = 0; i < paths.length; i++) {
          const path = paths.getAt(i);
          if (this.pointInPolygonPath(point, path)) {
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    // Ray Casting으로 점이 경로 내부에 있는지 판단
    pointInPolygonPath: function (point, path) {
      const x = point.lng();
      const y = point.lat();
      let inside = false;

      const len = path.getLength();
      for (let i = 0, j = len - 1; i < len; j = i++) {
        const xi = path.getAt(i).lng();
        const yi = path.getAt(i).lat();
        const xj = path.getAt(j).lng();
        const yj = path.getAt(j).lat();

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }

      return inside;
    },

    // 행정동 데이터 조회 및 경계 표시
    loadAdmiDistrict: function (lat, lng) {
      // API 호출 (요청 빈도 제어는 상위 throttledLoadAdmi에서 수행)
      try {
        Zinidata.api({
          url: `/api/common/region/admi/by-point?lat=${lat}&lng=${lng}`,
          method: "GET",
          success: (data) => {
            if (data.success && data.data) {
              this.displayAdmiRegion(data.data);
            } else {
              // 행정동이 없는 경우 기존 경계 제거
              this.clearCurrentPolygon();
            }
          },
          error: () => {
            this.clearCurrentPolygon();
          },
        });
      } catch (_) {
        this.clearCurrentPolygon();
      }
    },

    // 클릭 위치의 행정구역을 확정 선택하고 이후 마우스 이동에 반응하지 않음
    selectRegionByPoint: function (lat, lng) {
      const self = this;
      self.selectionLocked = true;

      try {
        Zinidata.api({
          url: `/api/common/region/admi/by-point?lat=${lat}&lng=${lng}`,
          method: "GET",
          success: (data) => {
            if (data && data.success && data.data) {
              const admiData = data.data;
              self.displayAdmiRegion(admiData);
              // UI에 선택 지역 반영
              // 분석지역 표시용 풀 라벨: mega_nm + cty_nm + admi_nm
              const fullName = [
                typeof simplifyMegaNm === "function" ? simplifyMegaNm(admiData.megaNm) : admiData.megaNm,
                admiData.ctyNm,
                admiData.admiNm,
              ]
                .filter(Boolean)
                .join(" ");
              const name =
                fullName ||
                admiData.admiNm ||
                admiData.Admim ||
                admiData.admiName ||
                admiData.name ||
                "";
              let admiCd = admiData.admiCd || admiData.Admicd || "";
              if (admiCd && admiCd.length === 10) {
                admiCd = admiCd.substring(0, 8);
              }
              if (typeof window.onRegionSelected === "function") {
                window.onRegionSelected({
                  name: name,
                  admiCd: admiCd,
                  coordinates: { lat, lng },
                  code: admiCd,
                  fromMapClick: true,
                  admiData: admiData, // 이미 받은 API 데이터 전달
                });
              }
            }
          },
          error: () => {
            /* 선택 잠금 유지 */
          },
        });
      } catch (_) {
        /* 선택 잠금 유지 */
      }
    },

    // 행정동 경계 표시
    displayAdmiRegion: function (admiData) {
      try {
        // 기존 경계 및 InfoWindow 제거
        this.clearCurrentPolygon();

        // GeoJSON 파싱
        const feature = JSON.parse(admiData.feature);
        const geometry = feature.geometry;

        if (geometry.type === "MultiPolygon") {
          // MultiPolygon 처리
          const paths = [];
          geometry.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              const path = ring.map(
                (coord) => new naver.maps.LatLng(coord[1], coord[0]),
              );
              paths.push(path);
            });
          });

          // 폴리곤 생성 및 표시
          this.currentPolygon = new naver.maps.Polygon({
            map: this.map,
            paths: paths,
            fillColor: "#0066cc",
            fillOpacity: 0.2,
            strokeColor: "#0066cc",
            strokeOpacity: 0.8,
            strokeWeight: 1,
          });

          // InfoWindow는 사용하지 않음 (hover/선택 모두 불필요)

          // 커스텀 행정동 표시 콜백
          if (typeof window.onAdmiDisplayed === "function") {
            window.onAdmiDisplayed(admiData, this.currentPolygon);
          }
        }
      } catch (error) {
        console.error("[MAP-COMMON] 행정동 경계 표시 오류:", error);
      }
    },

    // 현재 표시된 경계 및 InfoWindow 제거
    clearCurrentPolygon: function () {
      if (this.currentPolygon) {
        this.currentPolygon.setMap(null);
        this.currentPolygon = null;
      }
      // InfoWindow는 사용하지 않으므로 정리 로직 유지만 함
      // 폴리곤 제거 시에도 선택 마커는 유지 (선택 유지 UX). 필요 시 아래 주석 해제
      // this.clearSelectionMarker();
    },

    // 현재 표시된 infoWindow 제거
    clearCurrentInfoWindow: function () {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.setMap(null);
        this.currentInfoWindow = null;
      }
    },

    // 지도 인스턴스 반환
    getMap: function () {
      return this.map;
    },

    // 현재 폴리곤 반환
    getCurrentPolygon: function () {
      return this.currentPolygon;
    },

    // 설정 업데이트
    updateConfig: function (newOptions) {
      this.config = { ...this.config, ...newOptions };
    },

    // ============================== 선택 마커 표시/제거 ==============================
    /**
     * 선택한 위치에 라벨 마커 표시
     * @param {number} lat
     * @param {number} lng
     * @param {string} label
     */
    showSelectionMarker: function (lat, lng, label) {
      const map = this.getMap();
      if (!map || typeof naver === "undefined" || !naver.maps) return;
      this.clearSelectionMarker();

      const position = new naver.maps.LatLng(lat, lng);
      const safeLabel = String(label || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      // 프로젝트의 마커 템플릿(HTML) 구조를 그대로 사용
      const content = `
                <div class="selectionMarkerWrapper">
                    <div class="mapMarker mapMarkerOnMap">
                        <img src="/assets/images/icons/map_marker.svg" alt="지도 마커" />
                        <div class="mapMarkerText"><p>${safeLabel}</p></div>
                    </div>
                </div>`;

      this.currentSelectionMarker = new naver.maps.Marker({
        position: position,
        map: Zinidata.map.map,
        icon: {
          content: content,
          size: new naver.maps.Size(0, 0),
          anchor: new naver.maps.Point(0, 0),
        },
      });
    },

    clearSelectionMarker: function () {
      if (this.currentSelectionMarker) {
        this.currentSelectionMarker.setMap(null);
        this.currentSelectionMarker = null;
      }
    },

    // ============================== 목록 마커 표시/제거 ==============================
    /**
     * 목록 마커 표시
     * @param {number} lat
     * @param {number} lng
     * @param {string} label
     */
    markerList: function (data, contentHtml) {
      const self = this;
      const map = this.getMap();
      if (!map || typeof naver === "undefined" || !naver.maps) return;

      // currentSelectionMarkers 배열 초기화 확인
      if (!self.currentSelectionMarkers) {
        self.currentSelectionMarkers = [];
      }

      this.clearMarkerList();

      data.forEach(function (val, idx) {
        // 좌표 확인 (centery/centerx, yaxis/xaxis, lat/lng)
        const lat = val.lat || val.yaxis || val.centery;
        const lng = val.lng || val.xaxis || val.centerx;

        if (!lat || !lng) {
          console.warn("[MAP-COMMON] 마커 좌표가 없습니다:", val);
          return;
        }

        const position = new naver.maps.LatLng(lat, lng);

        const marker = new naver.maps.Marker({
          position: position,
          map: Zinidata.map.map,
          icon: {
            content: contentHtml[idx],
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
        });

        self.currentSelectionMarkers.push(marker);
      });
    },

    /**
     * 목록 마커 제거
     */
    clearMarkerList: function () {
      if (
        !this.currentSelectionMarkers ||
        !Array.isArray(this.currentSelectionMarkers)
      ) {
        this.currentSelectionMarkers = [];
        return;
      }

      this.currentSelectionMarkers.forEach(function (marker) {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      this.currentSelectionMarkers = [];
    },

    /**
     * 시군구 클러스터 표시
     * @param {Array} data
     * @param {Array<string>} contentHtml
     */
    clusterList: function (data, contentHtml) {
      const self = this;
      const map = this.getMap();
      if (!map || typeof naver === "undefined" || !naver.maps) return;

      if (!self.currentClusterMarkers) {
        self.currentClusterMarkers = [];
      }

      this.clearClusterList();

      data.forEach(function (val, idx) {
        const lat = val.lat || val.yaxis || val.centery;
        const lng = val.lng || val.xaxis || val.centerx;

        if (!lat || !lng) {
          console.warn("[MAP-COMMON] 클러스터 좌표가 없습니다:", val);
          return;
        }

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map: Zinidata.map.map,
          icon: {
            content: contentHtml[idx],
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
        });

        self.currentClusterMarkers.push(marker);
      });
    },

    /**
     * 시군구 클러스터 제거
     */
    clearClusterList: function () {
      if (
        !this.currentClusterMarkers ||
        !Array.isArray(this.currentClusterMarkers)
      ) {
        this.currentClusterMarkers = [];
        return;
      }

      this.currentClusterMarkers.forEach(function (marker) {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      this.currentClusterMarkers = [];
    },

    // 줌 레벨에 따른 구분 반환(mega/cty/admi/block)
    getZoomGubun: function () {
      if (!this.map) {
        console.warn("[MAP-COMMON] 지도가 초기화되지 않았습니다.");
        return null;
      }

      const zoom = this.map.getZoom();

      if (zoom >= 15) {
        return "block";
      } else if (zoom === 14) {
        return "admi";
      } else if (zoom === 13 || zoom === 12) {
        return "cty";
      } else if (zoom <= 11) {
        return "mega";
      }
    },

    // 줌 레벨에 따른 구분 반환(marker/clustering)
    getZoomType: function () {
      if (!this.map) {
        console.warn("[MAP-COMMON] 지도가 초기화되지 않았습니다.");
        return null;
      }

      const zoom = this.map.getZoom();

      if (zoom > 13) {
        return "marker";
      } else {
        return "clustering";
      }
    },

    // ============================== 반경 Circle 표시/제거 ==============================
    /**
     * 반경 Circle 그리기
     * @param {number} lat - 중심 위도
     * @param {number} lng - 중심 경도
     * @param {number} radius - 반경 (미터, 기본값: 1000m)
     */
    drawRadiusCircle: function (lat, lng, radius = 1000, showMarker = false) {
      const map = this.getMap();
      if (!map) {
        console.warn("[MAP-COMMON] 지도가 초기화되지 않았습니다.");
        return;
      }

      // 유동인구 ON 시 임시 해제 후 복원용으로 옵션 보관
      this.lastRadiusCircleOptions = {
        lat,
        lng,
        radius,
        showMarker: !!showMarker,
      };

      this.clearCurrentPolygon();
      // 가이드 Circle 제거 (클릭 시 실제 Circle로 전환)
      this.clearRadiusGuide();

      // 기존 Circle 제거
      if (this.currentRadiusCircle) {
        this.currentRadiusCircle.setMap(null);
        this.currentRadiusCircle = null;
      }

      // 기존 중심 마커 제거
      if (this.currentRadiusMarker) {
        this.currentRadiusMarker.setMap(null);
        this.currentRadiusMarker = null;
      }

      // #mapWsReport + radius + 유동인구 보기 ON 이면 반경은 그리지 않고 옵션만 저장
      const $wsReport = $("#mapWsReport");
      const hideForFlowPop =
        typeof flowPopSw !== "undefined" &&
        flowPopSw &&
        sessionStorage.getItem("gubun") === "radius" &&
        $wsReport.length > 0 &&
        !$wsReport.hasClass("hidden");
      if (hideForFlowPop) {
        console.log("[MAP-COMMON] 유동인구 보기 중이라 반경 Circle 표시 보류");
        return;
      }

      // 실제 Circle 생성 (클릭 시, 진한 색상)
      this.currentRadiusCircle = new naver.maps.Circle({
        map: map,
        center: new naver.maps.LatLng(lat, lng),
        radius: radius,
        strokeColor: "#FF6900",
        fillColor: "#FD9A00",
        strokeOpacity: 1,
        strokeWeight: 1,
        fillOpacity: 0.3,
      });

      // 중심점 마커 생성 (showMarker true일 때만)
      if (showMarker) {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="3" fill="#FF6900" stroke="#FFFFFF" stroke-width="1"/>
          </svg>
        `;

        this.currentRadiusMarker = new naver.maps.Marker({
          map: map,
          position: new naver.maps.LatLng(lat, lng),
          icon: {
            content: svg,
            anchor: new naver.maps.Point(8, 8),
          },
        });
      }

      // 면적 계산 및 콘솔 출력
      const area = Math.PI * radius * radius;
      const areaKm2 = (area / 1000000).toFixed(4);
      const areaM2 = area.toFixed(2);

      console.log("[MAP-COMMON] 반경 Circle 생성:", {
        lat,
        lng,
        radius: radius,
        area: areaM2 + " ㎡ (" + areaKm2 + " ㎢)",
      });
    },

    /**
     * 마지막으로 그린 반경 Circle 복원 (유동인구 보기 OFF 시)
     */
    restoreRadiusCircle: function () {
      const opt = this.lastRadiusCircleOptions;
      if (!opt) {
        return;
      }
      this.drawRadiusCircle(opt.lat, opt.lng, opt.radius, opt.showMarker);
    },

    /**
     * 반경 가이드 Circle 제거
     */
    clearRadiusGuide: function () {
      if (this.radiusGuideCircle) {
        this.radiusGuideCircle.setMap(null);
        this.radiusGuideCircle = null;
      }
    },

    /**
     * 반경 Circle 제거 (중심 마커 포함). lastRadiusCircleOptions는 복원용으로 유지.
     */
    clearRadiusCircle: function () {
      if (this.currentRadiusCircle) {
        this.currentRadiusCircle.setMap(null);
        this.currentRadiusCircle = null;
      }
      if (this.currentRadiusMarker) {
        this.currentRadiusMarker.setMap(null);
        this.currentRadiusMarker = null;
      }
    },

    /**
     * 유동인구 셀 분포도 제거
     */
    clearFlowPopGeomList: function () {
      if (typeof clearFlowPop50x50Geom === "function") {
        clearFlowPop50x50Geom();
      } else if (geomList && geomList.length > 0) {
        geomList.forEach(function (val, idx){
          Zinidata.map.map.data.removeGeoJson(val);
        });
        geomList = [];
      }

      if($('.flowToggleBtn button').hasClass("active")) {
        $('.flowToggleBtn button').removeClass("active");
      }
    },

    // parseWktToPaths: function (wkt) {
    //   if (!wkt) return [];

    //   // 만약 데이터가 01060... 형태의 16진수(WKB)라면 변환 시도 (선택 사항)
    //   // 여기서는 문자열 WKT 형태를 기준으로 처리합니다.

    //   // 괄호 안의 숫자들 추출 (MULTIPOLYGON (((...))) 또는 POLYGON ((...)) 대응)
    //   const coordsMatch = wkt.match(/\d+[\d\s.,-]+/g);
    //   if (!coordsMatch) return [];

    //   // 마지막 괄호 뭉치에서 좌표 쌍들을 추출
    //   const coordsString = wkt.split("(").pop().split(")")[0];
    //   const pairs = coordsString.split(",");

    //   return pairs.map((pair) => {
    //     const parts = pair.trim().split(/\s+/); // 공백이 하나 이상일 경우 대응
    //     const lng = parseFloat(parts[0]);
    //     const lat = parseFloat(parts[1]);

    //     return new naver.maps.LatLng(lat, lng);
    //   });
    // },
  };
});
