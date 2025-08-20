const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// Upload fields
const photoInputs = [
  document.getElementById('photo1'),
  document.getElementById('photo2'),
  document.getElementById('photo3')
];

// 3 placeholder positions
const placeholders = [
  { x: 54.9, y: 345 },
  { x: 525.1, y: 345 },
  { x: 995.1, y: 345 }
];
const placeholderSize = { width: 450, height: 600 };

// Default template image
const templateSrc = 'template.png';
let templateImg = new Image();
templateImg.src = templateSrc;

// Store uploaded images
let uploadedImages = [null, null, null];

// Show only template first
function drawInitialTemplate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
}

// Show all images in placeholders
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

// Load template first
templateImg.onload = drawInitialTemplate;

// Handle photo uploads
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

// Trigger download
document.getElementById('downloadImage').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Error creating image for download.");
      return;
    }
    const link = document.createElement('a');
    link.download = 'snapstrip-collage.png';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, 'image/jpeg');
});

// Upload to Google Apps Script
document.getElementById('confirmPrint').addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (isNaN(copies) || copies < 1 || copies > 5) {
    alert("Please enter between 1 and 5 copies.");
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Something went wrong preparing the image.');
      return;
    }

    const fr = new FileReader();
    fr.onloadend = () => {
      const formData = new FormData();
      formData.append('photo', fr.result); // base64 data URL
      formData.append('copies', String(copies));
      formData.append('ts', String(Date.now()));

      fetch('https://script.google.com/macros/s/AKfycbzjYR0hiyu7aU9DhE9Nbd1ITwNrPdKDieJW4ZT2Kqgvj8hJdaeublZLmvhUxAxOZBE/exec', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          alert('Uploaded to print queue successfully!');
        } else {
          console.error(data);
          alert('Upload failed: ' + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error sending image to printer queue.');
      });
    };

    fr.readAsDataURL(blob);
  }, 'image/jpeg', 0.92);
});
