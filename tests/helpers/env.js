const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.LOG_FOLDER = process.env.LOG_FOLDER || path.join(os.tmpdir(), 'simva-front-tests');

module.exports = {};
