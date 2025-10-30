const ms = require("ms");
let config = {}

let default_protocol_ports = {
	"http": 80,
	"https": 443
};

config.simva = {}
config.simva.port  = parseInt(process.env.SIMVA_PORT || 3050);
config.simva.host = process.env.SIMVA_HOST || 'simva.external.test'
config.simva.protocol = process.env.SIMVA_PROTOCOL || 'https'
let simvaPort = ((default_protocol_ports[config.simva.protocol] !== config.simva.port) ? `:${config.simva.port}` : '')
config.simva.url = process.env.SIMVA_URL || `${config.simva.protocol}://${config.simva.host}${simvaPort}`;
config.simva.cookieMaxAgeInMin=process.env.SIMVA_COOKIE_MAX_AGE_IN_MIN || 4*60
config.simva.profiling = process.env.ENABLE_DEBUG_PROFILING == undefined ? "false" : (process.env.ENABLE_DEBUG_PROFILING == "true")
config.simva.ping_task = process.env.PING_TASK !== undefined ? ms(process.env.PING_TASK) : ms("3min")
config.simva.auth_expired_task = process.env.AUTH_EXPIRED_TASK !== undefined ? ms(process.env.AUTH_EXPIRED_TASK) : ms("30min")

config.mongo = {}
config.mongo.host = process.env.MONGO_HOST || 'localhost:27017'
config.mongo.db = process.env.MONGO_DB || '/simva-front'
config.mongo.url = `mongodb://${config.mongo.host}${config.mongo.db}`
config.mongo.test = config.mongo.url

config.sso = {}
config.sso.host = process.env.SSO_HOST || 'sso.external.test'
config.sso.protocol = process.env.SSO_PROTOCOL || 'https'
config.sso.port = process.env.SSO_PORT || '443'
config.sso.url = `${config.sso.protocol}://${config.sso.host}:${config.sso.port}`

config.sso.realm = process.env.SSO_REALM || 'simva'
config.sso.clientId = process.env.SSO_CLIENT_ID || 'simva'
config.sso.clientSecret = process.env.SSO_CLIENT_SECRET || 'th1s_1s_th3_s3cr3t'
config.sso.sslRequired = process.env.SSO_SSL_REQUIRED || 'external'
config.sso.publicClient = process.env.SSO_PUBLIC_CLIENT || 'false'

config.sso.accountPath = process.env.SSO_ACCOUNT_PATH || '/account'
config.sso.accountUrl = `${config.sso.url}/realms/${config.sso.realm}${config.sso.accountPath}?referrer=${config.sso.clientId}&referrer_uri=${config.simva.url}`
config.sso.tokenUrl = `${config.sso.url}/realms/${config.sso.realm}/protocol/openid-connect/token`
config.sso.userCanSelectRole=process.env.SSO_USER_CAN_SELECT_ROLE || "true"
config.sso.administratorContact= process.env.SSO_ADMINISTRATOR_CONTACT || "contact@administrator.com"
config.sso.studentAllowedRole = (process.env.SSO_STUDENT_ALLOWED_ROLE === "true") ? "student" : null
config.sso.teachingAssistantAllowedRole = (process.env.SSO_TEACHING_ASSISTANT_ALLOWED_ROLE === "true") ? "teaching-assistant" :  null
config.sso.teacherAllowedRole = (process.env.SSO_TEACHER_ALLOWED_ROLE === "true") ? "teacher" :  null
config.sso.researcherAllowedRole = (process.env.SSO_RESEARCHER_ALLOWED_ROLE === "true") ? "researcher" :  null
config.sso.allowedRoles = [config.sso.researcherAllowedRole, config.sso.teacherAllowedRole, config.sso.teachingAssistantAllowedRole, config.sso.studentAllowedRole ]
	.filter(role => role !== null)
	.join(',');

config.api = {}
config.api.host = process.env.SIMVA_API_HOST || 'simva-api.external.test'
config.api.protocol = process.env.SIMVA_API_PROTOCOL || 'https'
config.api.port = process.env.SIMVA_API_PORT || '443'
config.api.url = `${config.api.protocol}://${config.api.host}:${config.api.port}`;

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  `${config.limesurvey.protocol}://${config.limesurvey.host}:${config.limesurvey.port}`
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword = process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'

config.hmac = {}
config.hmac.password = process.env.HMAC_PASSWORD || 'mypassword'
config.hmac.salt = process.env.HMAC_SALT || 'mysalt'
config.hmac.key = process.env.HMAC_KEY || 'mykey'
config.hmac.hmacKey = null

config.lti = {}
config.lti.enabled = process.env.LTI_ENABLED || 'false'

config.i18n = {}
config.i18n.debug = process.env.I18N_DEBUG === "true"
languages = process.env.SIMVA_LOCALES || "en,es,pt-BR,fr,it";
config.i18n.languages = languages.split(",").map(s => s.trim());;
config.i18n.defaultLanguage = languages[0];

config.kafka = {}
config.kafka.clientId= process.env.SIMVA_KAFKA_CLIENTID || 'my-client-id'
config.kafka.brokers= [ process.env.SIMVA_KAFKA_BROKER ] || ['localhost:9092']
config.kafka.groupId= process.env.SIMVA_KAFKA_GROUPID || 'my-group-id'
config.kafka.topic= process.env.SIMVA_KAFKA_SIMVA_EVENTS_TOPIC || 'minio-events'

config.shlink = {}
config.shlink.apihost = process.env.SHLINK_SERVER_HOST || 'shlink.external.test'
config.shlink.protocol = process.env.SHLINK_PROTOCOL || 'https'
config.shlink.port = process.env.SHLINK_PORT || '443'
config.shlink.apiurl =  `${config.shlink.protocol}://${config.shlink.apihost}:${config.shlink.port}`
config.shlink.apikey = process.env.SHLINK_SERVER_API_KEY || 'myapikey'


module.exports = config;