// ==========================
// CONFIGURATION SECTION
// ==========================
const CONFIG = {
  canvas: { width: 1500, height: 1050 },
  placeholders: [
    { x: 105, y: 337.6 },
    { x: 525.8, y: 337.6 },
    { x: 946.7, y: 337.6 }
  ],
  placeholderSize: { width: 402.9, height: 537.2 },
  templateSrc: "template.png",
  uploadLimit: 3,
  maxCopies: 5,
  uploadURL: "https://script.google.com/macros/s/AKfycbwaVXXhFHBWMhJG2a0WyWLM_BmiEeG-GXGpVzwbOaoKKvxcZwVFQpemO_hXOtEJT0A/exec"
};

// ==========================
// CANVAS SETUP
// ==========================
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const photoInputs = Array.from({ length: CONFIG.uploadLimit }, (_, i) =>
  document.getElementById(`photo${i + 1}`)
);
const uploadedImages = new Array(CONFIG.uploadLimit).fill(null);

let templateImg = new Image();
templateImg.src = CONFIG.templateSrc;
templateImg.onload = drawInitialTemplate;

function drawInitialTemplate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
}

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

// ==========================
// PHOTO UPLOAD HANDLING
// ==========================
photoInputs.forEach((input, index) => {
  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        uploadedImages[index] = img;
        drawPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// ==========================
// LOADING UI HANDLING
// ==========================
const printBtn = document.getElementById("confirmPrint");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

function showProgress(msg) {
  progressContainer.style.display = "block";
  progressText.textContent = msg || "Uploading...";
  progressBar.value = 20;
  printBtn.disabled = true;
}

function updateProgress(value, msg) {
  progressBar.value = value;
  if (msg) progressText.textContent = msg;
}

function hideProgress() {
  progressContainer.style.display = "none";
  progressBar.value = 0;
  printBtn.disabled = false;
}

// ==========================
// DOWNLOAD COLLAGE (JPEG)
// ==========================
document.getElementById("downloadImage").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("❌ Error creating image for download.");
      return;
    }
    const link = document.createElement("a");
    link.download = "snapstrip-collage.jpg";
    link.href = URL.createObjectURL(blob);
    link.click();
  }, "image/jpeg");
});

// ==========================
// PRINT HANDLER
// ==========================
printBtn.addEventListener("click", () => {
  const copies = parseInt(document.getElementById("copies").value, 10);
  const guestName = document.getElementById("guestName").value.trim();

  // Validate inputs
  if (isNaN(copies) || copies < 1 || copies > CONFIG.maxCopies) {
    alert(`⚠️ Please select between 1 and ${CONFIG.maxCopies} copies.`);
    return;
  }
  if (!guestName) {
    alert("⚠️ Please enter your name before printing.");
    return;
  }

  showProgress("Preparing image...");

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("❌ Something went wrong preparing the image.");
      hideProgress();
      return;
    }

    const fr = new FileReader();
    fr.onloadend = () => {
      updateProgress(50, "Uploading to print queue...");

      const payload = {
        photo: fr.result,
        copies: String(copies),
        ts: String(Date.now()),
        name: guestName
      };
      console.log("Sending data:", payload);

      fetch(CONFIG.uploadURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload)
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.ok) {
            updateProgress(100, "✅ Uploaded successfully!");
            alert(`✅ Print request sent for ${guestName}`);
          } else {
            throw new Error(data.error || "Upload failed.");
          }
        })
        .catch((err) => {
          alert("⚠️ Error: " + err.message);
        })
        .finally(() => {
          hideProgress();
        });
    };

    fr.readAsDataURL(blob);
  }, "image/jpeg", 0.92);
});
