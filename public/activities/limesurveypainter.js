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
	simple_name: 'LimeSurvey activity',
	commun : {},
	communSpecific : {},
	specific : {},
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
					form+=`<p>${this.specific.new_message}</p>
						<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">${this.specific.title}</a></p>`
				} else {
					form += `<div class="tabs">
					<span class="tab selected" method="byid" onclick="changeTab(this, 'new_activity_extras','limesurvey_byid')">${this.specific.surveyid_title}</span>
					<span class="tab" method="byexisting" onclick="changeTab(this,'new_activity_extras','limesurvey_byexisting')">${this.specific.existing_title}</span>
					<span class="tab" method="bynew" onclick="changeTab(this, 'new_activity_extras','limesurvey_bynew')">${this.specific.new_title}</span>
					<span class="tab" method="byupload" onclick="changeTab(this, 'new_activity_extras','limesurvey_byupload')">${this.specific.upload_title}</span>
					</div>
					<div id="limesurvey_byid" class="subform selected">
					<p>${this.specific.surveyid_title}:</p>
					<input type="number" name="surveyid" placeholder="${this.specific.surveyid_placeholder}">
					</div>
					<div id="limesurvey_byexisting" class="subform">`;
					if(this.utils.surveys.length > 0){
						form += '<select name="existingid">';
						for (var i = 0; i < this.utils.surveys.length; i++) {
							form += `<option value="${this.utils.surveys[i].sid}">${this.utils.surveys[i].surveyls_title} - ${this.utils.surveys[i].sid}</option>`;
						}
						form += '</select>';
					}else{
						form += `<p>${this.specific.existing_zero_message}</p>`;
					}
					form += `</div>
					<div id="limesurvey_bynew" class="subform">
						<p>${this.specific.new_message}</p>
						<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">${this.specific.title}</a></p>
					</div>
					<div id="limesurvey_byupload" class="subform">
						<p>${this.specific.upload_message}</p>
						<input type="file" name="lss" placeholder="Activity name">
					</div>`
				}
			} else {
				form+=`<p>${this.specific.new_message}</p>
					<p><a class="button green" onclick="LimeSurveyPainter.openNewLimesurvey()">${this.specific.title}</a></p>`
			};
			callback(null, form);
		});	
	},

	getEditExtraForm: function () {
		let form=`${this.specific.survey_title}`;
		if(this.utils.surveys.length > 1){
			form += '<select name="existingid" id="existing_survey_list"></select>';
		} else  {
			form += '<p>${this.specific.survey.only_one.message}You don\'t have any other surveys.</p>'
		}
		form+=`${this.specific.language_title}`;
		form += '<select name="language" id="language_list"></select>';
		return form;
	},

	updateInputEditExtraForm(activity) {
		Simva.setSurveyOwner(activity.activity_id, (error, result) => {
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
				const selectedLanguage = activity.survey_language;
				if(selectedLanguage) {
					languageSelectElement.value = selectedLanguage;
				}
			}
			// Step 2: Loop through the data and create options
			Simva.getSurveyList((error, result) => {
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
					selectElement.value=activity.survey_id;
				}
			});
		});
	},

	downloadBackup: function(activity, type, user){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		
		Simva.getActivityResultWithType(activity, type, function(error, result){
			if(error){
				toastParams.text = error.message;
				$.toast(toastParams);
			}else{
				var filename = `${this.communSpecific.result_file_prefix}_${activity}_${type}.json`;
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
		activity.activity_type = this.supportedType;

		switch(method){
			case 'byid':
				activity.copysurvey = formdata.survey_id;
				callback(null, activity);
				break;
			case 'byexisting':
				activity.copysurvey = formdata.existingid;
				callback(null, activity);
				break;
			case 'bynew':
				callback(this.specific.new_after_message);
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
					callback(this.specific.upload_error);
				}
				break;
			default:
				callback(this.specific.no_method);
				break;
		}
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.activity_name !== formdata.name) {
			activity.name = formdata.name;
		}
		let actualSurveyid=actualActivity.survey_id;
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

		const actualLanguage = actualActivity.survey_language;
		if(actualLanguage !== formdata.language) {
			activity.survey_language = formdata.language;
		}

		callback(null, activity);
	},

	fullyPaintActivity: async function(activity, participants){
		this.paintActivity(activity, participants);
		await this.updateParticipants(activity, participants);
	},

	updateParticipants: async function(activity, participants){
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, false, participants);
		PainterFactory.Painters["activity"].paintActivityProgress(activity, activity.data.progress, participants);
		PainterFactory.Painters["activity"].paintActivityInit(activity, activity.data.init, participants);
		console.log("Result");
		console.log(activity.data.hasresult);
		console.log(activity.data.result);
		if(!activity.data.hasresult){
			// Still update totals even without results
			PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.hasresult, "No Results", participants, this.communSpecific.result_zero, "Started", this.communSpecific.result_view_partial_value, "Completed",this.communSpecific.result_view_final_value);
			return;
		}
		const userids = Object.keys(activity.data.result);
		const map = {};
		for (const userid of userids) {
			let state = this.communSpecific.result_zero;
			try {
				const value = activity.data.result[userid];
				map[userid] = state;
				if (PainterFactory.Painters["activity"].isDownloadUrl(value)) {
					console.log(`Fetching result for user ${userid} from URL: ${value}`);
					map[userid] = this.communSpecific.result_view_partial_value;
					//const response = await fetch(value);
					//if (!response.ok) {
					//	throw new Error(`HTTP ${response.status}`);
					//}
//
					//const blob = await response.blob();
					//const text = await blob.text(); // ⚠️ must await
					//console.log(text);
					//let parsed;
					//try {
					//	parsed = JSON.parse(text); // assuming JSON
					//} catch {
					//	parsed = {};
					//}
//
					//if (parsed.submitdate) {
					//	map[userid] = this.communSpecific.result_view_final_value;
					//}
				}
			} catch (error) {
				$.toast({
					heading: this.commun.result_error_loading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}
		};
		console.log("Map:");
		console.log(map);


		PainterFactory.Painters["activity"].paintActivityResult(activity, map, "No Results", participants, this.communSpecific.result_zero, "Started", this.communSpecific.result_view_partial_value, "Completed",this.communSpecific.result_view_final_value);
		PainterFactory.Painters["activity"].paintActivityProgress(activity, activity.data.progress, participants);
		PainterFactory.Painters["activity"].paintActivityInit(activity, activity.data.init, participants);
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
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			<div class="top"><h4>${activity.activity_name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity.activity_id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity.activity_id}', '${activity.activity_name}', '${activity.session_id}')"></div>
			<p class="subtitle">${this.simple_name}</p>
			<p>${this.specific.survey_title}: <a target="_blank" href="${this.utils.url}${activity.survey_id}">${activity.survey_id}</a></p>
			<p>${this.specific.language_title}: ${activity.survey_language}</p>
			<p><a class="button green" onclick="LimeSurveyPainter.openEditLimesurvey('${activity.activity_id}', '${activity.survey_id}')">${this.specific.edit_title}</a></p>
			<p><a onclick="LimeSurveyPainter.generateTinyURL('${activity.activity_id}', ${activity.survey_id})">${this.specific.short_url_title}</a></p>
			<p><a onclick="LimeSurveyPainter.downloadBackup('${activity.activity_id}', 'full')"> ${this.specific.backup_full_title} : ⬇️</a>
			<a onclick="LimeSurveyPainter.downloadBackup('${activity.activity_id}', 'code')"> ${this.specific.backup_code_title} : ⬇️</a></p>
			${this.commun.storage_title} : 
			<p>${this.commun.storage_file_title} <a onclick="PainterFactory.Painters['activity'].getMinioData('${activity.activity_id}')" target="_blank">${this.commun.storage_file_one_per_line_title}</a></p>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, false)}</div>`);
	},

	paintActivityProgress: function(activityId, username, progress) {
		try {
			PainterFactory.Painters["activity"].paintActivityProgress(activityId, username, progress);
		} catch(e) {
		}
	},

	updateActivityProgress: function(activityId, username, progress) {
		try {
			PainterFactory.Painters["activity"].updateActivityProgress(activityId, username, progress);
		} catch(e) {
		}
	},

	updateActivityCompletion: function(activityId, username, completion) {
		try {
			PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion);
		} catch(e) {
		}
	},

	updateActivityResult: function(activityId, username, result) {
		try {
			PainterFactory.Painters["activity"].updateActivityResult(activityId, username,result, "No Results", this.communSpecific.result_zero, "Started", this.communSpecific.result_view_partial_value, "Completed",this.communSpecific.result_view_final_value, "LimeSurveyPainter");
		} catch(e) {
		}
	},

	openNewLimesurvey: function(){
		$('#iframe_floating iframe').prop('src', `${this.newlimesurveyurl}`);
		Utils.toggleAddForm('iframe_floating');
	},

	openEditLimesurvey: function(activityId, surveyid){
		$('#iframe_floating iframe').prop('src', `${this.editlimesurveyurl.replace('{{surveyId}}', surveyid)}`);
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
					heading: this.commun.result_error_loading,
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
					heading: this.commun.result_error_downloading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				let stringifyres=JSON.stringify(result[user], null, 2);
				var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}_${type}.json`;
				Utils.download(filename, stringifyres);
			}
		})
	}
}

PainterFactory.addPainter(LimeSurveyPainter);