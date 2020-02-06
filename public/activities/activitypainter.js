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
		let tmp = this;
		this.paintActivity(activity, participants);

		Simva.getActivityCompletion(activity._id, function(error, result){
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.getActivityResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},

	paintActivity: function(activity, participants){
		$('#test_' + activity.test + ' .activities').append('<div id="activity_' + activity._id + '" class="activity t' + activity.type + '">'
			+ '<div class="top"><h4>' + activity.name + '</h4>'
			+ '<input class="red" type="button" value="X" onclick="deleteActivity(\'' + activity._id + '\')"></div>'
			+ this.paintActivityParticipantsTable(activity, participants) + '</div>');
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			toret += '<tr><td>' + participants[i].username + '</td>'
				+ '<td id="completion_' + activity._id + '_' + participants[i].username + '">---</td>'
				+ '<td id="result_' + activity._id + '_' + participants[i].username + '">---</td>';
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		let usernames = Object.keys(status);

		for (var i = 0; i < usernames.length; i++) {
			let completion = '<span class="' + ( !status[usernames[i]] ? 'red' : 'green') + '">' + status[usernames[i]] + '</span>'
			$('#completion_' + activity._id + '_' + usernames[i]).empty();
			$('#completion_' + activity._id + '_' + usernames[i]).append(completion);
		}
	},

	paintActivityResult: function(activity, results){
		let usernames = Object.keys(results);

		for (var i = 0; i < usernames.length; i++) {
			let completion = '<span class="' + (results[usernames[i]] == 'No results' ? 'red' : 'green') + '">' + results[usernames[i]] + '</span>'
			$('#result_' + activity._id + '_' + usernames[i]).empty();
			$('#result_' + activity._id + '_' + usernames[i]).append(completion);
		}
	}
}

PainterFactory.addPainter(ActivityPainter);