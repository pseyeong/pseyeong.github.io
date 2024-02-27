//click, scroll



$('.mapReportSide li').off('click');
    $('.mapReportSide_tab li').click(function(){
        $('.mapReportSide_tab li').removeClass('active');
        $(this).addClass('active');

        var idx = $('.mapReportSide_tab li').index(this);
        var target = $('.mapReportCheckSection').eq(idx);

        $('.mapReportInner').animate({
            scrollTop: $('.mapReportInner').scrollTop() + target.offset().top - 180
        }, 400);

    });

    $('.mapReportInner').scroll(function(){
        var h = $(document).scrollTop();

        var section01 = $('#report_area').position().top - 90;
        var section02 = $('#report_sales').position().top - 90;
        var section03 = $('#report_competition').position().top - 90;
        var section04 = $('#report_customer').position().top - 90;
        var section05 = $('#report_flow').position().top - 90;

        if(h > section01 && h < section02){
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(0).addClass('active');
        }else if(h > section02 && h < section03){
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(1).addClass('active');

        }else if(h > section03 && h < section04){
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(2).addClass('active');

        }else if(h > section04 && h < section05){
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(3).addClass('active');

        }else if(h > section05){
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(4).addClass('active');

        }else{
            $('.mapReportSide_tab li').siblings().removeClass('active');
            $('.mapReportSide_tab li').eq(0).addClass('active');
        }
    });
