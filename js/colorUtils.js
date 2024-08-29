// js/colorUtils.js

export function rgbToLab(rgb) {
    // RGB -> XYZ
    let [r, g, b] = rgb.map(value => value / 255);
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    // XYZ -> LAB
    let [X, Y, Z] = [x / 0.95047, y / 1.0, z / 1.08883];
    X = X > 0.008856 ? Math.pow(X, 1 / 3) : (7.787 * X) + 16 / 116;
    Y = Y > 0.008856 ? Math.pow(Y, 1 / 3) : (7.787 * Y) + 16 / 116;
    Z = Z > 0.008856 ? Math.pow(Z, 1 / 3) : (7.787 * Z) + 16 / 116;

    const L = (116 * Y) - 16;
    const a = 500 * (X - Y);
    const lb = 200 * (Y - Z);

    return [L, a, lb];
}
