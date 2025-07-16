const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Add headers for better mobile compatibility
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏴‍☠️ Pirate Sea server is running on http://localhost:${PORT}`);
    console.log(`🌐 External access: http://130.162.55.51:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nServer shutting down...');
    process.exit(0);
});