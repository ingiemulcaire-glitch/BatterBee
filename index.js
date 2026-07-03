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
  try {
    // BUTTON CLICK
    if (interaction.isButton() && interaction.customId === "verify") {
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
    
    if (interaction.isButton() && interaction.customId === "checkVerify") {
  const data = global.verifications?.[interaction.user.id];

  if (!data) {
    return interaction.reply({
      ephemeral: true,
      content: "no verification found. start again."
    });
  }

  // TEMP CHECK (safe starter version)
  // later we replace this with real Roblox API check
  const success = true;

  if (!success) {
    return interaction.reply({
      ephemeral: true,
      content: "verification failed. make sure code is in your Roblox profile."
    });
  }

  const roleId = "1513897216329121792";

  const member = await interaction.guild.members.fetch(interaction.user.id);

  await member.roles.add(roleId);

  const discordName = interaction.user.displayName || interaction.user.username;

  const robloxName = data.roblox;

  const nickname = `𐔌   .  ⋮ ${discordName} .ᐟ ${robloxName} ֹ   ₊ ꒱`;

  await member.setNickname(nickname).catch(() => {});

  delete global.verifications[interaction.user.id];

  return interaction.reply({
    ephemeral: true,
    content: `
𐔌   .  ✓ verified successfully ֹ   ₊ ꒱

welcome to the hive 🐝
`
  });
}

    // MODAL SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "verifyModal") {
  const robloxName = interaction.fields.getTextInputValue("robloxUsername");

  const codes = ["bee421", "hive882", "buzz119", "comb547", "nectar302"];
  const code = codes[Math.floor(Math.random() * codes.length)];

  if (!global.verifications) global.verifications = {};

  global.verifications[interaction.user.id] = {
    roblox: robloxName,
    code: code
  };

  const checkButton = new ButtonBuilder()
    .setCustomId("checkVerify")
    .setLabel("check verification")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(checkButton);

  return await interaction.reply({
    ephemeral: true,
    content: `
𐔌   .  ⋮ verification started .ᐟ ֹ   ₊ ꒱

Roblox: **${robloxName}**

Add this code to your Roblox profile:

**${code}**

Press "check verification" when done.
`,
    components: [row]
  });
}

  } catch (err) {
    console.log("Interaction error:", err);

    if (interaction.replied || interaction.deferred) return;

    await interaction.reply({
      ephemeral: true,
      content: "something went wrong while verifying. try again."
    });
  }
});

client.login(process.env.TOKEN);