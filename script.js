// ==========================
// CONFIGURATION
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

const uploadedImages = new Array(CONFIG.uploadLimit).fill(null);
const photoInputs = Array.from({ length: CONFIG.uploadLimit }, (_, i) =>
  document.getElementById(`photo${i + 1}`)
);

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

    const scale = Math.min(width / img.width, height / img.height);
    const renderW = img.width * scale;
    const renderH = img.height * scale;

    ctx.drawImage(
      img,
      x + (width - renderW) / 2,
      y + (height - renderH) / 2,
      renderW,
      renderH
    );
  });
}

// ==========================
// PHOTO INPUT HANDLING
// ==========================
photoInputs.forEach((input, index) => {
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        uploadedImages[index] = img;
        drawPreview();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// ==========================
// PROGRESS BAR UI
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
function updateProgress(val, msg) {
  progressBar.value = val;
  if (msg) progressText.textContent = msg;
}
function hideProgress() {
  progressContainer.style.display = "none";
  progressBar.value = 0;
  printBtn.disabled = false;
}

// ==========================
// DOWNLOAD COLLAGE
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
  const guestName = document.getElementById("guestName")
    ? document.getElementById("guestName").value.trim()
    : "Guest";

  if (isNaN(copies) || copies < 1 || copies > CONFIG.maxCopies) {
    alert(`⚠️ Please select between 1 and ${CONFIG.maxCopies} copies.`);
    return;
  }

  showProgress("Preparing image...");

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("❌ Error preparing image.");
      hideProgress();
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateProgress(50, "Uploading to print queue...");

      const payload = {
        photo: reader.result,
        copies: String(copies),
        ts: String(Date.now()),
        name: guestName
      };
      console.log("Sending payload:", payload);

      fetch(CONFIG.uploadURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload)
      })
        .then((res) => res.json())
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
    reader.readAsDataURL(blob);
  }, "image/jpeg", 0.92);
});
