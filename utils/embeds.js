const { EmbedBuilder } = require("discord.js");
const config = require("../config");

/**
 * Main verification panel embed
 */
function verifyPanelEmbed() {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("🐝 Verification Step")
    .setDescription(
      `𝜗𝒞 verification step ᰍ  
press the button below to verify your Roblox account

^ྀི  Batter Bee Verification System`
    );
}

/**
 * Success embed
 */
function successEmbed(robloxName) {
  return new EmbedBuilder()
    .setColor("#7d9d72")
    .setTitle("✅ Verified Successfully")
    .setDescription(`Linked to Roblox account: **${robloxName}**`);
}

/**
 * Error embed
 */
function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor("#ff5c5c")
    .setTitle("❌ Verification Failed")
    .setDescription(message);
}

/**
 * Log embed
 */
function logEmbed(title, desc) {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(title)
    .setDescription(desc)
    .setTimestamp();
}

module.exports = {
  verifyPanelEmbed,
  successEmbed,
  errorEmbed,
  logEmbed
};