const morgan = require('morgan');

// Configure dev formatting logger
const loggingMiddleware = morgan('dev');

module.exports = loggingMiddleware;
