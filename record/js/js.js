var word = document.getElementById('word');
var word_content = document.getElementById('word_content');
var plus = document.querySelector('.plus');

plus.addEventListener('click',(e)=>{
    //console.log(word.value, word_content.value);
    
    let fr_memo = document.querySelector('.fr_memo');
    let se_memo = document.querySelector('.se_memo');
    let value = word.value;
    let value_le = word_content.value;
    //console.log(value);
    fr_memo.innerHTML = value;
    se_memo.innerHTML = value_le;

    word.value = "";
    word_content.value = "";
});

const modify = document.querySelector(".modify");


