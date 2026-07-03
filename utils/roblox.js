const axios = require("axios");

/**
 * Get Roblox user ID from username
 */
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
    console.log("Roblox ID fetch error:", err.message);
    return null;
  }
}

/**
 * Get full Roblox profile
 */
async function getRobloxProfile(userId) {
  try {
    const res = await axios.get(
      `https://users.roblox.com/v1/users/${userId}`
    );

    return res.data;
  } catch (err) {
    console.log("Roblox profile error:", err.message);
    return null;
  }
}

module.exports = {
  getRobloxId,
  getRobloxProfile
};