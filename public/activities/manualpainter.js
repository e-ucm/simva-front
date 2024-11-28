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

	getExtraForm: function () {
		return `<p><label for="manual_user_managed">Allow students to complete?</label><input id="manual_user_managed" type="checkbox" name="user_managed"></p>
			 <p><label for="manual_uri" style="width: 100%; text-align: center;">URI (optional)</label><input id="manual_uri" type="text" name="uri">
			 <span class="info">URI can include tags: {username}, and {activityId}</p></div>`;
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

	extractEditInformation: function(form, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		Simva.getActivity(formdata.activity, function(error, actualActivity){
			if(!error) {
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
			} else {
				callback(error, null);
			}
		});
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		let tmp = this;

		this.updateParticipants(activity);
		//setInterval(function(){
		//	tmp.updateParticipants(activity);
		//}, 5000);
	},

	updateParticipants: function(activity){
		let tmp = this;
		activity.tmp = {};

		Simva.getActivityCompletion(activity._id, function(error, result){
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.hasActivityResult(activity._id, function(error, result){
			tmp.paintActivityResult(activity, result);
		});
	},

	paintActivity: function(activity, participants){
		let complete=activity.extra_data.user_managed ? 'can' : '<strong>can\'t<strong>'
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Students ${complete} complete</p>
			<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>% [ <doneres>0</doneres> /<total>0</total> ]</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += `<tr><td>${PainterFactory.Painters["activity"].getUsernameOrToken(participants[i])}</td>
				${PainterFactory.Painters['activity'].paintCompletionRow(activity._id,participants[i].username, true)}
				${PainterFactory.Painters['activity'].paintResultRow(activity._id,participants[i].username)}</tr>`;
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, status, true);
	},

	paintActivityResult: function(activity, results){
		PainterFactory.Painters["activity"].paintActivityResult(activity, results);
	},

	updateActivityCompletion: function(activityId, username, completion) {
		PainterFactory.Painters["activity"].updateActivityCompletion(activityId, username, completion, true);
	}
}

PainterFactory.addPainter(ManualActivityPainter);