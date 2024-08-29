import { buildKdTree } from './kdTree.js';
import { rgbToLab } from './colorUtils.js';
import { nearest } from './kdTree.js';
import { drawGrid } from './gridDrawer.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const uploadedImage = document.getElementById('uploadedImage');

    const pixelSize = 32; // 원래 픽셀의 크기 (32x32)
    const scaleFactor = 20; // 확대 배율
    let isZoom = false; // 줌 여부 확인
    let labColors = []; // K-D 트리에서 사용할 색상 데이터
    let kdTree = null; // K-D 트리 저장

    generateButton.addEventListener('click', () => {
        isZoom = false;
        
        // Label에서 Canvas Size 가져오기
        const canvasSize = parseInt(canvasSizeLabel.textContent) || 16;
        
        const selectedColors = [];

        document.querySelectorAll('.color-item input[type="checkbox"]:checked').forEach(checkbox => {
            const colors = JSON.parse(checkbox.dataset.colors);
            selectedColors.push(...colors);
        });

        if (uploadedImage.src && selectedColors.length > 0) {
            labColors = selectedColors.map(colorObj => ({
                lab: rgbToLab(colorObj.color),
                rgb: colorObj.color,
                name: colorObj.name,
                brightness: colorObj.brightness
            }));
            kdTree = buildKdTree(labColors.map(c => c.lab));

            // 이미지 비율 유지한 채 리사이징
            const img = new Image();
            img.src = uploadedImage.src;
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const outputWidth = canvasSize * pixelSize;
                const outputHeight = Math.floor(outputWidth / aspectRatio);

                canvas.width = outputWidth * scaleFactor; // 캔버스 크기를 확대
                canvas.height = outputHeight * scaleFactor;

                const offscreenCanvas = document.createElement('canvas');
                const offscreenCtx = offscreenCanvas.getContext('2d');
                offscreenCanvas.width = outputWidth;
                offscreenCanvas.height = outputHeight;
                offscreenCtx.drawImage(img, 0, 0, outputWidth, outputHeight);

                const imageData = offscreenCtx.getImageData(0, 0, outputWidth, outputHeight);
                const data = imageData.data;

                // 각 픽셀을 LAB로 변환하고 K-D 트리를 사용해 가장 가까운 색 찾기
                for (let y = 0; y < outputHeight; y++) {
                    for (let x = 0; x < outputWidth; x++) {
                        const index = (y * outputWidth + x) * 4;
                        const rgb = [data[index], data[index + 1], data[index + 2]];
                        const lab = rgbToLab(rgb);
                        const nearestColor = findNearestColor(kdTree, lab, labColors);
                        ctx.fillStyle = `rgb(${nearestColor.rgb.join(',')})`;

                        // 확대해서 픽셀을 그리기
                        ctx.fillRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor);
                    }
                }

                // 격자 그리기 (32x32로 나눔)
                drawGrid(ctx, Math.floor(outputWidth / pixelSize) * scaleFactor, pixelSize * scaleFactor);

                uploadedImage.style.display = 'none'; // 원래 이미지를 숨김
                canvas.style.display = 'block'; // 캔버스를 보여줌
            };
        } else {
            alert('Please upload an image and select at least one color.');
        }
    });

    // 픽셀의 색상, 채도 및 좌표 정보를 출력할 요소 추가
    const infoBox = document.createElement('div');
    infoBox.style.position = 'absolute';
    infoBox.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    infoBox.style.border = '1px solid #000';
    infoBox.style.padding = '5px';
    infoBox.style.display = 'none';
    document.body.appendChild(infoBox);

    // 마우스 이동 시의 이벤트 리스너 추가
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; // 실제 캔버스 크기와 표시된 크기 간의 비율
        const scaleY = canvas.height / rect.height; // 실제 캔버스 크기와 표시된 크기 간의 비율

        const x = Math.floor((event.clientX - rect.left) * scaleX / scaleFactor);
        const y = Math.floor((event.clientY - rect.top) * scaleY / scaleFactor);

        const rgb = [
            ctx.getImageData(x * scaleFactor, y * scaleFactor, 1, 1).data[0],
            ctx.getImageData(x * scaleFactor, y * scaleFactor, 1, 1).data[1],
            ctx.getImageData(x * scaleFactor, y * scaleFactor, 1, 1).data[2],
        ];

        const lab = rgbToLab(rgb);
        const nearestColor = findNearestColor(kdTree, lab, labColors);

        infoBox.style.left = `${event.clientX + 10}px`;
        infoBox.style.top = `${event.clientY + 10}px`;
        infoBox.innerHTML = `Color: ${nearestColor.name}<br>Brightness: ${nearestColor.brightness}<br>Coordinates: (${x}, ${y})`;
        infoBox.style.display = 'block';
    });

    // 마우스가 캔버스를 떠날 때 정보 상자를 숨김
    canvas.addEventListener('mouseleave', () => {
        infoBox.style.display = 'none';
    });

    // 캔버스 클릭 이벤트 처리
    canvas.addEventListener('click', (event) => {
        if (!isZoom) {
            isZoom = true;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width; // 실제 캔버스 크기와 표시된 크기 간의 비율
            const scaleY = canvas.height / rect.height; // 실제 캔버스 크기와 표시된 크기 간의 비율
        
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
        
            const gridX = Math.floor(x / (pixelSize * scaleFactor));
            const gridY = Math.floor(y / (pixelSize * scaleFactor));
        
            displaySelectedRegion(ctx, gridX, gridY, pixelSize * scaleFactor);
        }
    });
    
    function displaySelectedRegion(ctx, gridX, gridY, pixelSize) {
        const x = gridX * pixelSize;
        const y = gridY * pixelSize;

        const regionData = ctx.getImageData(x, y, pixelSize, pixelSize);
        
        // 기존 캔버스 내용을 지우고, 캔버스 크기를 확대된 크기로 조정
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
        ctx.canvas.width = pixelSize;
        ctx.canvas.height = pixelSize;

        // 선택된 영역만 다시 그리기
        ctx.putImageData(regionData, 0, 0);

        // 32x32로 나누어 얇은 선을 그립니다.
        drawGrid(ctx, pixelSize, pixelSize / 32, 0.1);
    }

    function findNearestColor(kdTree, targetLab, labColors) {
        const nearestLab = nearest(kdTree, targetLab, 0);
        return labColors.find(color => color.lab.toString() === nearestLab.toString());
    }
});
