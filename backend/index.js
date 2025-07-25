const express = require('express');
const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send({message: "Welcome to MyOwnCloud!"});
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});