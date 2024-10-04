if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var ActivityPainter = {
	supportedType: 'activity',
	simpleName: 'Default activity',
	description: '',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		return '';
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.type = this.supportedType;

		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		let tmp = this;

		this.updateParticipants(activity);
		//setInterval(function(){
		//	tmp.updateParticipants(activity);
		//}, 5000);
	},

	updateParticipants: function(activity){
		let tmp = this;
		activity.tmp = {};

		Simva.getActivityCompletion(activity._id, function(error, result){
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.hasActivityResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},

	paintActivity: function(activity, participants){
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Default Activity</p>
			<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>
			this.paintActivityParticipantsTable(activity, participants)</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += `<tr><td>${participants[i].username}</td>
				<td id="completion_${activity._id}_${participants[i].username}">---</td>
				<td id="result_${activity._id}_${participants[i].username}">---</td>`;
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

			let completion = `<span>${status[usernames[i]]}</span>`;
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
			let result = '<span>No results</span>'

			if(status){
				done++;
				result = `<span><a onclick="ActivityPainter.openResults('${activity._id}',
				'${usernames[i]}')">See Results</a></span>`;
			}


			$(`#result_${activity._id}_${usernames[i]}`).addClass(status ? 'green' : 'red');
			$(`#result_${activity._id}_${usernames[i]}`).empty();
			$(`#result_${activity._id}_${usernames[i]}`).append(result);
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
				toggleAddForm('iframe_floating');
			}
		})
	}
}

PainterFactory.addPainter(ActivityPainter);