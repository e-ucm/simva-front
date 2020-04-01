let config = {}

let ignored_ports = [80, 8080, 443];

config.api = {}
config.api.port  = parseInt(process.env.PORT || 3050);
config.api.host = process.env.URL || 'simva.e-ucm.es'
config.api.protocol = process.env.SSO_PROTOCOL || 'https'
config.api.url = config.api.protocol + '://' + config.api.host
				+ ( (ignored_ports.indexOf(config.api.port) !== -1) ? ':' + config.api.port : '' );

config.sso = {}
config.sso.host = process.env.SSO_HOST || 'sso.simva.e-ucm.es'
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

config.simva = {}
config.simva.host = process.env.SIMVA_HOST || 'api.simva.e-ucm.es'
config.simva.protocol = process.env.SIMVA_PROTOCOL || 'https'
config.simva.port = process.env.SIMVA_PORT || '443'
config.simva.url = config.simva.protocol + '://' + config.simva.host + ':' + config.simva.port;

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey-dev.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  config.limesurvey.protocol + '://' + config.limesurvey.host + ':' + config.limesurvey.port
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword =  process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'

module.exports = config;