require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const RateLimit = require('telegraf-rate-limit');
const Sentiment = require('sentiment');
const winston = require('winston');
const express = require('express');
const db = require('./db.js');
const getWalletInstance = require('./wallet.js');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const sentiment = new Sentiment();

const limitConfig = {
  window: 1000,
  limit: 5,
  onLimitExceeded: (ctx) => ctx.reply('Rate limit exceeded. Try again later.')
};
bot.use(RateLimit(limitConfig));

bot.command('register', (ctx) => {
  const username = ctx.message.from.username;
  const address = ctx.message.text.split(' ')[1];
  if (!address || !address.startsWith('W')) return ctx.reply('Usage: /register <valid_hathor_address>');

  db.run('INSERT OR REPLACE INTO users (username, address) VALUES (?, ?)', [username, address], (err) => {
    if (err) {
      logger.error(`Error registering address for ${username}:`, err);
      return ctx.reply('Error registering address.');
    }
    logger.info(`Registered address for ${username}: ${address}`);
    ctx.reply('Address registered!');
  });
});

bot.command('tip', async (ctx) => {
  const [_, username, amount] = ctx.message.text.split(' ');
  if (!username || !amount) return ctx.reply('Usage: /tip @username <amount>');

  const receiver = username.replace('@', '');
  const amountInt = parseInt(amount);
  if (isNaN(amountInt) || amountInt <= 0) return ctx.reply('Invalid amount.');

  db.get('SELECT address FROM users WHERE username = ?', [receiver], async (err, row) => {
    if (err || !row) {
      logger.error(`Error finding receiver ${receiver}:`, err);
      return ctx.reply('Receiver not registered.');
    }
    try {
      const wallet = await getWalletInstance();
      const tx = await wallet.sendTransaction({
        outputs: [{ address: row.address, value: amountInt }],
      });
      logger.info(`Tipped ${amountInt} HTR from ${ctx.message.from.username} to ${receiver}: ${tx.hash}`);
      ctx.reply(`Tipped ${amountInt} HTR to @${receiver}! Tx ID: ${tx.hash}`);
    } catch (error) {
      logger.error(`Error sending tip to ${receiver}:`, error);
      ctx.reply('Error sending tip: ' + error.message);
    }
  });
});

bot.command('reward', async (ctx) => {
  const chat = await ctx.getChat();
  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.some(admin => admin.user.id === ctx.message.from.id);
  if (!isAdmin) return ctx.reply('Only admins can reward!');

  const [_, username, amount] = ctx.message.text.split(' ');
  if (!username || !amount) return ctx.reply('Usage: /reward @username <amount>');

  const receiver = username.replace('@', '');
  const amountInt = parseInt(amount);
  if (isNaN(amountInt) || amountInt <= 0) return ctx.reply('Invalid amount.');

  db.get('SELECT address FROM users WHERE username = ?', [receiver], async (err, row) => {
    if (err || !row) {
      logger.error(`Error finding receiver ${receiver}:`, err);
      return ctx.reply('Receiver not registered.');
    }
    try {
      const wallet = await getWalletInstance();
      const tx = await wallet.sendTransaction({
        outputs: [{ address: row.address, value: amountInt }],
      });
      logger.info(`Rewarded ${amountInt} HTR to ${receiver}: ${tx.hash}`);
      ctx.reply(`Rewarded ${amountInt} HTR to @${receiver}! Tx ID: ${tx.hash}`);
    } catch (error) {
      logger.error(`Error sending reward to ${receiver}:`, error);
      ctx.reply('Error sending reward: ' + error.message);
    }
  });
});

bot.command('propose', async (ctx) => {
  const chat = await ctx.getChat();
  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.some(admin => admin.user.id === ctx.message.from.id);
  if (!isAdmin) return ctx.reply('Only admins can propose!');

  const description = ctx.message.text.split(' ').slice(1).join(' ');
  if (!description) return ctx.reply('Usage: /propose <description>');

  db.run('INSERT INTO proposals (description) VALUES (?)', [description], function(err) {
    if (err) {
      logger.error(`Error creating proposal:`, err);
      return ctx.reply('Error creating proposal.');
    }
    db.all('SELECT vote, COUNT(*) as count FROM votes WHERE proposal_id = ? GROUP BY vote', [this.lastID], (err, rows) => {
      const summary = rows.map(row => `${row.vote}: ${row.count}`).join(', ') || 'No votes yet';
      logger.info(`Proposal #${this.lastID} created by ${ctx.message.from.username}: ${description}`);
      ctx.reply(`Proposal #${this.lastID} created: ${description}\nCurrent votes: ${summary}`);
    });
  });
});

bot.command('vote', async (ctx) => {
  const [_, proposalId, vote] = ctx.message.text.split(' ');
  if (!proposalId || !vote) return ctx.reply('Usage: /vote <proposal_id> <yes/no>');
  if (!['yes', 'no'].includes(vote.toLowerCase())) return ctx.reply('Vote must be "yes" or "no".');

  const username = ctx.message.from.username;
  const tokens = 1;

  db.get('SELECT address FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) {
      logger.error(`Error finding user ${username}:`, err);
      return ctx.reply('Register first: /register <address>');
    }
    db.run('INSERT OR REPLACE INTO votes (proposal_id, username, vote, tokens) VALUES (?, ?, ?, ?)',
      [proposalId, username, vote.toLowerCase(), tokens], (err) => {
        if (err) {
          logger.error(`Error recording vote for ${username} on proposal ${proposalId}:`, err);
          return ctx.reply('Error recording vote.');
        }
        logger.info(`Voted ${vote} by ${username} on proposal #${proposalId}`);
        ctx.reply(`Voted ${vote} on proposal #${proposalId}!`);
      });
  });
});

bot.on('text', (ctx) => {
  const message = ctx.message.text;
  if (message.startsWith('/')) return;

  const result = sentiment.analyze(message);
  if (result.score > 0) {
    const username = ctx.message.from.username;
    db.get('SELECT address FROM users WHERE username = ?', [username], async (err, row) => {
      if (err || !row) return;
      try {
        const wallet = await getWalletInstance();
        const tx = await wallet.sendTransaction({
          outputs: [{ address: row.address, value: 5 }],
        });
        logger.info(`Auto-rewarded 5 HTR to ${username}: ${tx.hash}`);
        ctx.reply(`Auto-rewarded 5 HTR to @${username}! Tx ID: ${tx.hash}`);
      } catch (error) {
        logger.error(`Auto-reward error for ${username}:`, error);
      }
    });
  }
});

bot.start((ctx) =>
  ctx.reply(
    'Welcome! Choose an action:',
    Markup.inlineKeyboard([
      Markup.button.callback('Register', 'register'),
      Markup.button.callback('Tip', 'tip'),
      Markup.button.callback('Propose', 'propose'),
      Markup.button.callback('Vote', 'vote'),
    ])
  )
);

bot.action('register', (ctx) => ctx.reply('Usage: /register <address>'));
bot.action('tip', (ctx) => ctx.reply('Usage: /tip @username <amount>'));
bot.action('propose', (ctx) => ctx.reply('Usage: /propose <description>'));
bot.action('vote', (ctx) => ctx.reply('Usage: /vote <proposal_id> <yes/no>'));

const app = express();
app.use(express.json());

app.get('/api/balance/:username', async (req, res) => {
  db.get('SELECT address FROM users WHERE username = ?', [req.params.username], async (err, row) => {
    if (err || !row) {
      logger.error(`Error fetching balance for ${req.params.username}:`, err);
      return res.status(404).json({ error: 'User not found' });
    }
    try {
      const wallet = await getWalletInstance();
      const balance = await wallet.getBalance();
      res.json({ address: row.address, balance: balance.available });
    } catch (error) {
      logger.error(`Error fetching balance for ${req.params.username}:`, error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  });
});

app.get('/api/proposals', (req, res) => {
  db.all('SELECT p.id, p.description, p.created_at, v.vote, COUNT(v.vote) as vote_count FROM proposals p LEFT JOIN votes v ON p.id = v.proposal_id GROUP BY p.id, v.vote', (err, rows) => {
    if (err) {
      logger.error('Error fetching proposals:', err);
      return res.status(500).json({ error: 'Failed to fetch proposals' });
    }
    const proposals = {};
    rows.forEach(row => {
      if (!proposals[row.id]) {
        proposals[row.id] = {
          id: row.id,
          description: row.description,
          created_at: row.created_at,
          votes: { yes: 0, no: 0 }
        };
      }
      if (row.vote) proposals[row.id].votes[row.vote] = row.vote_count;
    });
    res.json(Object.values(proposals));
  });
});

app.get('/api/transactions/:username', async (req, res) => {
  db.get('SELECT address FROM users WHERE username = ?', [req.params.username], async (err, row) => {
    if (err || !row) {
      logger.error(`Error fetching transactions for ${req.params.username}:`, err);
      return res.status(404).json({ error: 'User not found' });
    }
    try {
      const wallet = await getWalletInstance();
      const history = await wallet.getTxHistory();
      res.json(history);
    } catch (error) {
      logger.error(`Error fetching transactions for ${req.params.username}:`, error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });
});

app.listen(process.env.PORT || 3000, () => logger.info('Express server running on port ' + (process.env.PORT || 3000)));

bot.launch();
logger.info('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
