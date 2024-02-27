let config = {}

let default_protocol_ports = {
	"http": 80,
	"https": 443
};

config.simva = {}
config.simva.port  = parseInt(process.env.SIMVA_PORT || 3050);
config.simva.host = process.env.SIMVA_HOST || 'simva.external.test'
config.simva.protocol = process.env.SIMVA_PROTOCOL || 'https'
config.simva.url = process.env.SIMVA_URL || config.simva.protocol + '://' + config.simva.host
				+ ( (default_protocol_ports[config.simva.protocol] !== config.simva.port) ? ':' + config.simva.port : '' );

config.mongo = {}
config.mongo.host = process.env.MONGO_HOST || 'localhost:27017'
config.mongo.db = process.env.MONGO_DB || '/simva-front'
config.mongo.url = 'mongodb://'+config.mongo.host+config.mongo.db

config.sso = {}
config.sso.host = process.env.SSO_HOST || 'sso.external.test'
config.sso.protocol = process.env.SSO_PROTOCOL || 'https'
config.sso.port = process.env.SSO_PORT || '443'
config.sso.url = config.sso.protocol + '://' + config.sso.host + ':' + config.sso.port
config.sso.authPath = process.env.SSO_AUTH_PATH || '/auth'
config.sso.authUrl = config.sso.url + config.sso.authPath

config.sso.realm = process.env.SSO_REALM || 'simva'
config.sso.clientId = process.env.SSO_CLIENT_ID || 'simva'
config.sso.clientSecret = process.env.SSO_CLIENT_SECRET || 'th1s_1s_th3_s3cr3t'
config.sso.sslRequired = process.env.SSO_SSL_REQUIRED || 'external'
config.sso.publicClient = process.env.SSO_PUBLIC_CLIENT || 'false'

config.sso.accountPath = process.env.SSO_ACCOUNT_PATH || '/account'
config.sso.accountUrl = config.sso.authUrl + "/realms/" + config.sso.realm + config.sso.accountPath

config.sso.userCanSelectRole=process.env.SSO_USER_CAN_SELECT_ROLE || "true"

config.api = {}
config.api.host = process.env.SIMVA_API_HOST || 'simva-api.external.test'
config.api.protocol = process.env.SIMVA_API_PROTOCOL || 'https'
config.api.port = process.env.SIMVA_API_PORT || '443'
config.api.url = config.api.protocol + '://' + config.api.host + ':' + config.api.port;

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  config.limesurvey.protocol + '://' + config.limesurvey.host + ':' + config.limesurvey.port
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword =  process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'

module.exports = config;