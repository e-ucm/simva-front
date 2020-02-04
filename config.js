let config = {}

config.api = {}
config.api.port  = process.env.PORT || 3050

config.simva = {}
config.simva.host = process.env.SIMVA_HOST || 'simva-api.external.test'
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