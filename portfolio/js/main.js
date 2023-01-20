const loding = document.querySelector(".loding");
const bak_btn = document.querySelector(".bak_btn");
const wrap_box = document.querySelector(".wrap");

setTimeout(()=>{
    loding.classList.add("on");
}, 3000);


let i = 0;

function bak_change(){

    let bg_col = ["#141414","#ffffff"];
    
    wrap_box.style.backgroundColor = bg_col[i];

    i++;

    if(i>=bg_col.length){
        i=0;

        bak_btn.classList.add("on");
    }else{
        bak_btn.classList.remove("on");
    }
    

    
}