
var Simva = {
	apiurl: null,
	jwt: null,

	setAPIURL: function(apiurl){
		this.apiurl = apiurl;
	},

	setJWT: function(jwt){
		this.jwt = jwt;
	},

	login: function(username, password, callback){
		let body = { username: username, password: password }
		Utils.post(this.apiurl + '/users/login', body, callback);
	},

	register: function(username, email, password, role, callback){
		let body = { username: username, email: email, password: password, role: role };
		Utils.post(this.apiurl + '/users/', body, callback);
	},

	// GROUPS
	
	getGroups: function(callback){
		Utils.get(this.apiurl + '/groups', callback, this.jwt);
	},

	addGroup: function(name, callback){
		let body = { name: name };
		Utils.post(this.apiurl + '/groups', body, callback, this.jwt);
	},

	updateGroup: function(group, callback){
		Utils.put(this.apiurl + '/groups/' + group._id, group, callback, this.jwt);
	},

	getGroup: function(group_id, callback){
		Utils.get(this.apiurl + '/groups/' + group_id, callback, this.jwt);
	},

	getGroupParticipants: function(group_id, callback){
		Utils.get(this.apiurl + '/groups/' + group_id + '/participants', callback, this.jwt);
	},

	getGroupPrintable: function(group_id, callback){
		Utils.getPDF(this.apiurl + '/groups/' + group_id + '/printable', callback, this.jwt);
	},

	// STUDIES

	getStudies: function(callback){
		Utils.get(this.apiurl + '/studies', callback, this.jwt);
	},

	addStudy: function(name, callback){
		let body = { name: name };
		Utils.post(this.apiurl + '/studies', body, callback, this.jwt);
	},

	addTestToStudy: function(study_id, name, callback){
		let body = { name: name };
		Utils.post(this.apiurl + '/studies/' + study_id + '/tests', body, callback, this.jwt);
	},

	getStudy: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id, callback, this.jwt);
	},

	updateStudy: function(study, callback){
		Utils.put(this.apiurl + '/studies/' + study._id, study, callback, this.jwt);
	},

	getAllocator: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/allocator', callback, this.jwt);
	},

	updateAllocator: function(study_id, allocator, callback){
		Utils.put(this.apiurl + '/studies/' + study_id + '/allocator', allocator, callback, this.jwt);
	},

	getStudyTests: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/tests', callback, this.jwt);
	},

	getStudyGroups: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/groups', callback, this.jwt);
	},

	getTestActivities: function(study_id, test_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/tests/' + test_id + '/activities', callback, this.jwt);
	},

	getStudyParticipants: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/participants', callback, this.jwt);
	},

	// Activities

	addActivityToTest: function(study_id, test_id, activity, callback){
		Utils.post(this.apiurl + '/studies/' + study_id + '/tests/' + test_id + '/activities', activity, callback, this.jwt);
	},

	getActivityCompletion: function(activity_id, callback){
		Utils.get(this.apiurl + '/activities/' + activity_id + '/completion', callback, this.jwt);
	},

	getActivityResultForUser(activity_id, student, callback){
		Utils.get(this.apiurl + '/activities/' + activity_id + '/result?users=' + student, callback, this.jwt);
	},

	getActivityResult: function(activity_id, callback){
		Utils.get(this.apiurl + '/activities/' + activity_id + '/result', callback, this.jwt);
	},

	hasActivityResult: function(activity_id, callback){
		Utils.get(this.apiurl + '/activities/' + activity_id + '/hasresult', callback, this.jwt);
	},

	getActivityTarget: function(activity_id, callback){
		Utils.get(this.apiurl + '/activities/' + activity_id + '/target', callback, this.jwt);
	},

	deleteActivity: function(activity_id, callback){
		Utils.delete(this.apiurl + '/activities/' + activity_id, callback, this.jwt);
	},

	getActivityTypes: function(callback){
		Utils.get(this.apiurl + '/activitytypes', callback, this.jwt);
	},
}