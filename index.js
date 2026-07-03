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
      .setTimestamp();

    channel.send({ embeds: [embed] });
  } catch (err) {
    console.log("Log error:", err);
  }
}

// ================= REGISTER SLASH COMMANDS =================
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("verifystatus")
      .setDescription("Check your verification status"),

    new SlashCommandBuilder()
      .setName("unverify")
      .setDescription("Remove your verification")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
}

// ================= READY =================
client.once("ready", async () => {
  console.log("🐝 Batter Bee online");

  await registerCommands();

  const channel = await client.channels.fetch(VERIFY_CHANNEL);

  const embed = new EmbedBuilder()
    .setColor(0x7d9d72)
    .setTitle("🐝 Verification")
    .setDescription(`
𝜗𝒞 verification step ᰍ  
press verify to link your Roblox account
`);

  const button = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("verify")
    .setStyle(ButtonStyle.Success);

  await channel.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(button)]
  });
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const db = loadDB();

    // BUTTON OPEN MODAL
    if (interaction.isButton() && interaction.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verifyModal")
        .setTitle("Roblox Verification");

      const input = new TextInputBuilder()
        .setCustomId("robloxUsername")
        .setLabel("Roblox username")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "verifyModal") {
      const robloxName = interaction.fields.getTextInputValue("robloxUsername");

      const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
      const code = codes[Math.floor(Math.random() * codes.length)];

      db[interaction.user.id] = {
        roblox: robloxName,
        code
      };

      saveDB(db);

      return interaction.reply({
        ephemeral: true,
        content: `Add this code to your Roblox profile:\n**${code}**`
      });
    }

    // CHECK VERIFICATION
    if (interaction.isButton() && interaction.customId === "checkVerify") {
      const data = db[interaction.user.id];

      if (!data) {
        return interaction.reply({
          ephemeral: true,
          content: "No verification found."
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
          content: "User not found."
        });
      }

      const profile = await axios.get(
        `https://users.roblox.com/v1/users/${userId}`
      );

      const desc = profile.data.description || "";

      if (!desc.includes(data.code)) {
        return interaction.reply({
          ephemeral: true,
          content: "Code not found in profile."
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.add(ROLE_ID).catch(console.error);

      const discordName = interaction.user.displayName || interaction.user.username;
      const nickname = `𐔌   .  ⋮ ${discordName} .ᐟ ${data.roblox} ֹ   ₊ ꒱`;

      await member.setNickname(nickname).catch(err => {
        console.log("Nickname failed:", err);
      });

      db[interaction.user.id].verified = true;
      saveDB(db);

      await sendLog(interaction.guild,
        "VERIFIED USER",
        `${interaction.user.tag} | ${data.roblox}`
      );

      return interaction.reply({
        ephemeral: true,
        content: "Verified successfully 🐝"
      });
    }

    // SLASH: UNVERIFY
    if (interaction.isChatInputCommand() && interaction.commandName === "unverify") {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.remove(ROLE_ID).catch(() => {});
      await member.setNickname(null).catch(() => {});

      delete db[interaction.user.id];
      saveDB(db);

      return interaction.reply({
        ephemeral: true,
        content: "You are now unverified 🧼"
      });
    }

    // SLASH: VERIFY STATUS
    if (interaction.isChatInputCommand() && interaction.commandName === "verifystatus") {
      const data = db[interaction.user.id];

      if (!data?.verified) {
        return interaction.reply({
          ephemeral: true,
          content: "You are not verified."
        });
      }

      return interaction.reply({
        ephemeral: true,
        content: `Verified as **${data.roblox}**`
      });
    }

  } catch (err) {
    console.log(err);

    if (!interaction.replied) {
      interaction.reply({
        ephemeral: true,
        content: "error occurred"
      });
    }
  }
});

// ================= AUTO CLEANUP =================
client.on("guildMemberUpdate", async (oldM, newM) => {
  const had = oldM.roles.cache.has(ROLE_ID);
  const has = newM.roles.cache.has(ROLE_ID);

  if (had && !has) {
    await newM.setNickname(null).catch(() => {});
  }
});

client.login(TOKEN);