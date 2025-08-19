window.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const leftInput = document.getElementById('leftPhoto');
  const rightInput = document.getElementById('rightPhoto');
  const previewImage = document.getElementById('previewImage');
  const actions = document.getElementById('actions');
  const copiesInput = document.getElementById('copies');
  const confirmBtn = document.getElementById('confirmBtn');

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1500;
  canvas.height = 1050;

  const templateImg = new Image();
  templateImg.src = 'template.png';
  templateImg.onload = () => {
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
    previewImage.src = canvas.toDataURL();
  };

  const PLACE_SIZE = 600;
  const PLACE_LEFT = { x: 105, y: 345 };
  const PLACE_RIGHT = { x: 795, y: 345 };

  let leftImg = null;
  let rightImg = null;

  function drawCentered(image, bottomLeft) {
    const centerX = bottomLeft.x + PLACE_SIZE / 2;
    const centerY = bottomLeft.y + PLACE_SIZE / 2;

    const scale = Math.min(PLACE_SIZE / image.width, PLACE_SIZE / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;

    const dx = centerX - drawW / 2;
    const dy = centerY - drawH / 2;

    ctx.drawImage(image, dx, dy, drawW, drawH);
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!leftInput.files[0] || !rightInput.files[0]) {
      return alert('Please upload both photos.');
    }

    leftImg = await loadImage(leftInput.files[0]);
    rightImg = await loadImage(rightInput.files[0]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

    drawCentered(leftImg, PLACE_LEFT);
    drawCentered(rightImg, PLACE_RIGHT);

    previewImage.src = canvas.toDataURL();
    actions.style.display = 'flex';
  });

  confirmBtn.addEventListener('click', () => {
    const copies = parseInt(copiesInput.value, 10);
    if (isNaN(copies) || copies < 1 || copies > 5) {
      return alert('Select between 1 to 5 copies.');
    }

    const filename = `snapstrip_${Date.now()}.jpg`;
    canvas.toBlob((blob) => {
      for (let i = 0; i < copies; i++) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}_${i+1}.jpg`;
        a.click();
      }
      alert(`${copies} copy/copies created.`);
    }, 'image/jpeg');
  });

  // Helper: load image from file
  function loadImage(file) {
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
});