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
	simpleName: 'Default activity',
	description: '',

	utils: {},
	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		return '';
	},

	getEditExtraForm: function () {
		return '';
	},

	updateInputEditExtraForm(activity) {
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
		
				callback(null, activity);
			} else {
				callback(error, null);
			}
		});
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
		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Default Activity</p>
			<p>Result:<a onclick="ActivityPainter.downloadResults('${activity._id}')"> ⬇️</a></p>
			<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>% [ <doneres>0</doneres>/<total>0</total> ]</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%  [ <partialres>0</partialres> (<doneres>0</doneres>) /<total>0</total> ]</span></div>
			<div id="progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Progress:<partial>0</partial>(<done>0</done>)%  [ <partialres>0</partialres> (<doneres>0</doneres>) /<total>0</total> ]</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += `<tr><td>${participants[i].username}</td>
				<td id="completion_${activity._id}_${participants[i].username}">---</td>
				<td id="result_${activity._id}_${participants[i].username}">---</td>`;
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status){
		let usernames = Object.keys(status);

		let done = 0;

		for (var i = 0; i < usernames.length; i++) {
			if(status[usernames[i]]){
				done++;
			}

			let completion = `<span>${status[usernames[i]]}</span>`
			$(`#completion_${activity._id}_${usernames[i]}`).addClass(!status[usernames[i]] ? 'red' : 'green');
			$(`#completion_${activity._id}_${usernames[i]}`).empty();
			$(`#completion_${activity._id}_${usernames[i]}`).append(completion);
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
		let usernames = Object.keys(status);
		let done = 0, partial = 0;

		for (var i = 0; i < usernames.length; i++) {
			if(status[usernames[i]] !== 0){
				partial++;
				if(status[usernames[i]] == 1){
					done++;
				}
			}

			let tmpprogress = status[usernames[i]]*100;
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

	paintActivityResult: function(activity, results, defaultValue='No Results', partialValue=null, finalValue="See Results", painter="ActivityPainter"){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;

		for (var i = 0; i < usernames.length; i++) {
			let status = results[usernames[i]];
			let result = `<span>${defaultValue}</span>`
			let color = 'red';
			let state = defaultValue;
			if(status){
				if(status == finalValue){
					color = 'green';
					state = finalValue;
					done++;
					partial++;
				} else if(status == partialValue) {
					color = 'yellow';
					state = partialValue;
					partial++;
				} else {
					color = 'red';
					state = defaultValue;
				}
				if(state == defaultValue) {
					result = `<span>${state}</span>`;
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

	updateActivityCompletion: function(activityId, username, completion) {
		var users = parseInt(document.querySelector(`#completion_progress_${activityId} total`).textContent);
		var res= parseInt(document.querySelector(`#completion_progress_${activityId} doneres`).textContent);
		var previousCompletion= document.querySelector(`#completion_${activityId}_${username}`).textContent;
		$(`#completion_${activityId}_${username}`).addClass(completion == 'false' ? 'red' : 'green');
		$(`#completion_${activityId}_${username}`).empty();
		$(`#completion_${activityId}_${username}`).append(completion);
		if(previousCompletion == "false") {
			var newRes = res + 1;
			$(`#completion_progress_${activityId} doneRes`).text(newRes);
			var progress = Math.round((newRes / users) * 1000) / 10; 
			$(`#completion_progress_${activityId} .done`).css('width', `${progress}%` );
			$(`#completion_progress_${activityId} done`).text(progress);
		}
	},

	updateActivityResult: function(activityId, username, result, defaultValue='No Results', partialValue=null, finalValue="See Results", painter="ActivityPainter") {
		var users = parseInt(document.querySelector(`#result_progress_${activityId} total`).textContent);
		var res= parseInt(document.querySelector(`#result_progress_${activityId} doneres`).textContent);
		var partialRes= parseInt(document.querySelector(`#result_progress_${activityId} partialres`).textContent);
		var prev= document.querySelector(`#result_${activityId}_${username}`).textContent;
		var span;
		var newRes, newPartialRes;
		if(result){
			if(result == finalValue){
				color = 'green';
				state = finalValue;
				if(! prev.includes(finalValue)) {
					newRes = res+1;
				}
			} else if(result == partialValue) {
				color = 'yellow';
				state = partialValue;
				if(! prev.includes(partialValue)) {
					newPartialRes = partialRes+1;
				}
			} else {
				color = 'red';
				state = defaultValue;
				if(!prev.includes(defaultValue)) {
					if(prev.includes(partialValue)) {
						newPartialRes = partialRes-1;
					}
					if(prev.includes(finalValue)) {
						newRes = res+1;
					}
				}
			}
			span = `<span>
			<a onclick="${painter}.openResults('${activityId}','${username}')">${state}</a>
			<a onclick="${painter}.downloadResults('${activityId}','${username}')"> ⬇️</a>
			</span>`;
		} else {
			span = `<span><a>${defaultValue}</a></span>`;
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
				var newPartialProgress = (newPartialProgressRes/users) * 100;
				$(`#progress_${activityId} partial`).text(newPartialProgress);
				$(`#progress_${activityId} .partial`).css('width', `${newPartialProgress}%` );
			}
			if(result == 1) {
				var newProgressRes = res + 1;
				$(`#progress_${activityId} doneres`).text(newProgressRes);
				var newProgress = (newProgressRes/ users) * 100;
				$(`#progress_${activityId} done`).text(newProgress);
				$(`#progress_${activityId} .done`).css('width', `${newProgress}%` );
			}
		}
	},

	openResults: function(activity, user){
		Simva.getActivityResultForUser(activity, user, function(error, result){
			if(error){
				$.toast({
					heading: 'Error loading the result',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			} else {
				let content = `<div style="padding: 20px;">${result[user]}</div>`;
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				Utils.toggleAddForm('iframe_floating');
			}
		});
	},

	downloadResults: function(activity, user){
		if(user) {
			Simva.getActivityResultForUser(activity, user, function(error, result){
				if(error){
					$.toast({
						heading: 'Error loading the result',
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				} else {
					var filename = `${activity}_${user}.json`;
					Utils.download(filename, result[user]);
				}
			});
		} else {
			Simva.downloadActivityResult(activity);
		}
	}
}

PainterFactory.addPainter(ActivityPainter);