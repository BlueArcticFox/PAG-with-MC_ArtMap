document.addEventListener('DOMContentLoaded', () => {
    const uploadImageInput = document.getElementById('uploadImage');
    const uploadedImage = document.getElementById('uploadedImage');
    const resultImage = document.getElementById('resultImage');

    uploadImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                uploadedImage.src = e.target.result;
                uploadedImage.style.display = 'block'; // 새 이미지가 보이도록 설정
                pixelCanvas.style.display = 'none';   // 이전 결과 이미지를 숨김
            };

            reader.readAsDataURL(file); // 파일 내용을 읽어서 데이터 URL로 변환
        }
    });
});
