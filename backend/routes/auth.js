// Defining routes for user authentication (registration and login)

const express = require('express'); // Import the Express framework for building web applications
const router = express.Router(); // Create a new router instance for handling routes
const { register, login } = require('../controllers/authController'); // Import the authentication controller functions

router.post('/register', register); // Route: POST /api/register -> call register() for user registration
router.post('/login', login); // Route: POST /api/login -> call login() for user login

module.exports = router; // Export the router to be used in the main application file