const leftInput = document.getElementById("left-photo");
const rightInput = document.getElementById("right-photo");
const previewImage = document.getElementById("preview-image");
const downloadButton = document.getElementById("download-button");
const printForm = document.getElementById("print-form");
const printQueue = [];

const TEMPLATE_SRC = "template.png";
const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 1050;

const PLACEHOLDER_SIZE = 600;
const LEFT_PLACEHOLDER_CENTER = { x: 105 + PLACEHOLDER_SIZE / 2, y: 345 - PLACEHOLDER_SIZE / 2 };
const RIGHT_PLACEHOLDER_CENTER = { x: 795 + PLACEHOLDER_SIZE / 2, y: 345 - PLACEHOLDER_SIZE / 2 };

let leftPhoto, rightPhoto;

function loadImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function scaleToFit(img, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  return {
    width: img.width * ratio,
    height: img.height * ratio
  };
}

async function updatePreview() {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");

  const template = new Image();
  template.src = TEMPLATE_SRC;
  await new Promise(resolve => template.onload = resolve);
  ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (leftPhoto) {
    const scaled = scaleToFit(leftPhoto, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
    const dx = LEFT_PLACEHOLDER_CENTER.x - scaled.width / 2;
    const dy = LEFT_PLACEHOLDER_CENTER.y - scaled.height / 2;
    ctx.drawImage(leftPhoto, dx, dy, scaled.width, scaled.height);
  }

  if (rightPhoto) {
    const scaled = scaleToFit(rightPhoto, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
    const dx = RIGHT_PLACEHOLDER_CENTER.x - scaled.width / 2;
    const dy = RIGHT_PLACEHOLDER_CENTER.y - scaled.height / 2;
    ctx.drawImage(rightPhoto, dx, dy, scaled.width, scaled.height);
  }

  previewImage.src = canvas.toDataURL("image/png");
  return canvas;
}

leftInput.addEventListener("change", async () => {
  if (leftInput.files[0]) {
    leftPhoto = await loadImage(leftInput.files[0]);
    await updatePreview();
  }
});

rightInput.addEventListener("change", async () => {
  if (rightInput.files[0]) {
    rightPhoto = await loadImage(rightInput.files[0]);
    await updatePreview();
  }
});

printForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const copies = parseInt(document.getElementById("copies").value);
  if (!leftPhoto || !rightPhoto || isNaN(copies) || copies < 1 || copies > 5) {
    alert("Please upload 2 photos and select 1–5 copies.");
    return;
  }

  const canvas = await updatePreview();
  canvas.toBlob(blob => {
    for (let i = 0; i < copies; i++) {
      printQueue.push(blob);
    }
    alert(`${copies} copies sent to the queue!`);
  }, "image/png");
});

// Initial template preview
(async function initialize() {
  previewImage.src = TEMPLATE_SRC;
})();