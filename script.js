const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

const template = new Image();
template.src = "template.png";

// Placeholder coordinates (bottom-left of each 450x600 px box)
const placeholders = [
  { x: 54.9, y: 345 },
  { x: 525.1, y: 345 },
  { x: 995.1, y: 345 }
];

const placeholderSize = { width: 450, height: 600 };

// Store uploaded images
let uploadedImages = [null, null, null];

// Draw the template and any uploaded images
function drawPreview() {
  if (!template.complete) {
    template.onload = drawPreview;
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw template background
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  // Draw uploaded images in each placeholder
  uploadedImages.forEach((img, index) => {
    if (img) {
      drawImageToPlaceholder(img, placeholders[index]);
    }
  });
}

// Draw image centered in placeholder and scaled to fit
function drawImageToPlaceholder(image, placeholder) {
  const centerX = placeholder.x + placeholderSize.width / 2;
  const centerY = placeholder.y + placeholderSize.height / 2;

  const scale = Math.min(
    placeholderSize.width / image.width,
    placeholderSize.height / image.height
  );

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  const drawX = centerX - drawWidth / 2;
  const drawY = centerY - drawHeight / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

// Handle uploads
document.querySelectorAll(".photo-upload").forEach((input, index) => {
  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
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

// Confirm and print
document.getElementById("confirmPrint").addEventListener("click", () => {
  const copies = parseInt(document.getElementById("copies").value);
  if (isNaN(copies) || copies < 1 || copies > 5) {
    alert("Please select 1 to 5 copies.");
    return;
  }

  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("image", blob, "collage.jpg");
    formData.append("copies", copies);

    fetch("/print", {
      method: "POST",
      body: formData
    })
      .then(() => alert("Print queued successfully!"))
      .catch(() => alert("Error sending print job."));
  }, "image/jpeg");
});

// Initial load with only template shown
template.onload = () => drawPreview();
