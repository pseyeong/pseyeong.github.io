var word = document.getElementById('word');
var word_content = document.getElementById('word_content');
var plus = document.querySelector('.plus');

plus.addEventListener('click',(e)=>{
    //console.log(word.value, word_content.value);
    
    const fr_memo = document.querySelector('.fr_memo');
    const se_memo = document.querySelector('.se_memo');
    const value_first = word.value;
    const value_second = word_content.value;
    const in_ul = document.getElementById("in_ul");
    //console.log(value);
        
    

    if(value_first === ''){
        alert('단어를 입력하세요.');
        return;
        
    }else if(value_second === ''){
        alert('내용을 입력하세요.');
        
        return;
    }else{
         //단어 입력 체크
        fr_memo.innerHTML = value_first;
        se_memo.innerHTML = value_second;

        const in_li = document.querySelector('.plus_memo');
        const in_li_txt = `
        <li class="plus_memo">
                        <p class="fr_memo"></p>
                        <p class="se_memo"></p>
                        <div class="btn_box">
                            <button class="modify">수정</button>
                            <button class="del">삭제</button>
                        </div>
                    </li>
        `;
        in_li.insertAdjacentHTML('beforebegin', in_li_txt);
        //appendChild(in_li).classList.add('plus_memo');
        
        
        

        for(let i = 0;i < in_ul;i++){
            console.log(i);

        }
        
    };
   

    //인풋 텍스트 삭제
    word.value = "";
    word_content.value = "";




});

const modify = document.querySelector(".modify");

modify.addEventListener('click',()=>{
    console.log(1);
});


