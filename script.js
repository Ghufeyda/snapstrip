const uploadForm = document.getElementById('uploadForm');
const leftPhotoInput = document.getElementById('leftPhoto');
const rightPhotoInput = document.getElementById('rightPhoto');
const previewImage = document.getElementById('previewImage');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const copiesInput = document.getElementById('copies');
const confirmBtn = document.getElementById('confirmBtn');
const actions = document.getElementById('actions');

canvas.width = 1500;
canvas.height = 1050;

const templateImg = new Image();
templateImg.src = 'template.png';

// Cover + Center Logic (like CSS object-fit: cover)
function drawImageCover(image, x, y, boxSize = 600) {
  const scale = Math.max(boxSize / image.width, boxSize / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  const offsetX = x + (boxSize - width) / 2;
  const offsetY = y + (boxSize - height) / 2;

  ctx.drawImage(image, offsetX, offsetY, width, height);
}

// Draw template on load
templateImg.onload = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  previewImage.src = canvas.toDataURL();
};

// On form submit (preview photos on template)
uploadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const leftFile = leftPhotoInput.files[0];
  const rightFile = rightPhotoInput.files[0];

  if (!leftFile || !rightFile) {
    return alert('Please upload both photos!');
  }

  const leftImg = new Image();
  const rightImg = new Image();
  const readerLeft = new FileReader();
  const readerRight = new FileReader();

  readerLeft.onload = () => {
    leftImg.src = readerLeft.result;
  };

  readerRight.onload = () => {
    rightImg.src = readerRight.result;
  };

  leftImg.onload = () => {
    rightImg.onload = () => {
      // Draw template
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

      // Draw both images in placeholder positions (bottom-left corner)
      drawImageCover(leftImg, 105, 345);  // Left placeholder
      drawImageCover(rightImg, 795, 345); // Right placeholder

      // Show preview
      previewImage.src = canvas.toDataURL();
      actions.style.display = 'flex';
    };
  };

  readerLeft.readAsDataURL(leftFile);
  readerRight.readAsDataURL(rightFile);
});

// On Confirm Print
confirmBtn.addEventListener('click', () => {
  const numCopies = parseInt(copiesInput.value, 10);

  if (isNaN(numCopies) || numCopies < 1 || numCopies > 5) {
    return alert('Please enter a valid number of copies (1–5).');
  }

  const filename = `snapstrip_${Date.now()}.jpg`;

  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();

    alert(`${numCopies} copy/copies will be printed.`);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
    previewImage.src = canvas.toDataURL();
    actions.style.display = 'none';
    uploadForm.reset();
  }, 'image/jpeg');
});