// 초기 값 설정
let canvasSize = 3;
const minSize = 1;
const maxSize = 10;

// DOM 요소 가져오기
const canvasSizeLabel = document.getElementById('canvasSizeLabel');
const decreaseButton = document.getElementById('decreaseButton');
const increaseButton = document.getElementById('increaseButton');

// 버튼 클릭 시 숫자 조절
decreaseButton.addEventListener('click', () => {
    if (canvasSize > minSize) {
        canvasSize--;
        canvasSizeLabel.textContent = canvasSize;
    }
});

increaseButton.addEventListener('click', () => {
    if (canvasSize < maxSize) {
        canvasSize++;
        canvasSizeLabel.textContent = canvasSize;
    }
});