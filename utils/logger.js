const config = require("../config");
const { logEmbed } = require("./embeds");

/**
 * Sends logs to log channel
 */
async function sendLog(client, title, desc) {
  try {
    const channel = await client.channels.fetch(config.logChannel);
    if (!channel) return;

    channel.send({
      embeds: [logEmbed(title, desc)]
    });
  } catch (err) {
    console.log("Logger error:", err.message);
  }
}

module.exports = {
  sendLog
};