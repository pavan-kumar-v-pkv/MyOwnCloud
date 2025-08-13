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
const { PrismaClient } = require("../generated/prisma"); // Import Prisma client for database operations
const prisma = new PrismaClient(); // Create a new Prisma client instance
const upload = multer({ storage }); // Create a multer instance with the defined storage configuration
const { checkFilePermission } = require('../middleware/checkPermission'); // Import permission checking middleware
const { grantFilePermission, revokeFilePermission } = require('../controllers/fileController');
const { analyzeFile } = require("../ai/analyzeFiles"); // Import the AI file analysis function

// POST /api/upload - requires login, accepts one file in form-data
// ⚠ upload.single('file') means:
// The form field name must be file:

// form-data:
//   Key: file
//   Value: (choose file)
router.post('/upload', auth, upload.array('files', 10), uploadFiles);
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

// POST /api/files/:id/analyze
router.post("/files/:id/analyze", auth, async (req, res) => {
    const fileId = parseInt(req.params.id); // Get file ID from request parameters
    if (Number.isNaN(fileId)) return res.status(400).json({ message: "Invalid file id" });

    try{
        // fetch file record
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if(!file) return res.status(404).json({ message: "File not found" });
        if(file.userId !== req.user.userId)
            return res.status(403).json({ message: "You do not have permission to analyze this file" });

        // run analyze pipeline
        const analysis = await analyzeFile(file); // Call the AI analysis function

        // Save to db
        const updated = await prisma.file.update({
            where: { id: fileId },
            data: { 
                textExtract: analysis.textExtract,
                tags: analysis.tags,
                category: analysis.category
                // embedding field removed - not in schema and not supported by Groq
            }
        });

        res.json({ success: true, file: updated });
    } catch (err) {
        console.error("Error analyzing file:", err);
        res.status(500).json({ message: "Internal server error, Analysis failed" });
    }
});

// GET /api/files/search?q=your query - FIXED to work without embeddings
router.get("/files/search", auth, async (req, res) => {
    const q = String(req.query.q || "").trim();
    if(!q) return res.status(400).json({ message: "Search query cannot be empty" });
    
    try {
        console.log(`Searching for: "${q}" for user ${req.user.userId}`);
        
        // Search in filename, textExtract, tags, and category using text matching
        const files = await prisma.file.findMany({
            where: {
                userId: req.user.userId,
                OR: [
                    // Search in filename
                    { filename: { contains: q, mode: 'insensitive' } },
                    // Search in extracted text content
                    { textExtract: { contains: q, mode: 'insensitive' } },
                    // Search in tags array
                    { tags: { has: q } },
                    // Search in category
                    { category: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                filename: true,
                mimetype: true,
                size: true,
                createdAt: true,
                tags: true,
                category: true,
                textExtract: true,
                folderId: true
            }
        });

        console.log(`Found ${files.length} files matching "${q}"`);
        
        // Return search results
        res.json({ 
            results: files.map(file => ({
                ...file,
                // Add search relevance info
                matchReason: getMatchReason(file, q)
            }))
        });

    } catch (err) {
        console.error("Error searching files:", err);
        res.status(500).json({ message: "Internal server error, Search failed" });
    }
});

// Helper function to determine why a file matched
function getMatchReason(file, query) {
    const q = query.toLowerCase();
    if (file.filename.toLowerCase().includes(q)) return 'filename';
    if (file.category?.toLowerCase().includes(q)) return 'category';
    if (file.tags?.some(tag => tag.toLowerCase().includes(q))) return 'tags';
    if (file.textExtract?.toLowerCase().includes(q)) return 'content';
    return 'unknown';
}

module.exports = router; // Export the router to be used in the main app
