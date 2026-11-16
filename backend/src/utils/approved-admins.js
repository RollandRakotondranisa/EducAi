const { Op } = require("sequelize");
const User = require("../models/User");
const UserRequest = require("../models/UserRequest");

const getApprovedAdminUserIds = async ({ activeOnly = false } = {}) => {
  const approvedRequests = await UserRequest.findAll({
    where: { requestedRole: "ADMIN", status: "APPROVED" },
    attributes: ["userId"],
    raw: true,
  });
  const requestedUserIds = [...new Set(approvedRequests.map((request) => Number(request.userId)))];
  if (!requestedUserIds.length) return [];

  const users = await User.findAll({
    where: {
      id: { [Op.in]: requestedUserIds },
      role: "ADMIN",
      ...(activeOnly ? { isActive: true } : {}),
    },
    attributes: ["id"],
    raw: true,
  });
  return users.map((user) => Number(user.id));
};

module.exports = { getApprovedAdminUserIds };
