const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    }
  );
};


const generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user.id,
      sessionId: sessionId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    }
  );
};


module.exports = {
  generateAccessToken,
  generateRefreshToken,
};