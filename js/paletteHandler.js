import { rgbToLab } from './colorUtils.js';
import { palette } from './palette.js';
import { buildKdTree } from './kdTree.js';

document.addEventListener('DOMContentLoaded', () => {
    const colorGroups = {};
    const uncheckedColors = [
        "Brown", "Cream", "Coffee", "Gunpowder", "Aqua", "Ice-Blue", "Deep-Blue", 
        "Emerald-Green", "Caramel-Brown", "Chrous Fruit Purple", "Dark-Chocolate Brown",
        "Cobbled Deepslate", "Glow Lichen", "Lavender Purple"
    ];

    palette.forEach(item => {
        if (!colorGroups[item.name]) {
            colorGroups[item.name] = [];
        }
        colorGroups[item.name].push(item);
    });

    const colorList = document.getElementById('colorList');

    for (const [name, colors] of Object.entries(colorGroups)) {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.style.display = 'flex';
        colorItem.style.alignItems = 'center';
        colorItem.style.marginBottom = '10px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = name;
        checkbox.dataset.colors = JSON.stringify(colors);

        checkbox.checked = !uncheckedColors.includes(name);

        const label = document.createElement('label');
        label.setAttribute('for', name);
        label.textContent = name;
        label.style.marginLeft = '8px';

        const colorPreviews = document.createElement('div');
        colorPreviews.style.display = 'flex';
        colorPreviews.style.marginLeft = '10px';

        colors.forEach((colorObj) => {
            const colorPreview = document.createElement('span');
            colorPreview.style.display = 'inline-block';
            colorPreview.style.width = '16px';
            colorPreview.style.height = '16px';
            colorPreview.style.backgroundColor = `rgb(${colorObj.color.join(',')})`;
            colorPreview.style.border = '1px solid #000';
            colorPreview.style.marginRight = '5px';
            colorPreview.style.borderRadius = '2px';

            colorPreviews.appendChild(colorPreview);
        });

        colorItem.appendChild(checkbox);
        colorItem.appendChild(label);
        colorItem.appendChild(colorPreviews);
        colorList.appendChild(colorItem);
    }

    const generateButton = document.getElementById('generateButton');

    generateButton.addEventListener('click', () => {
        const selectedColors = [];

        document.querySelectorAll('.color-item input[type="checkbox"]:checked').forEach(checkbox => {
            const colors = JSON.parse(checkbox.dataset.colors);
            selectedColors.push(...colors);
        });

        if (selectedColors.length > 0) {
            const labColors = selectedColors.map(colorObj => ({
                lab: rgbToLab(colorObj.color),
                rgb: colorObj.color
            }));
            const kdTree = buildKdTree(labColors.map(c => c.lab));
            console.log('K-D Tree:', kdTree);
        } else {
            alert('Please select at least one color.');
        }
    });
});