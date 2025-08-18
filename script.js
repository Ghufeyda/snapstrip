window.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const leftPhotoInput = document.getElementById('leftPhoto');
  const rightPhotoInput = document.getElementById('rightPhoto');
  const previewImage = document.getElementById('previewImage');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const confirmBtn = document.getElementById('confirmBtn');
  const backBtn = document.getElementById('backBtn');
  const actions = document.getElementById('actions');
  const copiesInput = document.getElementById('copies');

  const templateImg = new Image();
  templateImg.crossOrigin = "anonymous";
  templateImg.src = 'template.png';

  let leftImg = new Image();
  let rightImg = new Image();

  // Draw the default template on page load
  templateImg.onload = () => {
    canvas.width = templateImg.width;
    canvas.height = templateImg.height;
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
    previewImage.src = canvas.toDataURL(); // show template in preview
  };

  function drawFinalImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

  const placeholderSize = 560;

  function drawImageCover(image, x, y) {
    const scale = Math.max(
      placeholderSize / image.width,
      placeholderSize / image.height
    );
    const width = image.width * scale;
    const height = image.height * scale;
    const dx = x + (placeholderSize - width) / 2;
    const dy = y + (placeholderSize - height) / 2;
    ctx.drawImage(image, dx, dy, width, height);
  }

  if (leftImg.complete && rightImg.complete) {
    drawImageCover(leftImg, 98, 322);   // Left placeholder
    drawImageCover(rightImg, 742, 322); // Right placeholder
  }

  // Show the preview
  previewImage.src = canvas.toDataURL();
  actions.style.display = 'flex';
}


  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    actions.style.display = 'none';

    const leftFile = leftPhotoInput.files[0];
    const rightFile = rightPhotoInput.files[0];

    if (!leftFile || !rightFile) return;

    const readerLeft = new FileReader();
    const readerRight = new FileReader();

    readerLeft.onload = function (event) {
      leftImg = new Image();
      leftImg.onload = () => {
        if (rightImg.complete) {
          drawFinalImage();
          previewImage.src = canvas.toDataURL();
          actions.style.display = 'flex';
        }
      };
      leftImg.src = event.target.result;
    };

    readerRight.onload = function (event) {
      rightImg = new Image();
      rightImg.onload = () => {
        if (leftImg.complete) {
          drawFinalImage();
          previewImage.src = canvas.toDataURL();
          actions.style.display = 'flex';
        }
      };
      rightImg.src = event.target.result;
    };

    readerLeft.readAsDataURL(leftFile);
    readerRight.readAsDataURL(rightFile);
  });

  backBtn.addEventListener('click', () => {
    previewImage.src = canvas.toDataURL(); // reset to last rendered image
    actions.style.display = 'none';
  });

  confirmBtn.addEventListener('click', () => {
    const copies = Math.min(5, parseInt(copiesInput.value) || 1);
    canvas.toBlob(blob => {
      for (let i = 0; i < copies; i++) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `snapstrip-print-${Date.now()}-${i + 1}.png`;
        a.click();
      }
    }, 'image/png');
  });
});
