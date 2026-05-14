// Frontend Application Logic

const API_BASE = '/api';
let refreshInterval = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    checkServerConnection();
    loadAllData();
    
    // Set up event listeners
    document.getElementById('sendBtn').addEventListener('click', sendTransaction);
    document.getElementById('resetBtn').addEventListener('click', resetSystem);
    
    // Auto-refresh every 5 seconds
    refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadUTXOs();
            loadTransactionLog();
            loadSystemStats();
        }
    }, 5000);
});

// Check server connection
async function checkServerConnection() {
    const statusDiv = document.getElementById('serverStatus');
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (response.ok) {
            statusDiv.innerHTML = '✅ Connected to UTXO Coin Server';
            statusDiv.className = 'server-status connected';
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        statusDiv.innerHTML = '❌ Disconnected from server. Make sure server is running on port 3000';
        statusDiv.className = 'server-status disconnected';
        console.error('Server connection error:', error);
    }
}

// Load all data
async function loadAllData() {
    await Promise.all([
        loadBalance(),
        loadUTXOs(),
        loadTransactionLog(),
        loadSystemStats()
    ]);
}

// Load balance for Arya
async function loadBalance() {
    try {
        const response = await fetch(`${API_BASE}/balance/arya`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('totalBalance').textContent = data.balance;
        }
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// Load UTXOs for Arya
async function loadUTXOs() {
    try {
        const response = await fetch(`${API_BASE}/utxos/arya`);
        const data = await response.json();
        
        const utxoListDiv = document.getElementById('utxoList');
        
        if (data.success && data.utxos.length > 0) {
            utxoListDiv.innerHTML = data.utxos.map(utxo => `
                <div class="utxo-item">
                    <div class="utxo-info">
                        <div class="utxo-id">🔹 ID: ${UTXOCore.formatUTXOId(utxo.id)}</div>
                        <div class="utxo-amount">💰 ${utxo.amount} UTXO</div>
                        <div class="utxo-date">📅 ${UTXOCore.formatDate(utxo.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            utxoListDiv.innerHTML = '<div class="empty-state">✨ Tidak ada UTXO. Lakukan reset jika perlu ✨</div>';
        }
    } catch (error) {
        console.error('Error loading UTXOs:', error);
        document.getElementById('utxoList').innerHTML = '<div class="empty-state">❌ Error loading UTXOs</div>';
    }
}

// Load transaction log
async function loadTransactionLog() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);
        const data = await response.json();
        
        const logDiv = document.getElementById('transactionLog');
        
        if (data.success && data.transactions.length > 0) {
            logDiv.innerHTML = data.transactions.map(tx => `
                <div class="log-entry">
                    <div class="log-timestamp">📅 ${UTXOCore.formatDate(tx.timestamp)}</div>
                    <div class="log-description">📝 ${tx.description}</div>
                    ${tx.spentUTXOs ? `
                        <div class="log-details">
                            🔴 Spent UTXOs: ${tx.spentUTXOs.map(u => `${u.amount}`).join(' + ')}
                        </div>
                    ` : ''}
                    ${tx.newUTXOs ? `
                        <div class="log-details">
                            🟢 New UTXOs: ${tx.newUTXOs.map(u => `${u.amount} (${u.owner})`).join(' + ')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            logDiv.innerHTML = '<div class="empty-state">📭 Belum ada transaksi</div>';
        }
    } catch (error) {
        console.error('Error loading transaction log:', error);
    }
}

// Load system statistics
async function loadSystemStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        const statsDiv = document.getElementById('systemStats');
        
        if (data.success) {
            statsDiv.innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Total UTXO</div>
                    <div class="stat-value">${data.stats.totalUTXOs}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Value</div>
                    <div class="stat-value">${data.stats.totalValue}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Owners</div>
                    <div class="stat-value">${data.stats.uniqueOwners}</div>
                </div>
                ${data.stats.balances.map(b => `
                    <div class="stat-card">
                        <div class="stat-label">${b.owner}</div>
                        <div class="stat-value">${b.balance} (${b.utxoCount} UTXO)</div>
                    </div>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Send transaction
async function sendTransaction() {
    const recipient = document.getElementById('recipient').value.trim();
    const amount = parseInt(document.getElementById('amount').value);
    
    // Clear previous messages
    hideMessages();
    
    // Validation
    if (!recipient) {
        showError('Penerima tidak boleh kosong');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showError('Jumlah harus lebih dari 0');
        return;
    }
    
    if (recipient === 'arya') {
        showError('Tidak bisa kirim ke diri sendiri');
        return;
    }
    
    // Disable button while processing
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Memproses...';
    
    try {
        const response = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'arya',
                to: recipient,
                amount: amount
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`✅ Berhasil mengirim ${amount} UTXO ke ${recipient}! Kembalian: ${result.data.changeAmount} UTXO`);
            
            // Clear input
            document.getElementById('amount').value = '';
            
            // Reload all data
            await loadAllData();
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error sending transaction:', error);
        showError('Gagal mengirim transaksi. Periksa koneksi server.');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = '🚀 Kirim Transaksi';
    }
}

// Reset system
async function resetSystem() {
    if (confirm('⚠️ Reset akan menghapus semua UTXO dan transaksi. Lanjutkan?')) {
        try {
            const response = await fetch(`${API_BASE}/reset`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess('🔄 System berhasil direset ke genesis UTXO');
                await loadAllData();
            } else {
                showError('Gagal reset system');
            }
        } catch (error) {
            console.error('Error resetting system:', error);
            showError('Gagal reset system');
        }
    }
}

// Helper functions
function hideMessages() {
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';
    document.getElementById('errorMsg').innerHTML = '';
    document.getElementById('successMsg').innerHTML = '';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMsg');
    successDiv.innerHTML = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}