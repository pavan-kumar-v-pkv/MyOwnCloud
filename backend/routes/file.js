const express = require('express'); // Express framework for building web applications
const router = express.Router(); // Create a new router instance
const path = require('path'); // For working with file paths

const multer = require('multer'); // Middleware for handling multipart/form-data, used for file uploads
const auth = require('../middleware/auth'); // Custom middleware for authentication
const { 
    uploadFiles, 
    downloadZip, 
    generateShareLink, 
    downloadPublicFile,
    bulkDeleteFiles,
    listUserFile,
    downloadFile
} = require('../controllers/fileController'); // Import all file controller functions

// Configure multer for file storage in /uploads directory
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Set the destination directory for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set the filename to current timestamp + original name
    }
});

const upload = multer({ storage }); // Create a multer instance with the defined storage configuration
const { checkFilePermission } = require('../middleware/checkPermission'); // Import permission checking middleware
const { grantFilePermission, revokeFilePermission } = require('../controllers/fileController');

// POST /api/upload - requires login, accepts one file in form-data
// ⚠ upload.single('file') means:
// The form field name must be file:

// form-data:
//   Key: file
//   Value: (choose file)
router.post('/upload', auth, upload.array('files', 10), uploadFiles);
router.post()
router.get('/files', auth, listUserFile); // GET /api/files - requires login, lists all files for the authenticated user
// router.get('/files/:id', auth, downloadFile); // GET /api/files/:id
router.get('/files/:id', auth, checkFilePermission('download'), downloadFile);
router.post('/files/:id/share', auth, generateShareLink); // POST /api/files/:id/share - generate share link for a file
// route to serve thumbnails
router.get('/thumbnails/:filename', (req, res) => {
    const thumbnailPath = path.join(__dirname, '../uploads/thumbnails', req.params.filename);
    res.sendFile(thumbnailPath);
});
// route to download multiple files as zip
router.post('/download-zip', auth, downloadZip);
// route to bulk delete files
router.post('/bulk-delete', auth, bulkDeleteFiles);
// Grant file permission (admin or editor only)

// Grant file permission (owner only)
router.post('/:id/permissions', auth, grantFilePermission);

// Revoke file permission (owner only)
router.delete('/:id/permissions', auth, revokeFilePermission);


module.exports = router; // Export the router to be used in the main app
