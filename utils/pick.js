// copy only whitelisted keys that were actually sent (prevents mass assignment)
const pick = (source = {}, keys = []) =>
  keys.reduce((result, key) => {
    if (source[key] !== undefined) result[key] = source[key];
    return result;
  }, {});

module.exports = pick;
