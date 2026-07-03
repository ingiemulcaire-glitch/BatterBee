const config = require("../config");

module.exports = async (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(config.verifiedRole);
  const hasRole = newMember.roles.cache.has(config.verifiedRole);

  // If removed verified role → reset nickname
  if (hadRole && !hasRole) {
    await newMember.setNickname(null).catch(() => {});
  }
};