const { LRSTracker } = require("xasu-js");
const config = require("../../config.js");
const ms = require("ms");
const logger = require("../../logger.js");
const usertools = require('../lib/usertools.js');

/**
 * Actor used when the request cannot be associated with an identified user
 */
const UNKNOWN_ACTOR = "Not identified user";

/**
 * Statement stub returned when a statement cannot be built, so that a tracking
 * problem never prevents a route from sending its response
 */
const NOOP_STATEMENT = {
    withContextLanguage: () => NOOP_STATEMENT,
    withContextPlatform: () => NOOP_STATEMENT,
    withResultExtensions: () => NOOP_STATEMENT,
    withContextExtensions: () => NOOP_STATEMENT,
    withContextActivity: () => NOOP_STATEMENT,
    withActor: () => NOOP_STATEMENT,
    send: () => Promise.resolve()
};

class XasuJSClient {
    xapiTracker;

    constructor() {
        this.xapiTracker = new LRSTracker();
        this.xapiTracker.trackerSettings = {
            generateSettingsFromURLParams:false,
            oauth_type:"OAuth2",
            batch_mode:true,
            batch_endpoint: config.api.url + "/admin/lrs",
            batch_length:100,
            batch_timeout:ms("30sec"),
            platform: config.simva.url,
            backup_mode:false,
            default_uri: config.simva.url,
            max_retry_delay: ms("2min"),
            debug: true
        };

        this.xapiTracker.oauth2.token_endpoint=config.sso.tokenUrl;
        this.xapiTracker.oauth2.client_id=config.sso.clientId;
        this.xapiTracker.oauth2.client_secret=config.sso.clientSecret;
        this.xapiTracker.oauth2.grant_type="password";
        this.xapiTracker.oauth2.scope="openid profile";
        this.xapiTracker.oauth2.state="";
        this.xapiTracker.oauth2.code_challenge_method="S256";
        this.xapiTracker.oauth2.username=config.sso.lrs.user;
        this.xapiTracker.oauth2.password=config.sso.lrs.password;
        this.xapiTracker.oauth2.login_hint="";
        this.xapiTracker.oauth2.language="";
        logger.debug(this.xapiTracker.oauth2);
        this.ensureLoggedAndStarted()
            .catch(err => logger.error(err, 'Tracker login/start failed'));
    }
    
    async ensureLoggedAndStarted() {
        if(!this.xapiTracker.isLoggedIn()) {
            await this.xapiTracker.login();
        }
        if(!this.xapiTracker.isStarted()) {
            this.xapiTracker.start();
        }
    }

    tracker() {
        return this.xapiTracker;
    }

    async flush() {
        await this.xapiTracker.flush();
    }

    /**
     * Get the username of the user that performed the request
     * @param {string} jwtToken - token of the session of the request
     * @returns {string} - username of the user, or the unknown actor when it cannot be identified
     */
    getActor(jwtToken) {
        try {
            const decoded = jwtToken ? usertools.decodeJWT(jwtToken) : null;
            return decoded?.preferred_username || UNKNOWN_ACTOR;
        } catch(err) {
            logger.warn(err, 'Could not decode the JWT of the request');
            return UNKNOWN_ACTOR;
        }
    }

    /**
     * Build a statement of the given verb. It never throws, so that a tracking
     * problem cannot prevent a route from sending its response
     * @param {string} verb - id of the verb of the statement
     * @param {string} objectType - type of the object of the statement
     * @param {string} objectId - id of the object of the statement
     * @param {string} jwtToken - token of the session of the request
     * @returns {Promise<object>} - statement builder, or a stub statement when the tracking fails
     */
    async trace(verb, objectType, objectId, jwtToken) {
        try {
            await this.ensureLoggedAndStarted();
            return this.xapiTracker.trace(verb, objectType, objectId)
                .withActorAccount(this.getActor(jwtToken), config.simva.url);
        } catch(err) {
            logger.error(err, `Could not trace ${verb} ${objectId}`);
            return NOOP_STATEMENT;
        }
    }

    getActivityUrl(simletId, sessionId, activityId, useTestUrls = false) {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.simva.url}${prefix}/simlets/${simletId}/sessions/${sessionId}/activities/${activityId}`;
	}

	getSessionUrl(simletId, sessionId, useTestUrls = false){
		const prefix = useTestUrls ? "/test" : "";
		return `${config.simva.url}${prefix}/simlets/${simletId}/sessions/${sessionId}`;
	}

	getSimletUrl(simletId, useTestUrls = false) {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.simva.url}${prefix}/simlets/${simletId}`;
	}

	getStandaloneActivityUrl(activityId, useTestUrls = false) {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.simva.url}${prefix}/activities/${activityId}`;
	}

	getSimletType() {
		return `${config.simva.url}/about#simlet`;
	}

	getSessionType() {
		return `${config.simva.url}/about#session`;
	}

    getActivityType() {
    	return `${config.simva.url}/about#activity`;
    }

    getGroupType() {
    	return `${config.simva.url}/about#group`;
    }

    getUserType() {
    	return `${config.simva.url}/about#user`;
    }
}

module.exports = new XasuJSClient();