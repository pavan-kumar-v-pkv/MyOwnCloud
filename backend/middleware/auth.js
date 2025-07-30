// Protecting routes with authentication middleware
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for verifying JWTs
const JWT_SECRET = process.env.JWT_SECRET; // Get the JWT secret from environment variables

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Get the 'authorization' header
    const token = authHeader?.split(' ')[1]; // Extract the token from the header (format: Bearer <token>)

    if (!token) return res.status(401).json({ message: 'Token missing' }); // If no token is provided, return 401 Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => { // validate the token
        if (err) return res.status(403).json({ message: 'Invalid token'}); // If token is invalid, return 403 Forbidden
        req.user = user; // Attach the user information to the request object
        next(); // Call the next middleware or route handler
    });
};

// Export the middleware to be used in routes
module.exports = authenticateToken; // <-- This is what 'auth' refers to