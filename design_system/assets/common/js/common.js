$(function(){
    list_tab();
});


const list_tab = () => {
    $('.list_tab li').click(function(){
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        console.log('1')
    });
}