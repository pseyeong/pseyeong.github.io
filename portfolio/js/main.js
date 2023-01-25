const loding = document.querySelector(".loding");
const bak_btn = document.querySelector(".bak_btn");
const wrap_box = document.querySelector(".wrap");

let i = 0;

setTimeout(()=>{ // 3초 뒤 실행
    loding.classList.add("on");

    //타이핑 ST
    (function(){
        const ct_name = "SE YEONG \n FRONT-END DEVELOPER \n PORTFOLIO";
        const ct_name_typing = document.querySelector(".ct_name");
        
        let i = 0;
    
        function ct_name_typing_txt(){
            if(i < ct_name.length){
                let ct_txt = ct_name.charAt(i);
                ct_name_typing.innerHTML += ct_txt === "\n" ? "<br/>" : ct_txt;
                i++; 
            }
    
        }
        
        setInterval(ct_name_typing_txt, 100);
    }());
    //타이핑 ED

}, 3000);




function bak_change(){

    let bg_col = ["#141414","#ffffff"];
    
    wrap_box.style.backgroundColor = bg_col[i];    

    i++;

    if(i>=bg_col.length){
        i=0;
        //하얀배경
        bak_btn.classList.remove("on");
        wrap_box.classList.remove("on");
        wrap_box.style.color = '#141414';
    }else{
        //검정배경
        bak_btn.classList.add("on"); 
        wrap_box.classList.add("on"); 
        wrap_box.style.color = 'white';
        
    }
    

    
}


//마우스 이동
const mouse_pit = document.querySelector(".mouse_pointer");

document.addEventListener('mousemove',(event)=>{
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    mouse_pit.style.left = mouseX + 'px';
    mouse_pit.style.top = mouseY + 'px';


});

const docStyle = document.documentElement.style;

document.addEventListener('mousemove', (e) => {
  docStyle.setProperty('--mouse-x', e.clientX);
  docStyle.setProperty('--mouse-y', e.clientY);
});