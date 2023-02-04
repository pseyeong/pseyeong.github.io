//윈도우 사이즈 확인 + 리사이즈 
window.addEventListener('resize', resizeHandler);

function resizeHandler(e){  
  resize();
}

function resize(){
  const w = window.innerWidth;
  const resize_w = document.querySelector(".wrap");


  if(w >= 1025){
    resize_w.classList.add('pc');
    resize_w.classList.remove('tablet', 'mobile');
  }else if(w >= 768 ){
    resize_w.classList.add('tablet');
    resize_w.classList.remove('pc', 'mobile');
  }else if(w <= 767){
    resize_w.classList.add('mobile');
    resize_w.classList.remove('tablet', 'pc');
  }
}



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


/*sub박스 안에 문자배열*/
const ul_aboutMe = document.querySelector(".ul_aboutMe");

const ul_aboutMe_intxt = ['#책임감','#도전정신','#자기개발','#성취감','#노력형'];
let abm_intxtLength = ul_aboutMe_intxt.length;

let ul_text = "<ul>";

for(let k = 0; k < abm_intxtLength;k++){
    ul_text += "<li>" + ul_aboutMe_intxt[k] + "</li>";
}

ul_text += "</ul>";

ul_aboutMe.innerHTML = ul_text;


/*클릭 이벤트*/

const tabBtn = document.querySelectorAll(".box_open");
const tabContent = document.querySelectorAll(".sub_box");
const close_btn = document.querySelector('.close_btn');
for (let i = 0; i < tabBtn.length; i++) {
  tabBtn[i].addEventListener("click", () => {
    tabBtn.forEach((e) => { //배열을 순회하면서 인자로 전달한 함수를 호출하는 반복문
      e.classList.remove("on");
      tabContent.forEach((e) => {
        e.classList.remove("on");
        
      });
    });

    tabBtn[i].classList.add("on");
    tabContent[i].classList.add("on");
    close_btn.classList.add('on');
    tabBox.classList.remove('on');

  });
  
};

const dot_01 = document.querySelector('.dot.aboutMe');
const about_sub_box = document.querySelector('.aboutMe_box.sub_box');
const dot_02 = document.querySelector('.game.dot');
const game_sub_box = document.querySelector('.game_box.sub_box');

dot_01.addEventListener('click',()=>{
  about_sub_box.classList.add('on');
  close_btn.classList.add('on');
});

dot_02.addEventListener('click',()=>{
  game_sub_box.classList.add('on');
  close_btn.classList.add('on');
});

const tab_about = document.querySelector('.tab_about');
const tab_game = document.querySelector('.tab_game');
const tab = document.querySelector('.tab');

tab_about.addEventListener('click',()=>{
  about_sub_box.classList.add('on');
  close_btn.classList.add('on');
  game_sub_box.classList.remove('on');
  tab.classList.remove('on');

});

tab_game.addEventListener('click',()=>{
  game_sub_box.classList.add('on');
  close_btn.classList.add('on');
  about_sub_box.classList.remove('on');
  tab.classList.remove('on');

});

const tab_Content = document.querySelectorAll(".sub_box");
  close_btn.addEventListener('click',()=>{  

    tab_Content.forEach((ev)=>{
        ev.classList.remove('on');
    });

    close_btn.classList.remove('on');
      
  });

const playBox_list = document.querySelectorAll(".game_playBox_list_in");
const game_playBox = document.querySelectorAll(".game_playBox_inner");

 
  for(let e = 0; e < playBox_list.length; e++){
    playBox_list[e].addEventListener('click',()=>{
      playBox_list.forEach((w)=>{
        w.classList.remove('on');
        
        game_playBox.forEach((w)=>{
          w.classList.remove('on');
        });


      });

      playBox_list[e].classList.add('on');
      game_playBox[e].classList.add('on');

    });
   };
   

const tab_box = document.querySelector(".tab_line");
const tabBox = document.querySelector(".tab");

tab_box.addEventListener('click',()=>{
  
  tabBox.classList.toggle('on');

});

