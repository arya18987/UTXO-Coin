const { v4: uuidv4 } = require('uuid');

/**
 * UTXO Engine - Core Business Logic
 * Konsep: Saldo = penjumlahan semua UTXO yang belum terpakai
 */

class UTXOEngine {
    constructor() {
        // UTXO Database: array of { id, owner, amount, createdAt }
        this.utxos = [];
        
        // Transaction history
        this.transactions = [];
        
        // Initialize with genesis UTXO
        this.initGenesis();
    }

    // Genesis block: 1000 UTXO untuk Arya
    initGenesis() {
        const genesisUTXO = {
            id: uuidv4(),
            owner: 'arya',
            amount: 100000,
            createdAt: new Date().toISOString(),
            txId: 'genesis'
        };
        this.utxos.push(genesisUTXO);
        
        this.addTransactionLog({
            type: 'GENESIS',
            description: `Genesis UTXO dibuat: 100000 UTXO untuk arya`,
            utxos: [genesisUTXO]
        });
    }

    // Get balance for specific owner (sum of all UTXOs)
    getBalance(owner) {
        return this.utxos
            .filter(utxo => utxo.owner === owner)
            .reduce((sum, utxo) => sum + utxo.amount, 0);
    }

    // Get all UTXOs for specific owner
    getUTXOs(owner) {
        return this.utxos.filter(utxo => utxo.owner === owner);
    }

    // Get all UTXOs (for debugging/admin)
    getAllUTXOs() {
        return [...this.utxos];
    }

    // Get transaction history
    getTransactionHistory() {
        return [...this.transactions];
    }

    // Add transaction log
    addTransactionLog(log) {
        this.transactions.unshift({
            ...log,
            timestamp: new Date().toISOString(),
            id: uuidv4()
        });
        
        // Keep only last 50 transactions
        if (this.transactions.length > 50) {
            this.transactions.pop();
        }
    }

    // Core UTXO transaction logic
    sendTransaction(from, to, amount) {
        // Validations
        if (amount <= 0) {
            return { success: false, error: 'Jumlah harus lebih dari 0' };
        }
        
        if (from === to) {
            return { success: false, error: 'Tidak bisa kirim ke diri sendiri' };
        }
        
        const currentBalance = this.getBalance(from);
        if (currentBalance < amount) {
            return { 
                success: false, 
                error: `Saldo tidak cukup! (Saldo: ${currentBalance} UTXO, Dibutuhkan: ${amount} UTXO)` 
            };
        }

        // Step 1: Get all UTXOs of sender, sort by amount (largest first - greedy)
        let senderUTXOs = this.utxos
            .filter(utxo => utxo.owner === from)
            .sort((a, b) => b.amount - a.amount);
        
        // Step 2: Select UTXOs until sum >= amount
        let selectedUTXOs = [];
        let selectedSum = 0;
        
        for (let utxo of senderUTXOs) {
            if (selectedSum >= amount) break;
            selectedUTXOs.push(utxo);
            selectedSum += utxo.amount;
        }

        // Step 3: Remove spent UTXOs
        const spentIds = new Set(selectedUTXOs.map(u => u.id));
        this.utxos = this.utxos.filter(utxo => !spentIds.has(utxo.id));

        // Step 4: Calculate change
        const changeAmount = selectedSum - amount;

        // Step 5: Create new UTXOs
        const newUTXOs = [];
        
        // UTXO for recipient
        const recipientUTXO = {
            id: uuidv4(),
            owner: to,
            amount: amount,
            createdAt: new Date().toISOString(),
            txId: uuidv4()
        };
        newUTXOs.push(recipientUTXO);
        
        // UTXO for change (if any)
        if (changeAmount > 0) {
            const changeUTXO = {
                id: uuidv4(),
                owner: from,
                amount: changeAmount,
                createdAt: new Date().toISOString(),
                txId: uuidv4()
            };
            newUTXOs.push(changeUTXO);
        }
        
        // Add new UTXOs to the system
        this.utxos.push(...newUTXOs);

        // Step 6: Log transaction
        this.addTransactionLog({
            type: 'TRANSACTION',
            from,
            to,
            amount,
            changeAmount,
            spentUTXOs: selectedUTXOs.map(u => ({ id: u.id, amount: u.amount })),
            newUTXOs: newUTXOs.map(u => ({ id: u.id, owner: u.owner, amount: u.amount })),
            description: `${from} mengirim ${amount} UTXO ke ${to} | UTXO spent: ${selectedUTXOs.length} buah | Kembalian: ${changeAmount} UTXO`
        });

        return {
            success: true,
            data: {
                from,
                to,
                amount,
                changeAmount,
                spentUTXOs: selectedUTXOs,
                newUTXOs,
                newBalance: this.getBalance(from)
            }
        };
    }

    // Reset to genesis state
    resetToGenesis() {
        this.utxos = [];
        this.transactions = [];
        this.initGenesis();
        
        this.addTransactionLog({
            type: 'RESET',
            description: 'System reset to genesis state'
        });
        
        return { success: true };
    }
}

module.exports = UTXOEngine;