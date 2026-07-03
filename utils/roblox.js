const axios = require("axios");

async function getRobloxId(username) {
  try {
    const res = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      {
        usernames: [username],
        excludeBannedUsers: true
      }
    );

    return res.data.data?.[0]?.id || null;
  } catch (err) {
    console.log("ROBLOX ID ERROR:", err.response?.data || err.message);
    return null;
  }
}

async function getRobloxProfile(userId) {
  try {
    if (!userId) return null;

    const res = await axios.get(
      `https://users.roblox.com/v1/users/${userId}`
    );

    return res.data;
  } catch (err) {
    console.log("ROBLOX PROFILE ERROR:", err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  getRobloxId,
  getRobloxProfile
};