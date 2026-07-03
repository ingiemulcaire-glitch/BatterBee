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
  Events
} = require("discord.js");

const axios = require("axios");
const fs = require("fs");

// ================= CONFIG =================
const VERIFY_CHANNEL = "1513073038789316660";
const ROLE_ID = "1513897216329121792";
const LOG_CHANNEL = "1513388178973921341";
const DB_FILE = "./database.json";

// ================= DATABASE =================
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

// ================= LOG EMBED =================
async function sendLog(guild, title, desc) {
  try {
    const channel = await guild.channels.fetch(LOG_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x1c1d23)
      .setTitle(title)
      .setDescription(desc)
      .setFooter({ text: "Batter Bee Logs 🐝" })
      .setTimestamp();

    channel.send({ embeds: [embed] });
  } catch (err) {
    console.log("Log error:", err);
  }
}

// ================= READY =================
client.once("ready", async () => {
  console.log("🐝 Batter Bee online");

  const channel = await client.channels.fetch(VERIFY_CHANNEL);

  const embed = new EmbedBuilder()
    .setColor(0x7d9d72)
    .setTitle("🐝 Batter Bee Verification")
    .setDescription(`
𝜗𝒞  verification step ᰍ    ࣪            ݂  
　  　press the button below to verify  
　　　　　　^ྀི　Roblox account 𓂃 ∿ 
`);

  const button = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("verify")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row]
  });
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const db = loadDB();

    // ========== VERIFY BUTTON ==========
    if (interaction.isButton() && interaction.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verifyModal")
        .setTitle("Roblox Verification");

      const input = new TextInputBuilder()
        .setCustomId("robloxUsername")
        .setLabel("Enter your Roblox username")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // ========== MODAL ==========
    if (interaction.isModalSubmit() && interaction.customId === "verifyModal") {
      const robloxName = interaction.fields.getTextInputValue("robloxUsername");

      const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
      const code = codes[Math.floor(Math.random() * codes.length)];

      db[interaction.user.id] = {
        roblox: robloxName,
        code: code
      };

      saveDB(db);

      const button = new ButtonBuilder()
        .setCustomId("checkVerify")
        .setLabel("check verification")
        .setStyle(ButtonStyle.Primary);

      const embed = new EmbedBuilder()
        .setColor(0x1c1d23)
        .setTitle("🐝 Verification Started")
        .setDescription(`
Roblox: **${robloxName}**

Add this code to your Roblox profile:

**${code}**
`);

      return interaction.reply({
        ephemeral: true,
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(button)]
      });
    }

    // ========== CHECK VERIFY ==========
    if (interaction.isButton() && interaction.customId === "checkVerify") {
      const data = db[interaction.user.id];

      if (!data) {
        return interaction.reply({
          ephemeral: true,
          content: "no verification found."
        });
      }

      const userRes = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        {
          usernames: [data.roblox],
          excludeBannedUsers: true
        }
      );

      const userId = userRes.data.data[0]?.id;

      if (!userId) {
        return interaction.reply({
          ephemeral: true,
          content: "Roblox user not found."
        });
      }

      const profile = await axios.get(
        `https://users.roblox.com/v1/users/${userId}`
      );

      const desc = profile.data.description || "";

      if (!desc.includes(data.code)) {
        return interaction.reply({
          ephemeral: true,
          content: "code not found in Roblox profile."
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.add(ROLE_ID).catch(() => {});

      const discordName = interaction.user.displayName || interaction.user.username;

      const nickname = `𐔌   .  ⋮ ${discordName} .ᐟ ${data.roblox} ֹ   ₊ ꒱`;

      await member.setNickname(nickname).catch(() => {});

      db[interaction.user.id].verified = true;
      saveDB(db);

      await sendLog(
        interaction.guild,
        "🐝 VERIFIED USER",
        `**Discord:** ${interaction.user.tag}\n**Roblox:** ${data.roblox}\n**Code:** ${data.code}`
      );

      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(0x7d9d72)
            .setTitle("✓ Verified")
            .setDescription("welcome to the hive 🐝")
        ]
      });
    }

    // ========== UNVERIFY COMMAND ==========
    if (interaction.isChatInputCommand && interaction.commandName === "unverify") {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.remove(ROLE_ID).catch(() => {});
      await member.setNickname(null).catch(() => {});

      delete db[interaction.user.id];
      saveDB(db);

      await sendLog(
        interaction.guild,
        "🧼 UNVERIFY",
        `**User:** ${interaction.user.tag}`
      );

      return interaction.reply({
        ephemeral: true,
        content: "you are now unverified 🧼"
      });
    }
  } catch (err) {
    console.log(err);

    if (!interaction.replied) {
      return interaction.reply({
        ephemeral: true,
        content: "something went wrong."
      });
    }
  }
});

// ========== AUTO CLEANUP ==========
client.on("guildMemberUpdate", async (oldM, newM) => {
  const ROLE_ID = "1513897216329121792";

  if (oldM.roles.cache.has(ROLE_ID) && !newM.roles.cache.has(ROLE_ID)) {
    await newM.setNickname(null).catch(() => {});

    const db = loadDB();
    delete db[newM.id];
    saveDB(db);

    await sendLog(
      newM.guild,
      "🧼 AUTO CLEANUP",
      `**User:** ${newM.user.tag}`
    );
  }
});

client.login(process.env.TOKEN);