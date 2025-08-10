const express = require('express'); // Import the Express framework for building web applications
const router = express.Router(); // Create a new router instance for handling routes
const { createFolder, getFolders, deleteFolder } = require('../controllers/folderController');
const authenticate = require('../middleware/auth'); // Middleware to authenticate user

// Debugging route to see what's happening
router.get('/debug', authenticate, (req, res) => {
    res.json({ 
        message: 'Folder routes are working', 
        user: req.user 
    });
});

// Route to create a new folder - accept requests at both endpoints
router.post('/', authenticate, createFolder);
router.post('/create', authenticate, createFolder);
router.get('/', authenticate, getFolders);
router.delete('/:id', authenticate, deleteFolder); // Route to delete a folder

module.exports = router; // Export the router to be used in the main application file