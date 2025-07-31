// Protecting routes with authentication middleware
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for verifying JWTs
const JWT_SECRET = process.env.JWT_SECRET; // Get the JWT secret from environment variables

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    // 1. Get the 'authorization' header
    const authHeader = req.headers['authorization']; // authHeader = "Bearer eyJhbGciOiJIUzI1NiIs..."
    // 2. Extract the token from the header (format: Bearer <token>)
    const token = authHeader?.split(' ')[1]; // token = "eyJhbGciOiJIUzI1NiIs..."
    // 3. Check if token exists
    if (!token) return res.status(401).json({ message: 'Token missing' }); // If no token is provided, return 401 Unauthorized
    // 4. Verify the token and decode it
    jwt.verify(token, JWT_SECRET, (err, user) => { // validate the token
        if (err) return res.status(403).json({ message: 'Invalid token'}); // If token is invalid, return 403 Forbidden
        // 5. If valid, attach decoded data to request
        req.user = user; // user = { userId: 123, iat: ..., exp: ... }
        // 6. Continue to next middleware/route
        next(); 
    });
};

// Export the middleware to be used in routes
module.exports = authenticateToken; // <-- This is what 'auth' refers to