const verifyToken = require("./verifyToken");
const allowedTo = require("./allowedTo");
const userRoles = require("../utils/userRoles");

// every route that changes portfolio content must use this, not verifyToken alone
module.exports = [verifyToken, allowedTo(userRoles.ADMIN, userRoles.MANAGER)];
