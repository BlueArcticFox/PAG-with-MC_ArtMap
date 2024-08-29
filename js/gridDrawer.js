export function drawGrid(ctx, size, pixelSize, lineWidth = 5) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = lineWidth;

    for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, size * pixelSize);
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(size * pixelSize, i * pixelSize);
        ctx.stroke();
    }
}
