if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var GameplayActivityPainter = {
	supportedType: 'gameplay',
	simple_name: 'Gameplay activity',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function (callback) {
		callback(null, `<div class="gameplay_activity">
			<div class="gameplay_tabs">
				<span class="tab selected" method="WEB" onclick="Utils.changeTab(this, 'new_activity_extras','gameplay_web')">WEB</span>
				<span class="tab" method="DESKTOP" onclick="Utils.changeTab(this, 'new_activity_extras','gameplay_desktop')">DESKTOP</span>
			</div>
			<div id="gameplay_web" class="subform selected" style="display: block;">
				<p><label for="gameplay_game_uri" style="width: 100%; text-align: center;">${this.specific.game_uri_title}</label><input id="gameplay_game_uri" type="text" name="game_uri">
				<span class="info">${this.specific.game_uri_explication}</span></p>
			</div>
			<div id="gameplay_desktop" class="subform" style="display: none;">
				<label for="gamefile">${this.specific.upload_title || 'Upload game file for DESKTOP activity'}</label>
				   <input type="file" name="file" id="gamefile" placeholder="Game file" accept=".zip">
				<span class="info">${this.specific.upload_explication || 'Select DESKTOP tab and upload a file.'}</span>
			</div>
			<p><label for="gameplay_trace_storage">${this.commun.storage_title}</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			<p><label for="gameplay_backup">${this.communSpecific.result_title}</label><input id="gameplay_backup" type="checkbox" name="backup" checked></p>
			<p><label for="gameplay_scorm_xAPI">${this.specific.xapi_by_game_title}</label><input id="gameplay_scorm_xAPI" type="checkbox" name="scorm_xapi"></p>
			<p><label for="gameplay_restarted">${this.communSpecific.restarted_title}</label><input id="gameplay_restarted" type="checkbox" name="restarted"></p>
		</div>`);
	},

	getEditExtraForm: function () {
		return `<div class="gameplay_activity">
			<div class="gameplay_tabs">
				<span class="tab selected" method="WEB" onclick="Utils.changeTab(this, 'edit_activity_extras','edit_gameplay_web')">WEB</span>
				<span class="tab" method="DESKTOP" onclick="Utils.changeTab(this, 'edit_activity_extras','edit_gameplay_desktop')">DESKTOP</span>
			</div>
			<div id="edit_gameplay_web" class="subform selected" style="display: block;">
				<p><label for="edit_gameplay_game_uri" style="width: 100%; text-align: center;">${this.specific.game_uri_title}</label><input id="edit_gameplay_game_uri" type="text" name="game_uri">
				<span class="info">${this.specific.game_uri_explication}</span></p>
			</div>
			<div id="edit_gameplay_desktop" class="subform" style="display: none;">
				<label for="edit_gamefile">${this.specific.upload_title || 'Upload game file for DESKTOP activity'}</label>
				   <input type="file" name="file" id="edit_gamefile" placeholder="Game file" accept=".zip">
				<span class="info">${this.specific.upload_explication || 'Select DESKTOP tab and upload a file.'}</span>
			</div>
			<p><label for="edit_gameplay_trace_storage">${this.commun.storage_title}</label><input id="edit_gameplay_trace_storage" type="checkbox" name="trace_storage" checked></p>
			<p><label for="edit_gameplay_backup">${this.communSpecific.result_title}</label><input id="edit_gameplay_backup" type="checkbox" name="backup" checked></p>
			<p><label for="edit_gameplay_scorm_xAPI">${this.specific.xapi_by_game_title}</label><input id="edit_gameplay_scorm_xAPI" type="checkbox" name="scorm_xapi" checked></p>
			<p><label for="edit_gameplay_restarted">${this.communSpecific.restarted_title}</label><input id="edit_gameplay_restarted" type="checkbox" name="restarted"></p>
		</div>`;
	},

	updateInputEditExtraForm(activity) {
		var gameplay_trace_storage = document.getElementById('edit_gameplay_trace_storage');
		gameplay_trace_storage.checked = Boolean(activity.activity_trace_storage);
		var gameplay_backup = document.getElementById('edit_gameplay_backup');
		gameplay_backup.checked = Boolean(activity.game_backup);
		var gameplay_scorm_xAPI = document.getElementById('edit_gameplay_scorm_xAPI');
		gameplay_scorm_xAPI.checked = Boolean(activity.game_scorm_xapi);
		var gameplay_restarted = document.getElementById('edit_gameplay_restarted');
		gameplay_restarted.checked = Boolean(activity.activity_can_be_restarted);
		var gameplay_game_uri = document.getElementById('edit_gameplay_game_uri');
		gameplay_game_uri.value = activity.game_url || "";
		if (activity.game_type === 'DESKTOP') {
			let desktopTab = document.querySelector('#edit_activity_extras .tab[method="DESKTOP"]');
			if (desktopTab) Utils.changeTab(desktopTab, 'edit_activity_extras', 'edit_gameplay_desktop');
		} else {
			let webTab = document.querySelector('#edit_activity_extras .tab[method="WEB"]');
			if (webTab) Utils.changeTab(webTab, 'edit_activity_extras', 'edit_gameplay_web');
		}
	},

	extractInformation: function(form, callback){
		let activity = {};
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let method = $('#new_activity_extras .tab.selected').attr('method');

		console.log('[gameplaypainter] extractInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);
		console.log('Method:', method);

		activity.activity_name = formdata.name;
		activity.activity_type = this.supportedType;
		activity.activity_trace_storage = formdata.trace_storage === 'on';
		activity.game_backup = formdata.backup === 'on';
		activity.game_scorm_xapi = formdata.scorm_xapi === 'on';
		activity.activity_can_be_restarted = formdata.restarted === 'on';

		switch(method){
			case 'DESKTOP':
				activity.game_type = "DESKTOP";
				console.log('[gameplaypainter] DESKTOP case');
				// Only for desktop games
				let rawformdata = PainterFactory.Painters["activity"].extractFileFromEditForm(form, 'gamefile', activity, 'file', 'game_type', 'DESKTOP');
				if(rawformdata !== undefined) {
					console.log('[gameplaypainter] File extraction triggered, returning');
					callback(null, rawformdata); // 👈 send rawformdata for DESKTOP activities
					return;
				} else {
					callback(null, activity);
				}
				break;
			default:
				console.log('[gameplaypainter] Default case, game_uri:', formdata.game_uri);
				activity.game_type = 'WEB';
				if(formdata.game_uri !== ''){
					activity.game_url = formdata.game_uri;
				} else {
					activity.game_url = null;
				}
				callback(null, activity);
				break;
		}
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		console.log('[gameplaypainter] extractEditInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);
		console.log('actualActivity:', actualActivity);

		let method = $('#edit_activity_extras .tab.selected').attr('method') || 'WEB';
		let selectedGameType = method === 'DESKTOP' ? 'DESKTOP' : 'WEB';

		if(actualActivity.activity_name !== formdata.name) {
			activity.activity_name = formdata.name;
		}
		const actualTraceStorage = actualActivity.activity_trace_storage;
		let trace_storage = formdata.trace_storage === 'on';
		if(actualTraceStorage !== trace_storage) {
			activity.activity_trace_storage = trace_storage;
		}
		const actualScormXapiByGame = actualActivity.game_scorm_xapi;
		let scorm_xapi_by_game = formdata.scorm_xapi === 'on';
		if(actualScormXapiByGame !== scorm_xapi_by_game) {
			activity.game_scorm_xapi = scorm_xapi_by_game;
		}
		const actualBackup = actualActivity.game_backup;
		let backup = formdata.backup === 'on';
		if(actualBackup !== backup) {
			activity.game_backup = backup;
		}
		if(actualActivity.game_type !== selectedGameType) {
			activity.game_type = selectedGameType;
		}

		if(selectedGameType === 'DESKTOP') {
			console.log('[gameplaypainter] Checking file extraction in edit');
			let rawformdata = PainterFactory.Painters["activity"].extractFileFromEditForm(form, 'edit_gamefile', activity, 'file', 'game_type', 'DESKTOP');
			if(rawformdata !== undefined) {
				console.log('[gameplaypainter] File extraction triggered in edit, returning');
				callback(null, rawformdata);
				return;
			}
		} else {
			let game_uri = formdata.game_uri;
			let actualGameUri = actualActivity.game_url || '';
			if(actualGameUri !== game_uri) {
				activity.game_url = game_uri;
			}
		}
		callback(null, activity);
	},

	fullyPaintActivity: function(activity, participants){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity, participants);
	},

	updateParticipants: function(activity, participants){
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true, participants);
		PainterFactory.Painters["activity"].paintActivityInit(activity, activity.data.init, participants);
		PainterFactory.Painters["activity"].paintActivityProgress(activity, activity.data.progress, participants);
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.hasresult, false, participants, this.communSpecific.result_zero, null,this.communSpecific.result_view_partial_value, true, this.communSpecific.result_view_final_value);
	},
	
	downloadXasuConfig: function(activityId, studyId){
		var content = JSON.stringify({
			online: true,
			simva :true,
			homepage:`${Simva.url}`,
			lrs_endpoint : `${Simva.apiurl}/activities/${activityId}`,
			auth_protocol : "oauth2",
			auth_parameters : {
				grant_type : "code",
       			auth_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/auth`, 
        		token_endpoint : `${Simva.ssoUrl}/realms/${Simva.ssoRealm}/protocol/openid-connect/token`,
        		client_id : "simva-plugin",
        		code_challenge_method : "S256",
				simva_user_token:"true",
    			login_hint: studyId
			}
		}, null, 2);

		var filename = "tracker_config.json";

		Utils.download(filename, content);
	},

	getExtraKebabItems: function(activity) {
		const xasuItem = Boolean(activity.activity_trace_storage)
			? `<li class="kebab-icon icon-download" title="${this.specific.xasu_title || 'Download tracker config'}" onclick="GameplayActivityPainter.downloadXasuConfig('${activity.activity_id}','${activity.study}')">${this.specific.xasu_title || 'Download tracker config'}</li>`
			: `<li class="kebab-icon icon-download li-disabled" title="${this.specific.xasu_title || 'Download tracker config'} (${this.commun.result_disabled || 'disabled'})">${this.specific.xasu_title || 'Download tracker config'} (${this.commun.result_disabled || 'disabled'})</li>`;

		const backupItem = Boolean(activity.game_backup)
			? `<li class="kebab-icon icon-download" title="${this.communSpecific.result_title || 'Backup'}" onclick="GameplayActivityPainter.downloadBackup('${activity.activity_id}')">${this.communSpecific.result_title || 'Backup'} ⬇️</li>`
			: `<li class="kebab-icon icon-download li-disabled" title="${this.communSpecific.result_title || 'Backup'} (${this.commun.result_disabled || 'disabled'})">${this.communSpecific.result_title || 'Backup'} (${this.commun.result_disabled || 'disabled'})</li>`;

		return `<li class="kebab-icon icon-activate" title="${this.commun.completed_all_set || 'Set completion'}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity.activity_id}', true)">${this.commun.completed_all_set || 'Set completion'}</li>
				<li class="kebab-icon icon-pause" title="${this.commun.completed_all_unset || 'Unset completion'}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity.activity_id}', false)">${this.commun.completed_all_unset || 'Unset completion'}</li>
				${xasuItem}
				${backupItem}`;
	},

	paintActivity: function(activity, participants){
		const topBar = PainterFactory.Painters['activity'].paintActivityTopBar.call(this, activity, this.getExtraKebabItems(activity));
		let activitybox = `<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			${topBar}
			<p class="subtitle" title="${this.description || ''}">${this.simple_name}</p>
			<div class="activity-meta">`;
		activitybox += `<p>${this.commun.storage_title}: <i>${Boolean(activity.activity_trace_storage) ? (this.commun.result_enabled || 'enabled') : (this.commun.result_disabled || 'disabled')}</i></p>`;
		activitybox += `<p>${this.communSpecific.result_title}: <i>${Boolean(activity.game_backup) ? (this.commun.result_enabled || 'enabled') : (this.commun.result_disabled || 'disabled')}</i></p>`;
		activitybox += `</div>`;
		activitybox += `${PainterFactory.Painters["activity"].paintActivityParticipantsTable(activity, participants, true)}</div>`;

		$(`#test_${activity.session_id} .activities`).append(activitybox);
	},

	updateActivityResult: function(activityId, username, backup) {
		PainterFactory.Painters["activity"].updateActivityResult(activityId, username,backup, true, this.communSpecific.result_zero, null,this.communSpecific.result_view_partial_value, "true", this.communSpecific.result_view_final_value,"PainterFactory.Painters['activity']");
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	},

	updateActivityProgress: function(activityId, username, result) {
		PainterFactory.Painters["activity"].updateActivityProgress(activityId, username,result);
	},
	
	downloadBackup: function(activity, user){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		
		if(user){
			Simva.getActivityResultForUser(activity, user, function(error, result){
				if(error){
					toastParams.text = error.message;
					$.toast(toastParams);
				}else{
					var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}.json`;
					Utils.download(filename, result[user]);
				}
			});
		} 
		else 
		{
			Simva.getActivityResult(activity, (error, result) => {
				if(error) {
					toastParams.text = error.message;
					$.toast(toastParams);
				} else {
					Utils.download(`${this.communSpecific.result_file_prefix}_${activity}.json`, JSON.stringify(result, null, 2));
				}
			});
		}
	},
}

PainterFactory.addPainter(GameplayActivityPainter);