const playground = document.querySelector(".playground > ul");

console.log(playground);

for(let i = 0; i < 20; i++){
    const li = document.createElement("li"); //createElement 동적생성
    const ul = document.createElement("ul");
    for(let j = 0;j < 10;j++){
        const matrix = document.createElement("li");
        ul.prepend(matrix);
    }
    li.prepend(ul);
    playground.prepend(li);
   
}

//9:21


/*

append() : 컨텐츠를 선택된 요소 내부의 끝 부분에서 삽입
prepend() : 컨텐츠를 선택한 요소 내부의 시작 부분에서 삽입
after() : 선택한 요소 뒤에 컨텐츠 삽입
before() : 선택된 요소 앞에 컨텐츠 삽입

*/