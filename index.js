
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const db = require("quick.db");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const PREFIX = "!";
const animals = ["🦊 Rubah", "🐺 Serigala", "🦝 Rakun", "🐻 Beruang", "🐱 Kucing", "🐶 Anjing"];

client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const [cmd, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const userId = message.author.id;

  // Command: daily
  if (cmd === "daily") {
    const last = db.get(`daily_${userId}`);
    const now = Date.now();
    const cooldown = 86400000;
    if (last && now - last < cooldown) {
      const timeLeft = ((cooldown - (now - last)) / 1000 / 60).toFixed(1);
      return message.reply(`Tunggu ${timeLeft} menit lagi untuk klaim berikutnya.`);
    }
    db.set(`daily_${userId}`, now);
    db.add(`money_${userId}`, 100);
    return message.reply("Kamu dapat 100 koin hari ini!");
  }

  // Command: bal
  if (cmd === "bal") {
    const bal = db.get(`money_${userId}`) || 0;
    return message.reply(`Saldo kamu: ${bal} koin`);
  }

  // Command: hunt
  if (cmd === "hunt") {
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const inv = db.get(`zoo_${userId}`) || {};
    inv[animal] = (inv[animal] || 0) + 1;
    db.set(`zoo_${userId}`, inv);
    return message.reply(`Kamu berburu dan menemukan ${animal}!`);
  }

  // Command: zoo
  if (cmd === "zoo") {
    const inv = db.get(`zoo_${userId}`) || {};
    const entries = Object.entries(inv).map(([animal, count]) => `${animal}: ${count}`).join("\n") || "Kosong.";
    return message.reply(`Koleksi hewanmu:\n${entries}`);
  }

  // Command: sell
  if (cmd === "sell") {
    const animal = args.join(" ");
    const inv = db.get(`zoo_${userId}`) || {};
    if (!inv[animal]) return message.reply("Kamu tidak punya hewan itu.");
    inv[animal]--;
    if (inv[animal] <= 0) delete inv[animal];
    db.set(`zoo_${userId}`, inv);
    db.add(`money_${userId}`, 50);
    return message.reply(`Kamu menjual ${animal} dan mendapat 50 koin.`);
  }

  // Command: pray
  if (cmd === "pray") {
    const luck = Math.random();
    if (luck > 0.8) {
      db.add(`money_${userId}`, 200);
      return message.reply("Dewa RNG mengabulkan doamu! +200 koin");
    } else {
      return message.reply("Dewa RNG tidak mendengarmu.");
    }
  }

  // Command: curse
  if (cmd === "curse") {
    const cursed = Math.random();
    if (cursed > 0.7) {
      db.subtract(`money_${userId}`, 100);
      return message.reply("Kamu dikutuk dan kehilangan 100 koin!");
    } else {
      return message.reply("Kutukan tidak berhasil.");
    }
  }

  // Admin-only commands
  if (userId === process.env.OWNER_ID) {
    if (cmd === "setmoney") {
      const target = message.mentions.users.first();
      const amt = parseInt(args[1]);
      if (!target || isNaN(amt)) return message.reply("Format: !setmoney @user jumlah");
      db.set(`money_${target.id}`, amt);
      return message.reply(`Saldo ${target.username} diatur ke ${amt}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
