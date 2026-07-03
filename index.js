const {
  Client,
  GatewayIntentBits,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("./config");
const db = require("./utils/database");
const { getRobloxId, getRobloxProfile } = require("./utils/roblox");
const { successEmbed, errorEmbed } = require("./utils/embeds");
const { sendLog } = require("./utils/logger");

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ================= READY =================
client.once(Events.ClientReady, require("./events/ready"));
require("./events/guildMemberUpdate");

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (i) => {
  try {

    // ================= VERIFY BUTTON =================
    if (i.isButton() && i.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verifyModal")
        .setTitle("Roblox Verification");

      const input = new TextInputBuilder()
        .setCustomId("roblox")
        .setLabel("Roblox username")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return i.showModal(modal);
    }

    // ================= MODAL SUBMIT =================
    if (i.isModalSubmit() && i.customId === "verifyModal") {
      const roblox = i.fields.getTextInputValue("roblox");

      const robloxId = await getRobloxId(roblox);

      if (!robloxId) {
        return i.reply({
          ephemeral: true,
          embeds: [errorEmbed("Roblox user not found")]
        });
      }

      function generateCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

const code = generateCode();

      await db.upsertUser(i.user.id, roblox, robloxId, code);

      return i.reply({
        ephemeral: true,
        content: `Put this code in your Roblox bio:\n**${code}**`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("check")
              .setLabel("Check Verification")
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
    }

    // ================= CHECK VERIFICATION =================
    if (i.isButton() && i.customId === "check") {
      const data = await db.getUser(i.user.id);

      if (!data) {
        return i.reply({ ephemeral: true, content: "No data found." });
      }

      const profile = await getRobloxProfile(data.robloxId);

      if (!profile || !profile.description.includes(data.code)) {
        return i.reply({
          ephemeral: true,
          embeds: [errorEmbed("Code not found in Roblox profile")]
        });
      }

      const member = await i.guild.members.fetch(i.user.id);

      // ROLE
      await member.roles.add(config.verifiedRole).catch(console.log);

      // NICKNAME (SAFE 32 CHAR FIX)
      let nickname = config.nicknameFormat
        .replace("{discord}", i.user.username)
        .replace("{roblox}", data.robloxName);

      if (nickname.length > 32) {
        nickname = `${i.user.username} | ${data.robloxName}`.slice(0, 32);
      }

      await member.setNickname(nickname).catch(console.log);

      // SAVE
      await db.setVerified(i.user.id, 1);

      // LOG
      await sendLog(
        client,
        "🐝 Verified User",
        `${i.user.tag} linked to ${data.robloxName}`
      );

      return i.reply({
        ephemeral: true,
        embeds: [successEmbed(data.robloxName)]
      });
    }

    // ================= UNVERIFY =================
    if (i.isChatInputCommand() && i.commandName === "unverify") {
      const member = await i.guild.members.fetch(i.user.id);

      await member.roles.remove(config.verifiedRole).catch(() => {});
      await member.setNickname(null).catch(() => {});

      await db.deleteUser(i.user.id);

      return i.reply({ ephemeral: true, content: "Unverified 🧼" });
    }

    // ================= STATUS =================
    if (i.isChatInputCommand() && i.commandName === "verifystatus") {
      const data = await db.getUser(i.user.id);

      if (!data || !data.verified) {
        return i.reply({ ephemeral: true, content: "Not verified." });
      }

      return i.reply({
        ephemeral: true,
        content: `Verified as **${data.robloxName}**`
      });
    }

  } catch (err) {
    console.log("Interaction error:", err);
    if (!i.replied) {
      i.reply({ ephemeral: true, content: "Something went wrong." });
    }
  }
});

// ================= LOGIN =================
client.login(TOKEN);