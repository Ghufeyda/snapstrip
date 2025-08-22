// ==========================
// CONFIGURATION SECTION
// ==========================
// Central place for constants so scaling / maintenance is easy
const CONFIG = {
  canvas: {
    width: 1500,
    height: 1050
  },
  placeholders: [
    // Coordinates = bottom-left corner of placeholder
    { x: 105, y: 337.6 },
    { x: 525.8, y: 337.6 },
    { x: 946.7, y: 337.6 }
  ],
  placeholderSize: { width: 402.9, height: 537.2 }, // Fixed slot size for each photo
  templateSrc: 'template.png',                  // Collage template overlay
  uploadLimit: 3,                               // Max number of photos to upload
  maxCopies: 5,                                 // Restrict number of copies
  uploadURL: 'https://script.google.com/macros/s/AKfycbwaVXXhFHBWMhJG2a0WyWLM_BmiEeG-GXGpVzwbOaoKKvxcZwVFQpemO_hXOtEJT0A/exec',
  driveFolderId: '164s0L6MUUaRhYYBaBsvnV-w3pqqU-6U3' // Reference for backend integration
};

// ==========================
// CANVAS INITIALIZATION
// ==========================
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// Track uploaded photos
const photoInputs = Array.from(
  { length: CONFIG.uploadLimit }, 
  (_, i) => document.getElementById(`photo${i + 1}`)
);
const uploadedImages = new Array(CONFIG.uploadLimit).fill(null);

// Load the collage template (frame/background)
let templateImg = new Image();
templateImg.src = CONFIG.templateSrc;

// Draw only the template (blank slate)
function drawInitialTemplate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
}

// Draw template + uploaded photos in placeholders
function drawPreview() {
  drawInitialTemplate();
  uploadedImages.forEach((img, index) => {
    if (!img) return;

    const { x, y } = CONFIG.placeholders[index];
    const { width, height } = CONFIG.placeholderSize;

    // Centering & scaling logic
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

// Draw template on first load
templateImg.onload = drawInitialTemplate;

// ==========================
// FILE UPLOAD HANDLING
// ==========================
photoInputs.forEach((input, index) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        uploadedImages[index] = img;
        drawPreview(); // Redraw collage when new photo uploaded
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// ==========================
// LOADING / PROGRESS HANDLING
// ==========================
const printBtn = document.getElementById('confirmPrint');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// Show progress UI
function showProgress(msg) {
  progressContainer.style.display = 'block';
  progressText.textContent = msg || 'Uploading...';
  progressBar.value = 20; // Start progress baseline
  printBtn.disabled = true;
}

// Update progress value + optional message
function updateProgress(value, msg) {
  progressBar.value = value;
  if (msg) progressText.textContent = msg;
}

// Hide/reset progress UI
function hideProgress() {
  progressContainer.style.display = 'none';
  progressBar.value = 0;
  printBtn.disabled = false;
}

// ==========================
// DOWNLOAD HANDLER (JPEG)
// ==========================
document.getElementById('downloadImage').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("❌ Error creating image for download.");
      return;
    }
    const link = document.createElement('a');
    link.download = 'snapstrip-collage.jpg';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, 'image/jpeg');
});

// ==========================
// PRINT HANDLER (UPLOAD TO GAS)
// ==========================
printBtn.addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);

  // Validate copies selection
  if (isNaN(copies) || copies < 1 || copies > CONFIG.maxCopies) {
    alert(`⚠️ Please select between 1 and ${CONFIG.maxCopies} copies.`);
    return;
  }

  showProgress('Preparing image...');

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('❌ Something went wrong preparing the image.');
      hideProgress();
      return;
    }

    const fr = new FileReader();
    fr.onloadend = () => {
      updateProgress(50, 'Uploading to print queue...');

      // POST to Apps Script Web App
      fetch(CONFIG.uploadURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',  // Correct content type
        },
        body: new URLSearchParams({
          photo: fr.result,          // Base64 JPEG
          copies: String(copies),    // Copies requested
          ts: String(Date.now())     // Client timestamp
        })
      })
        .then(response => {
          updateProgress(75, 'Processing response...');
          return response.text();
        })
        .then(text => {
          try {
            const data = JSON.parse(text);
            if (data.ok) {
              updateProgress(100, '✅ Uploaded successfully!');
              alert("✅ Print request sent!");
            } else {
              throw new Error(data.error || 'Upload failed.');
            }
          } catch (err) {
            throw new Error("Invalid server response: " + text);
          }
        })
        .catch(err => {
          alert("⚠️ Error: " + err.message);
        })
        .finally(() => {
          hideProgress();
        });
    };

    // Convert blob → base64
    fr.readAsDataURL(blob);
  }, 'image/jpeg', 0.92); // Slight compression for balance
});

