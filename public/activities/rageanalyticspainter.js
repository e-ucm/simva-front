if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var RageAnalyticsActivityPainter = {
	supportedType: 'rageanalytics',
	simple_name: 'RAGE Analytics activity',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function (callback) {
		callback(null,'');
	},

	getEditExtraForm: function () {
		return "";
	},
	
	updateInputEditExtraForm(activity) {
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.activity_type = this.supportedType;

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
		let tmp = this;

		this.updateParticipants(activity, participants);
		//setInterval(function(){
		//	tmp.updateParticipants(activity, participants);
		//}, 5000);
	},

	updateParticipants: function(activity, participants){
		let tmp = this;
		activity.tmp = {};

		tmp.paintActivityCompletion(activity, activity.data.completion, participants);
		tmp.paintActivityResult(activity, activity.data.result, participants);
	},

	paintActivity: function(activity, participants){
		const topBar = PainterFactory.Painters['activity'].paintActivityTopBar.call(this, activity, '');
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			${topBar}
			<p class="subtitle" title="${this.description || ''}">${this.simple_name}</p>
			<p><a onclick="RageAnalyticsActivityPainter.openDashboard('${activity.rage_activity_id}')">Dashboard Link</a></p>
			<div id="completion_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>
			<div id="result_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Progress</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			
			toret += `<tr><td>${PainterFactory.Painters["activity"].paintUsernameOrToken(activity, participants[i])}</td>
				<td id="completion_${activity.activity_id}_${participantKey}">---</td>
				<td id="progress_${activity.activity_id}_${participantKey}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>
				<td id="result_${activity.activity_id}_${participantKey}">---</td>`;
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status, participants=[]){
		let total = participants.length;
		if(!status) {
			// Even without status, update total if we have participant count
			if(total > 0) {
				$(`#completion_progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#completion_progress_${activity.activity_id} done`).text(0);
			}
			return;
		}

		let done = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			if(status[participantKey]){
				done++;
			}

			let completion = `<span>${status[participantKey]}</span>`
			$(`#completion_${activity.activity_id}_${participantKey}`).addClass(!status[participantKey] ? 'red' : 'green');
			$(`#completion_${activity.activity_id}_${participantKey}`).empty();
			$(`#completion_${activity.activity_id}_${participantKey}`).append(completion);
		}

		let progress = Math.round((done / total) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#completion_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activity.activity_id} done`).text(progress);
	},

	paintActivityResult: function(activity, results, participants=[]){
		let total = participants.length;
		if(!results) {
			// Even without results, update total if we have participant count
			if(total > 0) {
				$(`#result_progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#result_progress_${activity.activity_id} .partial`).css('width', '0%');
				$(`#result_progress_${activity.activity_id} done`).text(0);
				$(`#result_progress_${activity.activity_id} partial`).text(0);
			}
			return;
		}

		let done = 0, partial = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			let status = results[participantKey];
			let result = '<span>No results</span>'

			if(status){
				done++;
				result = `<span><a onclick="RageAnalyticsActivityPainter.openResults('${activity.activity_id}','${participantKey}')">See Results</a></span>`;

				let tmpprogress = 0; 
				if(results[participantKey]
					&& results[participantKey].progressed
					&& results[participantKey].progressed['serious-game']){
					let keys = Object.keys(results[participantKey].progressed['serious-game']);
					if(keys.length > 0){
						if(results[participantKey].progressed['serious-game'][keys[0]].progress){
							tmpprogress = results[participantKey].progressed['serious-game'][keys[0]].progress;
						}
					}
				}

				tmpprogress = (tmpprogress * 1000) / 10;

				$(`#progress_${activity.activity_id}_${participantKey} .done`).css('width', `${tmpprogress}%` );
				$(`#progress_${activity.activity_id}_${participantKey} done`).text(tmpprogress);
			}


			$(`#result_${activity.activity_id}_${participantKey}`).addClass(status ? 'green' : 'red');
			$(`#result_${activity.activity_id}_${participantKey}`).empty();
			$(`#result_${activity.activity_id}_${participantKey}`).append(result);
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

	openResults: function(activity, user){
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
				let content = `<div style="padding: 20px;">${result[user]}</div>`;
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				Utils.toggleAddForm('iframe_floating');
			}
		})
	},

	openDashboard: function(activityId){
		$('#iframe_floating iframe').prop('src', `${this.utils.dashboard_url}${activityId}${this.utils.dashboard_query}`);
		Utils.toggleAddForm('iframe_floating');
	},
}

PainterFactory.addPainter(RageAnalyticsActivityPainter);