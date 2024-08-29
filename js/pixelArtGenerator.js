import { buildKdTree } from './kdTree.js';
import { rgbToLab } from './colorUtils.js';
import { nearest } from './kdTree.js';
import { drawGrid } from './gridDrawer.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const uploadedImage = document.getElementById('uploadedImage');
    const backButton = document.getElementById('backButton');

    const pixelSize = 32;
    const scaleFactor = 20;
    let isZoom = false;
    let labColors = [];
    let kdTree = null;
    let pixelDataArray = [];
    let highlightedPixels = [];
    let zoomedRegionIndex = null;
    let canvasSize = null;

    generateButton.addEventListener('click', () => {
        // google Analytics 
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Generate Pixel Art',
        });
        isZoom = false;
    
        canvasSize = parseInt(canvasSizeLabel.textContent) || 16;
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
    
            const img = new Image();
            img.src = uploadedImage.src;
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const outputWidth = canvasSize * pixelSize;
                const outputHeight = Math.floor(outputWidth / aspectRatio);
    
                canvas.width = outputWidth * scaleFactor;
                canvas.height = outputHeight * scaleFactor;
    
                const offscreenCanvas = document.createElement('canvas');
                const offscreenCtx = offscreenCanvas.getContext('2d');
                offscreenCanvas.width = outputWidth;
                offscreenCanvas.height = outputHeight;
                offscreenCtx.drawImage(img, 0, 0, outputWidth, outputHeight);
    
                const imageData = offscreenCtx.getImageData(0, 0, outputWidth, outputHeight);
                const data = imageData.data;
    
                pixelDataArray = [];
    
                for (let y = 0; y < outputHeight; y++) {
                    const row = [];
                    for (let x = 0; x < outputWidth; x++) {
                        const index = (y * outputWidth + x) * 4;
                        const rgb = [data[index], data[index + 1], data[index + 2]];
                        const lab = rgbToLab(rgb);
                        const nearestColor = findNearestColor(kdTree, lab, labColors);
    
                        row.push({
                            rgb: nearestColor.rgb,
                            name: nearestColor.name,
                            brightness: nearestColor.brightness,
                            x, y
                        });
                    }
                    pixelDataArray.push(row);
                }
    
                drawPixelArt();
    
                uploadedImage.style.display = 'none';
                canvas.style.display = 'block';
            };
        } else {
            alert('Please upload an image and select at least one color.');
        }
    });    

    const infoBox = document.createElement('div');
    infoBox.style.position = 'absolute';
    infoBox.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    infoBox.style.border = '1px solid #000';
    infoBox.style.padding = '5px';
    infoBox.style.display = 'none';
    document.body.appendChild(infoBox);

    canvas.addEventListener('mousemove', (event) => {
        const [x, y] = getMouseXYInImage(event);
        const pixelInfo = getPixelInfoWithXY(x, y);
        let dx = Math.floor(x / scaleFactor);
        let dy = Math.floor(y / scaleFactor);

        infoBox.style.left = `${event.clientX + 10}px`;
        infoBox.style.top = `${event.clientY + 10}px`;
        infoBox.innerHTML = `Color: ${pixelInfo.name}<br>Brightness: ${pixelInfo.brightness}<br>Coordinates: (${dx}, ${dy})`;
        infoBox.style.display = 'block';
    });

    canvas.addEventListener('mouseleave', () => {
        infoBox.style.display = 'none';
    });

    canvas.addEventListener('click', (event) => {
        if (!isZoom) {
            isZoom = true;
            backButton.style.display = 'block';

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const x = Math.floor((event.clientX - rect.left) * scaleX / (pixelSize * scaleFactor));
            const y = Math.floor((event.clientY - rect.top) * scaleY / (pixelSize * scaleFactor));
            
            zoomedRegionIndex = y * Math.floor(canvas.width / (pixelSize * scaleFactor)) + x;

            displaySelectedRegion();
        } else {
            highlightSimilarColors(event);
        }
    });

    backButton.addEventListener('click', () => {
        isZoom = false;
        backButton.style.display = 'none';
    
        const aspectRatio = uploadedImage.width / uploadedImage.height;
        const outputWidth = canvasSize * pixelSize;
        const outputHeight = Math.floor(outputWidth / aspectRatio);
    
        canvas.width = outputWidth * scaleFactor;
        canvas.height = outputHeight * scaleFactor;
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawPixelArt();
    });
    

    function displaySelectedRegion() {
        const regionSize = 32;
        const regionData = ctx.createImageData(regionSize * scaleFactor, regionSize * scaleFactor);
        
        const gridX = zoomedRegionIndex % canvasSize;
        const gridY = Math.floor(zoomedRegionIndex / canvasSize);
    
        for (let i = 0; i < regionSize; i++) {
            for (let j = 0; j < regionSize; j++) {
                const pixelRow = gridY * regionSize + j;
                const pixelCol = gridX * regionSize + i;
    
                if (pixelRow < pixelDataArray.length && pixelCol < pixelDataArray[0].length) {
                    const pixelInfo = pixelDataArray[pixelRow][pixelCol];
                    for (let dx = 0; dx < scaleFactor; dx++) {
                        for (let dy = 0; dy < scaleFactor; dy++) {
                            const dataIndex = ((j * scaleFactor + dy) * regionSize * scaleFactor + (i * scaleFactor + dx)) * 4;
    
                            regionData.data[dataIndex] = pixelInfo.rgb[0];
                            regionData.data[dataIndex + 1] = pixelInfo.rgb[1];
                            regionData.data[dataIndex + 2] = pixelInfo.rgb[2];
                            regionData.data[dataIndex + 3] = 255;
                        }
                    }
                }
            }
        }
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.canvas.width = regionSize * scaleFactor;
        ctx.canvas.height = regionSize * scaleFactor;
        ctx.putImageData(regionData, 0, 0);
        drawGrid(ctx, regionSize * scaleFactor, scaleFactor, 0.05);
    }

    function highlightSimilarColors(event) {
        const [x, y] = getMouseXYInImage(event);
        const pixelInfo = getPixelInfoWithXY(x, y);
    
        highlightedPixels = [];
    
        if (!isZoom) {
            for (let i = 0; i < pixelDataArray.length; i++) {
                for (let j = 0; j < pixelDataArray[i].length; j++) {
                    const pixel = pixelDataArray[i][j];
                    if (pixel.name === pixelInfo.name && pixel.brightness === pixelInfo.brightness) {
                        highlightedPixels.push({ x: j, y: i });
                    }
                }
            }
        } else {
            const zoomedXStart = pixelSize * (zoomedRegionIndex % canvasSize);
            const zoomedYStart = pixelSize * Math.floor(zoomedRegionIndex / canvasSize);
    
            for (let i = zoomedYStart; i < zoomedYStart + pixelSize; i++) {
                for (let j = zoomedXStart; j < zoomedXStart + pixelSize; j++) {
                    const pixel = pixelDataArray[i][j];
                    const relativeX = j - zoomedXStart;
                    const relativeY = i - zoomedYStart;
                    if (pixel.name === pixelInfo.name && pixel.brightness === pixelInfo.brightness) {
                        highlightedPixels.push({ x: relativeX, y: relativeY });
                    }
                }
            }
        }
    
        drawHighlight();
    }

    function drawHighlight(highli) {
        displaySelectedRegion();
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        highlightedPixels.forEach(pixel => {
            ctx.strokeRect(pixel.x * scaleFactor, pixel.y * scaleFactor, scaleFactor, scaleFactor);
        });

        ctx.restore();
    }

    function drawPixelArt() {
        pixelDataArray.forEach(row => {
            row.forEach(pixel => {
                ctx.fillStyle = `rgb(${pixel.rgb.join(',')})`;
                ctx.fillRect(pixel.x * scaleFactor, pixel.y * scaleFactor, scaleFactor, scaleFactor);
            });
        });
        drawGrid(ctx, Math.floor(canvas.width / (pixelSize * scaleFactor)), pixelSize * scaleFactor);
    }
    

    function findNearestColor(kdTree, targetLab, labColors) {
        const nearestLab = nearest(kdTree, targetLab, 0);
        return labColors.find(color => color.lab.toString() === nearestLab.toString());
    }

    function getMouseXYInImage(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((event.clientX - rect.left) * scaleX);
        const y = Math.floor((event.clientY - rect.top) * scaleY);

        return [x, y];
    }

    function getPixelInfoWithXY(x, y) {
        let dx = Math.floor(x / scaleFactor);
        let dy = Math.floor(y / scaleFactor);
        if(!isZoom) {
            return pixelDataArray[dy][dx];
        } else {
            let tx = dx + (pixelSize * (zoomedRegionIndex % canvasSize));
            let ty = dy + (pixelSize * Math.floor(zoomedRegionIndex / canvasSize));
            return pixelDataArray[ty][tx];
        }
    }
});
