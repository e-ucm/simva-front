
var Simva = {
	apiurl: null,
	jwt: null,
	expiration: null,
	ssoUrl:null,
	ssoRealm:null,

	setAPIURL: function(apiurl){
		this.apiurl = apiurl;
	},

	
	setSSOURL: function(ssoUrl){
		this.ssoUrl = ssoUrl;
	},

	setSSOREALM: function(ssoRealm){
		this.ssoRealm = ssoRealm;
	},

	setJWT: function(jwt){
		this.jwt = jwt;
		this.expiration = parseInt(Utils.decodeJWT(this.jwt).exp);

	},

	login: function(username, password, callback){
		let body = { username: username, password: password }
		Utils.post('/users/login', body, callback);
	},

	checkAndUpdateAuth(callback){
		let current = Math.floor(Date.now() / 1000);

		if(current > this.expiration){
			this.refreshAuth(callback);
		}else{
			callback(null);
		}
	},

	refreshAuth: function(callback){
		Utils.get('/users/refresh_auth', function(error, result){
			if(!error){
				let body = JSON.parse(result);
				Simva.setJWT(body.access_token);
				callback(null);
			}else{
				callback(error);
			}
		});
	},

	// REQUEST CHECKING AUTH

	post: function(url, body, callback){
		this.checkAndUpdateAuth(function(error, result){
			if(!error){
				Utils.post(url, body, callback, Simva.jwt);
			}else{
				console.log(error);
			}
		})
	},

	put: function(url, body, callback){
		this.checkAndUpdateAuth(function(error){
			if(!error){
				Utils.put(url, body, callback, Simva.jwt);
			}else{
				console.log(error);
			}
		})
	},

	get: function(url, callback){
		this.checkAndUpdateAuth(function(error){
			if(!error){
				Utils.get(url, callback, Simva.jwt);
			}else{
				console.log(error);
			}
		})
	},

	getPDF: function(url, callback){
		this.checkAndUpdateAuth(function(error){
			if(!error){
				Utils.getPDF(url, callback, Simva.jwt);
			}else{
				console.log(error);
			}
		})
	},

	delete: function(url, callback){
		this.checkAndUpdateAuth(function(error){
			if(!error){
				Utils.delete(url, callback, Simva.jwt);
			}else{
				console.log(error);
			}
		})
	},

	// USER

	register: function(username, email, password, role, callback){
		let body = { username: username, email: email, password: password, role: role };
		Utils.post(this.apiurl + '/users/', body, callback);
	},

	setRole: function(role, callback){
		let body = { role: role };
		this.post(this.apiurl + '/users/role', body, callback);
	},

	// GROUPS
	
	getGroups: function(callback){
		this.get(this.apiurl + '/groups', callback);
	},

	addGroup: function(name, callback){
		let body = { name: name };
		this.post(this.apiurl + '/groups', body, callback);
	},

	updateGroup: function(group, callback){
		this.put(this.apiurl + '/groups/' + group._id, group, callback);
	},

	getGroup: function(group_id, callback){
		this.get(this.apiurl + '/groups/' + group_id, callback);
	},

	getGroupParticipants: function(group_id, callback){
		this.get(this.apiurl + '/groups/' + group_id + '/participants', callback);
	},

	getGroupPrintable: function(group_id, callback){
		this.getPDF(this.apiurl + '/groups/' + group_id + '/printable', callback);
	},

	// STUDIES

	getStudies: function(callback){
		this.get(this.apiurl + '/studies', callback);
	},

	addStudy: function(name, callback){
		let body = { name: name };
		this.post(this.apiurl + '/studies', body, callback);
	},

	addTestToStudy: function(study_id, name, callback){
		let body = { name: name };
		this.post(this.apiurl + '/studies/' + study_id + '/tests', body, callback);
	},

	getStudy: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id, callback);
	},

	updateStudy: function(study, callback){
		this.put(this.apiurl + '/studies/' + study._id, study, callback);
	},

	deleteStudy: function(study_id, callback){
		this.delete(this.apiurl + '/studies/' + study_id, callback);
	},

	getAllocator: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/allocator', callback);
	},

	updateAllocator: function(study_id, allocator, callback){
		this.put(this.apiurl + '/studies/' + study_id + '/allocator', allocator, callback);
	},

	getStudyTests: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/tests', callback);
	},

	getStudyGroups: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/groups', callback);
	},

	getTestActivities: function(study_id, test_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/tests/' + test_id + '/activities', callback);
	},

	getStudyParticipants: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/participants', callback);
	},

	getStudySchedule: function(study_id, callback){
		this.get(this.apiurl + '/studies/' + study_id + '/schedule', callback);
	},

	// Activities

	addActivityToTest: function(study_id, test_id, activity, callback){
		this.post(this.apiurl + '/studies/' + study_id + '/tests/' + test_id + '/activities', activity, callback);
	},

	getActivityCompletion: function(activity_id, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/completion', callback);
	},

	setActivityCompletion: function(activity_id, user, status, callback){
		this.post(this.apiurl + '/activities/' + activity_id + '/completion?user=' + user, { status: status }, callback);
	},

	getActivityResultForUser(activity_id, student, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/result?users=' + student, callback);
	},

	getActivityResult: function(activity_id, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/result', callback);
	},
	
	downloadActivityResult: async function(activity_id) {
		try {
			let url = this.apiurl + `/activities/${activity_id}/result?token=${this.jwt}`;
			window.location.href = url; // Redirige al usuario para iniciar la descarga

		} catch (error) {
			console.error('Error al descargar el archivo:', error);
		}
	},

	hasActivityResult: function(activity_id, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/hasresult', callback);
	},

	getActivityTarget: function(activity_id, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/target', callback);
	},

	isActivityOpenable: function(activity_id, callback){
		this.get(this.apiurl + '/activities/' + activity_id + '/openable', callback);
	},

	deleteActivity: function(activity_id, callback){
		this.delete(this.apiurl + '/activities/' + activity_id, callback);
	},

	getActivityTypes: function(callback){
		this.get(this.apiurl + '/activitytypes', callback);
	},

	getAllocatorTypes: function(callback){
		this.get(this.apiurl + '/allocatortypes', callback);
	},

	// LTI

	getLtiTools: function(callback){
		this.get(this.apiurl + '/lti/tools', callback);
	},

	addLtiTool: function(tool, callback){
		this.post(this.apiurl + '/lti/tools', tool, callback);
	},

	deleteLtiTool: function(tool, callback){
		this.delete(this.apiurl + '/lti/tools/' + tool, callback);
	},

	getLtiPlatforms: function(study, callback){
		let query = '';
		if(study){
			console.log(study);
			query = '?searchString=' + encodeURI('{"studyId":"' + study + '"}');
		}

		this.get(this.apiurl + '/lti/platforms' + query, callback);
	},

	addLtiPlatform: function(platform, callback){
		this.post(this.apiurl + '/lti/platforms', platform, callback);
	},

	removePlatform: function(platform_id, callback){
		this.delete(this.apiurl + '/lti/platforms/' + platform_id, callback);
	}
}