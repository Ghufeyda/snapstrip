// ==========================
// CONFIGURATION SECTION
// ==========================
const CONFIG = {
  canvas: {
    width: 1500,
    height: 1050
  },
  placeholders: [
    { x: 54.9, y: 345 },
    { x: 525.1, y: 345 },
    { x: 995.1, y: 345 }
  ],
  placeholderSize: { width: 450, height: 600 },
  templateSrc: 'template.png',
  uploadLimit: 3,
  maxCopies: 5,
  uploadURL: 'https://script.google.com/macros/s/AKfycbwaVXXhFHBWMhJG2a0WyWLM_BmiEeG-GXGpVzwbOaoKKvxcZwVFQpemO_hXOtEJT0A/exec'
};

// ==========================
// CORE LOGIC
// ==========================
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const photoInputs = Array.from({ length: CONFIG.uploadLimit }, (_, i) => document.getElementById(`photo${i + 1}`));
const uploadedImages = new Array(CONFIG.uploadLimit).fill(null);

let templateImg = new Image();
templateImg.src = CONFIG.templateSrc;

// Draw template only
function drawInitialTemplate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
}

// Draw preview with uploaded photos
function drawPreview() {
  drawInitialTemplate();

  uploadedImages.forEach((img, index) => {
    if (!img) return;

    const { x, y } = CONFIG.placeholders[index];
    const { width, height } = CONFIG.placeholderSize;

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

// Load initial template
templateImg.onload = drawInitialTemplate;

// Photo uploads
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

// Set up loading spinner or bar element (make sure it's added in HTML)
const loadingIndicator = document.getElementById('loadingIndicator');  // Add this in your HTML (e.g., a simple div or spinner)

// Show loading indicator
function showLoading() {
  loadingIndicator.style.display = 'block';  // Show the loading indicator
}

// Hide loading indicator
function hideLoading() {
  loadingIndicator.style.display = 'none';  // Hide the loading indicator
}

// Download Image (JPEG)
document.getElementById('downloadImage').addEventListener('click', () => {
  showLoading();  // Show loading indicator when download starts

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Error creating image for download.");
      hideLoading();
      return;
    }

    const link = document.createElement('a');
    link.download = 'snapstrip-collage.jpg';
    link.href = URL.createObjectURL(blob);
    link.click();

    hideLoading();  // Hide loading indicator after download completes
  }, 'image/jpeg');
});

// Print Image (JPEG)
document.getElementById('confirmPrint').addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (isNaN(copies) || copies < 1 || copies > CONFIG.maxCopies) {
    alert(`Please enter between 1 and ${CONFIG.maxCopies} copies.`);
    return;
  }

  showLoading();  // Show loading indicator when print starts

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Something went wrong preparing the image.');
      hideLoading();
      return;
    }

    const fr = new FileReader();
    fr.onloadend = () => {
      const formData = new FormData();
      formData.append('photo', fr.result);  // JPEG data
      formData.append('copies', String(copies));
      formData.append('ts', String(Date.now()));

      fetch(CONFIG.uploadURL, {
        method: 'POST',
        body: new URLSearchParams({
          photo: fr.result,
          copies: String(copies),
          ts: String(Date.now())
        })
      })
        .then(response => response.text())
        .then(text => JSON.parse(text))
        .then(data => {
          if (data.ok) {
            alert("✅ Print request sent!");
          } else {
            alert("❌ Upload failed: " + data.error);
          }
          hideLoading();  // Hide loading indicator after processing
        })
        .catch(err => {
          alert("⚠️ Error: " + err.message);
          hideLoading();  // Hide loading indicator in case of error
        });
    };

    fr.readAsDataURL(blob);
  }, 'image/jpeg', 0.92);
});
