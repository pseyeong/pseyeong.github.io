import BLOCKS from "./blocks.js";

//DOM
const playground = document.querySelector(".playground > ul");
const gameText = document.querySelector(".game_text");
const scoreDisplay = document.querySelector(".score");
const restartButton = document.querySelector(".game_text button");



//SETTING
const GAME_ROWS = 20;
const GAME_COLS = 10;

let score = 0;
let duration = 500;
let downInterval; // 
let tempMovingItem; //담아두는 용도



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
    generateNewBlock();
    
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

function renderBlocks(moveType=""){
    const {type, direction, top, left} = tempMovingItem;
    const movingBlocks = document.querySelectorAll(".moving");

    movingBlocks.forEach((moving)=>{
        moving.classList.remove(type, "moving");
    });

    BLOCKS[type][direction].some(block =>{
        const x = block[0] + left;
        const y = block[1] + top;        
        
        const target = playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null;  //childNodes / 배열 함수로 쓸수있는 형태로 보내줌
        const isAvailable = checkEmpty(target);

        if(isAvailable){
            target.classList.add(type, "moving");
        }else{
            tempMovingItem = {...movingItem}//원상복구

            if(moveType === 'retry'){
                clearInterval(downInterval);
                showGameoverText()
            }

            setTimeout(()=>{ // 이벤트 루프에 예약된 것들이 다 실행된 후 실행\
                renderBlocks('retry'); // 재귀함수 조심히 쓰기
                if(moveType === "top"){
                    seizeBlock();
                }
                
            },0);
           return true;
        }
    });
    movingItem.left = left;
    movingItem.top = top;
    movingItem.direction = direction; // 

}

function seizeBlock(){
    const movingBlocks = document.querySelectorAll(".moving");

    movingBlocks.forEach((moving)=>{
        moving.classList.remove("moving");
        moving.classList.add("seized");
    });

    checkMatch();
}

function checkMatch(){
    const childNodes = playground.childNodes;
    childNodes.forEach((child)=>{
        let matched = true;

        child.children[0].childNodes.forEach((li)=>{
            if(!li.classList.contains("seized")){
                matched = false;
            }
        })

        if(matched){
            child.remove();
            prependNewLine();
            score++;
            scoreDisplay.innerText = score;
        }
    })

    generateNewBlock();
}

function generateNewBlock(){

        clearInterval(downInterval);
        downInterval = setInterval(()=>{ // 자동으로 내려옴
            moveBlock('top',1);
        }, duration);
    // console.log(Object.entries(BLOCKS).length); //BLOCKS는 오브젝트

    const blockArray = Object.entries(BLOCKS);
    const randomIndex = Math.floor(Math.random()* blockArray.length);//소수점 자름 floor
    // blockArray.forEach((block)=>{
    //     console.log(block[0])
    // });   

    movingItem.type = blockArray[randomIndex][0];
    movingItem.top = 0;
    movingItem.left = 3;
    movingItem.direction = 0;
    tempMovingItem = {...movingItem} // 다시 한 번 더 복사 
    renderBlocks();
}

function checkEmpty(target){
    if(!target || target.classList.contains("seized")){ // seized라는 찾아서 클래스를 가지고있으면
        return false;
    }else{
        return true;
    }
}



function moveBlock(moveType, amount){
    tempMovingItem[moveType] += amount;
    renderBlocks(moveType);
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
    renderBlocks();
}

function dropBlock(){
    clearInterval(downInterval);
    downInterval = setInterval(()=>{
        moveBlock("top",1)
    },10);
}

function showGameoverText(){
    
    gameText.style.display = "flex";
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
        case 32:
            dropBlock();
            break;
        default:
            break;
    }
});



restartButton.addEventListener('click',()=>{
    playground.innerHTML = "";
    gameText.style.display = "none";
    init();
});

/*

44:15

append() : 컨텐츠를 선택된 요소 내부의 끝 부분에서 삽입
prepend() : 컨텐츠를 선택한 요소 내부의 시작 부분에서 삽입
after() : 선택한 요소 뒤에 컨텐츠 삽입
before() : 선택된 요소 앞에 컨텐츠 삽입

*/