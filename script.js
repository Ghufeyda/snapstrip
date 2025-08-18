const uploadForm = document.getElementById('uploadForm');
const leftPhotoInput = document.getElementById('leftPhoto');
const rightPhotoInput = document.getElementById('rightPhoto');
const previewImage = document.getElementById('previewImage');
const actions = document.getElementById('actions');
const copiesInput = document.getElementById('copies');
const confirmBtn = document.getElementById('confirmBtn');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 980;
canvas.height = 1400;

const PLACEHOLDER_SIZE = 560;
const LEFT_X = 98;   // 0.35in x 280ppi
const LEFT_Y = 322;  // 1.15in x 280ppi
const RIGHT_X = 742; // 2.65in x 280ppi
const RIGHT_Y = 322; // 1.15in x 280ppi

const templateImg = new Image();
templateImg.src = 'template.png';

let leftImg = null;
let rightImg = null;

// Load and store images
function loadImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = () => callback(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Cover and center image logic
function drawImageCover(image, x, y) {
  const scale = Math.max(
    PLACEHOLDER_SIZE / image.width,
    PLACEHOLDER_SIZE / image.height
  );
  const width = image.width * scale;
  const height = image.height * scale;
  const offsetX = x + (PLACEHOLDER_SIZE - width) / 2;
  const offsetY = y + (PLACEHOLDER_SIZE - height) / 2;
  ctx.drawImage(image, offsetX, offsetY, width, height);
}

function drawFinalImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

  if (leftImg) drawImageCover(leftImg, LEFT_X, LEFT_Y);
  if (rightImg) drawImageCover(rightImg, RIGHT_X, RIGHT_Y);

  // Show preview
  previewImage.src = canvas.toDataURL();
  actions.style.display = 'flex';
}

uploadForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const leftFile = leftPhotoInput.files[0];
  const rightFile = rightPhotoInput.files[0];

  if (!leftFile || !rightFile) return alert("Please upload both photos.");

  loadImage(leftFile, (img) => {
    leftImg = img;
    if (rightImg) drawFinalImage();
  });

  loadImage(rightFile, (img) => {
    rightImg = img;
    if (leftImg) drawFinalImage();
  });
});

confirmBtn.addEventListener('click', () => {
  const copies = parseInt(copiesInput.value);
  if (isNaN(copies) || copies < 1 || copies > 5) {
    alert("Please select 1 to 5 copies.");
    return;
  }

  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("image", blob, "snapstrip.png");
    formData.append("copies", copies);

    fetch("/print", {
      method: "POST",
      body: formData
    }).then(() => {
      alert("Sent to print queue! You may collect your photo shortly.");
    }).catch(() => {
      alert("Error sending to printer.");
    });
  }, "image/png");
});
