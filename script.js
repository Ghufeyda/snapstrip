// ====== Config ======
const TEMPLATE_SRC = 'template.png';          // must be same-origin to avoid CORS-tainted canvas
const CANVAS_W = 1500, CANVAS_H = 1050;
const PLACE_W = 450, PLACE_H = 600;
const PLACEHOLDERS = [
  { x: 54.9,  y: 345   }, // Photo 1 bottom-left
  { x: 525.1, y: 345   }, // Photo 2 bottom-left
  { x: 995.1, y: 345   }  // Photo 3 bottom-left
];
// Your Google Apps Script Web App URL (Deploy > Web app > "Anyone")
const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzjYR0hiyu7aU9DhE9Nbd1ITwNrPdKDieJW4ZT2Kqgvj8hJdaeublZLmvhUxAxOZBE/exec';

// ====== DOM ======
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W; canvas.height = CANVAS_H;

const inputs = [
  document.getElementById('photo1'),
  document.getElementById('photo2'),
  document.getElementById('photo3'),
];
const copiesEl = document.getElementById('copies');
const btnPrint = document.getElementById('confirmPrint');
const btnDownload = document.getElementById('downloadImage');

// ====== State ======
const uploadedImages = [null, null, null];
const templateImg = new Image();
templateImg.src = TEMPLATE_SRC;

// ====== Helpers ======
function drawTemplateOnly() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.drawImage(templateImg, 0, 0, CANVAS_W, CANVAS_H);
}

function drawAll() {
  drawTemplateOnly();
  uploadedImages.forEach((img, i) => {
    if (!img) return;
    const { x, y } = PLACEHOLDERS[i];
    const cx = x + PLACE_W / 2;
    const cy = y + PLACE_H / 2;

    // Scale to fit within 450x600 while preserving aspect ratio
    const s = Math.min(PLACE_W / img.width, PLACE_H / img.height);
    const w = img.width * s;
    const h = img.height * s;

    const dx = cx - w / 2;
    const dy = cy - h / 2;
    ctx.drawImage(img, dx, dy, w, h);
  });
}

function readAsImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = e => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// ====== Events ======
templateImg.onload = drawTemplateOnly;

inputs.forEach((input, idx) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await readAsImage(file);
      uploadedImages[idx] = img;
      drawAll();
    } catch {
      alert('Could not load that image. Please try a different file.');
    }
  });
});

// Upload merged JPEG to Google Apps Script
btnPrint.addEventListener('click', () => {
  const copies = parseInt(copiesEl.value, 10);
  if (isNaN(copies) || copies < 1 || copies > 5) {
    alert('Please choose between 1 and 5 copies.');
    return;
  }

  // Ensure template is drawn even if no photos provided
  drawAll();

  canvas.toBlob((blob) => {
  if (!blob) {
    alert('Failed to prepare image.');
    return;
  }

  const copies = parseInt(document.getElementById('copies').value, 10) || 1;

  const fr = new FileReader();
  fr.onloadend = () => {
    // Send base64 as a normal form field (text) via multipart/form-data
    const fd = new FormData();
    fd.append('photo', fr.result);    // dataURL (base64)
    fd.append('copies', String(copies));
    fd.append('ts', String(Date.now()));

    fetch(SCRIPT_WEB_APP_URL, { method: 'POST', body: fd })
      .then(r => r.text())
      .then(() => alert('Uploaded to print queue!'))
      .catch(err => {
        console.error(err);
        alert('Upload failed.');
      });
  };
  fr.readAsDataURL(blob);
}, 'image/jpeg', 0.92);

// Single download (for guest keepsake)
btnDownload.addEventListener('click', () => {
  drawAll();
  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Failed to prepare download.');
      return;
    }
    const a = document.createElement('a');
    a.download = 'snapstrip.jpg';
    a.href = URL.createObjectURL(blob);
    a.click();
    // Revoke later
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/jpeg', 0.92);
});
