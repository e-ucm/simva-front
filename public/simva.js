
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

	// STUDIES

	getStudies: function(callback){
		Utils.get(this.apiurl + '/studies', callback, this.jwt);
	},

	addStudy: function(name, callback){
		let body = { name: name };
		Utils.post(this.apiurl + '/studies', body, callback, this.jwt);
	},

	getStudy: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id, callback, this.jwt);
	},

	getStudyTests: function(study_id, callback){
		Utils.get(this.apiurl + '/studies/' + study_id + '/tests', callback, this.jwt);
	},

	getTestActivities: function(study_id, test_id, callback){
		Utils.get(this.apiurl + '/studies/' + id + '/tests/ ' + test_id + '/activities', callback, this.jwt);
	},

}