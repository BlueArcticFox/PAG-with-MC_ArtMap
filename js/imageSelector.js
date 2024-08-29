function displaySelectedRegion(ctx, gridX, gridY, pixelSize) {
    const x = gridX * pixelSize;
    const y = gridY * pixelSize;

    const regionData = ctx.getImageData(x, y, pixelSize, pixelSize);
    
    // 기존 캔버스 내용을 지우고, 캔버스 크기를 32x32로 변경
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
    ctx.canvas.width = pixelSize;
    ctx.canvas.height = pixelSize;

    // 선택된 영역만 다시 그리기
    ctx.putImageData(regionData, 0, 0);
}
