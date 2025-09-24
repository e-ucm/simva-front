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

		callback(null, activity);
	},

	
	getExtraTemplateForm: function (callback) {
		callback(null, `<p><label for="manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="manual_uri" type="text" name="uri">
			 <span class="info">${this.specific.uri_explication}</p></div>`);
	},

	getEditExtraTemplateForm: function () {
		return `<p><label for="edit_manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="edit_manual_uri" type="text" name="uri">
		<span class="info">${this.specific.uri_explication}</p></div>`;
	},

	getExtraTemplateForm: function (callback) {
		callback(null, `<div class="manual_activity">
				<div class="tabs">
					<span class="tab selected" method="uri" onclick="changeTab(this, 'new_activity_extras','uri')">${this.specific.uri_title}</span>
					<span class="tab" method="package" onclick="changeTab(this,'new_activity_extras','package')">${this.specific.gameplay_game_package_title}</span>
				</div>
				<div id="uri" class="subform selected">
					<p><label for="manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="manual_uri" type="text" name="game_uri">
					<span>
					<p>${this.specific.uri_explication}</p>
				</div>
				<div id="package" class="subform">
					<p><label for="manual_package" style="width: 100%; text-align: center;">${this.specific.package_title}</label><input id="manual_package" type="file" name="manual_package">
				</div>		
			</div>`);
	},

	getEditExtraTemplateForm: function () {
		return `<div class="edit_manual_activity">
				<div class="tabs">
					<span class="tab selected" method="edit_uri" onclick="changeTab(this, 'new_activity_extras','edit_uri')">${this.specific.uri_title}</span>
					<span class="tab" method="edit_package" onclick="changeTab(this,'new_activity_extras','edit_package')">${this.specific.gameplay_game_package_title}</span>
				</div>
				<div id="edit_uri" class="subform selected">
					<p><label for="edit_manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="edit_manual_uri" type="text" name="edit_manual_uri">
					<span>
					<p>${this.specific.uri_explication}</p>
				</div>
				<div id="edit_package" class="subform">
					<p><label for="edit_manual_package" style="width: 100%; text-align: center;">${this.specific.package_title}</label><input id="edit_manual_package" type="file" name="edit_manual_package">
				</div>		
			</div>`;
	},

	updateInputEditExtraTemplateForm(activity) {
		var gameplay_game_uri = document.getElementById('edit_gameplay_game_uri');
		gameplay_game_uri.value = activity.extra_data.game_uri;
	},

	extractTemplateInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.type = this.supportedType;

		if(formdata.game_uri !== ''){
			activity.game_uri = formdata.game_uri;
		}

		callback(null, activity);
	},

	extractEditTemplateInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.name !== formdata.name) {
			activity.name = formdata.name;
		}

		let game_uri=formdata.game_uri;
		if(!(actualActivity.extra_data.game_uri == game_uri)) {
			if(actualActivity.extra_data.game_uri) {
				activity.game_uri = game_uri;
			} else {
				if(game_uri !== ''){
					activity.game_uri = game_uri;
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