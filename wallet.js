const { HathorWallet, Network } = require('@hathor/wallet-lib');

let walletInstance = null;

async function getWalletInstance() {
    if (!walletInstance) {
        console.log('Initializing HATHOR Nano Testnet Alpha wallet...');
        
        walletInstance = new HathorWallet({
            seed: 'item mechanic tide start pair picnic steak friend void patient survey ecology sea goose letter grass concert shrug force holiday worry alone spare pattern',
            network: new Network('testnet'), // Nano testnet uses 'testnet' network type
            connection: {
                // Your original Nano Testnet Alpha node URL was correct
                nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
            },
            // Additional configuration for better stability
            connectionTimeout: 30000, // 30 seconds timeout
            requestTimeout: 10000,    // 10 seconds request timeout
        });

        try {
            console.log('Starting HATHOR Nano Testnet Alpha wallet...');
            await walletInstance.start();
            console.log('✅ HATHOR Nano Testnet Alpha wallet started successfully!');
            
            // Verify connection
            const balance = await walletInstance.getBalance();
            console.log('Wallet balance:', balance);
            console.log('Connected to Nano Testnet Alpha network');
            
        } catch (err) {
            console.error('❌ Error starting HATHOR wallet:', err.message);
            walletInstance = null;
            throw new Error(`HATHOR Nano Testnet wallet initialization failed: ${err.message}`);
        }
    }
    return walletInstance;
}

// Function to safely stop wallet
async function stopWallet() {
    if (walletInstance) {
        try {
            await walletInstance.stop();
            walletInstance = null;
            console.log('Wallet stopped successfully.');
        } catch (err) {
            console.error('Error stopping wallet:', err);
        }
    }
}

module.exports = getWalletInstance;