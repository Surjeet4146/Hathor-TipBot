#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Telegraf } = require('telegraf');
const getWalletInstance = require('./wallet.js');

console.log('🚀 Setting up Hathor TipBot...\n');

// Check if required files exist
const requiredFiles = ['db.js', 'index.js', 'wallet.js'];
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

// Test sentiment analysis
console.log('🧠 Testing sentiment analysis...');
try {
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
    const result = sentiment.analyze('This is amazing!');
    if (result.score > 0) {
        console.log('✅ Sentiment analysis test passed! Result: POSITIVE');
    } else {
        console.error('❌ Sentiment analysis test failed: Expected POSITIVE');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Sentiment analysis test failed:', error.message);
    process.exit(1);
}

// Test bot token validity
console.log('🤖 Testing bot token...');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.getMe()
    .then(botInfo => {
        console.log('✅ Bot token is valid!');
        console.log('Bot name:', botInfo.first_name);
        console.log('Bot username:', botInfo.username);
        testWallet();
    })
    .catch(error => {
        console.error('❌ Bot token test failed:', error.message);
        console.log('Please check your BOT_TOKEN in .env.');
        process.exit(1);
    });

async function testWallet() {
    console.log('💰 Testing wallet initialization...');
    try {
        await getWalletInstance();
        console.log('✅ Wallet initialized successfully!');
        console.log('🎉 Setup complete! You can now run the bot with: npm start');
    } catch (error) {
        console.error('❌ Wallet initialization failed:', error.message);
        console.log('Please check your WALLET_SEED in .env and network configuration.');
        process.exit(1);
    }
}

// Display configuration
console.log('\n📋 Current Configuration:');
console.log('Bot Token:', process.env.BOT_TOKEN ? 'Configured' : 'Not configured');
console.log('Wallet Seed:', process.env.WALLET_SEED ? 'Configured' : 'Not configured');
console.log('Network: Hathor Nano Testnet Alpha');
console.log('Node URL: https://node.alpha.nano-testnet.hathor.network/v1a/\n');
