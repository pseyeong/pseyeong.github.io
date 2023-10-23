$(function(){
    $('.guide_btn').click(function(){
        $('.guide_popup').addClass('active');
    });

    $('.guide_close, .popup_bg').click(function(){
        $('.guide_popup').removeClass('active');
    });

    text();
});

const text = () => {
    $('.guide_btn .typography').click(function(){
        $('.common_top p').text('typography');
    });

    $('.guide_btn .color').click(function(){
        $('.common_top p').text('color');
    });

    $('.guide_btn .shadow').click(function(){
        $('.common_top p').text('shadow / blur');
    });

    $('.guide_btn .layout').click(function(){
        $('.common_top p').text('layout');
    });

    $('.guide_btn .popup').click(function(){
        $('.common_top p').text('popup');
    });

    $('.guide_btn .icon').click(function(){
        $('.common_top p').text('icon');
    });

    $('.guide_btn .modal').click(function(){
        $('.common_top p').text('modal');
    });

    $('.guide_btn .button').click(function(){
        $('.common_top p').text('button');
    });

    $('.guide_btn .form').click(function(){
        $('.common_top p').text('form');
    });

    $('.guide_btn .tag').click(function(){
        $('.common_top p').text('tag');
    });

    $('.guide_btn .call_out').click(function(){
        $('.common_top p').text('call out');
    });

    $('.guide_btn .footer').click(function(){
        $('.common_top p').text('footer');
    });

    $('.guide_btn .table').click(function(){
        $('.common_top p').text('table');
    });


}