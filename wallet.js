require('dotenv').config();
const { HathorWallet, Network } = require('@hathor/wallet-lib');

let walletInstance = null;

async function getWalletInstance() {
    if (!walletInstance) {
        console.log('Initializing HATHOR Nano Testnet Alpha wallet...');
        
        walletInstance = new HathorWallet({
            seed: process.env.WALLET_SEED,
            network: new Network('testnet'),
            connection: {
                nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
            },
            connectionTimeout: 30000,
            requestTimeout: 10000,
        });

        try {
            console.log('Starting HATHOR Nano Testnet Alpha wallet...');
            await walletInstance.start();
            console.log('✅ HATHOR Nano Testnet Alpha wallet started successfully!');
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
