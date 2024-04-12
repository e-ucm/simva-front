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
		return '<div class="gameplay_activity"><p><label for="gameplay_trace_storage">Trace Storage</label><input id="gameplay_trace_storage" type="checkbox" name="trace_storage"></p>'
			// + '<p><label for="gameplay_realtime">Realtime</label><input id="gameplay_realtime" type="checkbox" name="realtime"></p>'
			 + '<p><label for="gameplay_backup">Backup</label><input id="gameplay_backup" type="checkbox" name="backup" checked></p>'
			 + '<p><label for="gameplay_game_uri" style="width: 100%; text-align: center;">Game URI (optional)</label><input id="gameplay_game_uri" type="text" name="game_uri">'
			 + '<span class="info">Game URI can include tags: {authToken}, {username}, and {activityId}</p></div>';
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

		Simva.getActivityHasResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},
	
	downloadXasuConfig: function(activityId){
		var content = JSON.stringify({
			online: true,
			simva :true,
			lrs_endpoint : Simva.apiurl + "/activities/" + activityId,
			auth_protocol : "oauth2",
			auth_parameters : {
				grant_type : "code",
       			auth_endpoint : Simva.ssoUrl+ "/realms/" + Simva.ssoRealm + "/protocol/openid-connect/auth", 
        		token_endpoint : Simva.ssoUrl + "/realms/" + Simva.ssoRealm + "/protocol/openid-connect/token", 
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
		let activitybox = '<div id="activity_' + activity._id + '" class="activity t' + activity.type + '">'
			+ '<div class="top"><h4>' + activity.name + '</h4>'
			+ '<input class="red" type="button" value="X" onclick="deleteActivity(\'' + activity._id + '\')"></div>'
			+ '<p class="subtitle">' + this.simpleName + '</p>';

		activitybox += '<p>'
		/*
		activitybox += 'Realtime: ';
		if(activity.extra_data.config.realtime){
			activitybox += '<a href="' + this.utils.dashboard_url
			+ activity.extra_data.analytics.activity._id + this.utils.dashboard_query + '" target="_blank">Dashboard</a>';
		}else{
			activitybox += '<i>Disabled</i>';
		}
		activitybox += '<br>'
		*/
		activitybox += 'Trace Storage: '
		if(activity.extra_data.config.trace_storage) {
			activitybox += '<a href="' + this.utils.minio_url + "minio/"+ this.utils.minio_bucket + '/' + this.utils.topics_dir + '/' + this.utils.trace_topic  + '/_id=' + activity._id + '/" target="_blank">Folder</a>' 
			activitybox += ' / '
			activitybox += '<a href="' + this.utils.minio_url + "minio/"+ this.utils.minio_bucket + '/' + this.utils.users_dir + '/' + this.utils.user_folder + '/' + activity._id + '/" target="_blank">Combined Data</a>'
			activitybox += '<br>'
			activitybox += 'XASU Config: '
			activitybox += '<a onclick="GameplayActivityPainter.downloadXasuConfig(\'' + activity._id + '\')"><img src="/ua.png"  width="20" height="20"></a>'
		} else {
			activitybox += '<i>Disabled</i>';
		}
		activitybox += '<br>'
		activitybox += 'Backup: '
		if(activity.extra_data.config.backup){
			activitybox += '<a onclick="GameplayActivityPainter.downloadBackup(\'' + activity._id + '\')"> ⬇️</a>' 
		} else {
			activitybox += '<i>Disabled</i>';
		}
		activitybox += '</p>';		
		activitybox += '<div id="completion_progress_' + activity._id + '" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>'
		if(activity.extra_data.config.backup){
			activitybox += '<div id="result_progress_' + activity._id + '" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>'
		}
		activitybox += this.paintActivityParticipantsTable(activity, participants) + '</div>';

		$('#test_' + activity.test + ' .activities').append(activitybox);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th>';
		if(activity.extra_data.config.realtime){
			toret += '<th>Progress</th><th>Traces</th>';
		}
		toret += '<th>Backup</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			toret += '<tr>';

			if(activity.isOpenable || (activity.extra_data.game_uri && activity.extra_data.game_uri !== '') ){
				toret += '<td><a id="' + activity._id + "_" + participants[i].username + '_target"class="targeturl" target="_blank" href="">'
				+ participants[i].username + '</a></td>';
			}else{
				toret += '<td>' + participants[i].username + '</td>';
			}

			toret += '<td id="completion_' + activity._id + '_' + participants[i].username + '">---</td>';

			if(activity.extra_data.config.realtime){
				toret += '<td id="progress_' + activity._id + '_' + participants[i].username + '" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>'
						+ '<td id="traces_' + activity._id + '_' + participants[i].username + '">---</td>';
			}else{
				toret += ''
			}
			
			if(activity.extra_data.config.backup){
				toret += '<td id="backup_' + activity._id + '_' + participants[i].username + '">---</td></tr>';
			}else{
				toret += '<td><i>Disabled</i></td>';
			}
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		let usernames = Object.keys(status);

		let done = 0;

		for (var i = 0; i < usernames.length; i++) {
			if(status[usernames[i]]){
				done++;
			}

			let completion = '<span>' + status[usernames[i]] + '</span>'
			$('#completion_' + activity._id + '_' + usernames[i]).addClass(!status[usernames[i]] ? 'red' : 'green');
			$('#completion_' + activity._id + '_' + usernames[i]).empty();
			$('#completion_' + activity._id + '_' + usernames[i]).append(completion);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$('#completion_progress_' + activity._id + ' .done').css('width', progress + '%' );
		$('#completion_progress_' + activity._id + ' done').text(progress);
	},

	paintActivityResult: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;

		for (var i = 0; i < usernames.length; i++) {
			let status = results[usernames[i]];
			let traces = '<span>No traces</span>';
			let backup = '<span><i>Disabled</i></span>';
			if(activity.extra_data.config.backup){
				backup = '<span>No backup</span>';
			}

			if(status){
				done++;

				let tmpprogress = 0; 
				if(status){
					if(activity.extra_data.config.backup && results[usernames[i]]){
						backup = '<span ><a onclick="GameplayActivityPainter.downloadBackup(\'' + activity._id + '\',\'' + usernames[i]
							 + '\')">Download</a></span>';
					}
					
				}
				/*
				tmpprogress = (tmpprogress * 1000) / 10;
				$('#progress_' + activity._id + '_' + usernames[i] +' .done').css('width', tmpprogress + '%' );
				$('#progress_' + activity._id + '_' + usernames[i] +' done').text(tmpprogress);*/
			}


			/*$('#traces_' + activity._id + '_' + usernames[i]).addClass(status && status.realtime ? 'green' : 'red');
			$('#traces_' + activity._id + '_' + usernames[i]).empty();
			$('#traces_' + activity._id + '_' + usernames[i]).append(traces);*/

			$('#backup_' + activity._id + '_' + usernames[i]).addClass(status ? 'green' : 'red');
			$('#backup_' + activity._id + '_' + usernames[i]).empty();
			$('#backup_' + activity._id + '_' + usernames[i]).append(backup);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		$('#result_progress_' + activity._id + ' .done').css('width', progress + '%' );
		$('#result_progress_' + activity._id + ' done').text(progress);

		/*
		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}
		$('#result_progress_' + activity._id + ' .partial').css('width', partialprogress + '%' );
		$('#result_progress_' + activity._id + ' partial').text(partialprogress);*/
	},

	paintActivityTargets: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$('#' + activity._id + '_' + usernames[i] + '_target').attr('href', results[usernames[i]]);
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
					var filename = activity + "_" + user + ".json";
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
							block += '<p>' + keys[i] + '</p>';
							block += printAnalysisRecursive(analysis[keys[i]]);
						}else{
							block += '<p>' + keys[i] + ': ' + analysis[keys[i]] + '</p>';
						}
					}
					
					block += '</div>';

					return block;
				}


				let content = '<link href="/css/style.css" rel="stylesheet" type="text/css"><div style="padding: 20px;" class="analysis">' + printAnalysisRecursive(result[user].realtime) + '</div>';
				
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				toggleAddForm('iframe_floating');
			}
		})
	},
}

PainterFactory.addPainter(GameplayActivityPainter);
