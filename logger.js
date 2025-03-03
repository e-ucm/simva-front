const pino = require('pino');
const config = require('./config.js');
const path = require('path');
const logsFolder =process.env.LOG_FOLDER || path.join(__dirname, '../../logs');
var now = new Date();
const logFile = `${logsFolder}/${now.toISOString().replace(/:/g, '-')}.log`;
/** @type {{targets:import('pino').TransportTargetOptions[]}} */

/** @type {import('pino').LoggerOptions} */
const options = {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    redact: {
        paths: ['clientSecret','password', 'api.adminPassword', 'JWT.secret', 'limesurvey.adminPassword', 'sso.clientSecret', 'sso.adminPassword', 'a2.adminPassword', 'LTI.platform.mongo.password', 'LTI.platform.key'],
        censor: '**REDACTED**'
    },
    customLevels: { log: 30 },
    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
    }
}
let targets = [
    {
        target: 'pino/file',
        level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
        options: {
            destination: logFile,
            singleLine: true
        }
    }
];
if (process.env.NODE_ENV !== 'production') {
targets.push(
    {
        target: 'pino-pretty',
        level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
        options: {
            ignore: 'pid,hostname'
        }
    }
);
}


const transport = pino.transport({
targets: targets
});

const logger = pino(options, transport);

process.on('uncaughtException', err => {
    logger.fatal(err, 'uncaughtException')
    process.exitCode = 1
});

process.on('unhandledRejection', reason =>
    logger.fatal(reason, 'unhandledRejection')
);

module.exports = logger;