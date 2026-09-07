$(function(){
    sideToggle();
    sideMenuNavigate();
});

/**
 * 사이드 토글 메뉴에서 data-href 클릭 시 해당 주소로 이동
 * side.html에 data-href="/경로" 넣으면 메뉴 추가 가능
 */
const sideMenuNavigate = () => {
    $('.c-sideToggleMenuList .c-sideToggleMenuItem[data-href]').on('click', function () {
        const href = $(this).data('href');
        if (href) {
            window.location.href = href;
        }
    });
};

const sideToggle = () => {
    $('.c-sideSubMenu > .c-sideToggleMenuItem').on('click', function() {
        $(this).parent().siblings().removeClass('active');
        $(this).parent().siblings().children('.c-sideToggleSubMenuList').slideUp();
        $(this).parent().toggleClass('active');

        if($(this).parent().hasClass('active')){
            $(this).siblings('.c-sideToggleSubMenuList').slideDown();
        } else {
            $(this).siblings('.c-sideToggleSubMenuList').slideUp();
        }
    });

    $('.c-sideToggleBtn').on('click', function() {
        $('.c-sideToggle').toggleClass('hide');
        $('.c-sideSubMenu').removeClass('active');
        $('.c-sideToggleSubMenuList').slideUp();

        if($('.c-sideToggle').hasClass('hide')){
            $('.c-sideToggleBtn').addClass('hide');
            $('.sideToggleContent').addClass('hide');
        }else{
            $('.c-sideToggleBtn').removeClass('hide');
            $('.sideToggleContent').removeClass('hide');
        }
    });

}