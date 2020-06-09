if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var ManualActivityPainter = {
	supportedType: 'manual',
	simpleName: 'Manual activity',
	description: '',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		return '<p><label for="manual_user_managed">Allow students to complete?</label><input id="manual_user_managed" type="checkbox" name="user_managed"></p>'
			 + '<p><label for="manual_uri" style="width: 100%; text-align: center;">URI (optional)</label><input id="manual_uri" type="text" name="uri">'
			 + '<span class="info">URI can include tags: {username}, and {activityId}</p></div>';
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.type = this.supportedType;

		activity.user_managed = formdata.user_managed === 'on';
		if(formdata.uri !== ''){
			activity.uri = formdata.uri;
		}

		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		let tmp = this;

		this.updateParticipants(activity);
		setInterval(function(){
			tmp.updateParticipants(activity);
		}, 5000);
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
		$('#test_' + activity.test + ' .activities').append('<div id="activity_' + activity._id + '" class="activity t' + activity.type + '">'
			+ '<div class="top"><h4>' + activity.name + '</h4>'
			+ '<input class="red" type="button" value="X" onclick="deleteActivity(\'' + activity._id + '\')"></div>'
			+ '<p class="subtitle">' + this.simpleName + '</p>'
			+ '<p>Students ' + (activity.extra_data.user_managed ? 'can' : '<strong>can\'t<strong>') +  ' complete</p>'
			+ '<div id="completion_progress_' + activity._id + '" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>'
			+ '<div id="result_progress_' + activity._id + '" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>'
			+ this.paintActivityParticipantsTable(activity, participants) + '</div>');
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			toret += '<tr><td>' + participants[i].username + '</td>'
				+ '<td id="completion_' + activity._id + '_' + participants[i].username + '"><input type="checkbox" onchange="ManualActivityPainter.toggleCompletion(this, \'' + activity._id + '\', \'' + participants[i].username + '\')"></td>'
				+ '<td id="result_' + activity._id + '_' + participants[i].username + '">---</td>';
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

			if(status[usernames[i]]){
				$('#completion_' + activity._id + '_' + usernames[i]).addClass('green');
				$('#completion_' + activity._id + '_' + usernames[i]).removeClass('red');
			}else{
				$('#completion_' + activity._id + '_' + usernames[i]).removeClass('green');
				$('#completion_' + activity._id + '_' + usernames[i]).addClass('red');
			}

			$('#completion_' + activity._id + '_' + usernames[i]).find('input[type="checkbox"]').prop('checked', status[usernames[i]]);
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
			let result = '<span>No results</span>'

			if(status){
				done++;
				result = '<span><a onclick="ActivityPainter.openResults(\'' + activity._id + '\',\'' + usernames[i] + '\')">'
					+'See Results</a></span>';
			}


			$('#result_' + activity._id + '_' + usernames[i]).addClass(status ? 'green' : 'red');
			$('#result_' + activity._id + '_' + usernames[i]).empty();
			$('#result_' + activity._id + '_' + usernames[i]).append(result);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;

		if(isNaN(progress)){
			progress = 0;
		}
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}

		$('#result_progress_' + activity._id + ' .done').css('width', progress + '%' );
		$('#result_progress_' + activity._id + ' .partial').css('width', partialprogress + '%' );
		$('#result_progress_' + activity._id + ' done').text(progress);
		$('#result_progress_' + activity._id + ' partial').text(partialprogress);
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
				let content = '<div style="padding: 20px;">' + result[user] + '</div>';
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				toggleAddForm('iframe_floating');
			}
		})
	},

	toggleCompletion: function(checkbox, activityId, username){
		let status = $(checkbox).is(":checked");

		if(status){
			$('#completion_' + activityId + '_' + username).addClass('green');
			$('#completion_' + activityId + '_' + username).removeClass('red');
		}else{
			$('#completion_' + activityId + '_' + username).removeClass('green');
			$('#completion_' + activityId + '_' + username).addClass('red');
		}

		Simva.setActivityCompletion(activityId, username, status, function(){
			console.log('saved');
		});
	}
}

PainterFactory.addPainter(ManualActivityPainter);