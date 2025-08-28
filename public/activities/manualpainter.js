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
	simple_name: 'Manual activity',
	description: '',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function (callback) {
		callback(null, `<p><label for="manual_user_managed">${this.specific.student_complete_title}</label><input id="manual_user_managed" type="checkbox" name="user_managed"></p>
			 <p><label for="manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="manual_uri" type="text" name="uri">
			 <span class="info">${this.specific.uri_explication}</p></div>`);
	},

	getEditExtraForm: function () {
		return `<p><label for="edit_manual_user_managed">${this.specific.student_complete_title}</label><input id="edit_manual_user_managed" type="checkbox" name="user_managed"></p>
		<p><label for="edit_manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="edit_manual_uri" type="text" name="uri">
		<span class="info">${this.specific.uri_explication}</p></div>`;
	},

	updateInputEditExtraForm(activity) {
		var manual_user_managed = document.getElementById('edit_manual_user_managed');
		manual_user_managed.checked = activity.extra_data.user_managed;
		var manual_uri = document.getElementById('edit_manual_uri');
		if(activity.extra_data.uri) {
			manual_uri.value = activity.extra_data.uri;
		}
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

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.name !== formdata.name) {
			activity.name = formdata.name;
		}
	
		let user_managed = formdata.user_managed === 'on';
		if(actualActivity.extra_data.user_managed !== user_managed) {
			activity.user_managed = user_managed;
		}
		
		if(!(actualActivity.extra_data.uri == formdata.uri)) {
			if(actualActivity.extra_data.uri) {
				activity.uri = formdata.uri;
			} else {
				if(formdata.uri !== ''){
					activity.uri = formdata.uri;
				}
			}
		}

		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity);
	},

	updateParticipants: function(activity){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true);
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.hasresult);
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target);
		}
	},

	paintActivity: function(activity, participants){
		let complete=activity.extra_data.user_managed ? this.specific.student_complete_ok : this.specific.student_complete_nok;
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simple_name}</p>
			<p><strong>${complete}<strong></p>
			<p>${this.commun.storage_file_title} <a onclick="PainterFactory.Painters['activity'].getMinioData('${activity._id}')" target="_blank">${this.commun.storage_file_one_per_line_title}</a></p>
			<br>
			<a onclick="PainterFactory.Painters['activity'].getTMonUrl('${activity._id}','${activity.test}','${activity.study}')">
				${this.commun.tmon_title}
			</a>
			<br>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true, false, true)}</div>`);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	}
}

PainterFactory.addPainter(ManualActivityPainter);