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
	simpleName: 'Gameplay activity',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		return `<div class="gameplay_activity"><p><label for="gameplay_trace_storage">Trace Storage</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			 <p><label for="gameplay_backup">Backup</label><input id="gameplay_backup" type="checkbox" name="backup" checked></p>
			 <p><label for="gameplay_game_uri" style="width: 100%; text-align: center;">Game URI (optional)</label><input id="gameplay_game_uri" type="text" name="game_uri">
			 <span class="info">Game URI can include tags: {simvaResultUri}, {simvaHomePage}, {username}, {authToken} and {activityId}</p></div>`;
			 //<p><label for="gameplay_realtime">Realtime</label><input id="gameplay_realtime" type="checkbox" name="realtime"></p>
	},

	getEditExtraForm: function () {
		return `<div class="gameplay_activity"><p><label for="edit_gameplay_trace_storage">Trace Storage</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			 <p><label for="edit_gameplay_backup">Backup</label><input id="edit_gameplay_backup" type="checkbox" name="backup" checked></p>
			 <p><label for="edit_gameplay_game_uri" style="width: 100%; text-align: center;">Game URI (optional)</label><input id="edit_gameplay_game_uri" type="text" name="game_uri">
			 <span class="info">Game URI can include tags: {simvaResultUri}, {simvaHomePage}, {username}, {authToken} and {activityId}</p></div>`;
			 //<p><label for="gameplay_realtime">Realtime</label><input id="gameplay_realtime" type="checkbox" name="realtime"></p>
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

	extractEditInformation: function(form, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		Simva.getActivity(formdata.activity, function(error, actualActivity){
			if(!error) {
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
			} else {
				callback(error, null);
			}
		});
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		let tmp = this;

		Simva.isActivityOpenable(activity._id, function(error, result){
			activity.isOpenable = result.openable;
			if(activity.isOpenable){
				Simva.getActivityTarget(activity._id, function(error, result){
					activity.tmp.result = result;
					tmp.paintActivityTargets(activity, result);
				});
			}
			tmp.updateParticipants(activity);
		});
	},

	updateParticipants: function(activity){
		let tmp = this;
		activity.tmp = {};

		Simva.getActivityCompletion(activity._id, function(error, result){
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.getActivityProgress(activity._id, function(error, result){
			tmp.paintActivityProgress(activity, result);
		});

		Simva.getActivityHasResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},
	
	downloadXasuConfig: function(activityId){
		var content = JSON.stringify({
			online: true,
			simva :true,
			lrs_endpoint : `${Simva.apiurl}/activities/${activityId}`,
			auth_protocol : "oauth2",
			auth_parameters : {
				grant_type : "code",
       			auth_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/auth`, 
        		token_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/token`,
        		client_id : "simva-plugin",
        		code_challenge_method : "S256"
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
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>`;
		
		/*
		activitybox += 'Realtime: ';
		if(activity.extra_data.config.realtime){
			activitybox += `<a href="${this.utils.dashboard_url}${activity.extra_data.analytics.activity._id}${this.utils.dashboard_query}" target="_blank">Dashboard</a>`;
		}else{
			activitybox += '<i>Disabled</i>';
		}
		activitybox += '<br>'
		*/
		activitybox += '<p>Trace Storage: '
		if(activity.extra_data.config.trace_storage) {
			activitybox += `<a onclick="GameplayActivityPainter.getMinioData('${activity._id}')" target="_blank">Download Data</a>
			<br>
			XASU Config:
			<a onclick="GameplayActivityPainter.downloadXasuConfig('${activity._id}')">
				<img src="/ua.png"  width="20" height="20">
			</a>`;
		} else {
			activitybox += '<i>Disabled</i>';
		}
		activitybox +='<br>'
		activitybox += 'Backup: '
		if(activity.extra_data.config.backup){
			activitybox += `<a onclick="GameplayActivityPainter.downloadBackup('${activity._id}')"> ⬇️</a>` 
		} else {
			activitybox += '<i>Disabled</i>';
		}
		activitybox += '</p>';
		activitybox += `<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`
		if(activity.extra_data.config.trace_storage){
			activitybox += `<div id="progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>GameProgress:  <partial>0</partial>(<done>0</done>)%  [ <partialres>0</partialres> (<doneres>0</doneres>) /<total>0</total> ]</span></div>`
		}
		if(activity.extra_data.config.backup){
			activitybox += `<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>BackupResults:  <partial>0</partial>(<done>0</done>)%  [ <partialres>0</partialres> (<doneres>0</doneres>) /<total>0</total> ]</span></div>`
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

			if(activity.isOpenable || (activity.extra_data.game_uri && activity.extra_data.game_uri !== '') ){
				toret += `<td><a id="${activity._id}_" ${participants[i].username}_target"class="targeturl" target="_blank" href="">
				${participants[i].username}</a></td>`;
			}else{
				toret += `<td>${participants[i].username}</td>`;
			}

			toret += `<td id="completion_${activity._id}_${participants[i].username}">---</td>`;

			toret += `<td id="progress_${activity._id}_${participants[i].username}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>`
			//toret += `<td id="traces_${activity._id}_${participants[i].username}">---</td>`;
			
			if(activity.extra_data.config.backup){
				toret += `<td id="result_${activity._id}_${participants[i].username}">---</td></tr>`;
			}else{
				toret += '<td><i>Disabled</i></td>';
			}
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, status);
	},

	paintActivityProgress: function(activity, status){
		PainterFactory.Painters["activity"].paintActivityProgress(activity, status);
	},

	paintActivityResult: function(activity, results){
		PainterFactory.Painters["activity"].paintActivityResult(activity, results);
	},

	updateActivityResult: function(activityId, username, backup) {
		PainterFactory.Painters["activity"].updateActivityResult(activityId, username,backup);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username,completion);
	},

	updateActivityProgress: function(activityId, username, result) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username,result);
	},

	paintActivityTargets: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$(`#${activity._id}_${usernames[i]}_target`).attr('href', results[usernames[i]]);
		}
	},
	
	downloadBackup: function(activity, user){
		var toastParams = {
			heading: 'Error loading the result',
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
					var filename = `${activity}_${user}.json`;
					Utils.download(filename, result[user]);
				}
			});
		} 
		else 
		{
			Simva.downloadActivityResult(activity);
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
				toggleAddForm('iframe_floating');
			}
		})
	},

	getMinioData: function(activity){
		Simva.getMinioDataUrl(activity, function(error, result){
			console.log("Callback triggered");
			if(error){
				console.log("Error:", error);  // Log the error object for better visibility
				$.toast({
					heading: 'Error loading the result',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				console.log("Result:", result);  // Log the entire result for debugging
       			let url = result.url;

       			// Open the generated URL in a new tab
       			window.open(url, '_blank');

       			// If you still want to show a message or update the UI in some way, you can do it here
			}
		})
	},
}

PainterFactory.addPainter(GameplayActivityPainter);