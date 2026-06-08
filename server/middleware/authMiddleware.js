const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies.sf_token;

  if (!token)
    return res.status(401).json({ message: "Not authenticated." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("sf_token");
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
};