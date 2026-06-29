if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var ActivityPainter = {
	supportedType: 'activity',
	simple_name: 'activity.activity_type',
	description: 'activity.description',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getUsernameOrToken : function (user) {
		if(user.isToken) {
			return user.token;
		} else {
			return user.username;
		}
	},

	getParticipantKey: function(participant){
		if(participant && participant.user_id !== undefined && participant.user_id !== null){
			return String(participant.user_id);
		}

		if(participant && participant.participant_id !== undefined && participant.participant_id !== null){
			return String(participant.participant_id);
		}

		if(participant && participant.id !== undefined && participant.id !== null){
			return String(participant.id);
		}

		if(participant && participant.isToken && participant.token !== undefined && participant.token !== null){
			return String(participant.token);
		}

		return String(participant.username);
	},

	getParticipantKeys: function(participant){
		let keys = [];

		if(participant && participant.user_id !== undefined && participant.user_id !== null){
			keys.push(String(participant.user_id));
		}

		if(participant && participant.participant_id !== undefined && participant.participant_id !== null){
			keys.push(String(participant.participant_id));
		}

		if(participant && participant.id !== undefined && participant.id !== null){
			keys.push(String(participant.id));
		}

		if(participant && participant.username !== undefined && participant.username !== null){
			keys.push(String(participant.username));
		}

		if(participant && participant.token !== undefined && participant.token !== null){
			keys.push(String(participant.token));
		}

		if(participant && participant.isToken && participant.token !== undefined && participant.token !== null){
			keys.unshift(String(participant.token));
		}

		return Array.from(new Set(keys));
	},

	getParticipantMappedValue: function(map, participant){
		if(!map){
			return undefined;
		}

		const keys = this.getParticipantKeys(participant);
		for (let i = 0; i < keys.length; i++) {
			if(Object.prototype.hasOwnProperty.call(map, keys[i])) {
				return map[keys[i]];
			}
		}

		return undefined;
	},

	isDownloadUrl: function(value){
		return Utils.isDownloadUrl(value);
	},

	downloadContent: function(source, filename, errorHeading){
		Utils.downloadContent(source, filename, errorHeading);
	},

	getExtraForm: function (callback) {
		callback(null, '');
	},

	getEditExtraForm: function () {
		return '';
	},

	updateInputEditExtraForm(activity) {
	},

	extractFileFromEditForm(form, inputName, activity, fileField, typeField, typeValue) {
		console.log('[activitypainter] extractFileFromEditForm called');
		let fileInput = null;

		// Normalize form (always jQuery)
		let $form = (form instanceof $) ? form : $(form);

		// Much simpler + reliable selector
		fileInput = $form.find(`input[name="${inputName}"], input[id="${inputName}"], input[id="edit_${inputName}"]`).get(0);

		console.log('[activitypainter] fileInput selected:', fileInput);

		if (fileInput && fileInput.files && fileInput.files.length > 0) {
			let file = fileInput.files[0];
			console.log('[activitypainter] File selected:', file);

			// 🚨 KEY CHANGE: use FormData instead of base64
			let formData = new FormData();
			formData.append('formData', true);
			// Append file
			formData.append(fileField, file);

			// Append metadata
			formData.append(typeField, typeValue);

			// Add other activity fields
			Object.keys(activity).forEach(key => {
				formData.append(key, activity[key]);
			});

			console.log('[activitypainter] FormData ready');
			console.log('FormData entries:');
			for (let pair of formData.entries()) {
				console.log(pair[0]+ ':', pair[1]);
			}
			return formData; // 👈 send FormData instead of activity
		}

		console.log('[activitypainter] No file selected');
		return undefined;
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};
		console.log('[activitypainter] extractEditInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);
		console.log('actualActivity:', actualActivity);
		if(actualActivity.activity_name !== formdata.name) {
			activity.activity_name = formdata.name;
		}
		callback(null, activity);
	},


	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		console.log('[activitypainter] extractInformation called');
		console.log('Form:', form);
		console.log('FormData:', formdata);

		activity.activity_name = formdata.name;
		activity.activity_type = this.supportedType;

		callback(null, activity);
	},

	fullyPaintActivity: function(activity, participants){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity, participants);
	},

	updateParticipants: function(activity, participants){
		this.paintActivityInit(activity, activity.data.init, participants);
		this.paintActivityProgress(activity, activity.data.progress, participants);
		this.paintActivityCompletion(activity, activity.data.completion, true, participants);
		this.paintActivityResult(activity, activity.data.hasresult, true, participants);
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
	},

	paintActivityTargets: function(activity, results, participants=[]){
		if(!results) {
			return;
		}

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			const target = this.getParticipantMappedValue(results, participants[i]);
			if(target) {
				$(`#${activity.activity_id}_${participantKey}_target`).attr('href', target);
			}
		}
	},
 
	getExtraKebabItems: function(activity) {
		return '';
	},

	paintActivityTopBar: function(activity, extraItems) {
		return `<div class="top"><h4>${activity.activity_name}</h4>
			<div class="activityTopActions">
				<div class="activityDownload kebab-icon icon-download" title="${this.commun.download_tooltip}" onclick="openActivityDownloadForm(${activity.activity_id})"><b>${this.commun.download_title}</b></div>
				
				<div class="kebab">
					<ul class="kebab-dropdown">
						<li class="kebab-icon icon-edit" title="${this.commun.edit_title}" onclick="openEditActivityForm('${activity.activity_id}')">${this.commun.edit_title}</li>
						<li class="kebab-icon icon-export" title="${this.commun.export_title}" onclick="PainterFactory.Painters['activity'].exportActivity('${activity.activity_id}','${activity.session_id}','${activity.study}')">${this.commun.export_title}</li>
						<li class="kebab-icon icon-url" title="${this.commun.tmon_title}" onclick="PainterFactory.Painters['activity'].getTMonUrl('${activity.activity_id}','${activity.session_id}','${activity.study}')">${this.commun.tmon_title}</li>
						${extraItems}
						<li class="kebab-icon icon-delete" title="${this.commun.delete_title}" onclick="deleteActivity('${activity.activity_id}', '${activity.activity_name}', '${activity.session_id}')">${this.commun.delete_title}</li>
					</ul>
				</div>
			</div></div>`;
	},

	paintActivity: function(activity, participants){
		$(`#test_${activity.session_id} .activities`).append(`
			<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
				${this.paintActivityTopBar(activity, this.getExtraKebabItems(activity))}
				<p class="subtitle" title="${this.description}">${this.simple_name}</p>
				${this.paintActivityParticipantsTable(activity, participants, true)}
			</div>
		`);
	},

	paintActivityParticipantsTable: function(activity, participants, checkbox=false, progress=true, result=true, init=true){
		const participantTooltip = this.commun.participant_tooltip;
		const initTooltip = this.commun.init_bar_tooltip;
		const progressTooltip = this.commun.progress_tooltip;
		const completedTooltip = this.commun.completed_tooltip;
		const resultTooltip = this.commun.result_tooltip;
		const completedBarTooltip = this.commun.completed_bar_tooltip;
		const initBarTooltip = this.commun.init_bar_tooltip;
		const progressBarTooltip = this.commun.progress_bar_tooltip;
		const resultBarTooltip = this.commun.result_bar_tooltip;

		let toret = `<div id="completion_progress_${activity.activity_id}" class="progress" title="${completedBarTooltip}"><div class="partial"></div><div class="done"></div><span>${this.commun.completed_title}: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`;
		if(init) {
			toret += `<div id="init_progress_${activity.activity_id}" class="progress" title="${initBarTooltip}"><div class="partial"></div><div class="done"></div><span>${this.commun.init_title}: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`;
		}
		if(progress) {
			toret += `<div id="progress_${activity.activity_id}" class="progress" title="${progressBarTooltip}"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.progress_title}: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		if(result) {
			toret += `<div id="result_progress_${activity.activity_id}" class="progress" title="${resultBarTooltip}"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.result_title}: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		
		toret += `<table><tr><th title="${participantTooltip}">${this.commun.user_title}</th>`;
		if(init) {
			toret += `<th title="${initTooltip}">${this.commun.init_title}</th>`;
		}
		if(progress) {
			toret += `<th title="${progressTooltip}">${this.commun.progress_title}</th>`;
		}
		toret += `<th title="${completedTooltip}">${this.commun.completed_title}</th>`;
		if(result) {
			toret += `<th title="${resultTooltip}">${this.commun.result_title}</th>`;
		}
		toret += '</tr>';

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			toret += `<tr><td>${this.paintUsernameOrToken(activity, participants[i])}</td>`;
			if(init) {
				toret += `${this.paintInitRow(activity.activity_id,participantKey)}`;
			}
			if(progress) {
				toret += `${this.paintProgressRow(activity.activity_id,participantKey)}`
			}
			toret += `${this.paintCompletionRow(activity.activity_id,participantKey, checkbox)}`;
			if(result){
				toret += `${this.paintResultRow(activity.activity_id,participantKey)}`;
			}else{
				toret += `<td><i>${this.commun.result_disabled}</i></td>`;
			}
		}

		toret += '</table>';

		return toret;
	},

	paintUsernameOrToken(activity, participant, ok=null) {
		let openable = activity.data.openable;
		const participantKey = this.getParticipantKey(participant);
		if(ok !== '') {
			openable = openable || ok;
		}
		let toret="";
		if(openable) {
			toret += `<a id="${activity.activity_id}_${participantKey}_target" class="targeturl" target="_blank" href="">${this.getUsernameOrToken(participant)}</a>`;
		} else {
			toret += `${this.getUsernameOrToken(participant)}`;
		}
		return toret;
	},

	paintCompletionRow(activity, participant, checkbox=false) {
		if(checkbox) {
			return `<td id="completion_${activity}_${participant}">
				<input type="checkbox" onchange="PainterFactory.Painters['activity'].toggleCompletion(this, '${activity}', '${participant}')">
			</td>`;
		} else {
			return `<td id="completion_${activity}_${participant}">---</td>`;
		}
	},

	paintProgressRow(activity, participant) {
		return `<td id="progress_${activity}_${participant}" class="progress"><div class="partial"></div><div class="done"></div><span><done>---</done>%</span></td>`;
	},

	paintResultRow(activity, participant) {
		return `<td id="result_${activity}_${participant}">---</td>`;
	},

	paintInitRow(activity, participant) {
		return `<td id="init_${activity}_${participant}">---</td>`;
	},

	paintActivityInit: function(activity, status, participants=[], init_on=this.commun.init_on, init_off=this.commun.init_off){
		let total = participants.length;
		if(!status) {
			// Even without status, update total if we have participant count
			if(total > 0) {
				$(`#init_progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#init_progress_${activity.activity_id} done`).text(0);
				$(`#init_progress_${activity.activity_id} doneres`).text(0);
				$(`#init_progress_${activity.activity_id} total`).text(total);
			}
			return;
		}

		let done = 0;
		console.info("paintActivityInit", status, participants);

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			let value = this.getParticipantMappedValue(status, participants[i]);
			let initText = "";
			let colorClass = 'red';

			if(value === true) {
				initText = `<span>${init_on}</span>`;
				colorClass = 'green';
				done++;
			} else if(value === false) {
				initText = `<span>${init_off}</span>`;
				colorClass = 'red';
			} else if(typeof value === 'number') {
				let progress = Math.round(value * 1000) / 10;
				initText = `<span>${progress}%</span>`;
				if(value >= 1) {
					colorClass = 'green';
					done++;
				} else if(value > 0) {
					colorClass = 'yellow';
				} else {
					colorClass = 'red';
				}
			} else {
				initText = `<span>---</span>`;
				colorClass = '';
			}

			$(`#init_${activity.activity_id}_${participantKey}`).removeClass('green red yellow');
			$(`#init_${activity.activity_id}_${participantKey}`).addClass(colorClass);
			$(`#init_${activity.activity_id}_${participantKey}`).empty();
			$(`#init_${activity.activity_id}_${participantKey}`).append(initText);
		}

		let progress = Math.round((done / total) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#init_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#init_progress_${activity.activity_id} done`).text(progress);
		$(`#init_progress_${activity.activity_id} doneres`).text(done);
		$(`#init_progress_${activity.activity_id} total`).text(total);
	},

	paintActivityCompletion: function(activity, status, checkbox=false, participants=[], completed_on=this.commun.completed_on, completed_off=this.commun.completed_off){
		let total = participants.length;
		if(!status) {
			// Even without status, update total if we have participant count
			if(total > 0) {
				$(`#completion_progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#completion_progress_${activity.activity_id} done`).text(0);
				$(`#completion_progress_${activity.activity_id} doneres`).text(0);
				$(`#completion_progress_${activity.activity_id} total`).text(total);
			}
			return;
		}

		let done = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			const completionValue = this.getParticipantMappedValue(status, participants[i]);
			if(completionValue){
				done++;
			}
			if(checkbox) {
				if(completionValue){
					$(`#completion_${activity.activity_id}_${participantKey}`).addClass('green');
					$(`#completion_${activity.activity_id}_${participantKey}`).removeClass('red');
				}else{
					$(`#completion_${activity.activity_id}_${participantKey}`).removeClass('green');
					$(`#completion_${activity.activity_id}_${participantKey}`).addClass('red');
				}
	
				$(`#completion_${activity.activity_id}_${participantKey}`).find('input[type="checkbox"]').prop('checked', Boolean(completionValue));
			} else {
				let completion = "";
				if(completionValue==true) {
					completion=`<span>${completed_on}</span>`;
				} else {
					completion=`<span>${completed_off}</span>`;
				}
				
		 		$(`#completion_${activity.activity_id}_${participantKey}`).addClass(!completionValue ? 'red' : 'green');
				$(`#completion_${activity.activity_id}_${participantKey}`).empty();
				$(`#completion_${activity.activity_id}_${participantKey}`).append(completion);
			}
		}

		let progress = Math.round((done / total) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#completion_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activity.activity_id} done`).text(progress);
		$(`#completion_progress_${activity.activity_id} doneres`).text(done);
		$(`#completion_progress_${activity.activity_id} total`).text(total);
	},

	paintActivityProgress: function(activity, status, participants=[]){
		let total = participants.length;
		if(!status) {
			// Even without status, update total if we have participant count
			if(total > 0) {
				$(`#progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#progress_${activity.activity_id} done`).text(0);
				$(`#progress_${activity.activity_id} doneres`).text(0);
				$(`#progress_${activity.activity_id} .partial`).css('width', '0%');
				$(`#progress_${activity.activity_id} partial`).text(0);
				$(`#progress_${activity.activity_id} partialres`).text(0);
				$(`#progress_${activity.activity_id} total`).text(total);
			}
			return;
		}
		let done = 0, partial = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			let value = this.getParticipantMappedValue(status, participants[i]);
			if(value === null || value === undefined) {
				$(`#progress_${activity.activity_id}_${participantKey}`).empty();
				$(`#progress_${activity.activity_id}_${participantKey}`).append('---');
				$(`#progress_${activity.activity_id}_${participantKey}`).removeClass('progress');
				continue;
			}
			if(value !== 0){
				partial++;
				if(value == 1){
					done++;
				}
			}

			let tmpprogress = Math.round(value * 1000) / 10;
			const visualTmpProgress = tmpprogress >= 100 ? 100.2 : tmpprogress;
			$(`#progress_${activity.activity_id}_${participantKey} .done`).css('width', `${visualTmpProgress}%` );
			$(`#progress_${activity.activity_id}_${participantKey} done`).text(tmpprogress);
		}

		let progress = Math.round((done / total) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		const visualProgress = progress >= 100 ? 100.2 : progress;
		$(`#progress_${activity.activity_id} .done`).css('width', `${visualProgress}%` );
		$(`#progress_${activity.activity_id} done`).text(progress);
		$(`#progress_${activity.activity_id} doneres`).text(done);

		let partialprogress = Math.round((partial / total) * 1000) / 10;
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}
		$(`#progress_${activity.activity_id} .partial`).css('width', `${partialprogress}%` );
		$(`#progress_${activity.activity_id} partial`).text(partialprogress);
		$(`#progress_${activity.activity_id} partialres`).text(partial);
		$(`#progress_${activity.activity_id} total`).text(total);
	},

	paintActivityResult: function(activity, results, defaultValue="true", participants=[], displayDefaultValue=this.communSpecific.result_zero, partialValue=null,displayPartialValue=this.communSpecific.result_view_partial_value, finalValue="true", displayFinalValue=this.communSpecific.result_view_final_value,painter="PainterFactory.Painters['activity']"){
		let total = participants.length;
		if(!results) {
			// Even without results, update total if we have participant count
			if(total > 0) {
				$(`#result_progress_${activity.activity_id} .done`).css('width', '0%');
				$(`#result_progress_${activity.activity_id} done`).text(0);
				$(`#result_progress_${activity.activity_id} doneres`).text(0);
				$(`#result_progress_${activity.activity_id} .partial`).css('width', '0%');
				$(`#result_progress_${activity.activity_id} partial`).text(0);
				$(`#result_progress_${activity.activity_id} partialres`).text(0);
				$(`#result_progress_${activity.activity_id} total`).text(total);
			}
			return;
		}

		let done = 0, partial = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = this.getParticipantKey(participants[i]);
			let status = this.getParticipantMappedValue(results, participants[i]);
			let result= `<span>${displayDefaultValue}</span>`;
			let color = 'red';
			let state = defaultValue;
			if(status){
				if(status == finalValue){
					color = 'green';
					state = displayFinalValue;
					done++;
					partial++;
				} else if(status == partialValue) {
					color = 'yellow';
					state = displayPartialValue;
					partial++;
				} else {
					color = 'red';
					state = defaultValue;
				}
				if(state == defaultValue) {
					result = `<span>${displayDefaultValue}</span>`;
				} else {
					result = `<span>
					<a onclick="${painter}.openResults('${activity.activity_id}','${participantKey}')">${state}</a>
					<a onclick="${painter}.downloadResults('${activity.activity_id}','${participantKey}')">⬇️</a>
					</span>`;
				}
			}
			$(`#result_${activity.activity_id}_${participantKey}`).removeClass();
			$(`#result_${activity.activity_id}_${participantKey}`).addClass(color);
			$(`#result_${activity.activity_id}_${participantKey}`).empty();
			$(`#result_${activity.activity_id}_${participantKey}`).append(result);
		}

		let progress = Math.round((done / total) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		$(`#result_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity.activity_id} done`).text(progress);
		$(`#result_progress_${activity.activity_id} doneres`).text(done);

		let partialprogress = Math.round((partial / total) * 1000) / 10;
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}
		$(`#result_progress_${activity.activity_id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity.activity_id} partial`).text(partialprogress);
		$(`#result_progress_${activity.activity_id} partialres`).text(partial);
		$(`#result_progress_${activity.activity_id} total`).text(total);
	},

	updateActivityCompletion: function(activityId, username, completion, checkbox=false) {
		var users = parseInt(document.querySelector(`#completion_progress_${activityId} total`).textContent);
		var res= parseInt(document.querySelector(`#completion_progress_${activityId} doneres`).textContent);
		var newRes;
		if(checkbox) {
			var previous= $(`#completion_${activityId}_${username}`).find('input[type="checkbox"]').prop('checked');
			if(completion) {
				$(`#completion_${activityId}_${username}`).addClass('green');
				$(`#completion_${activityId}_${username}`).removeClass('red');
				newRes=res+1;
				if(! previous) {
					$(`#completion_${activityId}_${username}`).find('input[type="checkbox"]').prop('checked', true);
				}
			} else {
				$(`#completion_${activityId}_${username}`).removeClass('green');
				$(`#completion_${activityId}_${username}`).addClass('red');
				newRes=res-1;
				if(previous) {
					$(`#completion_${activityId}_${username}`).find('input[type="checkbox"]').prop('checked', false);
				}
			}
		} else {
			var previousCompletion= document.querySelector(`#completion_${activityId}_${username}`).textContent;
			$(`#completion_${activityId}_${username}`).addClass(completion == 'false' ? 'red' : 'green');
			$(`#completion_${activityId}_${username}`).empty();
			$(`#completion_${activityId}_${username}`).append(completion);
			if(previousCompletion == "false") {
				newRes = res + 1;
			}
		}
		$(`#completion_progress_${activityId} doneRes`).text(newRes);
		var progress = Math.round((newRes / users) * 1000) / 10; 
		$(`#completion_progress_${activityId} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activityId} done`).text(progress);
	},

	updateActivityResult: function(activityId, username, result, defaultValue=this.communSpecific.result_zero, displayDefaultValue=this.commun.result_disabled, partialValue=null,displayPartialValue=null, finalValue="true", displayFinalValue=this.communSpecific.result_view_final_value, painter="PainterFactory.Painters['activity']") {
		var users=parseInt(document.querySelector(`#result_progress_${activityId} total`).textContent);
		var res=parseInt(document.querySelector(`#result_progress_${activityId} doneres`).textContent);
		var partialRes=parseInt(document.querySelector(`#result_progress_${activityId} partialres`).textContent);
		var prev=document.querySelector(`#result_${activityId}_${username}`).textContent;
		var span;
		var newRes, newPartialRes;
		if(result){
			if(result == finalValue){
				color = 'green';
				state = displayFinalValue;
				if(! prev.includes(finalValue)) {
					newRes = res+1;
				}
			} else if(result == partialValue) {
				color = 'yellow';
				state = displayPartialValue;
				if(! prev.includes(partialValue)) {
					newPartialRes = partialRes+1;
				}
			} else {
				color = 'red';
				state = displayDefaultValue;
				if(!prev.includes(displayDefaultValue)) {
					if(prev.includes(displayPartialValue)) {
						newPartialRes = partialRes-1;
					}
					if(prev.includes(displayFinalValue)) {
						newRes = res+1;
					}
				}
			}
			span = `<span>
			<a onclick="${painter}.openResults('${activityId}','${username}')">${state}</a>
			<a onclick="${painter}.downloadResults('${activityId}','${username}')"> ⬇️</a>
			</span>`;
		} else {
			span = `<span><a>${displayDefaultValue}</a></span>`;
		}
		$(`#result_${activityId}_${username}`).removeClass();
		$(`#result_${activityId}_${username}`).addClass(color);
		$(`#result_${activityId}_${username}`).empty();
		$(`#result_${activityId}_${username}`).append(span);
		if(finalValue) {
			if(!newRes) {
				newRes = res;
			}
			$(`#result_progress_${activityId} doneRes`).text(newRes);
			var progress = Math.round((newRes / users) * 1000) / 10; 
			$(`#result_progress_${activityId} .done`).css('width', `${progress}%` );
			$(`#result_progress_${activityId} done`).text(progress);
		}
		if(partialValue) {
			if(!newPartialRes) {
				newPartialRes = partialRes;
			}
			$(`#result_progress_${activityId} partialres`).text(newPartialRes);
			var partialProgress = Math.round((newPartialRes / users) * 1000) / 10;
			$(`#result_progress_${activityId} .partial`).css('width', `${partialProgress}%` );
			$(`#result_progress_${activityId} partial`).text(partialProgress);
		}
	}, 

	updateActivityProgress: function(activityId, username, result) {
		var prevValue= parseInt(document.querySelector(`#progress_${activityId}_${username} done`).textContent);
		var users = parseInt(document.querySelector(`#progress_${activityId} total`).textContent);
		var res= parseInt(document.querySelector(`#progress_${activityId} doneres`).textContent);
		var partialres= parseInt(document.querySelector(`#progress_${activityId} partialres`).textContent);

		if(prevValue !== 100) {
			var progress=result*100;
			var visualProgress = progress >= 100 ? 100.2 : progress;
			$(`#progress_${activityId}_${username} .done`).css('width', `${visualProgress}%` );
			$(`#progress_${activityId}_${username} done`).text(progress);
			if(prevValue == 0 && result !== 0) {
				var newPartialProgressRes = partialres + 1;
				$(`#progress_${activityId} partialres`).text(newPartialProgressRes);
				var newPartialProgress = Math.round((newPartialProgressRes/users) * 1000)/10;
				$(`#progress_${activityId} partial`).text(newPartialProgress);
				$(`#progress_${activityId} .partial`).css('width', `${newPartialProgress}%` );
			}
			if(result == 1) {
				var newProgressRes = res + 1;
				$(`#progress_${activityId} doneres`).text(newProgressRes);
				var newProgress = Math.round((newProgressRes/ users) * 1000)/10;
				$(`#progress_${activityId} done`).text(newProgress);
				var visualNewProgress = newProgress >= 100 ? 100.2 : newProgress;
				$(`#progress_${activityId} .done`).css('width', `${visualNewProgress}%` );
			}
		} else {
			var progress=result*100;
			var visualProgress = progress >= 100 ? 100.2 : progress;
			$(`#progress_${activityId}_${username} .done`).css('width', `${visualProgress}%` );
			$(`#progress_${activityId}_${username} done`).text(progress);
			var newProgressRes = res - 1;
			$(`#progress_${activityId} doneres`).text(newProgressRes);
			var newProgress = Math.round((newProgressRes/ users) * 1000)/10;
			$(`#progress_${activityId} done`).text(newProgress);
			var visualNewProgress = newProgress >= 100 ? 100.2 : newProgress;
			$(`#progress_${activityId} .done`).css('width', `${visualNewProgress}%` );
			if(result == 0) {
				var newPartialProgressRes = partialres - 1;
				$(`#progress_${activityId} partialres`).text(newPartialProgressRes);
				var newPartialProgress = Math.round((newPartialProgressRes/users) * 1000)/10;
				$(`#progress_${activityId} partial`).text(newPartialProgress);
				$(`#progress_${activityId} .partial`).css('width', `${newPartialProgress}%` );
			}
		}
	},

	openResults: function(activity, user){
		Simva.getActivityResultForUser(activity, user, (error, result) => {
			if(error){
				$.toast({
					heading: error.message,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				Utils.openResultContent(result[user], 'Error loading the result');
			}
		});
	},

	downloadResults: function(activity, user){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};

		if(user) {
			Simva.getActivityResultForUser(activity, user, (error, result) => {
				if(error){
					toastParams.text = error.message;
					$.toast(toastParams);
				} else {
					var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}.json`;
					this.downloadContent(result[user], filename, this.commun.result_error_downloading);
				}
			});
		} else {
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

	toggleCompletion: function(checkbox, activityId, username){
		let status = $(checkbox).is(":checked");

		if(status){
			$(`#completion_${activityId}_${username}`).addClass('green');
			$(`#completion_${activityId}_${username}`).removeClass('red');
		}else{
			$(`#completion_${activityId}_${username}`).removeClass('green');
			$(`#completion_${activityId}_${username}`).addClass('red');
		}

		Simva.setActivityCompletion(activityId, username, status, function(){
			console.log('saved');
		});
	},

	getTMonUrl: function(activityId, testId, studyId) {
		let url = `${Simva.tmonUrl}/${studyId}/${testId}/${activityId}/${Simva.TMonFile}/dashboard/`;
		// Open the generated URL in a new tab
       	Utils.toggleIframeInFloating(url); 
	},

	exportActivity: function(activityId, testId, studyId) {
		Simva.exportActivity(activityId, testId, studyId, (error, result) => {
			if(error){
				$.toast({
					heading: this.commun.export_error,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				this.downloadContent(JSON.stringify(result, null, 2), `activity_export_${activityId}.json`, this.commun.export_error);
			}
		});
	},

	setCompletionForAllParticipant(activityid, status) {
		Simva.setMultiActivityCompletion(activityid, status, function(error, result){
			if(error){
				$.toast({
					heading: this.commun.completed_error,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				console.info("OK");
			}
		})
	},

	getLRSData: function(activity){
		Simva.getActivityLRSData(activity, (error, data) => {
			if(error){
				$.toast({
					heading: this.commun.result_error_downloading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				this.downloadContent(data.data, `full_xapi_data_${activity}.json`, this.commun.result_error_downloading);
			}
		});
	},

	getLRSTestData: function(activity){
		Simva.getActivityTestLRSData(activity, (error, data) => {
			if(error){
				$.toast({
					heading: this.commun.result_error_downloading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				this.downloadContent(data.data, `test_xapi_data_${activity}.json`, this.commun.result_error_downloading);
			}
		});
	},

	downloadGlobalMinioBackup: function(activity){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		
		Simva.getMinioDataUrl(activity, (error, result) => {
			if(error) {
				toastParams.text = error.message;
				$.toast(toastParams);
			} else {
				console.log('Minio URL for backup:', result);
				Utils.downloadContent(result.url, `${this.communSpecific.result_file_prefix}_${activity}.json`, this.commun.result_error_downloading);
			}
		});
	},

	downloadBackup: function(activity, user){
		var toastParams = {
			heading: this.commun.result_error_downloading,
			position: 'top-right',
			icon: 'error',
			stack: false
		};
		var filename = user ? `${this.communSpecific.result_file_prefix}_${activity}_${user}.json` : `${this.communSpecific.result_file_prefix}_${activity}.zip`;
		var zipname = `${this.communSpecific.result_file_prefix}_${activity}.zip`;
		var errorDownloading = this.commun.result_error_downloading;
		
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
					var zip = new JSZip();
					let hasResults = false;
					let downloadPromises = [];
					for(const participant in result) {
						if(result.hasOwnProperty(participant) && result[participant] != null) {
							downloadPromises.push(
								fetch(result[participant])
								.then((response) => {
									if(!response.ok) {
										throw new Error(`HTTP ${response.status}`);
									}
									return response.blob();
								})
								.then((blob) => {
									zip.file(`${this.communSpecific.result_file_prefix}_${activity}_${participant}.json`, blob);
								})
								.catch((error) => {
									console.error(`Error fetching result for participant ${participant}:`, error);
								})
							);
							hasResults = true;
						};
					}
					if(!hasResults) {
						Utils.download(`${this.communSpecific.result_file_prefix}_${activity}_nodata.json`, JSON.stringify(result,null,2));
					} else {
						Promise.all(downloadPromises)
						.then(() => zip.generateAsync({type:"blob"}))
						.then(function(content) {
							// see FileSaver.js
							saveAs(content, `${zipname}`);
						});
					}
				}
			});
		}
	},

};

PainterFactory.addPainter(ActivityPainter);