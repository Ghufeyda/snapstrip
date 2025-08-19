const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const photoInputs = [
  document.getElementById('photo1'),
  document.getElementById('photo2'),
  document.getElementById('photo3')
];

const placeholders = [
  { x: 54.9, y: 345 },
  { x: 525.1, y: 345 },
  { x: 995.1, y: 345 }
];

const placeholderSize = { width: 450, height: 600 };
const templateSrc = 'template.png'; // Ensure this file exists in the same directory

let templateImg = new Image();
templateImg.src = templateSrc;

let uploadedImages = [null, null, null];

function drawPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

  uploadedImages.forEach((img, index) => {
    if (!img) return;

    const { x, y } = placeholders[index];
    const { width, height } = placeholderSize;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Calculate scale to fit while preserving aspect ratio
    const scale = Math.min(width / img.width, height / img.height);
    const renderWidth = img.width * scale;
    const renderHeight = img.height * scale;

    const renderX = centerX - renderWidth / 2;
    const renderY = centerY - renderHeight / 2;

    ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);
  });
}

// Initial draw to show just the template
templateImg.onload = drawPreview;

// Handle uploads
photoInputs.forEach((input, index) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        uploadedImages[index] = img;
        drawPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// Handle confirm and print
document.getElementById('confirmPrint').addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (copies < 1 || copies > 5) {
    alert("Please select between 1 and 5 copies.");
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Error generating image. Try again.");
      return;
    }

    const url = URL.createObjectURL(blob);
    for (let i = 0; i < copies; i++) {
      const printWindow = window.open(url);
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  });
});
