/**
 * ============================================
 *  자주 쓰는 공통 함수
 * ============================================
 * 
 * @author NICE ZiniData 개발팀
 * @since 1.0
 * @refactored 2025.10
 */

const MEGA_NM_SHORT_MAP = [
  ["전남광주통합특별시", "전남"],
  ["전북특별자치도", "전북"],
  ["세종특별자치시", "세종"],
  ["강원특별자치도", "강원"],
  ["제주특별자치도", "제주"],
  ["서울특별시", "서울"],
  ["부산광역시", "부산"],
  ["대구광역시", "대구"],
  ["인천광역시", "인천"],
  ["대전광역시", "대전"],
  ["울산광역시", "울산"],
  ["충청북도", "충북"],
  ["충청남도", "충남"],
  ["전라북도", "전북"],
  ["전라남도", "전남"],
  ["경상북도", "경북"],
  ["경상남도", "경남"],
  ["세종시", "세종"],
  ["경기도", "경기"],
  ["강원도", "강원"],
];

/** 광역시/도 공식명을 짧은 표기로 바꿉니다. (예: 서울특별시 마포구 → 서울 마포구) */
const simplifyMegaNm = (value) => {
  if (value == null || value === "") {
    return value;
  }
  let text = String(value);
  MEGA_NM_SHORT_MAP.forEach(([from, to]) => {
    if (text.indexOf(from) >= 0) {
      text = text.split(from).join(to);
    }
  });
  return text;
};
window.simplifyMegaNm = simplifyMegaNm;

$(document).ready(function() {
    
    /**
     * 공통 자바스크립트 함수
     */
    commonUtil = {};
    commonUtil.simplifyMegaNm = simplifyMegaNm;

    commonUtil.isEmpty = function(value){
        if(typeof value === 'function'){
            return false;
        }
        return (value == null || value.length === 0);
    }

    commonUtil.getMaxDay = function(year, month){
        var date = new Date(year, month, 0);

        if(this.isEmpty(date)) return 0;

        return date.getDate();
    }

    // 3자리 수 마다 "," 넣기
    commonUtil.addComma = function(value, dot, zero) {
        // 값이 비어있거나 유효하지 않은 경우 처리
        if (commonUtil.isEmpty(value) || value === "null" || value === "NaN" || isNaN(value) || value === Infinity || value === -Infinity) {
            return zero || 0; // zero 값이 있으면 대신 표시, 없으면 0 반환
        }

        // 소수점 자리수 설정
        if (!commonUtil.isEmpty(dot)) {
            value = parseFloat(value).toFixed(dot); // 소수점 자리수 고정
        } else {
            value = Math.round(value); // 정수로 반올림
        }

        // 최종 결과가 0일 경우 zero로 대체
        if (parseFloat(value) === 0) {
            return zero || value; // zero 값이 있으면 반환, 없으면 0 반환
        }

        // 3자리마다 콤마 추가
        var regExp = /\B(?=(\d{3})+(?!\d))/g;
        return value.toString().replace(regExp, ",");
    };

    // "," 지우기 / ex) 데이터:11,232,111 같은 형식이면 문자로 인식될때 사용
    commonUtil.removeComma = function(value){
        if(commonUtil.isEmpty(value)){
            return 0;
        }
        var regExp = /,/gi;
        return value.toString().replace(regExp, "");
    }


    commonUtil.convertSort = function(value){
        return this.isEmpty(value) ? null : (value === 'asc') ? 0 : 1;
    }

    commonUtil.getValue = function(value){
        return typeof(value) == 'function' ? value() : value;
    }

    // replace all 과 같은 기능
    commonUtil.replace = function(value, from, to){
        var string = this.getValue(value);
        var from = this.getValue(from);
        var to = this.getValue(to);

        return string.replace(new RegExp(from, 'gi'), to);
    }

    commonUtil.formatDate = function(date, stringFormat){
        var format = this.getValue(stringFormat);
        format = (format.length) ? format : 'YYYY.MM.DD';
        return moment(this.getValue(date)).format(format);
    }

    // HTML DB에 저장하면 아래와 같이 저장될때 다시 변환할때 사용
    // 핸들바스 영역에서 사용하면 {{{ }}} 이렇게 괄호 3개 줘야 HTML 테그로 인식됨
    commonUtil.replaceHtml = function(text){
        if(!commonUtil.isEmpty(text)){
            var tmp = text;
            tmp = tmp.replaceAll(/\\n/gi, '');
            tmp = tmp.replace(/&amp;/gi, "&");
            tmp = tmp.replace(/&lt;/gi, "<");
            tmp = tmp.replace(/&gt;/gi, ">");
            tmp = tmp.replace(/&quot;/gi, '"');
            tmp = tmp.replace(/&#39;/gi, "'");
            tmp = tmp.replace(/&#40;/gi, "(')");
            tmp = tmp.replace(/&#41;/gi, ")");
            return tmp;
        }
    }

    // oracle lpad 랑 똑같은 기능
    commonUtil.lpad = function(s, padLength, padString){
        s = String(s);
        while(s.length < padLength)
            s = padString + s;
        return s;
    }

    // oracle rpad 랑 똑같은 기능
    commonUtil.rpad = function(s, padLength, padString){
        s = String(s);
        while(s.length < padLength)
            s = s + padString;
        return s;
    }


    // 0 기준으로 값이 0보다 크면 up, 0보다 작으면 down
    commonUtil.checkUpDown = function(value){
        if(Number(value) > 0){
            return "up";
        }else if(Number(value) < 0){
            return "down";
        }else{
            return "font_w600";
        }
    }

    // 0 기준으로 값이 0보다 크면 upText, 0보다 작으면 downText
    commonUtil.checkUpDownText = function(value, type){
        if(type === 'string'){
            if(value == '높고' || value == '높은'){
                return "upText";
            }else if(value == '낮고' || value == '낮은'){
                return "downText";
            }else{
                return "font_w600";
            }
        }

        if(Number(value) > 0){
            return "upText";
        }else if(Number(value) < 0){
            return "downText";
        }else{
            return "font_w600";
        }
    }

    // 오늘 날짜 출력
    commonUtil.toDay = function (gubun){
        var today = new Date();

        var year = today.getFullYear();
        var month = ('0' + (today.getMonth() + 1)).slice(-2);
        var day = ('0' + today.getDate()).slice(-2);
        var dateString = year + '-' + month  + '-' + day;
        if(!commonUtil.isEmpty(gubun)){
            dateString = year + gubun + month  + gubun + day;
        }

        return dateString;
    }

    // 현재 시간 출력
    commonUtil.toTime = function (){
        var today = new Date();

        var hours = ('0' + today.getHours()).slice(-2);
        var minutes = ('0' + today.getMinutes()).slice(-2);
        var seconds = ('0' + today.getSeconds()).slice(-2);

        var timeString = hours + ':' + minutes  + ':' + seconds;

        return timeString;
    }

    // 오늘 날짜 + 현재 시간 출력
    commonUtil.toDateTime = function (){
        var today = new Date();

        var year = today.getFullYear();
        var month = ('0' + (today.getMonth() + 1)).slice(-2);
        var day = ('0' + today.getDate()).slice(-2);
        var hours = ('0' + today.getHours()).slice(-2);
        var minutes = ('0' + today.getMinutes()).slice(-2);
        var seconds = ('0' + today.getSeconds()).slice(-2);

        var dateString = year + '-' + month  + '-' + day;
        var timeString = hours + ':' + minutes  + ':' + seconds;


        return dateString + " " + timeString;
    }

    // 증감률
    commonUtil.growthRate = function(before, after, dot) {
        if (before === 0 || after === 0) {
            return 0; // 나눗셈에서 0으로 나누는 경우 방지
        }
        let result = ((after - before) / before) * 100;
        if (!commonUtil.isEmpty(dot)) {
            const factor = Math.pow(10, dot); // 소수점 자리수 반올림 계산
            result = Math.round(result * factor) / factor;
        } else {
            result = Math.round(result * 10) / 10; // 기본적으로 소수점 1자리로 반올림
        }
        if (isNaN(result)) {
            result = 0;
        }
        return result;
    };

    // 6645 좌표 4326 으로 변경
    commonUtil.proj4 = function(val, gubun) {
        Proj4js.defs["EPSG:6645"] = '+proj=tmerc +lat_0=38.0 +lon_0=128.0 +x_0=400000.0 +y_0=600000.0 +k=0.9999 +ellps=bessel +a=6377397.155 +b=6356078.9628181886 +units=m +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43';
        Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
        var _6645 = new Proj4js.Proj("EPSG:6645");
        var _4326 = new Proj4js.Proj("EPSG:4326");
        var pt = new Proj4js.Point(val.x, val.y);	//포인트 생성
        var result = (gubun == 6645) ? Proj4js.transform(_4326,_6645,pt) : Proj4js.transform(_6645, _4326, pt);
        return result;
    }

    // 비밀번호 패턴 체크 (8자 이상, 문자, 숫자, 특수문자 포함여부 체크)
    commonUtil.checkPasswordPattern = function(str) {
        var pattern1 = /[0-9]/;				// 숫자
        var pattern2 = /[a-zA-Z]/;			// 문자
        var pattern3 = /[~!@#$%^&*()]/;	// 특수문자

        if(!pattern1.test(str) || !pattern2.test(str) || !pattern3.test(str) || str.length < 8) {
            alert("비밀번호는 8자리 이상 문자, 숫자, 특수문자로 구성하여야 합니다.");
            return false;
        } else {
            return true;
        }
    }

    // 가져온 날짜 형식 바꿔 보내기
    // 필요한 유형있으면 추가해주세요.
    commonUtil.getDateString = function(val, gubun) {
        var date;
        
        // 입력값 타입 구분 및 Date 객체 변환
        if (val instanceof Date) {
            // Date 객체인 경우
            date = val;
        } else if (typeof val === 'string' && val.length >= 8) {
            // 문자열인 경우 (YYYYMMDDHH24MISS 또는 YYYYMMDDHH24MI 형식)
            var dateStr = val.toString().replace(/[^0-9]/g, ''); // 숫자만 추출
            if (dateStr.length >= 8) {
                var year = parseInt(dateStr.substring(0, 4), 10);
                var month = parseInt(dateStr.substring(4, 6), 10) - 1; // JavaScript month는 0부터 시작
                var day = parseInt(dateStr.substring(6, 8), 10);
                var hour = dateStr.length >= 10 ? parseInt(dateStr.substring(8, 10), 10) : 0;
                var minute = dateStr.length >= 12 ? parseInt(dateStr.substring(10, 12), 10) : 0;
                var second = dateStr.length >= 14 ? parseInt(dateStr.substring(12, 14), 10) : 0;
                date = new Date(year, month, day, hour, minute, second);
            } else {
                console.warn('getDateString: 잘못된 날짜 문자열 형식입니다. (최소 8자리 필요)');
                return '';
            }
        } else if (typeof val === 'number') {
            // 숫자 타임스탬프인 경우
            date = new Date(val);
        } else {
            console.warn('getDateString: 지원하지 않는 날짜 형식입니다.');
            return '';
        }
        
        // Date 객체 유효성 검사
        if (isNaN(date.getTime())) {
            console.warn('getDateString: 유효하지 않은 날짜입니다.');
            return '';
        }
        
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        var hh = ("0" + date.getHours()).slice(-2); // 시
        var mm = ("0" + date.getMinutes()).slice(-2); // 분
        var ss = ("0" + date.getSeconds()).slice(-2); // 초
        var dateString = "";

        if(gubun == "YYYY-MM-DD"){
            dateString = year + '-' + month  + '-' + day;
        }else if(gubun == "YYYY-MM-DD HH24:MI:SS"){
            dateString = year + '-' + month  + '-' + day + " " + hh + ":" + mm + ":" + ss;
        }else if(gubun == "YYYY-MM-DD HH24:MI"){
            dateString = year + '-' + month  + '-' + day + " " + hh + ":" + mm;
        }
        return dateString;
    }


    // 표준편차 구하는 함수
    commonUtil.standardDeviation = function(array) {
        var sum = 0;
        var n = array.length;
        for (var i = 0; i < n; i++) {
            sum += array[i];
        }
        var mean = sum / n;
        var variance = 0;
        for (var i = 0; i < n; i++) {
            variance += (array[i] - mean) ** 2;
        }
        var standardDeviation = Math.sqrt(variance / n);
        return standardDeviation;
    }

    // 반올림 함수
    commonUtil.round = function(number, decimals) {
        if(commonUtil.isEmpty(decimals)){
            decimals = 0;
        }
        var multiplier = Math.pow(10, decimals);
        return Math.round(number * multiplier) / multiplier;
    }

    // 목록 가장 큰수 구하기
    commonUtil.listMax = function(list){
        var max = Math.max.apply(null, list.filter(function(item) {
            return typeof item === 'number';
        }));

        return max;
    }

    // 목록 평균 구하기
    commonUtil.arrAvg = function(arr, dot){
        if (arr.length === 0) {
            return 0;
        }
        var sum = arr.reduce(function (total, current) {
            return total + current;
        }, 0);
        var average = sum / arr.length;

        if (!commonUtil.isEmpty(dot)) {
            return commonUtil.round(average, dot);
        }else{
            return average;
        }
    }

    // 0보다 큰것만 평균하기
    commonUtil.arrAvg2 = function(arr, dot){
        // 0보다 큰 값만 필터링
        var filteredArr = arr.filter(function(val) {
            return val > 0;
        });

        if (filteredArr.length === 0) {
            return 0;
        }

        var sum = filteredArr.reduce(function (total, current) {
            return total + current;
        }, 0);

        var average = sum / filteredArr.length;

        if (!commonUtil.isEmpty(dot)) {
            return commonUtil.round(average, dot);
        } else {
            return average;
        }
    };


    // 목록 총합 구하기
    commonUtil.arrSum = function(arr){
        let total = 0;
        if(!commonUtil.isEmpty(arr)){
            arr.forEach(function(item) {
                total += commonUtil.isEmpty(item) ? 0 : item;
            });
        }
        return total;
    }

    // 사업자 번호 패턴 xxx-xx-xxxxx
    commonUtil.bizNo = function(value){
        if(commonUtil.isEmpty(value)) {
            return '-';
        }
        var regExp = /(\d{3})(\d{2})(\d{5})/
        return value.toString().replace(regExp, '$1-$2-$3');
    }

    /**
     * 휴대폰 번호 포맷팅 함수
     * 입력 형식: 01012345678, 010-1234-5678, 010 1234 5678
     * 출력 형식: 010-1234-5678
     * 
     * @param {string} value - 휴대폰 번호 (숫자만 또는 하이픈/공백 포함)
     * @param {string} defaultValue - 값이 비어있을 때 반환할 기본값 (기본: '-')
     * @returns {string} 포맷팅된 휴대폰 번호 (예: 010-1234-5678)
     * 
     * @example
     * commonUtil.formatPhoneNumber('01012345678')      // '010-1234-5678'
     * commonUtil.formatPhoneNumber('010-1234-5678')   // '010-1234-5678'
     * commonUtil.formatPhoneNumber('010 1234 5678')    // '010-1234-5678'
     * commonUtil.formatPhoneNumber('')                 // '-'
     * commonUtil.formatPhoneNumber(null, '')          // ''
     */
    commonUtil.phoneNumber = function(value, defaultValue) {
        // 값이 비어있거나 null인 경우
        if (commonUtil.isEmpty(value)) {
            return defaultValue !== undefined ? defaultValue : '-';
        }

        // 숫자만 추출 (하이픈, 공백, 기타 문자 제거)
        var numbers = value.toString().replace(/[^0-9]/g, '');

        // 숫자가 10자리 또는 11자리가 아니면 원본 반환 (또는 기본값)
        if (numbers.length !== 10 && numbers.length !== 11) {
            return defaultValue !== undefined ? defaultValue : value;
        }

        // 10자리 (구 형식: 010-1234-5678) 또는 11자리 (신 형식: 010-1234-5678)
        if (numbers.length === 10) {
            // 10자리: 010-1234-5678 형식
            return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else {
            // 11자리: 010-1234-5678 형식
            return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
    }

    // console.log(commonUtil.changeYyyymm('202412', -1));  // 출력: '202411'
    // console.log(commonUtil.changeYyyymm('202412', 1));   // 출력: '202501'
    // console.log(commonUtil.changeYyyymm('202412', -12)); // 출력: '202312'
    // console.log(commonUtil.changeYyyymm('202412', 12));  // 출력: '202512'
    commonUtil.changeYyyymm = function (yyyymm, mm){
        let year = parseInt(yyyymm.substring(0, 4), 10);
        let month = parseInt(yyyymm.substring(4, 6), 10);
        month += mm;
        while (month > 12) {
        year += 1;
        month -= 12;
        }
        while (month <= 0) {
        year -= 1;
        month += 12;
        }
        return year.toString() + (month < 10 ? '0' : '') + month.toString();
    }

    // 추세선 차트 (1차 다항 추세선)
    // 표로 보면 직선임, 처음값 마지막값 비교해서 마지막값이 크면 상승, 적으면 하락
    commonUtil.trendData = function (data) {
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i + 1);

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumX2 = x.reduce((a, b) => a + b ** 2, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = data.reduce((sum, y, i) => sum + y * x[i], 0);

        // 행렬 연산을 줄여 1차 다항식의 계수를 바로 계산
        const denominator = n * sumX2 - sumX ** 2;
        if (denominator === 0) {
            return [];
        }

        const a = (sumY * sumX2 - sumX * sumXY) / denominator; // 절편
        const b = (n * sumXY - sumX * sumY) / denominator;    // 기울기

        // 1차 방정식에 따라 추세 데이터를 생성
        return x.map(value => a + b * value);
    };

    // 추세선 차트 (1차 다항 추세선)
    // 표로 보면 직선임, 처음값 마지막값 비교해서 마지막값이 크면 상승, 적으면 하락
    commonUtil.calculateTrend = function (dataList) {
        let trendData = commonUtil.trendData(dataList);
        if (trendData.length > 2) { // 데이터가 2개 이상인 경우만 분석 가능
            let firstValue = trendData[0]; // 첫 번째 값
            let lastValue = trendData[trendData.length - 1]; // 마지막 값

            if (lastValue > firstValue) {
                return "상승";
            } else if (lastValue < firstValue) {
                return "하락";
            } else {
                return "동일";
            }
        }
        return "비교 데이터 부족"; // 데이터가 2개 이하일 경우
    };

    /*월 일수 계산
        yyyymm : 기준년월(ex.202406)
        stdMonth : 이전 월 기준(ex.3개월 전까지 계산 -> 3)
    * */
    commonUtil.getDaysCnt = (yyyymm,stdMonth) =>{

        const getDaysInMonth = (year, month) => {
            return new Date(year, month + 1, 0).getDate();
        }

        let resultCnt = 0;

        // 현재 날짜 기준
        const year = parseInt(yyyymm.substring(0, 4), 10);
        const month = parseInt(yyyymm.substring(4, 6), 10) - 1; // JavaScript에서 1월 = 0, 2월 = 1, ..., 12월 = 11

        const recentMonths = [];
        for (let i = 0; i < stdMonth; i++) {
            const targetMonth = month - i;
            const targetYear = targetMonth < 0 ? year - 1 : year;
            const adjustedMonth = (targetMonth + 12) % 12;

            recentMonths.push({
                year: targetYear,
                month: adjustedMonth + 1, // 실제 월 (1부터 시작)
                days: getDaysInMonth(targetYear, adjustedMonth)
            });
        }

        recentMonths.forEach(({ year, month, days }) => {
            resultCnt = resultCnt + days
        });

        return resultCnt;
    }

    commonUtil.randomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 날짜 형식 변환 함수
     * 입력 날짜 문자열을 지정된 형식으로 변환합니다.
     * 
     * @param {string} dateString - 변환할 날짜 문자열 (예: '20250101', '2025-01-01', '2025/01/01')
     * @param {string} format - 출력 형식 (예: 'YYYY-MM-DD', 'YYYY.MM.DD', 'YYYYMMDD')
     * @returns {string} 변환된 날짜 문자열
     * 
     * @example
     * commonUtil.dateConvert('20250101', 'YYYY-MM-DD')      // '2025-01-01'
     * commonUtil.dateConvert('2025-01-01', 'YYYY.MM.DD')   // '2025.01.01'
     * commonUtil.dateConvert('20250101', 'YYYYMMDD')       // '20250101'
     * commonUtil.dateConvert('20250101', 'YYYY/MM/DD')      // '2025/01/01'
     */
    commonUtil.dateConvert = function(dateString, format) {
        if (commonUtil.isEmpty(dateString)) {
            return '';
        }

        // 입력 날짜 문자열에서 숫자만 추출 (YYYYMMDD 형식으로 변환)
        var numbers = dateString.toString().replace(/[^0-9]/g, '');
        
        // 8자리가 아니면 원본 반환
        if (numbers.length !== 8) {
            return dateString;
        }

        // 년, 월, 일 추출
        var year = numbers.substring(0, 4);
        var month = numbers.substring(4, 6);
        var day = numbers.substring(6, 8);

        // format이 없으면 기본값 'YYYY-MM-DD' 사용
        if (commonUtil.isEmpty(format)) {
            format = 'YYYY-MM-DD';
        }

        // 형식에 맞게 변환
        var result = format
            .replace(/YYYY/g, year)
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/YY/g, year.substring(2, 4))
            .replace(/M/g, parseInt(month, 10).toString())
            .replace(/D/g, parseInt(day, 10).toString());

        return result;
    }


    /**
     * 시작 날짜와 종료 날짜 사이의 모든 월을 생성하는 함수
     * @param {string} startDate - 시작 날짜 (YYYYMM 형식)
     * @param {string} endDate - 종료 날짜 (YYYYMM 형식)
     * @returns {string} - 콤마로 구분된 날짜 문자열 (예: "202503,202504,202505")
     */
    commonUtil.generateDateRange = (startDate, endDate) => {
        const dateList = [];

        // 입력값 검증
        if (!startDate || !endDate) {
            console.error('시작 날짜 또는 종료 날짜가 없습니다.');
            return '';
        }

        // 문자열을 날짜로 변환
        const startYear = parseInt(startDate.substring(0, 4));
        const startMonth = parseInt(startDate.substring(4, 6));
        const endYear = parseInt(endDate.substring(0, 4));
        const endMonth = parseInt(endDate.substring(4, 6));

        // 유효성 검사
        if (startYear < 1900 || endYear > 9999 || startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
            console.error('잘못된 날짜 형식입니다.');
            return '';
        }

        // 시작 날짜가 종료 날짜보다 늦으면 에러
        if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
            console.error('시작 날짜가 종료 날짜보다 늦습니다.');
            return '';
        }

        let currentYear = startYear;
        let currentMonth = startMonth;

        // 시작 월부터 종료 월까지 반복하여 배열에 추가
        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const monthStr = String(currentMonth).padStart(2, '0');
            dateList.push(`${currentYear}${monthStr}`);

            // 다음 월로 이동
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }

            // 무한 루프 방지 (최대 5년 범위)
            if (currentYear - startYear > 5) {
                console.warn('날짜 범위가 너무 큽니다. 5년으로 제한됩니다.');
                break;
            }
        }

        return dateList.join(',');
    }

    /**
     * 영역 기반 분석 영역 생성 함수
     * @param {Array} coordinatesArray - 영역 좌표 배열
     * @returns {string} - 영역 기반 분석 영역 문자열
     */
    commonUtil.analysisAreaGeom = (coordinatesArray) => {
        if (!coordinatesArray || coordinatesArray.length < 3) {
            return "";
        }
        // areaCoordinates는 {lat, lng} 형태이므로 lng lat 순서로 변환
        // PostGIS POLYGON 형식: POLYGON((lng lat, lng lat, ...))
        const polygonPoints = coordinatesArray.map(coord => `${coord.lng} ${coord.lat}`);
        // 첫 번째 점을 마지막에 추가하여 폐곡선 만들기
        polygonPoints.push(`${coordinatesArray[0].lng} ${coordinatesArray[0].lat}`);
        const polygonString = `POLYGON((${polygonPoints.join(", ")}))`;
        return polygonString;
    }

    /**
     * yyyymm 문자열을 yy.mm 형식으로 변환
     * @param {string} yyyymm - 변환할 년월(예: "202406")
     * @returns {string} yy.mm 형식(예: "24.06")
     */
    commonUtil.yyyymmToYymmDot = (yyyymm) => {
        if (!yyyymm || yyyymm.length !== 6) {
            return '';
        }
        const yy = yyyymm.substring(2, 4);
        const mm = yyyymm.substring(4, 6);
        return `${yy}.${mm}`;
    }
});

