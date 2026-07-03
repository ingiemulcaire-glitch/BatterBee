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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("🐝 Batter Bee is online");

  const channel = await client.channels.fetch("1513073038789316660");

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
  if (!interaction.isButton()) return;

  // BUTTON CLICK
  if (interaction.customId === "verify") {
    const modal = new ModalBuilder()
      .setCustomId("verifyModal")
      .setTitle("Roblox Verification");

    const robloxInput = new TextInputBuilder()
      .setCustomId("robloxUsername")
      .setLabel("Enter your Roblox username")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(robloxInput);
    modal.addComponents(row);

    return await interaction.showModal(modal);
  }

  // MODAL SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "verifyModal") {
    const robloxName = interaction.fields.getTextInputValue("robloxUsername");

    // generate simple code
    const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
    const code = codes[Math.floor(Math.random() * codes.length)];

    // store temporarily (simple version)
    global.verifications ??= {};
    global.verifications[interaction.user.id] = {
      roblox: robloxName,
      code: code
    };

    await interaction.reply({
      ephemeral: true,
      content: `
𐔌   .  ⋮ verification started .ᐟ ֹ   ₊ ꒱

your roblox: **${robloxName}**

add this code to your Roblox profile description:

**${code}**

then press verify again after saving it.
`
    });
  }
});

client.login(process.env.TOKEN);