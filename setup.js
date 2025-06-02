#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Hathor TipBot...\n');

// Check if required files exist
const requiredFiles = ['db.js', 'index.js', 'sentiment.py'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles.join(', '));
    console.log('Make sure you have all the necessary files in the project directory.');
    process.exit(1);
}

// Test database connection
console.log('📊 Testing database connection...');
try {
    const db = require('./db.js');
    console.log('✅ Database connection successful!');
} catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
}

// Test Python and transformers
console.log('🧠 Testing sentiment analysis...');
exec('python3 -c "from transformers import pipeline; print(\'Transformers available\')"', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Python transformers not available. Installing...');
        exec('pip3 install transformers torch', (installError, installStdout, installStderr) => {
            if (installError) {
                console.error('❌ Failed to install transformers:', installError.message);
                console.log('Please install manually: pip3 install transformers torch');
            } else {
                console.log('✅ Transformers installed successfully!');
                testSentiment();
            }
        });
    } else {
        console.log('✅ Transformers already available!');
        testSentiment();
    }
});

function testSentiment() {
    exec('python3 sentiment.py "This is amazing!"', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Sentiment analysis test failed:', error.message);
        } else {
            console.log('✅ Sentiment analysis test passed!');
            console.log('Result:', stdout.trim());
        }
        
        // Test bot token validity
        testBotToken();
    });
}

function testBotToken() {
    console.log('🤖 Testing bot token...');
    const { Telegraf } = require('telegraf');
    const bot = new Telegraf('7376741953:AAFfJy6LK2XgsPqH3p2TkZSSlDJqU-WwfEs');
    
    bot.telegram.getMe()
        .then(botInfo => {
            console.log('✅ Bot token is valid!');
            console.log('Bot name:', botInfo.first_name);
            console.log('Bot username:', botInfo.username);
            
            // Test wallet (basic initialization)
            testWallet();
        })
        .catch(error => {
            console.error('❌ Bot token test failed:', error.message);
            console.log('Please check your bot token.');
        });
}

function testWallet() {
    console.log('💰 Testing wallet initialization...');
    const { HathorWallet, Network } = require('@hathor/wallet-lib');
    
    try {
        const wallet = new HathorWallet({
            seed: 'item mechanic tide start pair picnic steak friend void patient survey ecology sea goose letter grass concert shrug force holiday worry alone spare pattern',
            network: new Network('testnet'),
            connection: {
                nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
            },
        });
        
        console.log('✅ Wallet initialized successfully!');
        console.log('🎉 Setup complete! You can now run the bot with: node index.js');
        
    } catch (error) {
        console.error('❌ Wallet initialization failed:', error.message);
        console.log('Please check your wallet configuration.');
    }
}

// Display configuration
console.log('\n📋 Current Configuration:');
console.log('Bot Token: 7376741953:AAF...WwfEs (configured)');
console.log('Wallet Seed: item mechanic tide... (configured)');
console.log('Network: Hathor Nano Testnet Alpha');
console.log('Node URL: https://node.alpha.nano-testnet.hathor.network/v1a/\n');