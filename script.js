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

// Download button
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

  // Upload and print as PDF
document.getElementById('confirmPrint').addEventListener('click', () => {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (isNaN(copies) || copies < 1 || copies > CONFIG.maxCopies) {
    alert(`Please enter between 1 and ${CONFIG.maxCopies} copies.`);
    return;
  }

  // Create a PDF the same size as canvas
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  // Render canvas as image inside the PDF
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

  // Convert PDF to Blob
  const pdfBlob = pdf.output('blob');

  const fr = new FileReader();
  fr.onloadend = () => {
    fetch(CONFIG.uploadURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        photo: fr.result,            // now a base64 PDF
        copies: String(copies),
        ts: String(Date.now())
      })
    })
    .then(response => response.text())
    .then(text => {
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid JSON from server: " + text);
      }
      if (data.ok) {
        alert('Uploaded successfully as PDF!');
      } else {
        alert('Upload failed: ' + data.error);
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error sending PDF to server: ' + err.message);
    });
  };

  fr.readAsDataURL(pdfBlob);  // read the PDF blob as base64
});

});
