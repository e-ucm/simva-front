if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var ImsPackagePainter = {
	supportedType: 'imspackage',
	simpleName: 'Ims Package activity',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		return `<div class="imspackage_activity"><p><label for="imspackage_trace_storage">Trace Storage</label><input id="imspackage_trace_storage" type="checkbox" name="trace_storage"></p>
			 <p><label for="imspackage_backup">Backup</label><input id="imspackage_backup" type="checkbox" name="backup"></p>
			 <p><label for="imspackage_package" style="width: 100%; text-align: center;">Package</label><input id="imspackage_package" type="file" name="imspackage">`;
			 //<p><label for="imspackage_realtime">Realtime</label><input id="imspackage_realtime" type="checkbox" name="realtime"></p>`
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
			
			setInterval(function(){
				tmp.updateParticipants(activity);
			}, 5000);
		});
	},

	updateParticipants: function(activity){
		let tmp = this;
		activity.tmp = {};

		Simva.getActivityCompletion(activity._id, function(error, result){
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.getActivityResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},

	paintActivity: function(activity, participants){
		let activitybox = `<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>`;

		/*
		activitybox += '<p>Realtime: ';
		if(activity.extra_data.config.realtime){
			activitybox += `<a href="${this.utils.dashboard_url}${activity.extra_data.analytics.activity._id}${this.utils.dashboard_query}" target="_blank">Dashboard</a>`;
		}else{
			activitybox += '<i>Disabled</i>';
		}
		activitybox += ' - '
		*/
		
		activitybox += 'Trace Storage: '
		if(activity.extra_data.config.trace_storage){
			activitybox += `<a href="${this.utils.minio_url}minio/${this.utils.minio_bucket}/${this.utils.topics_dir}/${this.utils.trace_topic}/_id=${activity._id}/" target="_blank">Folder</a>`;
		}else{
			activitybox += '<i>Disabled</i>';
		}
		
		activitybox += `<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`;

		$(`#test_${activity.test} .activities`).append(activitybox);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Progress</th><th>Traces</th><th>Backup</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += '<tr>';

			if(activity.isOpenable || (activity.extra_data.game_uri && activity.extra_data.game_uri !== '') ){
				toret += `<td><a id="${activity._id}_" ${participants[i].username}_target" 
				class="targeturl" target="_blank" href="">${participants[i].username}</a></td>`;
			}else{
				toret += `<td>${participants[i].username}</td>`;
			}

			toret += `<td id="completion_${activity._id}_${participants[i].username}">---</td>`;

			if(activity.extra_data.config.realtime){
				toret += `<td id="progress_${activity._id}_${participants[i].username}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>
						<td id="traces_${activity._id}_${participants[i].username}">---</td>`;
			}else{
				toret += '<td colspan="2"><i>Disabled</i></td>'
			}
			
			if(activity.extra_data.config.backup){
				toret += `<td id="backup_${activity._id}_${participants[i].username}">---</td></tr>`;
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

			let completion = `<span>${status[usernames[i]]}</span>`
			$(`#completion_${activity._id}_${usernames[i]}`).addClass(!status[usernames[i]] ? 'red' : 'green');
			$(`#completion_${activity._id}_${usernames[i]}`).empty();
			$(`#completion_${activity._id}_${usernames[i]}`).append(completion);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#completion_progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activity._id} done`).text(progress);
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
					if(status.realtime
						&& status.realtime.progressed
						&& status.realtime.progressed['serious-game']){
						let keys = Object.keys(status.realtime.progressed['serious-game']);
						if(keys.length > 0){
							if(status.realtime.progressed['serious-game'][keys[0]].progress){
								tmpprogress = status.realtime.progressed['serious-game'][keys[0]].progress;
							}
						}

						traces = `<span>
						<a onclick="ImsPackagePainter.openTraces('${activity._id}','${usernames[i]}')">
						See traces</a>
						</span>`;
					}

					if(activity.extra_data.config.backup && results[usernames[i]].backup){
						backup = `<span>
						<a onclick="ImsPackagePainter.downloadBackup('${activity._id}','${usernames[i]}')">
						Download</a>
						</span>`;
					}
					
				}

				tmpprogress = (tmpprogress * 1000) / 10;

				$(`#progress_${activity._id}_${usernames[i]} .done`).css('width', `${tmpprogress}%` );
				$(`#progress_${activity._id}_${usernames[i]} done`).text(tmpprogress);
			}


			$(`#traces_${activity._id}_${usernames[i]}`).addClass(status && status.realtime ? 'green' : 'red');
			$(`#traces_${activity._id}_${usernames[i]}`).empty();
			$(`#traces_${activity._id}_${usernames[i]}`).append(traces);

			$(`#backup_${activity._id}_${usernames[i]}`).addClass(status && status.backup ? 'green' : 'red');
			$(`#backup_${activity._id}_${usernames[i]}`).empty();
			$(`#backup_${activity._id}_${usernames[i]}`).append(backup);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;

		if(isNaN(progress)){
			progress = 0;
		}
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}

		$(`#result_progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity._id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity._id} done`).text(progress);
		$(`#result_progress_${activity._id} partial`).text(partialprogress);
	},

	paintActivityTargets: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$(`#${activity._id}_${usernames[i]}_target`).attr('href', results[usernames[i]]);
		}
	},

	downloadBackup: function(activity, user){
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
				var filename = `${activity}_${user}.csv`;

				Utils.download(filename, result[user].backup);
			}
		})
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
							block += `<p>${keys[i]}: ${analysis[keys[i]]} </p>`;
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
}

PainterFactory.addPainter(ImsPackagePainter);