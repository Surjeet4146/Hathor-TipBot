# Hathor TipBot - Telegram Bot with Sentiment Analysis

A Telegram bot that integrates with the Hathor blockchain to enable tipping, rewards, proposals, and automatic sentiment-based rewards.

## 🚀 Features

- **User Registration**: Users can register their Hathor wallet addresses
- **Tipping System**: Send HTR tokens to other users via Telegram
- **Admin Rewards**: Admins can reward users with tokens
- **Governance**: Create proposals and vote on them
- **Sentiment Analysis**: Automatic rewards for positive messages using AI
- **Hathor Integration**: Full integration with Hathor blockchain testnet

## 📁 Project Structure

```
├── node_modules/          # Node.js dependencies
├── .gitignore            # Git ignore file
├── README.md             # This file
├── db.js                 # Database setup and configuration
├── index.js              # Main Telegram bot application
├── package-lock.json     # Dependency lock file
├── package.json          # Node.js dependencies and scripts
├── sentiment.py          # Python sentiment analysis using Transformers
├── users.db              # SQLite database (auto-generated)
└── wallet.js             # Wallet utilities (if used)
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Telegram Bot Token (from @BotFather)
- Hathor wallet seed

### Installation

#### 1. Clone and Setup
```bash
git clone https://github.com/Surjeet4146/Hathor-TipBot.git
cd Hathor-TipBot
```

#### 2. Install Node.js Dependencies
```bash
npm install
```

#### 3. Install Python Dependencies
```bash
pip install transformers torch
```

#### 4. Configure the Bot
Edit `index.js` and replace:
```javascript
const bot = new Telegraf('YOUR_BOT_TOKEN_HERE'); // Get from @BotFather
```

And update wallet configuration:
```javascript
const wallet = new HathorWallet({
  seed: 'your-actual-wallet-seed-here',
  network: new Network('testnet'),
  connection: {
    nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
  },
});
```

#### 5. Initialize Database
Make sure `db.js` creates the required tables:
```sql
- users (username, address)
- proposals (id, description, created_at)
- votes (proposal_id, username, vote, tokens)
```

## 🚀 Running the Bot

### In GitHub Codespaces
```bash
# Install dependencies
npm install
pip install transformers torch

# Start the bot
node index.js
```

### Local Development
```bash
# Start the bot
npm start
# or
node index.js
```

## 🤖 Bot Commands

### User Commands
- `/start` - Show welcome message and available commands
- `/register <hathor_address>` - Register your Hathor wallet address
- `/tip @username <amount>` - Send HTR tokens to another user
- `/vote <proposal_id> <yes/no>` - Vote on governance proposals

### Admin Commands
- `/reward @username <amount>` - Reward a user with HTR tokens
- `/propose <description>` - Create a new governance proposal

### Automatic Features
- **Sentiment Rewards**: Positive messages automatically earn 5 HTR tokens
- **Admin Detection**: Automatically detects Telegram group administrators

## 🧠 Sentiment Analysis

The bot uses Hugging Face Transformers to analyze message sentiment:
- **Positive messages**: Automatically rewarded with 5 HTR
- **Neutral/Negative**: No automatic reward
- **Model**: Default sentiment-analysis pipeline from Transformers

Test sentiment analysis:
```bash
python sentiment.py "I love this project!"  # Returns: POSITIVE
python sentiment.py "This is terrible"      # Returns: NEUTRAL_OR_NEGATIVE
```

## 🔧 Configuration

### Environment Variables (Recommended)
Create a `.env` file:
```env
BOT_TOKEN=your_telegram_bot_token
WALLET_SEED=your_hathor_wallet_seed
NODE_URL=https://node.alpha.nano-testnet.hathor.network/v1a/
NETWORK=testnet
```

### Database Configuration
The bot uses SQLite database (`users.db`) with tables:
- `users`: Stores username and Hathor addresses
- `proposals`: Governance proposals
- `votes`: Voting records

## 🌐 Deployment

### GitHub Codespaces (Recommended for Testing)
1. Open repository in Codespaces
2. Run setup commands
3. Configure bot token and wallet seed
4. Start with `node index.js`

### Production Deployment
- Use environment variables for sensitive data
- Consider using mainnet instead of testnet
- Set up proper logging and error handling
- Use process managers like PM2

## 🧪 Testing

### Test the Complete Setup
```bash
# Run the health check script
./test.sh
```

### Manual Testing
```bash
# Test sentiment analysis
python sentiment.py "Amazing project!"

# Test database connection
node -e "const db = require('./db.js'); console.log('DB connected');"

# Test bot (will need valid token)
node index.js
```

## 📊 How It Works

1. **User Registration**: Users register Hathor addresses with `/register`
2. **Message Analysis**: Every text message is analyzed for sentiment
3. **Auto Rewards**: Positive messages trigger automatic 5 HTR rewards
4. **Manual Operations**: Admins can tip, reward, and create proposals
5. **Governance**: Users vote on proposals with their registered addresses

## ⚠️ Important Notes

- **Testnet**: Currently configured for Hathor testnet
- **Security**: Never commit real wallet seeds or bot tokens
- **Permissions**: Only Telegram group admins can use reward/propose commands
- **Rate Limiting**: Consider implementing rate limits for auto-rewards

## 🐛 Troubleshooting

### Common Issues

**Bot not responding:**
```bash
# Check if token is valid
node -e "const {Telegraf} = require('telegraf'); const bot = new Telegraf('YOUR_TOKEN'); bot.telegram.getMe().then(console.log);"
```

**Sentiment analysis failing:**
```bash
pip install --upgrade transformers torch
python sentiment.py "test message"
```

**Wallet connection issues:**
```bash
# Check if Hathor node is accessible
curl https://node.alpha.nano-testnet.hathor.network/v1a/status
```

**Database errors:**
```bash
# Check if database file exists and has correct tables
sqlite3 users.db ".tables"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

## 📝 License

ISC License

## 🔗 Links

- [Hathor Network](https://hathor.network/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Hugging Face Transformers](https://huggingface.co/transformers/)

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/Surjeet4146/Hathor-TipBot/issues)
- Repository: [Hathor-TipBot](https://github.com/Surjeet4146/Hathor-TipBot)