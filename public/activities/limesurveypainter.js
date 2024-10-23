if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var LimeSurveyPainter = {
	limesurveyurl: 'https://limesurvey-dev.external.test/',

	supportedType: 'limesurvey',
	simpleName: 'LimeSurvey activity',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;

		this.limesurveyurl = this.utils.url;
		console.log(utils);
	},

	getExtraForm: function () {
		let form = `<div class="tabs">
			<span class="tab selected" method="byid" onclick="changeTab(this, 'new_activity_extras','limesurvey_byid')">Survey ID</span>
			<span class="tab" method="byexisting" onclick="changeTab(this,'new_activity_extras','limesurvey_byexisting')">Existing Survey</span>
			<span class="tab" method="bynew" onclick="changeTab(this, 'new_activity_extras','limesurvey_bynew')">New Survey</span>
			<span class="tab" method="byupload" onclick="changeTab(this, 'new_activity_extras','limesurvey_byupload')">Upload LSS</span>
			</div>
			<div id="limesurvey_byid" class="subform selected">
			<p>Survey ID:</p>
			<input type="number" name="surveyid" placeholder="Survey ID">
			</div>
			<div id="limesurvey_byexisting" class="subform">`;

		if(this.utils.surveys.length > 0){
			form += '<select name="existingid">';
			for (var i = 0; i < this.utils.surveys.length; i++) {
				form += `<option value="${this.utils.surveys[i].sid}">${this.utils.surveys[i].surveyls_title}</option>`;
			}

			form += '</select>';
		}else{
			form += '<p>You don\'t have surveys.</p>'
		}

		form += `</div>
			<div id="limesurvey_bynew" class="subform">
				<p>Click to open LimeSurvey</p>
				<p><a class="button green" onclick="LimeSurveyPainter.openLimesurvey()">LimeSurvey</a></p>
			</div>
			<div id="limesurvey_byupload" class="subform">
				<p>Select LLS file</p>
				<input type="file" name="lss" placeholder="Activity name">
			</div>`

		return form;
	},

	getEditExtraForm: function () {
		return "";
	},

	updateInputEditExtraForm(activity) {
	},

	downloadBackup: function(activity, type, user){
		var toastParams = {
			heading: 'Error loading the result',
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		
		Simva.getActivityResultWithType(activity, type, function(error, result){
			if(error){
				toastParams.text = error.message;
				$.toast(toastParams);
			}else{
				var filename = `${activity}_${type}.json`;
				var stringifiedres = JSON.stringify(result, null, 2);
				Utils.download(filename, stringifiedres);
			}
		});

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
				activity.copysurvey = formdata.existingid;
				callback(null, activity);
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

	extractEditInformation: function(form, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		Simva.getActivity(formdata.activity, function(error, actualActivity){
			if(!error) {
				let activity = {};

				if(actualActivity.name !== formdata.name) {
					activity.name = formdata.name;
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

		this.updateParticipants(activity);
		/*setInterval(function(){
			tmp.updateParticipants(activity);
		}, 5000);*/
	},

	updateParticipants: function(activity){
		let tmp = this;
		activity.tmp = {};

		Simva.getActivityCompletion(activity._id, function(error, result){
			activity.tmp.completion = result;
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.getActivityResult(activity._id, function(error, result){
			activity.tmp.result = result;
			tmp.paintActivityResult(activity, result);
		});

		Simva.getActivityTarget(activity._id, function(error, result){
			activity.tmp.result = result;
			tmp.paintActivityTargets(activity, result);
		});
	},

	generateTinyURL: function(activityId, surveyId) {
		//Simva.getTinyUrl(activityId, function(error, result){
		//});
		let url=`${this.utils.url}${surveyId}`;
		$.get(`https://tinyurl.com/api-create.php?url=${url}`, function(shorturl){
			// Copy the text inside the text field
			navigator.clipboard.writeText(shorturl);
			// Alert Short URL
			alert(shorturl);
		});
	},

	paintActivity: function(activity, participants){
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Survey ID: <a target="_blank" href="${this.utils.url}${activity.extra_data.surveyId}">${activity.extra_data.surveyId}</a></p>
			<p><a onclick="LimeSurveyPainter.generateTinyURL('${activity._id}', ${activity.extra_data.surveyId})">Generate Tiny URL</a></p>
			<p><a onclick="LimeSurveyPainter.downloadBackup('${activity._id}', 'full')"> Full : ⬇️</a>
			<a onclick="LimeSurveyPainter.downloadBackup('${activity._id}', 'code')"> Code : ⬇️</a></p>
			<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%  [ <doneres>0</doneres> /<total>0</total> ]</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%  [ <partialres>0</partialres> (<doneres>0</doneres>) /<total>0</total> ]</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += `<tr><td><a id="${activity._id}_${participants[i].username}_target" class="targeturl" target="_blank" 
			href="">${participants[i].username}</a></td>
				<td id="completion_${activity._id}_${participants[i].username}">---</td>
				<td id="result_${activity._id}_${participants[i].username}">---</td>`;
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, status);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username,completion);
	},

	paintActivityResult: function(activity, results){
		let usernames = Object.keys(results);
		let map= {};
		for (var i = 0; i < usernames.length; i++) {
			let state = 'No Results';
			if(results[usernames[i]]){
				if(results[usernames[i]].submitdate){
					state = 'Completed';
				}else{
					state = 'Started';
				}
			}
			map[usernames[i]] = state;
		}
		PainterFactory.Painters["activity"].paintActivityResult(activity, map, "No Results", "Started", "Completed","LimeSurveyPainter");
	},

	updateActivityResult: function(activityId, username, result) {
		PainterFactory.Painters["activity"].updateActivityResult(activityId, username,result, "No Results", "Started", "Completed","LimeSurveyPainter");
	},

	paintActivityTargets: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$(`#${activity._id}_${usernames[i]}_target`).attr('href', results[usernames[i]]);
		}
	},

	openLimesurvey: function(){
		$('#iframe_floating iframe').prop('src', `${this.limesurveyurl}/admin/survey/sa/newsurvey`);
		Utils.toggleAddForm('iframe_floating');
	},

	openResults: function(activity, user, type){
		Simva.getActivityResultWithTypeForUser(activity, type, user, function(error, result){
			if(error){
				$.toast({
					heading: 'Error loading the result',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				let stringifyres=JSON.stringify(result[user], null, 2);

				// Create a pre-formatted text element with styling
				let content = `<pre style="padding: 20px; background-color: #f0f0f0; color: #333; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${stringifyres}</pre>`;
            
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				
				// Set the content and ensure proper styling
				body.html(content);
				body.css({
					'margin': '0',
					'padding': '0',
					'overflow': 'auto',
					'height': '100vh'
				});
				Utils.toggleAddForm('iframe_floating');
			}
		})
	},

	downloadResults: function(activity, user, type){
		Simva.getActivityResultWithTypeForUser(activity, type, user, function(error, result){
			if(error){
				$.toast({
					heading: 'Error loading the result',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				let stringifyres=JSON.stringify(result[user], null, 2);
				var filename = `${activity}_${user}.json`;
				Utils.download(filename, stringifyres);
			}
		})
	}
}

PainterFactory.addPainter(LimeSurveyPainter);