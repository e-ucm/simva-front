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
		gameplay_trace_storage.checked = activity.extra_data.config.trace_storage;
		var gameplay_backup = document.getElementById('edit_gameplay_backup');
		gameplay_backup.checked = activity.extra_data.config.backup;
		var gameplay_game_uri = document.getElementById('edit_gameplay_game_uri');
		gameplay_game_uri.value = activity.extra_data.game_uri;

	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.type = this.supportedType;

		activity.trace_storage = formdata.trace_storage === 'on';
		activity.realtime = formdata.realtime === 'on';
		activity.backup = formdata.backup === 'on';
		if(formdata.game_uri !== ''){
			activity.game_uri = formdata.game_uri;
		}

		callback(null, activity);
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.name !== formdata.name) {
			activity.name = formdata.name;
		}
	
		let trace_storage = formdata.trace_storage === 'on';
		if(actualActivity.extra_data.config.trace_storage !== trace_storage) {
			activity.trace_storage = trace_storage;
		}
		let realtime = formdata.realtime === 'on';
		if(actualActivity.extra_data.config.realtime !== realtime) {
			activity.realtime = realtime;
		}
		let backup = formdata.backup === 'on';
		if(actualActivity.extra_data.config.backup !== backup) {
			activity.backup = backup;
		}
		let game_uri=formdata.game_uri;
		if(!(actualActivity.extra_data.game_uri == game_uri)) {
			if(actualActivity.extra_data.game_uri) {
				activity.game_uri = game_uri;
			} else {
				if(game_uri !== ''){
					activity.game_uri = game_uri;
				}
			}
		}
	
		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity);
	},

	updateParticipants: function(activity){
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target);
		}
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true);
		PainterFactory.Painters["activity"].paintActivityProgress(activity, activity.data.progress);
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.hasresult, false, this.communSpecific.result_zero, null,this.communSpecific.result_view_partial_value, true, this.communSpecific.result_view_final_value);
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

		var blob = new Blob([content], {
		 type: "text/plain;charset=utf-8"
		});

		Utils.download(filename, content);
	},

	paintActivity: function(activity, participants){
		let activitybox = `<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simple_name}</p>`;
		activitybox += `<br>${this.commun.storage_title}:`;
		if(activity.extra_data.config.trace_storage) {
			activitybox += `<a onclick="PainterFactory.Painters['activity'].getMinioData('${activity._id}')" target="_blank">${this.commun.storage_file_title} ${this.commun.storage_file_one_per_line_title}</a>
			<br>
			<br>
			<a onclick="PainterFactory.Painters['activity'].getTMonUrl('${activity._id}','${activity.test}','${activity.study}')">
				${this.commun.tmon_title}
			</a>
			<br>
			${this.specific.xasu_title}:
			<a onclick="GameplayActivityPainter.downloadXasuConfig('${activity._id}','${activity.study}')">
				<img src="/ua.png"  width="20" height="20">
			</a>`;
		} else {
			activitybox += `<i>${this.commun.result_disabled}</i>`;
		}
		activitybox +='<br>'
		activitybox += `${this.communSpecific.result_title}:`
		if(activity.extra_data.config.backup){
			activitybox += `<a onclick="GameplayActivityPainter.downloadBackup('${activity._id}')"> ⬇️</a>` 
		} else {
			activitybox += `<i>${this.commun.result_disabled}</i>`;
		}
		activitybox += '</p>';
		activitybox += `<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`
		if(activity.extra_data.config.trace_storage){
			activitybox += `<div id="progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>GameProgress:  <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`
		}
		if(activity.extra_data.config.backup){
			activitybox += `<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>BackupResults:  <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`
		}
		activitybox += `${this.paintActivityParticipantsTable(activity, participants)}</div>`;

		$(`#test_${activity.test} .activities`).append(activitybox);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Progress</th>';
		//toret += '<th>Traces</th>';
		toret += '<th>Backup</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}

			toret += '<tr>';
			toret += `<td>${PainterFactory.Painters["activity"].paintUsernameOrToken(activity, participants[i], (activity.extra_data.game_uri && activity.extra_data.game_uri !== ''))}</td>`;

			toret += `${PainterFactory.Painters["activity"].paintCompletionRow(activity._id,participants[i].username, true)}`;

			toret += `<td id="progress_${activity._id}_${participants[i].username}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>`

			if(activity.extra_data.config.backup){
				toret += `${PainterFactory.Painters["activity"].paintResultRow(activity._id,participants[i].username)}`;
			}else{
				toret += '<td><i>Disabled</i></td>';
			}
		}

		toret += '</table>';

		return toret;
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
					var filename = `${this.communSpecific.result_file}_${activity}_${user}.json`;
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
					Utils.download(`${this.communSpecific.result_file}_${activity}.json`, JSON.stringify(result, null, 2));
				}
			});
		}
	},
	
	openTraces: function(activity, user){
		Simva.getActivityResultForUser(activity, user, function(error, result){
			if(error){
				$.toast({
					heading: 'Error loading the result',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{

				let printAnalysisRecursive = function(analysis){
					let block = '<div>';
					let keys = Object.keys(analysis);

					for (var i = keys.length - 1; i >= 0; i--) {
						if(typeof analysis[keys[i]] === 'object'){
							block += `<p>${keys[i]}</p>`;
							block += printAnalysisRecursive(analysis[keys[i]]);
						}else{
							block += `<p>${keys[i]}: ${analysis[keys[i]]}</p>`;
						}
					}
					
					block += '</div>';

					return block;
				}


				let content = `<link href="/css/style.css" rel="stylesheet" type="text/css"><div style="padding: 20px;" class="analysis">${printAnalysisRecursive(result[user].realtime)}</div>`;
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				Utils.toggleAddForm('iframe_floating');
			}
		})
	},
}

PainterFactory.addPainter(GameplayActivityPainter);