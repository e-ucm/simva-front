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
	simple_name: 'activity.type',
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
		if(actualActivity.name !== formdata.name) {
			activity.name = formdata.name;
		}
		callback(null, activity);
	},


	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);

		activity.name = formdata.name;
		activity.type = this.supportedType;

		callback(null, activity);
	},

	fullyPaintActivity: function(activity){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity);
	},

	updateParticipants: function(activity){
		this.paintActivityCompletion(activity, activity.data.completion, true);
		this.paintActivityResult(activity, activity.data.hasresult, true);
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target);
		}
	},

	paintActivityTargets: function(activity, results){
		if(!results) {
			return;
		}
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$(`#${activity._id}_${usernames[i]}_target`).attr('href', results[usernames[i]]);
		}
	},
 
	paintActivity: function(activity, participants){
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}', '${activity.name}', '${activity.test}')"></div>
			<p class="subtitle">${this.simple_name}</p>
			<p>${this.communSpecific.result_title}:<a onclick="PainterFactory.Painters["activity"].downloadResults('${activity._id}')"> ⬇️</a></p>
			${this.paintActivityParticipantsTable(activity, participants, true)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants, checkbox=false, progress=true, result=true){
		let toret = `<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>${this.commun.completed_title}: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>`;
		if(checkbox) {
			toret += this.paintActivityButtonCompletion(activity._id);
		}
		if(progress) {
			toret += `<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.result_title}: <done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		if(result) {
			toret += `<div id="progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>${this.commun.progress_title}:<done>0</done> (<partial>0</partial>) %  [ <doneres>0</doneres> (<partialres>0</partialres>) /<total>0</total> ]</span></div>`;
		}
		
		toret += `<table><tr><th>${this.commun.user_title}</th><th>${this.commun.completed_title}</th>`;
		if(progress) {
			toret += `<th>${this.commun.progress_title}</th>`;
		}
		if(result) {
			toret += `<th>${this.commun.result_title}</th>`;
		}
		toret += '</tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.allocator_type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			toret += `<tr><td>${this.paintUsernameOrToken(activity, participants[i])}</td>`;
			toret += `${this.paintCompletionRow(activity._id,participants[i].username, checkbox)}`;
			if(progress) {
				toret += `${this.paintProgressRow(activity._id,participants[i].username)}`
			}
			if(result){
				toret += `${this.paintResultRow(activity._id,participants[i].username)}`;
			}else{
				toret += `<td><i>${this.commun.result_disabled}</i></td>`;
			}
		}

		toret += '</table>';

		return toret;
	},

	paintUsernameOrToken(activity, participant, ok=null) {
		let openable = activity.data.openable;
		if(ok !== '') {
			openable = openable || ok;
		}
		let toret="";
		if(openable) {
			toret += `<a id="${activity._id}_${participant.username}_target" class="targeturl" target="_blank" href="">${this.getUsernameOrToken(participant)}</a>`;
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
		return `<td id="progress_${activity}_${participant}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>`;
	},

	paintResultRow(activity, participant) {
		return `<td id="result_${activity}_${participant}">---</td>`;
	},

	paintProgressRow(activity, participant) {
		return `<td id="progress_${activity}_${participant}" class="progress"><div class="partial"></div><div class="done"></div><span><done>0</done>%</span></td>`;
	},

	paintActivityCompletion: function(activity, status, checkbox=false, completed_on=this.commun.completed_on, completed_off=this.commun.completed_off){
		if(!status) {
			return;
		}
		let usernames = Object.keys(status);

		let done = 0;

		for (var i = 0; i < usernames.length; i++) {
			if(status[usernames[i]]){
				done++;
			}
			if(checkbox) {
				if(status[usernames[i]]){
					$(`#completion_${activity._id}_${usernames[i]}`).addClass('green');
					$(`#completion_${activity._id}_${usernames[i]}`).removeClass('red');
				}else{
					$(`#completion_${activity._id}_${usernames[i]}`).removeClass('green');
					$(`#completion_${activity._id}_${usernames[i]}`).addClass('red');
				}
	
				$(`#completion_${activity._id}_${usernames[i]}`).find('input[type="checkbox"]').prop('checked', status[usernames[i]]);
			} else {
				let completion = "";
				if(status[usernames[i]]==true) {
					completion=`<span>${completed_on}</span>`;
				} else {
					completion=`<span>${completed_off}</span>`;
				}
				
			 	$(`#completion_${activity._id}_${usernames[i]}`).addClass(!status[usernames[i]] ? 'red' : 'green');
				$(`#completion_${activity._id}_${usernames[i]}`).empty();
				$(`#completion_${activity._id}_${usernames[i]}`).append(completion);
			}
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#completion_progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activity._id} done`).text(progress);
		$(`#completion_progress_${activity._id} doneres`).text(done);
		$(`#completion_progress_${activity._id} total`).text(usernames.length);
	},

	paintActivityProgress: function(activity, status){
		if(!status) {
			return;
		}
		let usernames = Object.keys(status);
		let done = 0, partial = 0;

		for (var i = 0; i < usernames.length; i++) {
			if(status[usernames[i]] !== 0){
				partial++;
				if(status[usernames[i]] == 1){
					done++;
				}
			}

			let tmpprogress = Math.round(status[usernames[i]] * 1000) / 10;
			$(`#progress_${activity._id}_${usernames[i]} .done`).css('width', `${tmpprogress}%` );
			$(`#progress_${activity._id}_${usernames[i]} done`).text(tmpprogress);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		$(`#progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#progress_${activity._id} done`).text(progress);
		$(`#progress_${activity._id} doneres`).text(done);

		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}
		$(`#progress_${activity._id} .partial`).css('width', `${partialprogress}%` );
		$(`#progress_${activity._id} partial`).text(partialprogress);
		$(`#progress_${activity._id} partialres`).text(partial);
		$(`#progress_${activity._id} total`).text(usernames.length);
	},

	paintActivityResult: function(activity, results, defaultValue="true", displayDefaultValue=this.communSpecific.result_zero, partialValue=null,displayPartialValue=this.communSpecific.result_view_partial_value, finalValue="true", displayFinalValue=this.communSpecific.result_view_final_value,painter="PainterFactory.Painters['activity']"){
		if(!results) {
			return;
		}
		let usernames = Object.keys(results);

		let done = 0, partial = 0;

		for (var i = 0; i < usernames.length; i++) {
			let status = results[usernames[i]];
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
					<a onclick="${painter}.openResults('${activity._id}','${usernames[i]}')">${state}</a>
					<a onclick="${painter}.downloadResults('${activity._id}','${usernames[i]}')">⬇️</a>
					</span>`;
				}
			}
			$(`#result_${activity._id}_${usernames[i]}`).removeClass();
			$(`#result_${activity._id}_${usernames[i]}`).addClass(color);
			$(`#result_${activity._id}_${usernames[i]}`).empty();
			$(`#result_${activity._id}_${usernames[i]}`).append(result);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		if(isNaN(progress)){
			progress = 0;
		}
		$(`#result_progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity._id} done`).text(progress);
		$(`#result_progress_${activity._id} doneres`).text(done);

		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}
		$(`#result_progress_${activity._id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity._id} partial`).text(partialprogress);
		$(`#result_progress_${activity._id} partialres`).text(partial);
		$(`#result_progress_${activity._id} total`).text(usernames.length);
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