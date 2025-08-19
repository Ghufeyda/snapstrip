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
const templateSrc = 'template.png';

let templateImg = new Image();
templateImg.src = templateSrc;

let uploadedImages = [null, null, null];

// Draw the template first
function drawInitialTemplate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
}

// Draw all 3 photos over the template
function drawPreview() {
  drawInitialTemplate();

  uploadedImages.forEach((img, index) => {
    if (!img) return;

    const { x, y } = placeholders[index];
    const { width, height } = placeholderSize;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const scale = Math.min(width / img.width, height / img.height);
    const renderWidth = img.width * scale;
    const renderHeight = img.height * scale;

    const renderX = centerX - renderWidth / 2;
    const renderY = centerY - renderHeight / 2;

    ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);
  });
}

// Load template once on page load
templateImg.onload = drawInitialTemplate;

// Handle uploads for each photo input
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

// Confirm & Print
document.getElementById('confirmPrint').addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (isNaN(copies) || copies < 1 || copies > 5) {
    alert("Please choose between 1 and 5 copies.");
    return;
  }

  canvas.toBlob((blob) => {
    const reader = new FileReader();
    reader.onloadend = function () {
      fetch('YOUR_SCRIPT_URL_HERE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `photo=${encodeURIComponent(reader.result)}&copies=${copies}`
      })
        .then(res => res.text())
        .then(msg => alert('Sent to print queue.'))
        .catch(err => alert('Print failed: ' + err));
    };
    reader.readAsDataURL(blob);
  }, 'image/jpeg');
});

// Download
document.getElementById('downloadImage').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Error preparing download.");
      return;
    }

    const link = document.createElement('a');
    link.download = 'photo-collage.jpg';
    link.href = URL.createObjectURL(blob);
    link.click();
  });
});
