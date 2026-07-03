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
const { successEmbed, errorEmbed, verifyPanelEmbed } = require("./utils/embeds");
const { sendLog } = require("./utils/logger");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ================= READY =================
client.once(Events.ClientReady, async (clientUser) => {
  console.log(`🐝 Logged in as ${clientUser.user.tag}`);

  const channel = await client.channels.fetch(config.verifyChannel).catch(() => null);
  if (!channel) return;

  const verifyBtn = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("Verify")
    .setStyle(ButtonStyle.Success);

  channel.send({
    embeds: [verifyPanelEmbed()],
    components: [new ActionRowBuilder().addComponents(verifyBtn)]
  });
});

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

      const robloxName = i.fields.getTextInputValue("roblox").trim();

      console.log("USERNAME:", robloxName);

      const robloxId = await getRobloxId(robloxName);

      console.log("ROBLOX ID RESULT:", robloxId);

      if (!robloxId) {
        return i.reply({
          ephemeral: true,
          embeds: [errorEmbed("Roblox user not found")]
        });
      }

      const code = Math.random().toString(36).slice(2, 8);

      await db.upsertUser(i.user.id, robloxName, robloxId, code);

      return i.reply({
        ephemeral: true,
        content: `Put this code in your Roblox **About (Bio)** section:\n\n**${code}**`,
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
        return i.reply({
          ephemeral: true,
          content: "No verification data found."
        });
      }

      console.log("ROBLOX ID FROM DB:", data.robloxId);

      if (!data.robloxId) {
        return i.reply({
          ephemeral: true,
          content: "Invalid Roblox ID stored. Please restart verification."
        });
      }

      let profile = await getRobloxProfile(data.robloxId);

      await wait(1500);

      profile = await getRobloxProfile(data.robloxId);

      const desc = (profile?.description || "").toLowerCase();
      const code = data.code.toLowerCase();

      console.log("BIO:", desc);
      console.log("CODE:", code);

      if (!desc.includes(code)) {
        return i.reply({
          ephemeral: true,
          embeds: [errorEmbed("Code not found in Roblox bio")]
        });
      }

      const member = await i.guild.members.fetch(i.user.id);

      await member.roles.add(config.verifiedRole).catch(console.log);

      let nickname = config.nicknameFormat
        .replace("{discord}", i.user.username)
        .replace("{roblox}", data.robloxName);

      if (nickname.length > 32) {
        nickname = `${i.user.username} | ${data.robloxName}`.slice(0, 32);
      }

      await member.setNickname(nickname).catch(console.log);

      await db.setVerified(i.user.id, 1);

      await sendLog(
        client,
        "🐝 Verified User",
        `${i.user.tag} → ${data.robloxName}`
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

      return i.reply({
        ephemeral: true,
        content: "Unverified 🧼"
      });
    }

    // ================= STATUS =================
    if (i.isChatInputCommand() && i.commandName === "verifystatus") {

      const data = await db.getUser(i.user.id);

      if (!data?.verified) {
        return i.reply({
          ephemeral: true,
          content: "Not verified."
        });
      }

      return i.reply({
        ephemeral: true,
        content: `Verified as **${data.robloxName}**`
      });
    }

  } catch (err) {
    console.log("ERROR:", err);
    if (!i.replied) {
      i.reply({ ephemeral: true, content: "Something went wrong." });
    }
  }
});

client.login(process.env.TOKEN);