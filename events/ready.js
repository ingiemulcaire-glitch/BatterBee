const { verifyPanelEmbed } = require("../utils/embeds");
const config = require("../config");

module.exports = async (client) => {
  console.log(`🐝 Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(config.verifyChannel);
  if (!channel) return;

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  const button = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("Verify")
    .setStyle(ButtonStyle.Success);

  channel.send({
    embeds: [verifyPanelEmbed()],
    components: [new ActionRowBuilder().addComponents(button)]
  });
};