const { Telegraf } = require('telegraf');
const { HathorWallet, Network } = require('@hathor/wallet-lib');
const db = require('./db.js');
const { exec } = require('child_process');

const bot = new Telegraf('7184926549:AAGARrhnukaFGD41jnjfpTseZZQ--vfoDTw'); // Replace with your BotFather token

const wallet = new HathorWallet({
  seed: 'item mechanic tide start pair picnic steak friend void patient survey ecology sea goose letter grass concert shrug force holiday worry alone spare pattern', // Replace with your Hathor wallet seed
  network: new Network('testnet-alpha'),
connection: {
nodeUrl: 'https://node.alpha.nano-testnet.hathor.network/v1a/',
},
});
wallet.start();

bot.command('register', (ctx) => {
  const username = ctx.message.from.username;
  const address = ctx.message.text.split(' ')[1];
  if (!address) return ctx.reply('Usage: /register <hathor_address>');

  db.run('INSERT OR REPLACE INTO users (username, address) VALUES (?, ?)', [username, address], (err) => {
    if (err) return ctx.reply('Error registering address.');
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
    if (err || !row) return ctx.reply('Receiver not registered.');
    try {
      const tx = await wallet.sendTransaction({
        outputs: [{ address: row.address, value: amountInt }],
      });
      ctx.reply(`Tipped ${amount} HTR to @${receiver}! Tx ID: ${tx.hash}`);
    } catch (error) {
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
    if (err || !row) return ctx.reply('Receiver not registered.');
    try {
      const tx = await wallet.sendTransaction({
        outputs: [{ address: row.address, value: amountInt }],
      });
      ctx.reply(`Rewarded ${amount} HTR to @${receiver}! Tx ID: ${tx.hash}`);
    } catch (error) {
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
    if (err) return ctx.reply('Error creating proposal.');
    ctx.reply(`Proposal #${this.lastID} created: ${description}`);
  });
});

bot.command('vote', async (ctx) => {
  const [_, proposalId, vote] = ctx.message.text.split(' ');
  if (!proposalId || !vote) return ctx.reply('Usage: /vote <proposal_id> <yes/no>');
  if (!['yes', 'no'].includes(vote.toLowerCase())) return ctx.reply('Vote must be "yes" or "no".');

  const username = ctx.message.from.username;
  const tokens = 1;

  db.get('SELECT address FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) return ctx.reply('Register first: /register <address>');
    db.run('INSERT INTO votes (proposal_id, username, vote, tokens) VALUES (?, ?, ?, ?)',
      [proposalId, username, vote.toLowerCase(), tokens], (err) => {
        if (err) return ctx.reply('Error recording vote.');
        ctx.reply(`Voted ${vote} on proposal #${proposalId}!`);
      });
  });
});

bot.on('text', (ctx) => {
  const message = ctx.message.text;
  if (message.startsWith('/')) return;

  exec(`python3 sentiment.py "${message}"`, (err, stdout) => {
    if (err) return console.error(err);
    if (stdout.trim() === 'POSITIVE') {
      const username = ctx.message.from.username;
      db.get('SELECT address FROM users WHERE username = ?', [username], async (err, row) => {
        if (err || !row) return;
        try {
          const tx = await wallet.sendTransaction({
            outputs: [{ address: row.address, value: 5 }],
          });
          ctx.reply(`Auto-rewarded 5 HTR to @${username}! Tx ID: ${tx.hash}`);
        } catch (error) {
          console.error('Auto-reward error:', error);
        }
      });
    }
  });
});

bot.start((ctx) => ctx.reply('Welcome! Commands:\n/register <address>\n/tip @username <amount>\n/reward @username <amount> (admins)\n/propose <description> (admins)\n/vote <proposal_id> <yes/no>'));

bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));