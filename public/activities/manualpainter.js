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
		callback(null, `<div class="manual_activity">
			<div class="manual_tabs">
				<span class="tab selected" method="WEB" onclick="changeTab(this, 'new_activity_extras','manual_web')">WEB</span>
				<span class="tab" method="EXTERNAL" onclick="changeTab(this, 'new_activity_extras','manual_external')">EXTERNAL</span>
			</div>
			<div id="manual_web" class="subform selected">
				<p><label for="manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="manual_uri" type="text" name="uri">
				<span class="info">${this.specific.uri_explication}</span></p>
			</div>
			<div id="manual_external" class="subform">
				<label for="manualfile">${this.specific.upload_title || 'Upload file for EXTERNAL activity'}</label>
				   <input type="file" name="file" id="manualfile" placeholder="Manual file" accept=".pdf">
				<span class="info">${this.specific.upload_explication || 'Select EXTERNAL tab and upload a file.'}</span>
			</div>
			<p><label for="manual_user_managed">${this.specific.student_complete_title}</label><input id="manual_user_managed" type="checkbox" name="user_managed"></p>
			<p><label for="manual_storage">${this.commun.storage_title}</label><input id="manual_storage" type="checkbox" name="storage"></p>
			<p><label for="manual_restarted">${this.communSpecific.restarted_title}</label><input id="manual_restarted" type="checkbox" name="restarted"></p>
		</div>`);
	},

	getEditExtraForm: function () {
		return `<div class="manual_activity">
			<div class="manual_tabs">
				<span class="tab selected" method="WEB" onclick="changeTab(this, 'edit_manual_web')">WEB</span>
				<span class="tab" method="EXTERNAL" onclick="changeTab(this, 'edit_manual_external')">EXTERNAL</span>
			</div>
			<div id="edit_manual_web" class="subform selected">
				<p><label for="edit_manual_uri" style="width: 100%; text-align: center;">${this.specific.uri_title}</label><input id="edit_manual_uri" type="text" name="uri">
				<span class="info">${this.specific.uri_explication}</span></p>
			</div>
			<div id="edit_manual_external" class="subform">
				<label for="edit_manualfile">${this.specific.upload_title || 'Upload file for EXTERNAL activity'}</label>
				   <input type="file" name="file" id="edit_manualfile" placeholder="Manual file" accept=".pdf">
				<span class="info">${this.specific.upload_explication || 'Select EXTERNAL tab and upload a file.'}</span>
			</div>
			<p><label for="edit_manual_user_managed">${this.specific.student_complete_title}</label><input id="edit_manual_user_managed" type="checkbox" name="user_managed"></p>
			<p><label for="edit_manual_storage">${this.commun.storage_title}</label><input id="edit_manual_storage" type="checkbox" name="storage"></p>
			<p><label for="edit_manual_restarted">${this.communSpecific.restarted_title}</label><input id="edit_manual_restarted" type="checkbox" name="restarted"></p>
		</div>`;
	},

	updateInputEditExtraForm(activity) {
		var manual_user_managed = document.getElementById('edit_manual_user_managed');
		manual_user_managed.checked = Boolean(activity.manual_user_managed);
		var manual_storage = document.getElementById('edit_manual_storage');
		manual_storage.checked = Boolean(activity.manual_storage);
		var manual_restarted = document.getElementById('edit_manual_restarted');
		manual_restarted.checked = Boolean(activity.manual_restarted);
		var manual_uri = document.getElementById('edit_manual_uri');
		if(activity.manual_ressource_url) {
			manual_uri.value = activity.manual_ressource_url;
		}
	},

	extractInformation: function(form, callback){
		let activity = {};
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let method = $('#new_activity_extras .tab.selected').attr('method');

		console.log('[manualpainter] extractInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);
		console.log('Method:', method);

		activity.activity_name = formdata.name;
		activity.activity_type = this.supportedType;
		activity.manual_user_managed = formdata.user_managed === 'on';
		activity.activity_trace_storage = formdata.storage === 'on';
		activity.activity_can_be_restarted = formdata.restarted === 'on';

		switch(method){
			case 'EXTERNAL':
				// Only for EXTERNAL manual activities
				console.log('[manualpainter] EXTERNAL case, checking file extraction');
				let rawformdata = PainterFactory.Painters["activity"].extractFileFromEditForm(form, 'manualfile', callback, activity, 'file', 'manual_ressource_type', 'EXTERNAL');
				if(rawformdata !== undefined) {
					console.log('[manualpainter] File extraction triggered, returning');
					callback(null, rawformdata); // 👈 send rawformdata for EXTERNAL activities
					return;
				}
				console.log('[manualpainter] No file extracted, continuing');
				callback(null, activity);
				break;
			default:
				console.log('[manualpainter] Default case, uri:', formdata.uri);
				activity.manual_ressource_type = 'WEB';
				if(formdata.uri !== ''){
					activity.manual_ressource_url = formdata.uri;
				} else {
					activity.manual_ressource_url = null;
				}
				callback(null, activity);
				break;
		}
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};
		let method = $('#edit_activity_extras .tab.selected').attr('method');

		console.log('[manualpainter] extractEditInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);
		console.log('actualActivity:', actualActivity);

		if(actualActivity.activity_name !== formdata.name) {
			activity.activity_name = formdata.name;
		}
    
		const actualUserManaged = actualActivity.manual_user_managed;
		let user_managed = formdata.user_managed === 'on';
		if(actualUserManaged !== user_managed) {
			activity.manual_user_managed = user_managed;
		}
        
		switch(method){
			case 'EXTERNAL':
				activity.manual_ressource_type = 'EXTERNAL';
				console.log('[manualpainter] EXTERNAL case, checking file extraction in edit');
				const actualUri = actualActivity.manual_ressource_url;
				if(!(actualUri == formdata.uri)) {
					if(actualUri) {
						activity.manual_ressource_url = formdata.uri;
					} else {
						if(formdata.uri !== ''){
							activity.manual_ressource_url = formdata.uri;
						}
					}
				}
			case 'WEB':
				activity.manual_ressource_type = 'WEB';
				// Check for file upload in edit form
				console.log('[manualpainter] Checking file extraction in edit');
				let rawformdata = PainterFactory.Painters["activity"].extractFileFromEditForm(form, 'manualfile', activity, 'file', 'manual_ressource_type', 'EXTERNAL');
				if(rawformdata !== undefined) {
					console.log('[manualpainter] File extraction triggered in edit, returning');
					callback(null, rawformdata); // 👈 send rawformdata for EXTERNAL activities
					return;
				} else {
					callback(null, activity);
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

	getExtraKebabItems: function(activity) {
		return `<li class="kebab-icon icon-activate" title="${this.commun.completed_all_set || 'Set completion'}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity.activity_id}', true)">${this.commun.completed_all_set || 'Set completion'}</li>
				<li class="kebab-icon icon-pause" title="${this.commun.completed_all_unset || 'Unset completion'}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity.activity_id}', false)">${this.commun.completed_all_unset || 'Unset completion'}</li>`;
	},

	paintActivity: function(activity, participants){
		let complete=activity.manual_user_managed ? this.specific.student_complete_ok : this.specific.student_complete_nok;
		let storageStatus = Boolean(activity.activity_trace_storage) ? 'enabled' : (this.commun.result_disabled || 'disabled');
		let resourceType = activity.manual_ressource_type || 'WEB';
		const topBar = PainterFactory.Painters['activity'].paintActivityTopBar.call(this, activity, this.getExtraKebabItems(activity));
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			${topBar}
			<p class="subtitle" title="${this.description || ''}">${this.simple_name}</p>
			<div class="activity-meta">
				<p><strong>${complete}</strong></p>
				<p>${this.commun.storage_title}: <i>${storageStatus}</i></p>
				<p>${this.specific.upload_title || 'Resource type'}: <i>${resourceType}</i></p>
			</div>
			${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true, false, false, false)}</div>`);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	}
}

PainterFactory.addPainter(ManualActivityPainter);