const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1500;
canvas.height = 1050;

const templateImg = new Image();
templateImg.src = 'template.png';

const leftImg = new Image();
const rightImg = new Image();

const previewImage = document.getElementById('previewImage');
const actions = document.getElementById('actions');

document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const leftFile = document.getElementById('leftPhoto').files[0];
  const rightFile = document.getElementById('rightPhoto').files[0];
  if (!leftFile || !rightFile) return alert('Please upload both photos.');

  leftImg.src = URL.createObjectURL(leftFile);
  rightImg.src = URL.createObjectURL(rightFile);

  leftImg.onload = rightImg.onload = () => drawFinalImage();
});

document.getElementById('confirmBtn').addEventListener('click', function () {
  const copies = parseInt(document.getElementById('copies').value, 10);
  if (!copies || copies < 1 || copies > 5) return alert('Please choose between 1 to 5 copies.');

  canvas.toBlob(blob => {
    const file = new File([blob], 'photo-strip.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('copies', copies);

    fetch('/print', { method: 'POST', body: formData })
      .then(res => alert('Your print job has been sent!'))
      .catch(err => alert('Print failed. Please try again.'));
  });
});

function drawFinalImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

  const maxSize = 600;
  const leftCenter = { x: 105 + maxSize / 2, y: 345 - maxSize / 2 };
  const rightCenter = { x: 795 + maxSize / 2, y: 345 - maxSize / 2 };

  drawImageFit(ctx, leftImg, leftCenter.x, leftCenter.y, maxSize, maxSize);
  drawImageFit(ctx, rightImg, rightCenter.x, rightCenter.y, maxSize, maxSize);

  previewImage.src = canvas.toDataURL();
  actions.style.display = 'flex';
}

function drawImageFit(ctx, image, centerX, centerY, boxW, boxH) {
  const scale = Math.max(boxW / image.width, boxH / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = centerX - width / 2;
  const y = centerY - height / 2;
  ctx.drawImage(image, x, y, width, height);
}

// Draw template-only preview on initial load
templateImg.onload = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  previewImage.src = canvas.toDataURL();
};
