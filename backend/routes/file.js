// Defines the API endpoint for file uploads.
const express = require('express'); // Express framework for building web applications
const router = express.Router(); // Create a new router instance

const multer = require('multer'); // Middleware for handling multipart/form-data, used for file uploads
const auth = require('../middleware/auth'); // Custom middleware for authentication
const { uploadFile } = require('../controllers/fileController'); // Import the file upload controller

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

// POST /api/upload - requires login, accepts one file in form-data
// ⚠ upload.single('file') means:
// The form field name must be file:

// form-data:
//   Key: file
//   Value: (choose file)
router.post('/upload', auth, upload.single('file'), uploadFile);

const { listUserFile, downloadFile } = require('../controllers/fileController'); // Import file controller functions
router.get('/files', auth, listUserFile); // GET /api/files - requires login, lists all files for the authenticated user
router.get('/files/:id', auth, downloadFile); // GET /api/files/:id

module.exports = router; // Export the router to be used in the main app