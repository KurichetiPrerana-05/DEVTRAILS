const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { phone } = req.body;

  const token = jwt.sign({ phone }, process.env.JWT_SECRET);

  res.json({ token });
};