//DOM
const playground = document.querySelector(".playground > ul");

console.log(playground);

//SETTING
const GAME_ROWS = 20;
const GAME_COLS = 10;

let score = 0;
let duration = 500;
let downInterval; // null
let tempMovingItem; //담아두는 용도

const BLOCKS = {
    tree:[
        [[2,1],[0,1],[1,0],[1,1]],
        [[1,2],[0,1],[1,0],[1,1]],
        [[1,2],[0,1],[2,1],[1,1]],
        [[2,1],[1,2],[1,0],[1,1]],
    ]
}

const movingItem = {
    type:"tree",
    direction:3,
    top:0,
    left:0,
};


init();


//functions
function init(){ // 화면이 스크립트가 호출이 될때 바로 시작되는거

    tempMovingItem = {...movingItem}; //...movingItem 안에 값만 가져와서 넣음

    for(let i = 0; i < GAME_ROWS; i++){
        prependNewLine();
       
    }
    renderBlocks();
    
}

function prependNewLine(){
    const li = document.createElement("li"); //createElement 동적생성
    const ul = document.createElement("ul");
    for(let j = 0;j < 10;j++){
        const matrix = document.createElement("li");
        ul.prepend(matrix);
    }
    li.prepend(ul);
    playground.prepend(li);
}

function renderBlocks(){
    const {type, direction, top, left} = tempMovingItem;
    const movingBlocks = document.querySelectorAll(".moving");

    movingBlocks.forEach((moving)=>{
        moving.classList.remove(type, "moving");
    });

    BLOCKS[type][direction].forEach(block =>{
        const x = block[0] + left;
        const y = block[1] + top;        

        const target = playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null;  //childNodes / 배열 함수로 쓸수있는 형태로 보내줌
        const isAvailable = checkEmpty(target);

        if(isAvailable){
            target.classList.add(type, "moving");
        }else{
            tempMovingItem = {...movingItem}//원상복구
            setTimeout(()=>{ // 이벤트 루프에 예약된 것들이 다 실행된 후 실행\
                renderBlocks(); // 재귀함수 조심히 쓰기
                if(moveType === "top"){
                    seizeBlock();
                }
                
            },0);
           
        }
    });
    movingItem.left = left;
    movingItem.top = top;
    movingItem.direction = direction; // 

}

function seizeBlock(){
    console.log('test');
}

function checkEmpty(target){
    if(!target){
        return false;
    }else{
        return true;
    }
}



function moveBlock(moveType, amount){
    tempMovingItem[moveType] += amount;
    renderBlocks();
}

//방향키로 모형 변경
function changeDirection(){
    // tempMovingItem.direction += 1;
    // if(tempMovingItem.direction === 4){
    //     tempMovingItem.direction = 0
    // }

    //삼항연산자로 변환
    const direction = tempMovingItem.direction;
    direction === 3 ? tempMovingItem.direction = 0 : tempMovingItem.direction += 1;
    renderBlocks;
}

//방향키를 읽어서 박스를 움직임
document.addEventListener("keydown",(e)=>{
    switch(e.keyCode){
        case 39:
            moveBlock("left", 1);
            break;
        case 37:
            moveBlock("left", -1);
            break;
        case 40:
            moveBlock("top", 1);
            break;
        case 38:
            changeDirection();
            break;
        default:
            break;
    }
})

/*

44:15

append() : 컨텐츠를 선택된 요소 내부의 끝 부분에서 삽입
prepend() : 컨텐츠를 선택한 요소 내부의 시작 부분에서 삽입
after() : 선택한 요소 뒤에 컨텐츠 삽입
before() : 선택된 요소 앞에 컨텐츠 삽입

*/