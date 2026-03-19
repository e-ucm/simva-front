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
		manual_user_managed.checked = Boolean(activity.activity_manual_user_managed);
		var manual_uri = document.getElementById('edit_manual_uri');
		if(activity.activity_manual_ressource_url) {
			manual_uri.value = activity.activity_manual_ressource_url;
		}
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.activity_name = formdata.name;
		activity.activity_type = this.supportedType;

		activity.activity_manual_user_managed = formdata.user_managed === 'on';
		if(formdata.uri !== ''){
			activity.activity_manual_ressource_url = formdata.uri;
		}

		callback(null, activity);
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.activity_name !== formdata.name) {
			activity.activity_name = formdata.name;
		}
	
		const actualUserManaged = actualActivity.activity_manual_user_managed;
		let user_managed = formdata.user_managed === 'on';
		if(actualUserManaged !== user_managed) {
			activity.activity_manual_user_managed = user_managed;
		}
		
		const actualUri = actualActivity.activity_manual_ressource_url;
		if(!(actualUri == formdata.uri)) {
			if(actualUri) {
				activity.activity_manual_ressource_url = formdata.uri;
			} else {
				if(formdata.uri !== ''){
					activity.activity_manual_ressource_url = formdata.uri;
				}
			}
		}

		callback(null, activity);
	},

	fullyPaintActivity: function(activity, participants){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity, participants);
	},

	updateParticipants: function(activity, participants){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true, participants);
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
	},

	paintActivity: function(activity, participants){
		let complete=activity.manual_user_managed ? this.specific.student_complete_ok : this.specific.student_complete_nok;
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			<div class="top"><h4>${activity.activity_name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity.activity_id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity.activity_id}', '${activity.activity_name}', '${activity.session_id}')"></div>
			<p class="subtitle">${this.simple_name}</p>
			<p><strong>${complete}<strong></p>
			<p>${this.commun.storage_file_title} <a onclick="PainterFactory.Painters['activity'].getMinioData('${activity.activity_id}')" target="_blank">${this.commun.storage_file_one_per_line_title}</a></p>
			<br>
			<a onclick="PainterFactory.Painters['activity'].getTMonUrl('${activity.activity_id}','${activity.session_id}','${activity.study}')">
				${this.commun.tmon_title}
			</a>
			<br>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true, false, false, false)}</div>`);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	}
}

PainterFactory.addPainter(ManualActivityPainter);