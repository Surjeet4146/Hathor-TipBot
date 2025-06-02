#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🧪 Running Hathor TipBot Tests...\n');

// Test 1: Database
console.log('1️⃣ Testing Database...');
try {
    const db = require('./db.js');
    console.log('✅ Database: OK\n');
} catch (error) {
    console.error('❌ Database: FAILED -', error.message, '\n');
}

// Test 2: Bot Token
console.log('2️⃣ Testing Bot Token...');
const { Telegraf } = require('telegraf');
const bot = new Telegraf('7376741953:AAFfJy6LK2XgsPqH3p2TkZSSlDJqU-WwfEs');

bot.telegram.getMe()
    .then(botInfo => {
        console.log('✅ Bot Token: OK');
        console.log(`   Bot: @${botInfo.username} (${botInfo.first_name})\n`);
        
        // Test 3: Wallet
        testWallet();
    })
    .catch(error => {
        console.error('❌ Bot Token: FAILED -', error.message, '\n');
        testWallet();
    });

function testWallet() {
    console.log('3️⃣ Testing Wallet...');
    const { HathorWallet, Network } = require('@hathor/wallet-lib');
    
    try {
        const wallet = new HathorWallet({
            seed: 'item mechanic tide start pair picnic steak friend void patient survey ecology sea goose letter grass concert shrug force holiday worry alone spare pattern',
            network: new Network('testnet'),
            connection: {
                nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
            },
        });
        
        console.log('✅ Wallet: OK');
        console.log('   Network: Hathor Nano Testnet Alpha\n');
        
        // Test 4: Sentiment Analysis
        testSentiment();
    } catch (error) {
        console.error('❌ Wallet: FAILED -', error.message, '\n');
        testSentiment();
    }
}

function testSentiment() {
    console.log('4️⃣ Testing Sentiment Analysis...');
    
    exec('python3 sentiment.py "I love this project!"', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Sentiment: FAILED -', error.message);
            console.log('   Try: pip3 install transformers torch\n');
        } else {
            const result = stdout.trim();
            console.log('✅ Sentiment: OK');
            console.log(`   Test result: "${result}"\n`);
        }
        
        // Final summary
        showSummary();
    });
}

function showSummary() {
    console.log('📊 Test Summary:');
    console.log('================');
    console.log('Bot Token: 7376741953:AAF...WwfEs');
    console.log('Wallet Seed: item mechanic tide... (Configured)');
    console.log('Network: Hathor Nano Testnet Alpha');
    console.log('Node: https://node.alpha.nano-testnet.hathor.network/v1a/');
    console.log('');
    console.log('🚀 If all tests passed, run: node index.js');
    console.log('💡 Or use the enhanced version for better features!');
}