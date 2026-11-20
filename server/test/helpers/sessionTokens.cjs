const jwt = require('jsonwebtoken');
const sessionId = 'aaaaaaaaaaaaaaaaaaaaaa01';
const accessToken = (id, secret, options = {}, claims = {}) => jwt.sign({ id, sid: sessionId, ver: 0, ...claims }, secret, {
  expiresIn: '15m', issuer: 'athlix', audience: 'athlix-api', ...options,
});
module.exports = { accessToken, sessionId };
