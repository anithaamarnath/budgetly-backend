const { STATUS_CODE_UNAUTHORIZED, STATUS_CODE_BAD_REQUEST } = require('../constants');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(STATUS_CODE_UNAUTHORIZED).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = decoded;
    next(); 
  } catch (error) {
    res.status(STATUS_CODE_BAD_REQUEST).send('Invalid token.');
  }
};


