const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const axios = require("axios");
const fs = require("fs");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1519022460563882217";
const GUILD_ID = "1512899816626323577";

const VERIFY_CHANNEL = "1513073038789316660";
const ROLE_ID = "1513897216329121792";
const LOG_CHANNEL = "1513388178973921341";

const DB_FILE = "./database.json";

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ================= BOT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= LOGS =================
async function log(guild, title, desc, color = 0x1c1d23) {
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL);
    if (!ch) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(desc)
      .setTimestamp();

    ch.send({ embeds: [embed] });
  } catch (e) {
    console.log("log error:", e);
  }
}

// ================= COMMANDS =================
async function registerCommands() {
  const cmds = [
    new SlashCommandBuilder().setName("unverify").setDescription("Remove verification"),
    new SlashCommandBuilder().setName("verifystatus").setDescription("Check verification status")
  ].map(x => x.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: cmds }
  );
}

// ================= READY =================
client.once("ready", async () => {
  console.log("🐝 online");

  await registerCommands();

  const ch = await client.channels.fetch(VERIFY_CHANNEL);

  const embed = new EmbedBuilder()
    .setColor(0x7d9d72)
    .setTitle("🐝 Verification")
    .setDescription(`
𝜗𝒞 verification step ᰍ  
press verify to link Roblox account
`);

  const btn = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("verify")
    .setStyle(ButtonStyle.Success);

  ch.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(btn)]
  });
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (i) => {
  try {
    const db = loadDB();

    // BUTTON → MODAL
    if (i.isButton() && i.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verifyModal")
        .setTitle("Roblox Verification");

      const input = new TextInputBuilder()
        .setCustomId("roblox")
        .setLabel("Roblox username")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return i.showModal(modal);
    }

    // MODAL → CODE + CHECK BUTTON
    if (i.isModalSubmit() && i.customId === "verifyModal") {
      const roblox = i.fields.getTextInputValue("roblox");

      const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
      const code = codes[Math.floor(Math.random() * codes.length)];

      db[i.user.id] = { roblox, code };
      saveDB(db);

      const checkBtn = new ButtonBuilder()
        .setCustomId("check")
        .setLabel("check verification")
        .setStyle(ButtonStyle.Primary);

      return i.reply({
        ephemeral: true,
        content: `add this code to Roblox profile:\n**${code}**`,
        components: [new ActionRowBuilder().addComponents(checkBtn)]
      });
    }

    // CHECK VERIFICATION
    if (i.isButton() && i.customId === "check") {
  const data = db[i.user.id];

  if (!data) {
    return i.reply({
      ephemeral: true,
      content: "no verification data found. restart verification."
    });
  }

  // ================= ROBLOX CHECK =================
  console.log("🔍 Checking Roblox:", data.roblox);

  const res = await axios.post(
    "https://users.roblox.com/v1/usernames/users",
    {
      usernames: [data.roblox],
      excludeBannedUsers: true
    }
  );

  const userId = res.data.data[0]?.id;

  if (!userId) {
    return i.reply({
      ephemeral: true,
      content: "Roblox user not found."
    });
  }

  const profile = await axios.get(
    `https://users.roblox.com/v1/users/${userId}`
  );

  const desc = profile.data.description || "";

  if (!desc.includes(data.code)) {
    await log(
      i.guild,
      "❌ VERIFICATION FAILED",
      `User: ${i.user.tag}\nMissing code in Roblox profile`
    );

    return i.reply({
      ephemeral: true,
      content: "code not found in Roblox profile."
    });
  }

  // ================= SUCCESS =================
  const member = await i.guild.members.fetch(i.user.id);

  // ROLE ADD (THIS IS THE LINE YOU WERE MISSING)
  await member.roles.add(ROLE_ID).catch(err => {
    console.log("❌ Role add failed:", err);
  });

  // NICKNAME CHANGE
  const name = i.user.displayName || i.user.username;

  const nickname = `𐔌   .  ⋮ ${name} .ᐟ ${data.roblox} ֹ   ₊ ꒱`;

  await member.setNickname(nickname).catch(err => {
    console.log("❌ Nickname failed:", err);
  });

  // SAVE DATABASE
  db[i.user.id].verified = true;
  saveDB(db);

  // LOG SUCCESS
  await log(
    i.guild,
    "🐝 VERIFIED USER",
    `Discord: ${i.user.tag}\nRoblox: ${data.roblox}`
  );

  // RESPONSE
  return i.reply({
    ephemeral: true,
    content: "verified successfully 🐝"
  });
}

    // UNVERIFY
    if (i.isChatInputCommand() && i.commandName === "unverify") {
      const member = await i.guild.members.fetch(i.user.id);

      await member.roles.remove(ROLE_ID).catch(() => {});
      await member.setNickname(null).catch(() => {});

      delete db[i.user.id];
      saveDB(db);

      return i.reply({ ephemeral: true, content: "unverified 🧼" });
    }

    // STATUS
    if (i.isChatInputCommand() && i.commandName === "verifystatus") {
      const data = db[i.user.id];

      return i.reply({
        ephemeral: true,
        content: data?.verified
          ? `verified as ${data.roblox}`
          : "not verified"
      });
    }

  } catch (e) {
    console.log(e);
    if (!i.replied) i.reply({ ephemeral: true, content: "error" });
  }
});

// ================= CLEANUP =================
client.on("guildMemberUpdate", async (o, n) => {
  const ROLE_ID = "1513897216329121792";

  if (o.roles.cache.has(ROLE_ID) && !n.roles.cache.has(ROLE_ID)) {
    await n.setNickname(null).catch(() => {});
  }
});

client.login(TOKEN);