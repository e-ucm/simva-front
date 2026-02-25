if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var GameplayActivityPainter = {
	supportedType: 'gameplay',
	simple_name: 'Gameplay activity',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function (callback) {
		callback(null, `<div class="gameplay_activity"><p><label for="gameplay_trace_storage">${this.commun.storage_title}</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			 <p><label for="gameplay_backup">${this.communSpecific.result_title}</label><input id="gameplay_backup" type="checkbox" name="backup" checked></p>
			 <p><label for="gameplay_scorm_xAPI">${this.specific.xapi_by_game_title}</label><input id="gameplay_scorm_xAPI" type="checkbox" name="scorm_xapi"></p>
			 <p><label for="gameplay_game_uri" style="width: 100%; text-align: center;">${this.specific.game_uri_title}</label><input id="gameplay_game_uri" type="text" name="game_uri">
			 <span><p>${this.specific.game_uri_explication}</p></div>`);
	},

	getEditExtraForm: function () {
		return `<div class="gameplay_activity"><p><label for="edit_gameplay_trace_storage">${this.commun.storage_title}</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			 <p><label for="edit_gameplay_backup">${this.communSpecific.result_title}</label><input id="edit_gameplay_backup" type="checkbox" name="backup" checked></p>
			 <p><label for="edit_gameplay_scorm_xAPI">${this.specific.xapi_by_game_title}</label><input id="edit_gameplay_scorm_xAPI" type="checkbox" name="scorm_xapi" checked></p>
			 <p><label for="edit_gameplay_game_uri" style="width: 100%; text-align: center;">${this.specific.game_uri_title}</label><input id="edit_gameplay_game_uri" type="text" name="game_uri">
			 <span class="info"><p>${this.specific.game_uri_explication}</p></div>`;
	},

	updateInputEditExtraForm(activity) {
		var gameplay_trace_storage = document.getElementById('edit_gameplay_trace_storage');
		gameplay_trace_storage.checked = Boolean(activity.activity_trace_storage);
		var gameplay_backup = document.getElementById('edit_gameplay_backup');
		gameplay_backup.checked = Boolean(activity.game_backup);
		var gameplay_scorm_xAPI = document.getElementById('edit_gameplay_scorm_xAPI');
		gameplay_scorm_xAPI.checked = Boolean(activity.game_scorm_xapi);
		var gameplay_game_uri = document.getElementById('edit_gameplay_game_uri');
		gameplay_game_uri.value = activity.game_url || "";
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.activity_type = this.supportedType;

		activity.activity_trace_storage = formdata.trace_storage === 'on';
		activity.game_backup = formdata.backup === 'on';
		activity.game_scorm_xapi = formdata.scorm_xapi === 'on';
		if(formdata.game_uri !== ''){
			activity.game_uri = formdata.game_uri;
			activity.game_url = formdata.game_uri;
		}

		callback(null, activity);
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.activity_name !== formdata.name) {
			activity.name = formdata.name;
		}
		const actualTraceStorage = actualActivity.activity_trace_storage;
		let trace_storage = formdata.trace_storage === 'on';
		if(actualTraceStorage !== trace_storage) {
			activity.activity_trace_storage = trace_storage;
		}
		const actualScormXapiByGame = actualActivity.game_scorm_xapi;
		let scorm_xapi_by_game = formdata.scorm_xapi === 'on';
		if(actualScormXapiByGame !== scorm_xapi_by_game) {
			activity.game_scorm_xapi = scorm_xapi_by_game;
		}
		const actualBackup = actualActivity.game_backup;
		let backup = formdata.backup === 'on';
		if(actualBackup !== backup) {
			activity.game_backup = backup;
		}
		let game_uri = formdata.game_uri;
		const actualGameUri = actualActivity.game_url || (actualActivity.extra_data && actualActivity.extra_data.game_uri) || '';
		if(actualGameUri !== game_uri) {
			if(game_uri !== '' || actualGameUri !== '') {
				activity.game_uri = game_uri;
			}
		}
	
		callback(null, activity);
	},

	fullyPaintActivity: function(activity, participants){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity, participants);
	},

	updateParticipants: function(activity, participants){
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true, participants);
		PainterFactory.Painters["activity"].paintActivityInit(activity, activity.data.init, participants);
		PainterFactory.Painters["activity"].paintActivityProgress(activity, activity.data.progress, participants);
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.hasresult, false, participants, this.communSpecific.result_zero, null,this.communSpecific.result_view_partial_value, true, this.communSpecific.result_view_final_value);
	},
	
	downloadXasuConfig: function(activityId, studyId){
		var content = JSON.stringify({
			online: true,
			simva :true,
			homepage:`${Simva.url}`,
			lrs_endpoint : `${Simva.apiurl}/activities/${activityId}`,
			auth_protocol : "oauth2",
			auth_parameters : {
				grant_type : "code",
       			auth_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/auth`, 
        		token_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/token`,
        		client_id : "simva-plugin",
        		code_challenge_method : "S256",
				simva_user_token:"true",
    			login_hint: studyId
			}
		}, null, 2);

		var filename = "tracker_config.json";

		Utils.download(filename, content);
	},

	paintActivity: function(activity, participants){
		let activitybox = `<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			<div class="top"><h4>${activity.activity_name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity.activity_id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity.activity_id}', '${activity.activity_name}', '${activity.session_id}')"></div>
			<p class="subtitle">${this.simple_name}</p>`;
		activitybox += `<br>${this.commun.storage_title}:`;
		if(activity.activity_trace_storage) {
			activitybox += `<a onclick="PainterFactory.Painters['activity'].getMinioData('${activity.activity_id}')" target="_blank">${this.commun.storage_file_title} ${this.commun.storage_file_one_per_line_title}</a>
			<br>
			<br>
			<a onclick="PainterFactory.Painters['activity'].getTMonUrl('${activity.activity_id}','${activity.session_id}','${activity.study}')">
				${this.commun.tmon_title}
			</a>
			<br>
			${this.specific.xasu_title}:
			<a onclick="GameplayActivityPainter.downloadXasuConfig('${activity.activity_id}','${activity.study}')">
				<img src="/ua.png"  width="20" height="20">
			</a>`;
		} else {
			activitybox += `<i>${this.commun.result_disabled}</i>`;
		}
		activitybox +='<br>'
		activitybox += `${this.communSpecific.result_title}:`
		if(activity.game_backup){
			activitybox += `<a onclick="GameplayActivityPainter.downloadBackup('${activity.activity_id}')"> ⬇️</a>` 
		} else {
			activitybox += `<i>${this.commun.result_disabled}</i>`;
		}
		activitybox += '</p>';
		activitybox += `${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true)}</div>`;

		$(`#test_${activity.session_id} .activities`).append(activitybox);
	},

	updateActivityResult: function(activityId, username, backup) {
		PainterFactory.Painters["activity"].updateActivityResult(activityId, username,backup, true, this.communSpecific.result_zero, null,this.communSpecific.result_view_partial_value, "true", this.communSpecific.result_view_final_value,"PainterFactory.Painters['activity']");
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	},

	updateActivityProgress: function(activityId, username, result) {
		PainterFactory.Painters["activity"].updateActivityProgress(activityId, username,result);
	},
	
	downloadBackup: function(activity, user){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		
		if(user){
			Simva.getActivityResultForUser(activity, user, function(error, result){
				if(error){
					toastParams.text = error.message;
					$.toast(toastParams);
				}else{
					var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}.json`;
					Utils.download(filename, result[user]);
				}
			});
		} 
		else 
		{
			Simva.getActivityResult(activity, (error, result) => {
				if(error) {
					toastParams.text = error.message;
					$.toast(toastParams);
				} else {
					Utils.download(`${this.communSpecific.result_file_prefix}_${activity}.json`, JSON.stringify(result, null, 2));
				}
			});
		}
	},
}

PainterFactory.addPainter(GameplayActivityPainter);