// Main business logic for user authentication

const { PrismaClient } = require('../generated/prisma'); // Import Prisma ORM to access the database
const bcrypt = require('bcrypt'); // Import bcrypt for hashing passwords
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for creating JWTs

const prisma = new PrismaClient(); // Create a new Prisma DB client instance
const JWT_SECRET = process.env.JWT_SECRET // Get the JWT secret from environment variables

// REGISTER CONTROLLER
exports.register = async (req, res) => {
    const { name, email, password } = req.body; // extract user details from request body

    // check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({message: "User already exists with this email"});

    // Hash the password (salt rounds set to 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the new user in the database
    const user = await prisma.user.create({
        data: {
            name, 
            email, 
            password: hashedPassword // store the hashed password
        }
    });

    res.status(201).json({message: "User registered successfully"});
};

// LOGIN CONTROLLER
exports.login = async (req, res) => {
    const { email, password } = req.body; // extract email and password from request body

    // 1. Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({message: 'User not found with this email'});

    // 2. Compare the provided password with the stored hashed password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({message: 'Invalid password'});

    // 3. Create a JWT token with user ID and email
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' }); // token expires in 1 hour

    res.json({ token }); // 4. send the token back to the client
};