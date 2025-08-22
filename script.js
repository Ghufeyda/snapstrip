// ============================ CONFIG ============================

// Google Apps Script URL for logging status (your Web App URL)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwaVXXhFHBWMhJG2a0WyWLM_BmiEeG-GXGpVzwbOaoKKvxcZwVFQpemO_hXOtEJT0A/exec';
const DRIVE_FOLDER_ID = "164s0L6MUUaRhYYBaBsvnV-w3pqqU-6U3"; // <-- Your Drive folder ID

// The canvas for image preview
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// File input elements for photo upload
const photo1Input = document.getElementById('photo1');
const photo2Input = document.getElementById('photo2');
const photo3Input = document.getElementById('photo3');

// Dropdown for selecting the number of copies
const copiesSelect = document.getElementById('copies');

// Progress bar elements
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// Action buttons
const downloadButton = document.getElementById('downloadImage');
const printButton = document.getElementById('confirmPrint');

// Array to store the uploaded photos
let uploadedPhotos = [];

// ============================ EVENT LISTENERS ============================

// Upload event listeners for photo inputs
photo1Input.addEventListener('change', () => handleImageUpload(photo1Input));
photo2Input.addEventListener('change', () => handleImageUpload(photo2Input));
photo3Input.addEventListener('change', () => handleImageUpload(photo3Input));

// Print button event listener
printButton.addEventListener('click', () => handlePrint());

// Download button event listener
downloadButton.addEventListener('click', () => handleDownload());

// ============================ HANDLERS ============================

// Handle image upload and preview
function handleImageUpload(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      uploadedPhotos.push(img);  // Add the image to the photos array
      if (uploadedPhotos.length === 3) {
        drawPreview();
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Draw the images on the canvas (preview)
function drawPreview() {
  // Clear canvas before redrawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate image positions and sizes based on canvas size and image dimensions
  const imageWidth = canvas.width / 3;
  const imageHeight = canvas.height;

  uploadedPhotos.forEach((img, index) => {
    const x = index * imageWidth;
    const y = 0;
    ctx.drawImage(img, x, y, imageWidth, imageHeight);
  });
}

// Handle the download action
function handleDownload() {
  const selectedCopies = copiesSelect.value;
  const canvasDataUrl = canvas.toDataURL('image/jpeg');
  
  // Create an anchor element to trigger download
  const anchor = document.createElement('a');
  anchor.href = canvasDataUrl;
  anchor.download = 'collage.jpg';
  anchor.click();
}

// Handle the print action
async function handlePrint() {
  const selectedCopies = copiesSelect.value;
  const canvasDataUrl = canvas.toDataURL('image/jpeg');

  // Show progress bar while printing
  showProgress();

  try {
    // Upload image to Google Drive via Google Apps Script
    const response = await uploadImageToDrive(canvasDataUrl, selectedCopies);

    // If successful, print and log the status
    const { fileId, fileName } = response;

    // Print job will be sent to the Node.js backend (triggered via Gas)
    await printJob(fileId, fileName, selectedCopies);

    // Log success in Google Sheets
    await logPrintStatus(fileName, "printed");

    // Hide progress after print
    hideProgress();
  } catch (error) {
    console.error("Print failed:", error);
    hideProgress();
  }
}

// Upload the image to Google Drive using Google Apps Script
async function uploadImageToDrive(dataUrl, copies) {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: new URLSearchParams({
      photo: dataUrl,
      copies: copies,
      ts: Date.now(),
      folderId: DRIVE_FOLDER_ID // Pass the Folder ID to the GAS script
    })
  });
  const result = await response.json();
  if (result.ok) {
    return { fileId: result.fileId, fileName: result.fileName };
  } else {
    throw new Error("Failed to upload image to Google Drive");
  }
}

// Print job request to Node.js backend (assuming Node.js print listener)
async function printJob(fileId, fileName, copies) {
  const response = await fetch(`${GAS_URL}?action=updateStatus&filename=${fileName}&status=pending`);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error("Failed to update print status");
  }
  
  // Make sure the file gets printed via Node.js
  await fetch(`http://localhost:3000/print?fileId=${fileId}&copies=${copies}`);
}

// Log the print status in Google Sheets
async function logPrintStatus(filename, status) {
  const response = await fetch(`${GAS_URL}?action=updateStatus&filename=${filename}&status=${status}`);
  const result = await response.json();
  if (!result.ok) {
    throw new Error("Failed to log print status");
  }
}

// ============================ PROGRESS BAR ============================

function showProgress() {
  progressContainer.style.display = "block";
  progressBar.value = 0;
  progressText.textContent = "Uploading...";

  let progressInterval = setInterval(() => {
    if (progressBar.value < 100) {
      progressBar.value += 5;
    } else {
      clearInterval(progressInterval);
      progressText.textContent = "Printing...";
    }
  }, 500);
}

function hideProgress() {
  progressContainer.style.display = "none";
  progressBar.value = 0;
  progressText.textContent = "";
}
