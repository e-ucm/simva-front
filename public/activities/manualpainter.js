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

	getExtraForm: function (callback) {
		callback(null, `<p><label for="manual_user_managed">Allow students to complete?</label><input id="manual_user_managed" type="checkbox" name="user_managed"></p>
			 <p><label for="manual_uri" style="width: 100%; text-align: center;">URI (optional)</label><input id="manual_uri" type="text" name="uri">
			 <span class="info">URI can include tags: {username}, and {activityId}</p></div>`);
	},

	getEditExtraForm: function () {
		return `<p><label for="edit_manual_user_managed">Allow students to complete?</label><input id="edit_manual_user_managed" type="checkbox" name="user_managed"></p>
		<p><label for="edit_manual_uri" style="width: 100%; text-align: center;">URI (optional)</label><input id="edit_manual_uri" type="text" name="uri">
		<span class="info">URI can include tags: {username}, and {activityId}</p></div>`;
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
		let complete=activity.extra_data.user_managed ? 'can' : '<strong>can\'t<strong>'
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Students ${complete} complete</p>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true, false, true)}</div>`);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	}
}

PainterFactory.addPainter(ManualActivityPainter);