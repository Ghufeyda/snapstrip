====================================
 SnapStrip Collage Printer
====================================

A self-service photo collage web app for events. Guests can upload up to 3 photos, preview them in a fixed collage template, and either download a JPEG keepsake or send a print request (JPEG uploaded to Google Drive via Google Apps Script).

------------------------------------
✨ Features
------------------------------------
- Upload up to 3 photos
- Automatic scaling + centering into placeholders
- Collage overlay template (template.png)
- Download button → generates .jpg image
- Print button → uploads .jpg to Google Drive
- Copies dropdown (1–5) to request multiple copies
- Progress bar + disabled Print button during upload
- Minimal, mobile-friendly design
- Footer pinned to bottom

------------------------------------
🛠️ Tech Stack
------------------------------------
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Google Apps Script (Web App)
- Storage: Google Drive (event photo folder)
- Printer: Epson L8050 (via Mac print queue integration)

------------------------------------
📂 Project Structure
------------------------------------
/snapstrip
 ├── index.html       # Main UI (upload, preview, controls)
 ├── style.css        # Stylesheet (layout, buttons, progress bar)
 ├── script.js        # Core logic (canvas, upload, print flow)
 ├── template.png     # Collage overlay template
 └── README.txt       # Documentation (this file)

------------------------------------
🚀 Setup & Deployment
------------------------------------
1. Google Apps Script (Backend)
   - Create a new Apps Script project.
   - Paste the backend uploader code.
   - Replace placeholder FOLDER_ID with your Drive folder ID.
   - Deploy as Web App:
     - Execute as: Me
     - Who has access: Anyone with the link
   - Copy your Web App URL and update `script.js` CONFIG.

2. Frontend (Local or Hosted)
   - Place index.html, style.css, script.js, and template.png in the same folder.
   - Host via GitHub Pages, Netlify, or a local server.
   - Update CONFIG in script.js with your Apps Script URL.

3. Printing Integration
   - On event day, set up a Mac or local machine that:
     - Monitors the Google Drive folder.
     - Auto-downloads new uploads.
     - Sends them to Epson printer via lp (CUPS).
     - Moves printed files to a /printed subfolder.

------------------------------------
🔄 User Flow
------------------------------------
1. Guest uploads up to 3 photos.
2. Collage preview is shown on canvas.
3. Guest selects number of copies (dropdown).
4. Options:
   - Download → saves JPEG locally.
   - Print → uploads JPEG to Drive via Apps Script.
5. Drive watcher/queue picks up new files → sends to printer.

------------------------------------
📌 Notes for Developers
------------------------------------
- CONFIG block in script.js centralizes all constants.
- Progress helpers manage upload feedback (show, update, hide).
- Scaling logic inside drawPreview() ensures photos are centered without distortion.
- Error handling covers invalid images, failed uploads, and malformed responses.

------------------------------------
🔮 Future Enhancements
------------------------------------
- Logging uploads to Google Sheets (filename, copies, timestamp, guest name).
- QR code generation on printouts.
- Camera WiFi sync for direct uploads.
- Captions or labels under photos.
- Drag-and-drop upload support.

------------------------------------
👨‍💻 Contributors
------------------------------------
- Lead Developer: Rufaidah
- Use Case: Wedding / Event Photo Booth
