//사용변수

const GAME_TIME = 6; // const ->> 변경 불가능
let score = 0;
let time = GAME_TIME;
let isPlaying = false;
let timeInterval;
let checkInterval;
let words = [];

const wordInput = document.querySelector('.word_input');
const wordDisplay = document.querySelector('.display');
const scoreDisplay = document.querySelector('.score');
const timeDisplay = document.querySelector('.time');
const button =  document.querySelector('.btn');

//선언
init();

function init(){ //단어를 불러옴
    btnChange('게임 로딩 중');
    getWords();
    wordInput.addEventListener('input', checkMatch);
    
}

//게임실행
function run(){
    wordInput.value = "";
    if(isPlaying){
        return;
    }
    isPlaying = true;
    time = GAME_TIME;
    wordInput.focus();
    scoreDisplay.innerText = 0;
    timeInterval = setInterval(countDown, 1000);
    checkInterval = setInterval(checkStatus, 50); // 상태체크
    btnChange('게임 중');
    
}

//게임 실행 상태확인
function checkStatus(){
    if(!isPlaying && time === 0){
        btnChange("게임 시작");
        clearInterval(checkInterval);
        button.classList.remove('loading');
        
    }
}

//단어 불러오기
function getWords(){
    //axios api
    axios.get('https://random-word-api.herokuapp.com/word?number=10')
        .then(function (response) {

            response.data.forEach((word)=>{
                if(word.length < 10){
                    words.push(word);
                }
            })
            btnChange('게임 시작');
            button.classList.remove('loading');

            // handle success
            //console.log(response.data);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })

        
    //words = ['hello', 'banana', 'apple', 'cherry']; 
    //btnChange('게임 시작');
}


//단어일치 체크
function checkMatch(){
    if(wordInput.value.toLowerCase() === wordDisplay.innerText.toLowerCase()){
        wordInput.value = ""; // 인풋 초기화
        if(!isPlaying){
            return;
        }

        score++;  //점수 증가
        scoreDisplay.innerText = score; // 텍스트와 같을 때 점수 증가
        time = GAME_TIME;

        const randomIndex = Math.floor(Math.random() * words.length);
        wordDisplay.innerText = words[randomIndex];
        

    }
}



// wordInput.addEventListener('input', ()=>{
//     //console.log(wordInput.value.toLowerCase() === wordDisplay.innerText.toLowerCase()); 
//     // .toLowerCase() ->> 소문자로 변경

//     if(wordInput.value.toLowerCase() === wordDisplay.innerText.toLowerCase()){
//         score++;  //점수 증가
        
//         scoreDisplay.innerText = score; // 텍스트와 같을 때 점수 증가
//         wordInput.value = ""; // 인풋 초기화

//     }
    
    
// });


//btnChange('게임시작');



function countDown(){
 //(조건) ? 참일 경우 : 거짓일 경우 //삼항연산자 

    time > 0 ? time-- : isPlaying = false;
    if(!isPlaying){ //isPlaying ->> false일때
        clearInterval(timeInterval);
    }
    timeDisplay.innerText = time;
}

function btnChange(text){
    button.innerText = text;
    text === '게임시작' ? button.classList.remove('loading') : button.classList.add('loading');
}