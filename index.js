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

// ================= CONFIG =================
const VERIFY_CHANNEL = "1513073038789316660";
const ROLE_ID = "1513897216329121792";
const LOG_CHANNEL = "1513388178973921341";

// ================= STORAGE =================
global.verifications = {};
global.verifiedUsers = {};

// ================= LOG FUNCTION =================
async function sendLog(guild, message) {
  try {
    const channel = await guild.channels.fetch(LOG_CHANNEL);
    if (!channel) return;
    channel.send({ content: message });
  } catch (err) {
    console.log("Log error:", err);
  }
}

// ================= BOT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("🐝 Batter Bee is online");

  const channel = await client.channels.fetch(VERIFY_CHANNEL);

  const embed = new EmbedBuilder()
    .setColor(0x1c1d23)
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

client.on(Events.InteractionCreate, async (interaction) => {
  try {

    // ================= BUTTON START =================
    if (interaction.isButton() && interaction.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verifyModal")
        .setTitle("Roblox Verification");

      const input = new TextInputBuilder()
        .setCustomId("robloxUsername")
        .setLabel("Enter your Roblox username")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // ================= MODAL =================
    if (interaction.isModalSubmit() && interaction.customId === "verifyModal") {
      const robloxName = interaction.fields.getTextInputValue("robloxUsername");

      const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
      const code = codes[Math.floor(Math.random() * codes.length)];

      global.verifications[interaction.user.id] = {
        roblox: robloxName,
        code
      };

      const button = new ButtonBuilder()
        .setCustomId("checkVerify")
        .setLabel("check verification")
        .setStyle(ButtonStyle.Primary);

      return interaction.reply({
        ephemeral: true,
        content: `
𐔌   .  ⋮ verification started .ᐟ ֹ   ₊ ꒱

Roblox: **${robloxName}**

Add this code to your Roblox profile:

**${code}**

Press "check verification" when done.
`,
        components: [new ActionRowBuilder().addComponents(button)]
      });
    }

    // ================= CHECK VERIFICATION =================
    if (interaction.isButton() && interaction.customId === "checkVerify") {
      const data = global.verifications[interaction.user.id];

      if (!data) {
        return interaction.reply({
          ephemeral: true,
          content: "no verification found. restart process."
        });
      }

      // GET USER ID
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

      // GET PROFILE
      const profileRes = await axios.get(
        `https://users.roblox.com/v1/users/${userId}`
      );

      const description = profileRes.data.description || "";

      // CHECK CODE
      if (!description.includes(data.code)) {
        return interaction.reply({
          ephemeral: true,
          content: "verification code not found in Roblox profile."
        });
      }

      // SUCCESS

      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.add(ROLE_ID);

      const discordName = interaction.user.displayName || interaction.user.username;
      const robloxName = data.roblox;

      const nickname = `𐔌   .  ⋮ ${discordName} .ᐟ ${robloxName} ֹ   ₊ ꒱`;

      await member.setNickname(nickname).catch(() => {});

      global.verifiedUsers[interaction.user.id] = {
        roblox: robloxName,
        discord: discordName
      };

      delete global.verifications[interaction.user.id];

      await sendLog(interaction.guild,
        `🐝 VERIFIED
Discord: ${interaction.user.tag}
Roblox: ${robloxName}
Code: ${data.code}`
      );

      return interaction.reply({
        ephemeral: true,
        content: `
𐔌   .  ✓ verified successfully ֹ   ₊ ꒱

welcome to the hive 🐝
`
      });
    }

    // ================= UNVERIFY COMMAND =================
    if (interaction.isChatInputCommand && interaction.commandName === "unverify") {
      const member = await interaction.guild.members.fetch(interaction.user.id);

      await member.roles.remove(ROLE_ID).catch(() => {});
      await member.setNickname(null).catch(() => {});

      delete global.verifications[interaction.user.id];
      delete global.verifiedUsers[interaction.user.id];

      await sendLog(interaction.guild,
        `🧼 UNVERIFY
User: ${interaction.user.tag}`
      );

      return interaction.reply({
        ephemeral: true,
        content: "you have been unverified 🧼"
      });
    }

  } catch (err) {
    console.log("ERROR:", err);

    if (!interaction.replied) {
      return interaction.reply({
        ephemeral: true,
        content: "something went wrong. try again."
      });
    }
  }
});

// ================= AUTO CLEANUP =================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(ROLE_ID);
  const hasRole = newMember.roles.cache.has(ROLE_ID);

  if (hadRole && !hasRole) {
    await newMember.setNickname(null).catch(() => {});

    delete global.verifiedUsers?.[newMember.id];

    await sendLog(newMember.guild,
      `🧼 AUTO CLEANUP
User: ${newMember.user.tag}
Nickname reset (role removed)`
    );
  }
});

client.login(process.env.TOKEN);