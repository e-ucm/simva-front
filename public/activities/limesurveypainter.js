if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var LimeSurveyPainter = {
	supportedType: 'limesurvey',
	simpleName: 'LimeSurvey activity',

	getExtraForm: function () {
		let form = '<div class="tabs">'
			+ 	'<span class="tab selected" method="byid" onclick="changeTab(this, \'new_activity_extras\',\'limesurvey_byid\')">Survey ID</span>'
			+ 	'<span class="tab" method="byexisting" onclick="changeTab(this, \'new_activity_extras\',\'limesurvey_byexisting\')">Existing Survey</span>'
			+ 	'<span class="tab" method="bynew" onclick="changeTab(this, \'new_activity_extras\',\'limesurvey_bynew\')">New Survey</span>'
			+ 	'<span class="tab" method="byupload" onclick="changeTab(this, \'new_activity_extras\',\'limesurvey_byupload\')">Upload LSS</span>'
			+ '</div>'
			+ '<div id="limesurvey_byid" class="subform selected">'
			+ 	'<p>Survey ID:</p>'
			+ 	'<input type="number" name="surveyid" placeholder="Survey ID">'
			+ '</div>'
			+ '<div id="limesurvey_byexisting" class="subform">'
			+ 	'<p>Not available yet.</p>'
			+ '</div>'
			+ '<div id="limesurvey_bynew" class="subform">'
			+ 	'<p>Click to open LimeSurvey</p>'
			+ 	'<p><a class="button green">LimeSurvey</a></p>'
			+ '</div>'
			+ '<div id="limesurvey_byupload" class="subform">'
			+ 	'<p>Select LLS file</p>'
			+ 	'<input type="file" name="lss" placeholder="Activity name">'
			+ '</div>'


		return form;
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let method = $('#new_activity_extras .tab.selected').attr('method');

		activity.name = formdata.name;
		activity.type = this.supportedType;

		switch(method){
			case 'byid':
				activity.copysurvey = formdata.surveyid;
				callback(null, activity);
				break;
			case 'byexisting':
				callback('Not yet.');
				break;
			case 'bynew':
				callback('After creating new, you have to select from existing.');
				break;
			case 'byupload':
				if($(form).find('input[name="lss"]').get(0).files[0]){
					var reader = new FileReader();
					var input = event.target;
					reader.onload = function(){
						let raw = reader.result;
						raw = raw.substr(raw.indexOf(',') + 1);
						activity.rawsurvey = raw;
						callback(null, activity);
					};
					reader.readAsDataURL($(form).find('input[name="lss"]').get(0).files[0]);
				}else{
					callback('Select the file to upload first.');
				}
				break;
			default:
				callback('Select a method first');
				break;
		}
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

PainterFactory.addPainter(LimeSurveyPainter);