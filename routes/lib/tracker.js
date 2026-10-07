const { LRSTracker } = require("js-tracker");
const config = require("../../config.js");
const ms = require("ms");
const logger = require("../../logger.js");
const usertools = require('../lib/usertools.js');

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

    async trace(verb, objectType, objectId, jwtToken) {
        await this.ensureLoggedAndStarted().catch(err => {
            logger.error(err, 'Tracker login failed');
            return null;
        });
        const username = jwtToken ? usertools.decodeJWT(jwtToken).preferred_username : null;
        return this.xapiTracker.trace(verb, objectType, objectId).withActorAccount(username || reqSessionId, config.simva.url);
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
}

module.exports = new XasuJSClient();