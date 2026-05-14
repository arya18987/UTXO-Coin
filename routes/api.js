const express = require('express');
const router = express.Router();
const UTXOEngine = require('../utils/utxoEngine');

// Initialize UTXO Engine (singleton)
const utxoEngine = new UTXOEngine();

// Get balance for an owner
router.get('/balance/:owner', (req, res) => {
    const { owner } = req.params;
    const balance = utxoEngine.getBalance(owner);
    res.json({ success: true, owner, balance });
});

// Get all UTXOs for an owner
router.get('/utxos/:owner', (req, res) => {
    const { owner } = req.params;
    const utxos = utxoEngine.getUTXOs(owner);
    res.json({ success: true, owner, utxos });
});

// Get all UTXOs (full system)
router.get('/utxos', (req, res) => {
    const utxos = utxoEngine.getAllUTXOs();
    res.json({ success: true, utxos });
});

// Send transaction
router.post('/transaction', (req, res) => {
    const { from, to, amount } = req.body;
    
    if (!from || !to || !amount) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: from, to, amount' 
        });
    }
    
    const result = utxoEngine.sendTransaction(from, to, Number(amount));
    res.json(result);
});

// Get transaction history
router.get('/transactions', (req, res) => {
    const history = utxoEngine.getTransactionHistory();
    res.json({ success: true, transactions: history });
});

// Reset system
router.post('/reset', (req, res) => {
    const result = utxoEngine.resetToGenesis();
    res.json(result);
});

// Get system stats
router.get('/stats', (req, res) => {
    const allUTXOs = utxoEngine.getAllUTXOs();
    const owners = [...new Set(allUTXOs.map(u => u.owner))];
    const balances = owners.map(owner => ({
        owner,
        balance: utxoEngine.getBalance(owner),
        utxoCount: utxoEngine.getUTXOs(owner).length
    }));
    
    res.json({
        success: true,
        stats: {
            totalUTXOs: allUTXOs.length,
            totalValue: allUTXOs.reduce((sum, u) => sum + u.amount, 0),
            uniqueOwners: owners.length,
            balances
        }
    });
});

module.exports = router;