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

		return String(participant.username);
	},

	getExtraForm: function (callback) {
		callback(null, '');
	},

	getEditExtraForm: function () {
		return '';
	},

	updateInputEditExtraForm(activity) {
	},

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};
		if(actualActivity.activity_name !== formdata.name) {
			activity.name = formdata.name;
		}
		callback(null, activity);
	},


	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
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
			if(results[participantKey]) {
				$(`#${activity.activity_id}_${participantKey}_target`).attr('href', results[participantKey]);
			}
		}
	},
 
	paintActivity: function(activity, participants){
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			<div class="top"><h4>${activity.activity_name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity.activity_id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity.activity_id}', '${activity.activity_name}', '${activity.session_id}')"></div>
			<p class="subtitle">${this.simple_name}</p>
			<p>${this.communSpecific.result_title}:<a onclick="PainterFactory.Painters["activity"].downloadResults('${activity.activity_id}')"> ⬇️</a></p>
			${this.paintActivityParticipantsTable(activity, participants, true)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants, checkbox=false, progress=true, result=true, init=true){
		let toret = `<div id="completion_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><span>${this.commun.completed_title}: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`;
		if(checkbox) {
			toret += this.paintActivityButtonCompletion(activity.activity_id);
		}
		if(init) {
			toret += `<div id="init_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><span>${this.commun.init_title}: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`;
		}
		if(progress) {
			toret += `<div id="progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.progress_title}: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		if(result) {
			toret += `<div id="result_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.result_title}: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		
		toret += `<table><tr><th>${this.commun.user_title}</th>`;
		if(init) {
			toret += `<th>${this.commun.init_title}</th>`;
		}
		if(progress) {
			toret += `<th>${this.commun.progress_title}</th>`;
		}
		toret += `<th>${this.commun.completed_title}</th>`;
		if(result) {
			toret += `<th>${this.commun.result_title}</th>`;
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
			let value = status[participantKey];
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
			if(status[participantKey]){
				done++;
			}
			if(checkbox) {
				if(status[participantKey]){
					$(`#completion_${activity.activity_id}_${participantKey}`).addClass('green');
					$(`#completion_${activity.activity_id}_${participantKey}`).removeClass('red');
				}else{
					$(`#completion_${activity.activity_id}_${participantKey}`).removeClass('green');
					$(`#completion_${activity.activity_id}_${participantKey}`).addClass('red');
				}
	
				$(`#completion_${activity.activity_id}_${participantKey}`).find('input[type="checkbox"]').prop('checked', status[participantKey]);
			} else {
				let completion = "";
				if(status[participantKey]==true) {
					completion=`<span>${completed_on}</span>`;
				} else {
					completion=`<span>${completed_off}</span>`;
				}
				
			 	$(`#completion_${activity.activity_id}_${participantKey}`).addClass(!status[participantKey] ? 'red' : 'green');
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
			let value = status[participantKey];
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
			$(`#progress_${activity.activity_id}_${participantKey} .done`).css('width', `${tmpprogress}%` );
			$(`#progress_${activity.activity_id}_${participantKey} done`).text(tmpprogress);
		}

		let progress = Math.round((done / total) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		$(`#progress_${activity.activity_id} .done`).css('width', `${progress}%` );
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
			let status = results[participantKey];
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
			$(`#progress_${activityId}_${username} .done`).css('width', `${progress}%` );
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
				$(`#progress_${activityId} .done`).css('width', `${newProgress}%` );
			}
		} else {
			var progress=result*100;
			$(`#progress_${activityId}_${username} .done`).css('width', `${progress}%` );
			$(`#progress_${activityId}_${username} done`).text(progress);
			var newProgressRes = res - 1;
			$(`#progress_${activityId} doneres`).text(newProgressRes);
			var newProgress = Math.round((newProgressRes/ users) * 1000)/10;
			$(`#progress_${activityId} done`).text(newProgress);
			$(`#progress_${activityId} .done`).css('width', `${newProgress}%` );
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
		Simva.getActivityResultForUser(activity, user, function(error, result){
			if(error){
				$.toast({
					heading: this.commun.result_error_loading,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				// Extract and sanitize the string
				const stringifyres = result[user]
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;");
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
		});
	},

	downloadResults: function(activity, user){
		if(user) {
			Simva.getActivityResultForUser(activity, user, function(error, result){
				if(error){
					$.toast({
						heading: this.commun.result_error_downloading,
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				} else {
					var filename = `${this.communSpecific.result_file_prefix}_${activity}_${user}.json`;
					Utils.download(filename, result[user]);
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
       	window.open(url, '_blank'); 
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

	getMinioData: function(activity){
		Simva.getMinioDataUrl(activity, function(error, result){
			if(error){
				$.toast({
					heading: 'Error loading the result',
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

	paintActivityButtonCompletion: function(activity) {
		return `<input class="red" type="button" value="${this.commun.completed_all_unset}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity}', false)">
		<input class="green" type="button" value="${this.commun.completed_all_set}" onclick="PainterFactory.Painters['activity'].setCompletionForAllParticipant('${activity}', true)">`;
	},
};

PainterFactory.addPainter(ActivityPainter);