var config = {};
config.hmac = {};
config.hmac.password = process.env.HMAC_PASSWORD || 'password';
config.hmac.salt = process.env.HMAC_SALT || 'mysalt';
config.hmac.key = process.env.HMAC_KEY || 'mykey';
config.hmac.hmacKeyConfig = null;

//export { config };
module.exports = config;