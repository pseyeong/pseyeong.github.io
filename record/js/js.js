var word = document.getElementById('word');
var word_content = document.getElementById('word_content');
var plus = document.querySelector('.plus');

plus.addEventListener('click',(e)=>{
    //console.log(word.value, word_content.value);
    
    const fr_memo = document.querySelector('.fr_memo');
    const se_memo = document.querySelector('.se_memo');
    const value_first = word.value;
    const value_second = word_content.value;
    //console.log(value);
        
    

    if(value_first === ''){
        alert('단어를 입력하세요.');
        return;
        
    }else if(value_second === ''){
        alert('내용을 입력하세요.');
        return

        
    }
    //단어 입력 체크
    fr_memo.innerHTML = value_first;
    se_memo.innerHTML = value_second;


    const table_tr = document.createElement('tr');
    const table_td = document.createElement('td');

    for(let i=0;i<20;i++){
        console.log(i);
    }
    
    //단어 내용 체크 
    

    //인풋 텍스트 삭제
    word.value = "";
    word_content.value = "";




});

const modify = document.querySelector(".modify");

modify.addEventListener('click',()=>{
    console.log(1);
});


