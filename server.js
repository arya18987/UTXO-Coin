const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api', apiRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   🚀 UTXO Coin Server Started         ║
    ║   📡 Running on: http://localhost:${PORT}   ║
    ║   💰 Konsep UTXO - Seperti Uang Tunai ║
    ╚═══════════════════════════════════════╝
    `);
});