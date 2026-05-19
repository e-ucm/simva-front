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
	simple_name: 'Ims Package activity',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function (callback) {
		callback(null, `<div class="imspackage_activity"><p><label for="imspackage_trace_storage">${this.commun.storage_title}</label><input id="imspackage_trace_storage" type="checkbox" name="trace_storage"></p>
			 <p><label for="imspackage_backup">${this.communSpecific.result_title}</label><input id="imspackage_backup" type="checkbox" name="backup"></p>
			 <p><label for="imspackage_package" style="width: 100%; text-align: center;">${this.specific.package_title}</label><input id="imspackage_package" type="file" name="imspackage">`);
	},

	getEditExtraForm: function () {
		return `<div class="imspackage_activity"><p><label for="edit_imspackage_trace_storage">${this.commun.storage_title}</label><input id="edit_imspackage_trace_storage" type="checkbox" name="trace_storage"></p>
			 <p><label for="edit_imspackage_backup">${this.communSpecific.result_title}</label><input id="edit_imspackage_backup" type="checkbox" name="backup"></p>`;
	},

	updateInputEditExtraForm(activity) {
		var imspackage_trace_storage = document.getElementById('edit_imspackage_trace_storage');
		imspackage_trace_storage.checked = activity.trace_storage;
		var imspackage_backup = document.getElementById('edit_imspackage_backup');
		imspackage_backup.checked = activity.backup;
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.activity_type = this.supportedType;

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

		if(actualActivity.activity_name !== formdata.name) {
			activity.name = formdata.name;
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
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.result, false, participants, "No Backup", null, null, true, "See Backup", "imspackage");
	},

	getExtraKebabItems: function(activity) {
		return '';
	},

	paintActivity: function(activity, participants){
		const topBar = PainterFactory.Painters['activity'].paintActivityTopBar.call(this, activity, this.getExtraKebabItems(activity));
		let activitybox = `<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			${topBar}
			<p class="subtitle" title="${this.description || ''}">${this.simple_name}</p>`;
		
		activitybox += `${this.communSpecific.storage_title}: `
		if(activity.trace_storage){
			activitybox += `<a href="${this.utils.minio_url}minio/${this.utils.minio_bucket}/${this.utils.topics_dir}/${this.utils.trace_topic}/_id=${activity.activity_id}/" target="_blank">Folder</a>`;
		}else{
			activitybox += `<i>${this.commun.storage_disabled}</i>`;
		}
		activitybox += `${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true)}</div>`;
		$(`#test_${activity.session_id} .activities`).append(activitybox);
	},

	paintActivityCompletion: function(activity, status){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, status);
	},

	paintActivityResult: function(activity, results, participants=[]){
		let total = participants.length;
		if(!results) {
			return;
		}

		let done = 0, partial = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			let status = results[participantKey];
			let traces = '<span>No traces</span>';
			let backup = '<span><i>Disabled</i></span>';
			if(activity.backup){
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
						<a onclick="ImsPackagePainter.openTraces('${activity.activity_id}','${participantKey}')">
						See traces</a>
						</span>`;
					}

					if(activity.backup && results[participantKey].backup){
						backup = `<span>
						<a onclick="ImsPackagePainter.downloadBackup('${activity.activity_id}','${participantKey}')">
						Download</a>
						</span>`;
					}
					
				}

				tmpprogress = (tmpprogress * 1000) / 10;

				$(`#progress_${activity.activity_id}_${participantKey} .done`).css('width', `${tmpprogress}%` );
				$(`#progress_${activity.activity_id}_${participantKey} done`).text(tmpprogress);
			}


			$(`#traces_${activity.activity_id}_${participantKey}`).addClass(status && status.realtime ? 'green' : 'red');
			$(`#traces_${activity.activity_id}_${participantKey}`).empty();
			$(`#traces_${activity.activity_id}_${participantKey}`).append(traces);

			$(`#backup_${activity.activity_id}_${participantKey}`).addClass(status && status.backup ? 'green' : 'red');
			$(`#backup_${activity.activity_id}_${participantKey}`).empty();
			$(`#backup_${activity.activity_id}_${participantKey}`).append(backup);
		}

		let progress = Math.round((done / total) * 1000) / 10; 
		let partialprogress = Math.round((partial / total) * 1000) / 10;

		if(isNaN(progress)){
			progress = 0;
		}
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}

		$(`#result_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity.activity_id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity.activity_id} done`).text(progress);
		$(`#result_progress_${activity.activity_id} partial`).text(partialprogress);
	},

	downloadBackup: function(activity, user){
		Simva.getActivityResultForUser(activity, user, function(error, result){
			if(error){
				$.toast({
					heading: this.commun.result_error_downloading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}.csv`;

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
				Utils.showIframeFloating();
			}
		})
	},
}

PainterFactory.addPainter(ImsPackagePainter);