const express = require('express'); // Import the Express framework for building web applications
const dotenv = require('dotenv'); // to load environment variables from .env file
const cors = require('cors'); // Import CORS middleware
const { PrismaClient } = require('./generated/prisma'); // Prisma ORM to access the database

dotenv.config(); // Load environment variables from .env file
const app = express(); // Initialize Express application
const prisma = new PrismaClient(); // Create a new Prisma DB client instance
const PORT = process.env.PORT || 8000; // define the port for the server

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from React app
    credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Load the auth routes (registration, login)
const authRoutes = require('./routes/auth'); // Import authentication routes
app.use('/api', authRoutes); // Use the auth routes under the /api path, mount them at /api/register and /api/login

// Test route to check auth middleware
const authMiddleware = require('./middleware/auth'); // Import the authentication middleware
app.get('/private', authMiddleware, (req, res) => {
    res.json({message: `Welcome User ID ${req.user.userId}`})
});

// Debug route to see auth token and user info
app.get('/api/debug/auth', authMiddleware, (req, res) => {
    res.json({
        user: req.user,
        message: 'Auth is working correctly'
    });
});

app.get('/', (req, res) => {
    res.send({message: "Welcome to MyOwnCloud!"});
});

// Load the file upload routes
const fileRoutes = require('./routes/file'); // Import file upload routes
app.use('/api', fileRoutes); // Use the file routes under the /api path

// Load the folder routes
const folderRoutes = require('./routes/folderRoutes');
app.use('/api/folders', folderRoutes); // Mount at /api/folders

app.get('/public/:token', require('./controllers/fileController').downloadPublicFile); // Public route to download shared files using the token

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});