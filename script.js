window.addEventListener('DOMContentLoaded', () => {
  // ⬇️ Move all your current code INSIDE this block

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

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const leftFile = leftPhotoInput.files[0];
    const rightFile = rightPhotoInput.files[0];
    if (!leftFile || !rightFile) return alert('Please select both photos.');

    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = 'template.png'; // Template must be same-origin (i.e. GitHub Pages)

    templateImg.onload = () => {
      // Set canvas to template size (1754x1240 for 5x3.5in @ 350dpi)
      canvas.width = templateImg.width;
      canvas.height = templateImg.height;

      // Draw template background
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

      const readerLeft = new FileReader();
      const readerRight = new FileReader();

      readerLeft.onload = () => {
        const leftImg = new Image();
        leftImg.onload = () => {
          // Position: 0.35in (123px), 1.15in (403px)
          ctx.drawImage(leftImg, 123, 403, 280, 280); // 2x2in ≈ 280x280px
        };
        leftImg.src = readerLeft.result;
      };

      readerRight.onload = () => {
        const rightImg = new Image();
        rightImg.onload = () => {
          // Position: 2.65in (928px), 1.15in (403px)
          ctx.drawImage(rightImg, 928, 403, 280, 280);
          // Show preview once both images are loaded
          previewImage.src = canvas.toDataURL();
          actions.style.display = 'block';
        };
        rightImg.src = readerRight.result;
      };

      readerLeft.readAsDataURL(leftFile);
      readerRight.readAsDataURL(rightFile);
    };

    templateImg.onerror = () => {
      alert("Error loading template image. Make sure it's hosted on the same server.");
    };
  });

  confirmBtn.addEventListener('click', () => {
    const numCopies = parseInt(copiesInput.value, 10);
    if (isNaN(numCopies) || numCopies < 1 || numCopies > 5) {
      return alert('Please enter a valid number of copies (1–5).');
    }

    const filename = `snapstrip_${Date.now()}.jpg`;

    try {
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();

        alert(`${numCopies} copy/copies will be printed.`);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        actions.style.display = 'none';
        uploadForm.reset();
      }, 'image/jpeg');
    } catch (err) {
      alert('Error: Unable to generate print file. Make sure image sources are not cross-origin.');
      console.error(err);
    }
  });

  backBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    actions.style.display = 'none';
    previewImage.src = '';
    uploadForm.reset();
  });
});
