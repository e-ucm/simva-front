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
		this.editlimesurveyurl=this.utils.editurl;
		this.newlimesurveyurl=this.utils.newurl;
	},

	getExtraForm: function (callback) {
		let form = '';
		Simva.islimesurveyadmin((error, result) => {
			if(!error) {
				console.log(result);
				if(result.isLimesurveyUserAdmin == false) {
					form+=`<p>Click to open LimeSurvey</p>
						<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">LimeSurvey</a></p>`
				} else {
					form += `<div class="tabs">
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
							form += `<option value="${this.utils.surveys[i].sid}">${this.utils.surveys[i].surveyls_title} - ${this.utils.surveys[i].sid}</option>`;
						}
						form += '</select>';
					}else{
						form += '<p>You don\'t have surveys.</p>'
					}
					form += `</div>
					<div id="limesurvey_bynew" class="subform">
						<p>Click to open LimeSurvey</p>
						<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">LimeSurvey</a></p>
					</div>
					<div id="limesurvey_byupload" class="subform">
						<p>Select LLS file</p>
						<input type="file" name="lss" placeholder="Activity name">
					</div>`
				}
			} else {
				form+=`<p>Click to open LimeSurvey</p>
					<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">LimeSurvey</a></p>`
			};
			callback(null, form);
		});	
	},

	getEditExtraForm: function () {
		let form="Survey";
		if(this.utils.surveys.length > 1){
			form += '<select name="existingid" id="existing_survey_list"></select>';
		} else  {
			form += '<p>You don\'t have any other surveys.</p>'
		}
		form+="Survey Language";
		form += '<select name="language" id="language_list"></select>';
		return form;
	},

	updateInputEditExtraForm(activity) {
		Simva.setSurveyOwner(activity._id, (error, result) => {
			// Step 1: Get the select element
			var languageSelectElement = document.getElementById('language_list');
			// Step 2: Loop through the data and create options
			if(activity.data.languages.list.length > 0){
				activity.data.languages.list.forEach((language) => {
					// Step 3: Create a new option element
					var option = document.createElement('option');
					
					// Step 4: Set the value and text of the option
					option.value = language;
					option.text = language;
		
					// Step 5: Append the option to the select element
					languageSelectElement.appendChild(option);
				});
				
				// Set a specific option as selected
				if(activity.extra_data.language) {
					languageSelectElement.value=activity.extra_data.language;
				}
			}
			// Step 2: Loop through the data and create options
			Simva.getSurveyList(activity._id, (error, result) => {
				if(!error) {
					// Step 1: Get the select element
					var selectElement = document.getElementById('existing_survey_list');
					this.utils = result;
					this.utils.surveys.forEach((survey) => {
						// Step 3: Create a new option element
						var option = document.createElement('option');
						
						// Step 4: Set the value and text of the option
						option.value = survey.sid;
						option.text = `${survey.surveyls_title} - ${survey.sid}`;
			
						// Step 5: Append the option to the select element
						selectElement.appendChild(option);
					});

					// Set a specific option as selected
					selectElement.value=activity.extra_data.surveyId;
				}
			});
		});
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

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.name !== formdata.name) {
			activity.name = formdata.name;
		}
		let actualSurveyid=actualActivity.extra_data.surveyId;
		if(typeof(actualSurveyid) == "string") {
			actualSurveyid=Number(actualSurveyid);
		}
		let surveyid=formdata.existingid;
		if(typeof(surveyid) == "string") {
			surveyid=Number(surveyid);
		}
		if(actualSurveyid !== surveyid) {
			activity.copysurvey = surveyid;
		}

		if(actualActivity.extra_data.language !== formdata.language) {
			activity.language = formdata.language;
		}

		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity);
	},

	updateParticipants: function(activity){
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target);
		}
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, false);
		let usernames = Object.keys(activity.data.result);
		let map= {};
		for (var i = 0; i < usernames.length; i++) {
			let state = 'No Results';
			if(activity.data.result[usernames[i]]){
				if(activity.data.result[usernames[i]].submitdate){
					state = 'Completed';
				}else{
					state = 'Started';
				}
			}
			map[usernames[i]] = state;
		}
		PainterFactory.Painters["activity"].paintActivityResult(activity, map, "No Results", "No Results", "Started", "Started", "Completed","Completed","LimeSurveyPainter");
	},

	generateTinyURL: function(activityId, surveyId) {
		let url=`${this.utils.url}${surveyId}`;
		Simva.generateShlinkURL(url, "survey", `survey_${surveyId}`, null, (error, result) => {
			if(!error) {
				let shortUrl=result.shortUrl;
				// Copy the text inside the text field
				navigator.clipboard.writeText(shortUrl);
				// Alert Short URL
				alert(shortUrl);
			}			
		});
	},

	paintActivity: function(activity, participants){
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Survey ID: <a target="_blank" href="${this.utils.url}${activity.extra_data.surveyId}">${activity.extra_data.surveyId}</a></p>
			<p>Survey Language: ${activity.extra_data.language}</p>
			<p><a class="button green" onclick="LimeSurveyPainter.openEditLimesurvey('${activity.id}', '${activity.extra_data.surveyId}')">Edit Survey</a></p>
			<p><a onclick="LimeSurveyPainter.generateTinyURL('${activity._id}', ${activity.extra_data.surveyId})">Generate Tiny URL</a></p>
			<p><a onclick="LimeSurveyPainter.downloadBackup('${activity._id}', 'full')"> Full : ⬇️</a>
			<a onclick="LimeSurveyPainter.downloadBackup('${activity._id}', 'code')"> Code : ⬇️</a></p>
			Trace Storage : 
			<p>Download as <a onclick="PainterFactory.Painters['activity'].getMinioData('${activity._id}', true)" target="_blank">Array</a></p>
			<p>Download as <a onclick="PainterFactory.Painters['activity'].getMinioData('${activity._id}', false)" target="_blank">OneTracePerLine</a></p>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, false)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			toret += `<tr><td>${PainterFactory.Painters["activity"].paintUsernameOrToken(activity, participants[i], true)}</td>`;
			toret += `<td id="completion_${activity._id}_${participants[i].username}">---</td>
				<td id="result_${activity._id}_${participants[i].username}">---</td>`;
		}

		toret += '</table>';

		return toret;
	},

	updateActivityCompletion: function(activityId, username, completion) {
		try {
			PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion);
		} catch(e) {
		}
	},

	updateActivityResult: function(activityId, username, result) {
		try {
			PainterFactory.Painters["activity"].updateActivityResult(activityId, username,result, "No Results","No Results", "Started", "Started", "Completed","Completed","LimeSurveyPainter");
		} catch(e) {
		}
	},

	openNewLimesurvey: function(){
		$('#iframe_floating iframe').prop('src', `${this.newlimesurveyurl}`);
		Utils.toggleAddForm('iframe_floating');
	},

	openEditLimesurvey: function(activityId, surveyid){
		$('#iframe_floating iframe').prop('src', `${this.editlimesurveyurl}${surveyid}`);
		Simva.setSurveyOwner(activityId, function(error, result){
			let currentSrc = $('#iframe_floating iframe').prop('src');
			$('#iframe_floating iframe').prop('src', `${currentSrc}`);
			Utils.toggleAddForm('iframe_floating');
		});
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
				var filename = `${activity}_${user}_${type}.json`;
				Utils.download(filename, stringifyres);
			}
		})
	}
}

PainterFactory.addPainter(LimeSurveyPainter);