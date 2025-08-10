// Defines the routes for file permission management
const express = require('express'); // Import the Express framework for building web applications
const router = express.Router(); // Create a new router instance for handling routes
const { grantFilePermission, revokeFilePermission, listFilePermissions } = require('../controllers/permissionController');
const authenticate = require('../middleware/authenticate'); // Middleware to authenticate user
const checkRole = require('../middleware/checkRole'); // Middleware to check user roles

// Route to grant file permission based on user roles
router.post('/grant', authenticate, checkRole(['admin', 'editor']), grantFilePermission);
// Route to revoke file permission based on user roles
router.post('/revoke', authenticate, checkRole(['admin']), revokeFilePermission);

// Route to list file permissions based on user roles
router.get('/:fileId', authenticate, checkRole(['admin', 'editor', 'viewer']), listFilePermissions);

module.exports = router; // Export the router to be used in the main application file
