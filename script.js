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

    const maxSize = 280;

    if (leftImg.complete && rightImg.complete) {
      let scaleLeft = Math.min(maxSize / leftImg.width, maxSize / leftImg.height);
      let drawWLeft = leftImg.width * scaleLeft;
      let drawHLeft = leftImg.height * scaleLeft;
      let dxLeft = 123 + (maxSize - drawWLeft) / 2;
      let dyLeft = 403 + (maxSize - drawHLeft) / 2;
      ctx.drawImage(leftImg, dxLeft, dyLeft, drawWLeft, drawHLeft);

      let scaleRight = Math.min(maxSize / rightImg.width, maxSize / rightImg.height);
      let drawWRight = rightImg.width * scaleRight;
      let drawHRight = rightImg.height * scaleRight;
      let dxRight = 928 + (maxSize - drawWRight) / 2;
      let dyRight = 403 + (maxSize - drawHRight) / 2;
      ctx.drawImage(rightImg, dxRight, dyRight, drawWRight, drawHRight);
    }
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
