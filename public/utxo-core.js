// Shared UTXO Core Logic (Frontend)
// Sama seperti backend, untuk konsistensi

class UTXOCore {
    static formatUTXOId(id) {
        return id.substring(0, 8) + '...' + id.substring(id.length - 4);
    }
    
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID');
    }
    
    static calculateTotalBalance(utxos) {
        return utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    }
    
    static groupByOwner(utxos) {
        const groups = {};
        utxos.forEach(utxo => {
            if (!groups[utxo.owner]) {
                groups[utxo.owner] = [];
            }
            groups[utxo.owner].push(utxo);
        });
        return groups;
    }
}