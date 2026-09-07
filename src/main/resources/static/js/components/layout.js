(function (App, $) {
  App.ui = App.ui || {};
  
  // =========================
  // Search
  // =========================
  App.ui.search = App.ui.search || {};
  
  function bindClick($searchInput) {        
    if ($searchInput.data('bound')) return;
    $searchInput.data('bound', true);

    const hideSearchList = $searchInput.is('[data-hide-search-list]');
    const $container = $searchInput.closest('.c-searchbox');
    const toggleSearchList = (show) => {
      if (hideSearchList) {
        $searchInput.siblings('[data-search-list]').addClass('hidden');
        return;
      }
      $searchInput.siblings('[data-search-list]').toggleClass('hidden', !show);
    };

    $searchInput.on('click.search', '[data-search-input]', function () {
      toggleSearchList($(this).val() !== '');
    });
    
    // submit
    $container.on('click.search', '[data-search-item]', function () {        
      // const text = $(this).find('.keyword').text().trim() || $(this).text().trim();        
      const text = $(this).find('p:first-child').text().trim();
      // input에 값 채우기
      $searchInput.find('[data-search-input]').val(text);
      // clear 버튼 표시
      $searchInput.find('[data-search-clear]').removeClass('hidden');
      // 리스트 닫기
      $container.find('[data-search-list]').addClass('hidden');

      // ✅ submit 이벤트 발생
      $searchInput.trigger('search:submit', {
          key: $searchInput.data('searchKey') || null,
          keyword: text,
          source: 'list'
      });
    });

    // clear
    $container.on('click.search', '[data-search-clear]', function () {
      $searchInput.find('[data-search-input]').val('');
      $(this).addClass('hidden');
      $container.find('[data-search-list]').addClass('hidden');
      
      
      $searchInput.trigger('search:clear', {
        key: $searchInput.data('searchKey') || null
      });
    });

    // 타이핑 검색
    $searchInput.on('keyup.search', '[data-search-input]', function () {
      const value = $(this).val();
      if(value !== ''){
        toggleSearchList(true);
        $searchInput.find('[data-search-clear]').removeClass('hidden');
      }else{
        toggleSearchList(false);
        $searchInput.find('[data-search-clear]').addClass('hidden');
      }
    });

    // searchbox 외부 클릭 시 리스트 닫기
    $(document).on('click.search', function (e) {
      if (!$container.is(e.target) && $container.has(e.target).length === 0) {
        $container.find('[data-search-list]').addClass('hidden');
      }
      if ($searchInput.find('[data-search-input]').val() === '') {
        $searchInput.find('[data-search-clear]').addClass('hidden');
      }
    });

  }

  App.ui.search.init = function (scope) {
    const $scope = scope ? $(scope) : $(document);
    // click과 typing 모두 처리
    $scope.find('[data-search="click"], [data-search="typing"]').each(function () {
      bindClick($(this));
    });
  };

  // =========================
// Table Enhance (네가 만든 것 그대로 사용)
// =========================
App.ui.tableEnhance = App.ui.tableEnhance || {};

// 플레이스홀더('-' 등)만 있으면 열 정렬 판별에서 제외 → 다른 행 값으로 결정
function shouldSkipAlignProbe(text) {
  const t = String(text).trim();
  if (!t) return true;
  return /^[\-\u2013\u2014\uFF0D]$/.test(t);
}

// 타입 판별 유틸
function inferCellType(text) {
const normalized = text.trim();

// 날짜 + 시간 (공백 포함) -> 좌측 정렬 대상
const dateTimeLike =
  /^\d{4}[-./]\d{1,2}[-./]\d{1,2}\s+\d{1,2}:\d{2}(:\d{2})?$/.test(normalized);
if (dateTimeLike) return 'date';

// 날짜만 / 시간만 -> 좌측 정렬 대상
const dateLike =
  /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(normalized) ||
  /^\d{1,2}:\d{2}(:\d{2})?$/.test(normalized);
if (dateLike) return 'date';

// 숫자열: 문자열 전체가 수치 형태일 때만 (주소처럼 앞만 숫자인 값은 text → 좌측)
const num = '[-+]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
if (new RegExp(`^${num}$`).test(normalized)) return 'number';
if (new RegExp(`^${num}\\s*(?:원|만원|억원|억\\s*원|천만원|백만원)\\s*$`, 'i').test(normalized)) return 'number';
if (new RegExp(`^${num}\\s*개\\s*$`, 'i').test(normalized)) return 'number';
if (/^\d+\s*층\s*$/i.test(normalized)) return 'number';
if (/^\d+(?:\.\d+)?\s*㎡\s*$/.test(normalized)) return 'number';
if (new RegExp(`^${num}\\s*%\\s*$`).test(normalized)) return 'number';

return 'text';
}

App.ui.tableEnhance.init = function (scope) {
const $scope = scope ? $(scope) : $(document);

$scope.find('table[data-enhance-table]').each(function () {
  const $table = $(this);
  if ($table.data('enhanceBound')) return;
  $table.data('enhanceBound', true);

  // 그룹 헤더 중앙정렬(옵션)
  $table.find('th[data-group-head]').each(function () {
    this.style.textAlign = 'center';
    this.style.verticalAlign = 'middle';
  });

  // 열 기준 정렬
  const columnAlignMap = {};

  // 1) th 기준 선처리: data-align 우선, "No"면 center
  $table.find('thead th').each(function (index) {
    const $th = $(this);
    const thText = $th.text().trim();

    const explicitAlign = $th.data('align');
    if (explicitAlign) {
      columnAlignMap[index] = explicitAlign;
      return;
    }

    if (/^no$/i.test(thText)) {
      columnAlignMap[index] = 'center';
    }
  });

  // 2) button 있는 컬럼은 center
  $table.find('tbody tr').each(function () {
    $(this).children('td').each(function (index) {
      if (columnAlignMap[index]) return;
      if ($(this).find('button').length > 0) {
        columnAlignMap[index] = 'center';
      }
    });
  });

  // 3) td 기준 자동 판별
  $table.find('tbody tr').each(function () {
    $(this).children('td').each(function (index) {
      if (columnAlignMap[index]) return;

      const $td = $(this);
      if ($td.find('a, .tag').length) return;

      const text = $td.text();
      if (shouldSkipAlignProbe(text)) return;

      const type = inferCellType(text.trim());
      columnAlignMap[index] = (type === 'number') ? 'right' : 'left';
    });
  });

  // 4) th/td 일괄 적용
  $table.find('tr').each(function () {
    $(this).children('th, td').each(function (index) {
      const align = columnAlignMap[index];
      if (!align) return;

      this.style.textAlign = align;
      this.style.verticalAlign = 'middle';

      if (align === 'right') {
        this.style.fontVariantNumeric = 'tabular-nums';
      }
    });
  });
});
};


// =========================
// Admin Table (렌더러)
// =========================
App.ui.adminTable = App.ui.adminTable || {};

/**
* @param {string} selector - '#homeTable'
* @param {Object} options
* @param {Array} options.headers - [{text:'No', align?:'left|center|right'}] 또는 ['No','번호',...]
* @param {Array} options.rows - [['1','123',...], ...]  (cell은 텍스트 or HTML 문자열 가능)
*/
App.ui.adminTable.render = function (selector, options) {
const $table = $(selector);
if ($table.length === 0) {
  console.warn('[ADMIN_TABLE] 테이블을 찾을 수 없습니다:', selector);
  return;
}

const { headers = [], rows = [] } = options || {};

// thead/tbody 없으면 생성(안전)
if ($table.find('thead').length === 0) $table.prepend('<thead></thead>');
if ($table.find('tbody').length === 0) $table.append('<tbody></tbody>');

// thead
const $thead = $table.find('thead');
$thead.empty();

if (headers.length > 0) {
  const $tr = $('<tr></tr>');
  headers.forEach(h => {
    const isStr = (typeof h === 'string');
    const text = isStr ? h : (h.text || '');
    const align = isStr ? null : (h.align || null);

    const $th = $('<th></th>').text(text);
    if (align) $th.attr('data-align', align);
    $tr.append($th);
  });
  $thead.append($tr);
}

// tbody
const $tbody = $table.find('tbody');
$tbody.empty();

rows.forEach(row => {
  const $tr = $('<tr></tr>');
  (row || []).forEach(cell => {
    const $td = $('<td></td>');
    if (typeof cell === 'string' && cell.trim().startsWith('<')) $td.html(cell);
    else $td.text(cell ?? '');
    $tr.append($td);
  });
  $tbody.append($tr);
});

// ✅ 정렬 재적용 (렌더 후 항상 다시 계산)
$table.removeData('enhanceBound');
App.ui.tableEnhance.init($table.closest('.tableDataDom').length ? $table.closest('.tableDataDom') : $table);
};


  // =========================
  // Pagination (FINAL)
  // =========================
  window.App = window.App || {};
  App.ui = App.ui || {};
  App.ui.pagination = App.ui.pagination || {};

  (function () {
    const NS = '.pagination';

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    function getState($p) {
      return {
        totalPages: Number($p.data('totalPages')) || 1,
        currentPage: Number($p.data('currentPage')) || 1,
        windowSize: Number($p.data('windowSize')) || 5,
      };
    }

    function setState($p, st) {
      $p.data('totalPages', st.totalPages);
      $p.data('currentPage', st.currentPage);
      $p.data('windowSize', st.windowSize);
    }

    // ✅ 페이지 번호 li를 totalPages/currentPage 기준으로 생성(슬라이딩)
    function renderPageItems($p) {
      const st = getState($p);
      const total = st.totalPages;
      const cur = st.currentPage;
      const win = st.windowSize;

      const $ul = $p.find('ul').first();
      if (!$ul.length) return;

      // 기존 번호 li 제거
      $ul.find('li[data-page]').remove();

      // 표시할 구간 계산 (1..total에서 cur 중심으로 win개)
      let start = Math.max(1, cur - Math.floor(win / 2));
      let end = start + win - 1;

      if (end > total) {
        end = total;
        start = Math.max(1, end - win + 1);
      }

      // 삽입 기준: prev/first 다음에 넣고, next/last 앞에 위치
      const $after = $ul.find('li[data-page-btn="prev"]');
      const $before = $ul.find('li[data-page-btn="next"]');

      const items = [];
      for (let p = start; p <= end; p++) {
        const activeCls = (p === cur) ? 'active' : '';
        items.push(`<li data-page="${p}" class="${activeCls}">${p}</li>`);
      }

      // prev 뒤에 넣기
      if ($after.length) {
        $after.after(items.join(''));
      } else if ($before.length) {
        $before.before(items.join(''));
      } else {
        $ul.append(items.join(''));
      }
    }

    // ✅ first/prev/next/last disabled 처리 (총 페이지 기준)
    function updateDisabled($p) {
      const st = getState($p);
      const cur = st.currentPage;
      const total = st.totalPages;

      $p.find('[data-page-btn="first"], [data-page-btn="prev"]')
        .toggleClass('disabled', cur <= 1);

      $p.find('[data-page-btn="next"], [data-page-btn="last"]')
        .toggleClass('disabled', cur >= total);
    }

    function setActive($p, page) {
      $p.find('li[data-page]').removeClass('active');
      $p.find(`li[data-page="${page}"]`).addClass('active');
    }

    // ✅ 내부 공통: page 변경 처리
    function applyPage($p, nextPage) {
      const st = getState($p);
      const page = clamp(nextPage, 1, st.totalPages);

      st.currentPage = page;
      setState($p, st);

      renderPageItems($p);
      setActive($p, page);
      updateDisabled($p);

      // 외부로 알림
      $p.trigger('pagination:page', { page });
    }

    // ✅ 클릭 바인딩 (한 번만)
    function bind($p) {
      if ($p.data('bound')) return;
      $p.data('bound', true);

      $p.off('click' + NS).on('click' + NS, 'li', function (e) {
        const $li = $(this);

        if ($li.hasClass('disabled')) return;

        const st = getState($p);
        const cur = st.currentPage;

        // 번호 클릭
        const page = $li.data('page');
        if (page) {
          applyPage($p, Number(page));
          return;
        }

        // 버튼 클릭
        const action = $li.data('pageBtn');
        if (!action) return;

        if (action === 'first') applyPage($p, 1);
        if (action === 'prev')  applyPage($p, cur - 1);
        if (action === 'next')  applyPage($p, cur + 1);
        if (action === 'last')  applyPage($p, st.totalPages);
      });
    }

    // ✅ init: DOM에 있는 paginationWrap에 이벤트만 걸어줌
    App.ui.pagination.init = function (scope) {
      const $scope = scope ? $(scope) : $(document);
      $scope.find('[data-pagination]').each(function () {
        bind($(this));
      });
    };

    /**
     * connect: 페이지네이션 상태 세팅 + goToPage 연결 + 스크롤 TOP
     * @param {string|Element|jQuery} target - '#homePagination'
     * @param {Object} opt
     * @param {number} opt.totalPages
     * @param {number} [opt.currentPage=1]
     * @param {number} [opt.windowSize=5]  // 화면에 보여줄 페이지 li 개수
     * @param {function} opt.goToPage
     * @param {string|Element|jQuery} [opt.scrollTarget] // 없으면 window
     */
    App.ui.pagination.connect = function (target, opt) {
      const $p = (target instanceof jQuery) ? target : $(target);
      if (!$p.length) {
        console.warn('[PAGINATION] target not found:', target);
        return;
      }

      bind($p); // connect만 호출해도 바인딩 되도록

      const total = Math.max(1, Number(opt?.totalPages) || 1);
      const win = Math.max(1, Number(opt?.windowSize) || 5);
      let cur = Number(opt?.currentPage) || 1;
      cur = clamp(cur, 1, total);

      const goToPage = opt?.goToPage;
      if (typeof goToPage !== 'function') {
        console.warn('[PAGINATION] goToPage 함수가 필요합니다.');
        return;
      }

      setState($p, { totalPages: total, currentPage: cur, windowSize: win });
      renderPageItems($p);
      setActive($p, cur);
      updateDisabled($p);

      // 중복 연결 방지 (id별)
      $p.off('pagination:page.bridge').on('pagination:page.bridge', function (_e, ev) {
        goToPage(ev.page);
        scrollToTop(opt?.scrollTarget);
      });

      return {
        setTotalPages(n) {
          const st = getState($p);
          st.totalPages = Math.max(1, Number(n) || 1);
          st.currentPage = clamp(st.currentPage, 1, st.totalPages);
          setState($p, st);
          renderPageItems($p);
          setActive($p, st.currentPage);
          updateDisabled($p);
        },
        setCurrent(n) { applyPage($p, Number(n) || 1); },
        getCurrent() { return getState($p).currentPage; }
      };
    };

    function scrollToTop(target) {
      if (!target) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const $t = (target instanceof jQuery) ? target : $(target);
      if (!$t.length) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      $t.stop().animate({ scrollTop: 0 }, 200);
    }
  })();




  // =========================
  // Calendar (air-datepicker, CDN은 캘린더 사용 페이지에서 airDatepickerJs로 로드)
  // =========================
  App.ui.calendar = App.ui.calendar || {};

  const airDatepickerLocaleKo = {
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    daysShort: ['일', '월', '화', '수', '목', '금', '토'],
    daysMin: ['일', '월', '화', '수', '목', '금', '토'],
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthsShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    today: '오늘',
    clear: '초기화',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'hh:mm aa',
    firstDay: 0,
    isMobile: true,
    visible: false,
    autoClose: false
  };

  // air-datepicker 3.x: navTitles는 opts 최상위. formatDate 토큰(yyyy, M 등)은
  // ASCII 구분자(공백, <, > 등)로만 경계 인식 → "yyyy년", "M월"은 치환 안 됨 → 함수로 직접 조합
  const airDatepickerNavTitles = {
    days: (dp) => {
      const d = dp.viewDate;
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    },
    months: (dp) => `${dp.viewDate.getFullYear()}년`,
    years: (dp) => {
      const [y1, y2] = dp.curDecade;
      return `${y1} - ${y2}`;
    }
  };

  App.ui.calendar.init = function (scope) {
    const AirDatepickerCtor = window.AirDatepicker;
    if (typeof AirDatepickerCtor !== 'function') {
      return;
    }
    const $scope = scope ? $(scope) : $(document);
    $scope.find('[data-calendar]').each(function () {
      const input = this;
      if (input.nodeName !== 'INPUT' || $(input).data('airDatepickerInited')) {
        return;
      }
      $(input).data('airDatepickerInited', true);
      const instance = new AirDatepickerCtor(input, {
        locale: airDatepickerLocaleKo,
        navTitles: airDatepickerNavTitles,
        autoClose: true,
        dateFormat: 'yyyy-MM-dd',
        visible: false
      });

      $(input).data('airDatepickerInstance', instance);
    });

    const parseYmdLocal = (value) => {
      if (value == null || value === '') return null;
      const s = String(value).trim();
      if (!s) return null;
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
      if (!m) return null;
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    };

    $scope.find('.calendarDual').each(function () {
      const $pair = $(this);
      if ($pair.data('calendarDualInited')) {
        return;
      }
      const $start = $pair.find('[data-calendar-dual-start]');
      const $end = $pair.find('[data-calendar-dual-end]');
      const $hostStart = $pair.find('[data-calendar-dual-inline-start]');
      const $hostEnd = $pair.find('[data-calendar-dual-inline-end]');
      const $dropdown = $pair.find('[data-calendar-dual-dropdown]');
      if (
        $start.length !== 1 ||
        $end.length !== 1 ||
        $hostStart.length !== 1 ||
        $hostEnd.length !== 1 ||
        $dropdown.length !== 1
      ) {
        return;
      }
      const elStart = $start[0];
      const elEnd = $end[0];
      const elHostStart = $hostStart[0];
      const elHostEnd = $hostEnd[0];
      if (elStart.nodeName !== 'INPUT' || elEnd.nodeName !== 'INPUT') {
        return;
      }

      $pair.data('calendarDualInited', true);

      const dateKey = (d) =>
        d instanceof Date
          ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
          : null;

      const sameLocalDay = (a, b) =>
        a instanceof Date &&
        b instanceof Date &&
        dateKey(a) === dateKey(b);

      const dStart = parseYmdLocal(elStart.value);
      const dEnd = parseYmdLocal(elEnd.value);
      let rangeFrom = dStart ? new Date(dStart.getTime()) : null;
      let rangeTo = dEnd ? new Date(dEnd.getTime()) : null;

      const buildRangeCellClasses = (date) => {
        if (!(date instanceof Date)) return '';
        const hasFrom = rangeFrom instanceof Date;
        const hasTo = rangeTo instanceof Date;
        if (hasFrom && hasTo && sameLocalDay(rangeFrom, rangeTo) && sameLocalDay(date, rangeFrom)) {
          return 'calendarDual-rangeEdge calendarDual-rangeEdge--single';
        }
        if (hasFrom && sameLocalDay(date, rangeFrom)) {
          return 'calendarDual-rangeEdge calendarDual-rangeEdge--from';
        }
        if (hasTo && sameLocalDay(date, rangeTo)) {
          return 'calendarDual-rangeEdge calendarDual-rangeEdge--to';
        }
        if (!hasFrom || !hasTo) return '';
        const k = dateKey(date);
        const lo = Math.min(dateKey(rangeFrom), dateKey(rangeTo));
        const hi = Math.max(dateKey(rangeFrom), dateKey(rangeTo));
        if (k > lo && k < hi) return 'calendarDual-rangeBetween';
        return '';
      };

      const dualOnRenderCell = ({ date, cellType }) => {
        if (cellType !== 'day') return {};
        const classes = buildRangeCellClasses(date);
        return classes ? { classes } : {};
      };

      const inlineOpts = {
        locale: airDatepickerLocaleKo,
        navTitles: airDatepickerNavTitles,
        dateFormat: 'yyyy-MM-dd',
        inline: true,
        isMobile: false,
        range: true,
        dynamicRange: true,
        onRenderCell: dualOnRenderCell
      };

      let navSync = false;
      let rangeSync = false;
      let dpMin;
      let dpMax;

      const refreshDualRangeViews = () => {
        if (dpMin) dpMin.update({}, { silent: true });
        if (dpMax) dpMax.update({}, { silent: true });
      };

      const formatYmd = (d, dp) =>
        d instanceof Date ? dp.formatDate(d, 'yyyy-MM-dd') : '';

      const writeInputs = () => {
        const dp = dpMin || dpMax;
        if (!dp) return;
        elStart.value = formatYmd(rangeFrom, dp);
        elEnd.value = formatYmd(rangeTo, dp);
        // 프로그램 값 반영 후 필터 연동용 change 이벤트
        $(elStart).trigger('change');
        $(elEnd).trigger('change');
      };

      const selectedDatesOf = () =>
        [rangeFrom, rangeTo].filter((d) => d instanceof Date);

      const syncSelectedDates = () => {
        if (!dpMin || !dpMax) return;
        rangeSync = true;
        const leftView = new Date(dpMin.viewDate.getTime());
        const rightView = new Date(dpMax.viewDate.getTime());
        const dates = selectedDatesOf();
        dpMin.clear({ silent: true });
        dpMax.clear({ silent: true });
        if (dates.length) {
          dpMin.selectDate(dates, { silent: true });
          dpMax.selectDate(dates, { silent: true });
        }
        dpMin.setViewDate(leftView);
        dpMax.setViewDate(rightView);
        rangeSync = false;
        refreshDualRangeViews();
      };

      const onRangeSelect = ({ date }) => {
        if (rangeSync) return;
        const dates = Array.isArray(date) ? date.filter(Boolean) : (date ? [date] : []);
        if (dates.length >= 2) {
          const a = dates[0];
          const b = dates[1];
          if (dateKey(a) <= dateKey(b)) {
            rangeFrom = new Date(a.getTime());
            rangeTo = new Date(b.getTime());
          } else {
            rangeFrom = new Date(b.getTime());
            rangeTo = new Date(a.getTime());
          }
          writeInputs();
          syncSelectedDates();
          closeDropdown();
          return;
        }
        if (dates.length === 1) {
          rangeFrom = new Date(dates[0].getTime());
          rangeTo = null;
          writeInputs();
          syncSelectedDates();
          return;
        }
        rangeFrom = null;
        rangeTo = null;
        writeInputs();
        syncSelectedDates();
      };

      const closeNs = `calendarDual.${elStart.id || elEnd.id || String(Math.random()).slice(2)}`;
      let dropdownOpen = false;

      const closeDropdown = () => {
        if (!dropdownOpen) return;
        dropdownOpen = false;
        $dropdown.prop('hidden', true);
        $(document).off(`mousedown.${closeNs}`);
      };

      const openDropdown = () => {
        if (dropdownOpen) return;
        dropdownOpen = true;
        $dropdown.prop('hidden', false);
        setTimeout(() => {
          $(document).on(`mousedown.${closeNs}`, (ev) => {
            if ($pair[0].contains(ev.target)) return;
            closeDropdown();
          });
        }, 0);
      };

      $dropdown.on('mousedown', (ev) => {
        ev.preventDefault();
      });

      $pair.find('.calendarDualInputs input').on('focusin.calendarDual click.calendarDual', () => {
        openDropdown();
      });

      dpMin = new AirDatepickerCtor(elHostStart, {
        ...inlineOpts,
        onSelect: onRangeSelect,
        onChangeViewDate: () => {
          if (navSync) return;
          navSync = true;
          const vd = dpMin.viewDate;
          dpMax.setViewDate(new Date(vd.getFullYear(), vd.getMonth() + 1, 1));
          navSync = false;
        }
      });

      dpMax = new AirDatepickerCtor(elHostEnd, {
        ...inlineOpts,
        onSelect: onRangeSelect,
        onChangeViewDate: () => {
          if (navSync) return;
          navSync = true;
          const vd = dpMax.viewDate;
          dpMin.setViewDate(new Date(vd.getFullYear(), vd.getMonth() - 1, 1));
          navSync = false;
        }
      });

      navSync = true;
      const viewBase = dStart || dpMin.viewDate;
      dpMin.setViewDate(new Date(viewBase.getFullYear(), viewBase.getMonth(), 1));
      dpMax.setViewDate(new Date(viewBase.getFullYear(), viewBase.getMonth() + 1, 1));
      navSync = false;

      if (rangeFrom || rangeTo) {
        syncSelectedDates();
        writeInputs();
      }
      refreshDualRangeViews();

      $pair.data('calendarDual', { dpMin, dpMax, closeDropdown, openDropdown });
    });
  };

  // =========================
  // Table Enhance
  // =========================

  App.ui.tableEnhance = App.ui.tableEnhance || {};

  // 플레이스홀더('-' 등)만 있으면 열 정렬 판별에서 제외 → 다른 행 값으로 결정
  function shouldSkipAlignProbe(text) {
    const t = String(text).trim();
    if (!t) return true;
    return /^[\-\u2013\u2014\uFF0D]$/.test(t);
  }

  // 타입 판별 유틸
  function inferCellType(text) {
    const normalized = text.trim();
  
    // ✅ 날짜 + 시간 (공백 포함)
    const dateTimeLike =
      /^\d{4}[-./]\d{1,2}[-./]\d{1,2}\s+\d{1,2}:\d{2}(:\d{2})?$/.test(normalized);
  
    if (dateTimeLike) return 'date';
  
    // ✅ 날짜만
    const dateLike =
      /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(normalized) ||
      /^\d{1,2}:\d{2}(:\d{2})?$/.test(normalized);
  
    if (dateLike) return 'date';
  
    // 숫자열: 문자열 전체가 수치 형태일 때만 (주소처럼 앞만 숫자인 값은 text → 좌측)
    const num = '[-+]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
    if (new RegExp(`^${num}$`).test(normalized)) return 'number';
    if (new RegExp(`^${num}\\s*(?:원|만원|억원|억\\s*원|천만원|백만원)\\s*$`, 'i').test(normalized)) return 'number';
    if (new RegExp(`^${num}\\s*개\\s*$`, 'i').test(normalized)) return 'number';
    if (/^\d+\s*층\s*$/i.test(normalized)) return 'number';
    if (/^\d+(?:\.\d+)?\s*㎡\s*$/.test(normalized)) return 'number';
    if (new RegExp(`^${num}\\s*%\\s*$`).test(normalized)) return 'number';
  
    return 'text';
  }

  App.ui.tableEnhance.init = function (scope) {
    const $scope = scope ? $(scope) : $(document);

    $scope.find('table[data-enhance-table]').each(function () {
      const $table = $(this);
      if ($table.data('enhanceBound')) return;
      $table.data('enhanceBound', true);

      // 1) 그룹 헤더(th) 중앙 정렬
      $table.find('th[data-group-head]').each(function () {
        this.style.textAlign = 'center';
        this.style.verticalAlign = 'middle';
      });

      // 2) 자동 정렬 (열 기준)
      const columnAlignMap = {};

      // --- 1단계: th 기준 선처리 ---
      $table.find('thead th').each(function (index) {
        const $th = $(this);
        const text = $th.text().trim();

        // (1) 명시적 data-align 최우선
        const explicitAlign = $th.data('align');
        if (explicitAlign) {
          columnAlignMap[index] = explicitAlign;
          return;
        }

        // (2) "No" 컬럼은 무조건 center
        if (/^no$/i.test(text)) {
          columnAlignMap[index] = 'center';
        }
      });

      // --- 2단계: button 컬럼 감지 → center ---
      $table.find('tbody tr').each(function () {
        $(this).children('td').each(function (index) {
          if (columnAlignMap[index]) return;

          if ($(this).find('button').length > 0) {
            columnAlignMap[index] = 'center';
          }
        });
      });

      // --- 3단계: td 기준 자동 판별 ---
      $table.find('tbody tr').each(function () {
        $(this).children('td').each(function (index) {
          // 이미 정렬이 결정된 컬럼은 스킵
          if (columnAlignMap[index]) return;

          const $td = $(this);

          // 링크/태그 등 복합 콘텐츠는 스킵
          if ($td.find('a, .tag').length) return;

          const text = $td.text();
          if (shouldSkipAlignProbe(text)) return;

          const type = inferCellType(text.trim());
          columnAlignMap[index] = (type === 'number') ? 'right' : 'left';
        });
      });

      // --- 4단계: th / td에 일괄 적용 ---
      $table.find('tr').each(function () {
        $(this).children('th, td').each(function (index) {
          const align = columnAlignMap[index];
          if (!align) return;

          this.style.textAlign = align;
          this.style.verticalAlign = 'middle';

          if (align === 'right') {
            this.style.fontVariantNumeric = 'tabular-nums';
          }
        });
      });
    });
  };

  // -------------------------
  // sortBtn 클릭 정렬 (data-enhance-table 테이블 공통) — 3단계: default → up(asc) → down(desc) → default
  // -------------------------
  (function () {
    $(document).on('click', 'table[data-enhance-table] thead th', function () {
      const $th = $(this);
      if ($th.find('.sortBtn').length === 0) return;

      const $table = $th.closest('table');
      const $tbody = $table.find('tbody');
      const colIndex = $th.index();
      const rows = $tbody.find('tr').toArray();

      if (rows.length === 0) return;

      const state = $th.data('sortDirection') || 'default'; // 'default' | 'asc' | 'desc'

      function getCellText(row) {
        const text = $(row).find('td').eq(colIndex).text().trim();
        
        // 빈 값이나 '-'는 null로 처리 (정렬 시 맨 뒤로)
        if (!text || text === '-' || text === '') {
          return null;
        }
        
        // 날짜 형식 체크 (YYYY-MM-DD HH:mm 또는 YYYY-MM-DD 형식)
        const datePattern = /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2})?$/;
        if (datePattern.test(text)) {
          // ISO 형식으로 변환 (시간이 없으면 00:00:00으로 설정)
          const dateStr = text.includes(' ') ? text.replace(' ', 'T') : text + 'T00:00:00';
          const date = new Date(dateStr);
          // 유효한 날짜인지 확인
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // 숫자 체크
        const normalized = text.replace(/,/g, '');
        const num = parseFloat(normalized);
        return isNaN(num) ? text : num;
      }

      if (state === 'default') {
        $table.data('originalSortRows', rows.slice());
        const dir = 'asc';
        rows.sort(function (a, b) {
          const aVal = getCellText(a);
          const bVal = getCellText(b);
          
          // null 값 처리 (맨 뒤로)
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          
          // 날짜 비교
          if (aVal instanceof Date && bVal instanceof Date) {
            return aVal.getTime() - bVal.getTime();
          }
          if (aVal instanceof Date) return 1; // 날짜가 아닌 값보다 뒤로
          if (bVal instanceof Date) return -1;
          
          // 숫자 비교
          const isNum = typeof aVal === 'number' && typeof bVal === 'number';
          if (isNum) return aVal - bVal;
          
          // 텍스트 비교
          const sa = String(aVal);
          const sb = String(bVal);
          return sa > sb ? 1 : sa < sb ? -1 : 0;
        });
        $tbody.empty().append(rows);
        $table.find('thead th').removeClass('up down');
        $th.addClass('up').data('sortDirection', 'asc');
        return;
      }

      if (state === 'asc') {
        const dir = 'desc';
        rows.sort(function (a, b) {
          const aVal = getCellText(a);
          const bVal = getCellText(b);
          
          // null 값 처리 (맨 뒤로)
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          
          // 날짜 비교
          if (aVal instanceof Date && bVal instanceof Date) {
            return bVal.getTime() - aVal.getTime();
          }
          if (aVal instanceof Date) return -1; // 날짜가 아닌 값보다 앞으로
          if (bVal instanceof Date) return 1;
          
          // 숫자 비교
          const isNum = typeof aVal === 'number' && typeof bVal === 'number';
          if (isNum) return bVal - aVal;
          
          // 텍스트 비교
          const sa = String(aVal);
          const sb = String(bVal);
          return sa < sb ? 1 : sa > sb ? -1 : 0;
        });
        $tbody.empty().append(rows);
        $table.find('thead th').removeClass('up down');
        $th.addClass('down').data('sortDirection', 'desc');
        return;
      }

      // state === 'desc' → default: 원래 순서 복원
      const original = $table.data('originalSortRows');
      if (original && original.length) {
        $tbody.empty().append(original);
      }
      $table.find('thead th').removeClass('up down');
      $th.data('sortDirection', 'default');
    });
  })();

  // =========================
  // Admin Table
  // =========================

  App.ui.adminTable = App.ui.adminTable || {};

  // 태그로 시작하지 않아도 중간에 HTML이 있으면 html()로 렌더 (예: '아파트명<p>주소</p>')
  const looksLikeHtml = (value) =>
    typeof value === 'string' && /<[a-z][\s\S]*>/i.test(value);

  const setCellContent = ($el, value) => {
    if (value != null && typeof value === 'object' && value.html != null) {
      $el.html(value.html);
      return;
    }
    const content = value == null ? '' : String(value);
    if (looksLikeHtml(content)) $el.html(content);
    else $el.text(content);
  };

  /**
   * Admin 테이블 렌더링
   * @param {string} selector - 테이블 선택자 (예: '#homeTable')
   * @param {Object} options - 테이블 옵션
   * @param {Array} options.headers - 헤더 배열 [{ text: 'No' }, ...]
   * @param {Array} options.rows - 행 데이터 배열 [['1', '123', ...], ...]
   *   cell: 텍스트 | HTML 문자열 | { html: '...' }
   */
  App.ui.adminTable.render = function (selector, options) {
    const $table = $(selector);
    if ($table.length === 0) {
      console.warn('[ADMIN_TABLE] 테이블을 찾을 수 없습니다:', selector);
      return;
    }

    const { headers = [], rows = [], emptySel } = options || {};

    // thead 렌더링
    const $thead = $table.find('thead');
    $thead.empty();
    
    if (headers.length > 0) {
      const $tr = $('<tr></tr>');
      headers.forEach(header => {
        const content = typeof header === 'string' ? header : (header.text || '');
        const align = header && header.align ? header.align : null;
        const $th = $('<th></th>');
        setCellContent($th, content);
        if (align) {
          $th.attr('data-align', align);
        }
        $tr.append($th);
      });
      $thead.append($tr);
    }

    // tbody 렌더링
    const $tbody = $table.find('tbody');
    $tbody.empty();

    if (rows.length === 0 && emptySel && $(emptySel).length) {
      const colCount = Math.max(headers.length, 1);
      const $empty = $(emptySel).clone().removeClass('hidden').removeAttr('id');
      const $td = $('<td class="tableEmptyCell"></td>').attr('colspan', colCount).append($empty);
      $tbody.append($('<tr class="tableEmptyRow"></tr>').append($td));
    } else {
      rows.forEach(row => {
        const $tr = $('<tr></tr>');
        row.forEach(cell => {
          const $td = $('<td></td>');
          setCellContent($td, cell);
          $tr.append($td);
        });
        $tbody.append($tr);
      });
    }

    // tableEnhance 재적용(렌더 후 정렬 규칙 다시 계산)
    $table.removeData('enhanceBound');
    App.ui.tableEnhance.init($table.closest('.tableDataDom').length ? $table.closest('.tableDataDom') : $table);
  };

  // =========================
  // Paged Table Connector (공통 헬퍼)
  // =========================
  
  /**
   * 테이블과 페이지네이션을 연결하는 공통 헬퍼 함수
   * connect + slice + render를 한 번에 처리
   * 
   * @param {Object} cfg - 설정 객체
   * @param {string} cfg.tableSel - 테이블 선택자 (예: '#homeTable')
   * @param {string} cfg.pagingSel - 페이지네이션 선택자 (예: '#homeTablePagination')
   * @param {Array} cfg.headers - 테이블 헤더 배열 [{ text: 'No' }, ...]
   * @param {Array} cfg.rows - 전체 행 데이터 배열 [['1', '123', ...], ...]
   * @param {number} [cfg.pageSize=10] - 페이지당 행 수
   * @param {number} [cfg.currentPage=1] - 현재 페이지
   * @param {number} [cfg.windowSize=5] - 페이지네이션에 표시할 페이지 번호 개수
   * @param {string|Element|jQuery} [cfg.scrollTarget] - 페이지 변경 시 스크롤할 대상
   */
  App.ui.connectPagedTable = function (cfg) {
    const tableSel = cfg.tableSel;
    const pagingSel = cfg.pagingSel;
    const headers = cfg.headers || [];
    const rowsAll = cfg.rows || [];
    const size = cfg.pageSize || 10;
    const $paging = pagingSel ? $(pagingSel) : $();
    const isEmpty = rowsAll.length === 0;

    if (isEmpty) {
      $paging.addClass('hidden');
    } else {
      $paging.removeClass('hidden');
    }

    const totalPages = Math.max(1, Math.ceil(rowsAll.length / size));

    function getPageRows(page) {
      const start = (page - 1) * size;
      return rowsAll.slice(start, start + size);
    }

    function goToPage(page) {
      App.ui.adminTable.render(tableSel, {
        headers,
        rows: getPageRows(page),
        emptySel: cfg.emptySel
      });
    }

    // 최초 렌더
    goToPage(cfg.currentPage || 1);

    if (!pagingSel) {
      return;
    }

    // pagination 연결
    App.ui.pagination.connect(pagingSel, {
      totalPages,
      currentPage: cfg.currentPage || 1,
      windowSize: cfg.windowSize || 5,
      goToPage,
      scrollTarget: cfg.scrollTarget
    });
  };

  App.ui.connectChartTable = function (chartId, tableSel, headers) {
    const data = window.ZD_CHART_DATA?.[chartId];
    if (!data) {
      return;
    }
    const labels = data.yAxis || data.xAxis || [];
    const series = data.series?.[0] || {};
    const unit = series.valType || "";
    App.ui.connectPagedTable({
      tableSel,
      headers: headers || [{ text: "항목" }, { text: series.name || "값" }],
      rows: labels.map((label, i) => [label, `${series.data?.[i] ?? ""}${unit}`]),
    });
  };

  // =========================
  // Table More (더보기) Connector (공통)
  // =========================
  /**
   * 테이블 + 더보기 버튼 연결 (5행씩 등 누적 노출, 전체 노출 시 버튼 숨김)
   * 다중 테이블에서 각각 다른 설정으로 호출 가능.
   *
   * @param {Object} cfg - 설정 객체
   * @param {string} cfg.tableSel - 테이블 선택자 (예: '#sec01Table')
   * @param {string} [cfg.moreBtnSel] - 더보기 버튼 선택자. 없으면 테이블의 부모 .chartTable 내 .tableMore 사용
   * @param {Array} cfg.headers - 헤더 배열 [{ text: '구분' }, ...]
   * @param {Array} cfg.rows - 전체 행 데이터 [['7월', '1,480 만원'], ...]
   * @param {number} [cfg.pageSize=5] - 더보기 시 추가로 보여줄 행 수
   * @param {string} [cfg.hiddenClass='hidden'] - 전체 노출 시 버튼에 붙일 클래스
   */
  App.ui.connectTableMore = function (cfg) {
    const tableSel = cfg.tableSel;
    const headers = cfg.headers || [];
    const rowsAll = cfg.rows || [];
    const pageSize = cfg.pageSize || 5;
    const hiddenClass = cfg.hiddenClass || 'hidden';

    const $table = $(tableSel);
    if ($table.length === 0) return;

    const $moreBtn = cfg.moreBtnSel
      ? $(cfg.moreBtnSel)
      : $table.closest('.chartTable').find('.tableMore');
    const hasMoreBtn = $moreBtn.length > 0;

    let visibleCount = pageSize;

    function renderTable() {
      const rowsToShow = rowsAll.slice(0, visibleCount);
      App.ui.adminTable.render(tableSel, { headers, rows: rowsToShow });
    }

    function updateMoreButton() {
      if (!hasMoreBtn) return;
      if (visibleCount >= rowsAll.length) {
        $moreBtn.addClass(hiddenClass);
      } else {
        $moreBtn.removeClass(hiddenClass);
      }
    }

    // 더보기 버튼이 없으면 전체 행 표시 (예: .rankTable 안 테이블)
    if (!hasMoreBtn) {
      visibleCount = rowsAll.length;
    }

    renderTable();
    updateMoreButton();

    if (hasMoreBtn) {
      $moreBtn.off('click.tableMore').on('click.tableMore', function () {
        visibleCount = Math.min(visibleCount + pageSize, rowsAll.length);
        renderTable();
        updateMoreButton();
      });
    }
  };

  // =========================
  // Segment (라디오 썸 위치)
  // =========================
  App.ui.segment = App.ui.segment || {};

  App.ui.segment.sync = function ($group) {
    const $item = $group.find('.segmentItem:has(input:checked)');
    const $thumb = $group.find('.segmentThumb');
    if (!$item.length || !$thumb.length) {
      return;
    }
    const item = $item[0];
    $thumb.css({
      left: item.offsetLeft + 'px',
      top: item.offsetTop + 'px',
      width: item.offsetWidth + 'px',
      height: item.offsetHeight + 'px',
    });
  };

  App.ui.segment.refresh = function (scope) {
    const $root = scope ? $(scope) : $(document);
    const $groups = $root.hasClass('segmentGroup') ? $root : $root.find('.segmentGroup');
    $groups.removeClass('is-ready');
    $groups.each(function () {
      App.ui.segment.sync($(this));
    });
    requestAnimationFrame(() => {
      $groups.addClass('is-ready');
    });
  };

  App.ui.segment.init = function (scope) {
    const $scope = scope ? $(scope) : $(document);
    $scope.on('change.segment', '.segmentGroup input[type="radio"]', function () {
      App.ui.segment.sync($(this).closest('.segmentGroup'));
    });
    $(window).on('resize.segment', function () {
      App.ui.segment.refresh();
    });
  };

  // sideMenuNav → /assets/js/components/sideMenuNav.js

  $(function () {
    App.ui.search.init(document);
    App.ui.pagination.init(document);
    App.ui.calendar.init(document);
    App.ui.tableEnhance.init(document);
    App.ui.segment.init(document);
  });
})(window.App = window.App || {}, jQuery);