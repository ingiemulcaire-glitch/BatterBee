const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("🐝 Batter Bee is online");

  const channel = await client.channels.fetch("1513073038789316660");

  const embed = new EmbedBuilder()
    .setColor("#7D9D72")
    .setDescription(`
╭────────────୨ৎ

🐝 Batter Bee Verification

Press the button below to verify your Roblox account.

╰────────────୨ৎ
`);

  const button = new ButtonBuilder()
    .setCustomId("verify")
    .setLabel("🌿 Tap To Verify")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row]
  });
});

client.login(process.env.TOKEN);