if(!PainterFactory){
	var PainterFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var LTIToolPainter = {

	supportedType: 'ltitool',
	simpleName: 'LTI tool activity',

	utils: {},
	tools: [],

	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		let form = `<div class="tabs">
				<span id="ltitoolpainter_tab_byexising" class="tab" method="byexisting" onclick="changeTab(this, \`new_activity_extras\`,\`ltitool_byexisting\`)">Existing Tool</span>
				<span class="tab" method="bynew" onclick="changeTab(this, \`new_activity_extras\`,\`ltitool_bynew\`)">New Tool</span>
			</div>
			<div id="ltitool_byexisting" class="subform">`;

		form += `</div>
			<div id="ltitool_bynew" class="subform">

			<p><label for="ltitool_name">Name</label><input id="ltitool_name" type="text" name="ltitool_name"></p>
			<p><label for="ltitool_description">Description</label><input id="ltitool_description" type="text" name="ltitool_description"></p>
			<p><label for="ltitool_url">URL</label><input id="ltitool_url" type="text" name="ltitool_url" placeholder="https://lti-tool.test/"></p>
			<p><label for="ltitool_jwks_uri">JWKS URI</label><input id="ltitool_jwks_uri" type="text" name="ltitool_jwks_uri" placeholder=".../.well-known/jwks.json"></p>
			<p><label for="ltitool_login_uri">Login URI</label><input id="ltitool_login_uri" type="text" name="ltitool_login_uri" placeholder=".../oidc/init"></p>
			<p><label for="ltitool_redirect_uri">Redirect URI</label><input id="ltitool_redirect_uri" type="text" name="ltitool_redirect_uri" placeholder=".../launch"></p>
			<p><a class="button green" onclick="LTIToolPainter.addLtiTool()">AddTool</a></p>
			</div>`

		this.loadToolList(function(){});


		return form;
	},
	
	getEditExtraForm: function () {
		return this.getExtraForm();
	},

	updateInputEditExtraForm(activity) {
	},

	loadToolList: function(callback){
		Simva.getLtiTools(function(error, result){
			this.tools = result;

			let form = '';

			if(this.tools.length > 0){
				form += '<select id="lti_tool_id" name="existingid" style="width: 87%">';
				for (var i = 0; i < this.tools.length; i++) {
					form += `<option value="${this.tools[i]._id}">${this.tools[i].name}</option>`;
				}

				form += '</select><a style="width: 10%" class="button red" onclick="LTIToolPainter.deleteSelectedLtiTool()">X</a>';
			}else{
				form += '<p>No tools available. Create a new one.</p>'
			}

			console.log(form);

			$('#ltitool_byexisting').html(form);

			callback();
		});
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let method = $('#new_activity_extras .tab.selected').attr('method');

		activity.name = formdata.name;
		activity.type = this.supportedType;

		switch(method){
			case 'byexisting':
				activity.tool = formdata.existingid;
				callback(null, activity);
				break;
			case 'bynew':
				callback('After creating new, you have to select from existing.');
				break;
			default:
				callback('Select a method first');
				break;
		}
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
			activity.tmp.completion = result;
			tmp.paintActivityCompletion(activity, result);
		});

		Simva.getActivityResult(activity._id, function(error, result){
			activity.tmp.result = result;
			tmp.paintActivityResult(activity, result);
		});

		Simva.getActivityTarget(activity._id, function(error, result){
			activity.tmp.result = result;
			tmp.paintActivityTargets(activity, result);
		});
	},

	paintActivity: function(activity, participants){
		let tool = { name: 'Not found' };
		for (var i = 0; i < this.utils.tools.length; i++) {
			if(this.utils.tools[i]._id === activity.extra_data.tool){
				tool = this.utils.tools[i];
				break;
			}
		}

		$(`#test_${activity.test} .activities`).append(`<div id="activity_${activity._id}" class="activity t${activity.type}">
			<div class="top"><h4>${activity.name}</h4>
			<input class="blue" type="button" value="🖍️" onclick="openEditActivityForm('${activity._id}')">
			<input class="red" type="button" value="X" onclick="deleteActivity('${activity._id}')"></div>
			<p class="subtitle">${this.simpleName}</p>
			<p>Tool ClientID: ${tool.client_id}</p>
			<div id="completion_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>
			<div id="result_progress_${activity._id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			if(!AllocatorFactory.Painters[allocator.type].isAllocatedToActivity(participants[i].username, activity)){
				continue;
			}
			
			toret += `<tr><td><a id="${activity._id}_${participants[i].username}_target"class="targeturl" 
			target="_blank" href="">${participants[i].username}</a></td>
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
			$(`#completion_${activity._id}_${usernames[i]}`).removeClass();
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
	},

	paintActivityResult: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {

			let color = 'red';
			let state = 'No Results';

			if(results[usernames[i]]){
				partial++;
				if(results[usernames[i]].submitdate){
					color = 'green';
					state = 'Completed';
					done++;
				}else{
					color = 'yellow';
					state = 'Started';
				}

				state =`<a onclick="LTIToolPainter.openResults('${activity._id}','${usernames[i]}')">${state}</a>`
			}

			let completion = `<span>${state}</span>`
			$(`#result_${activity._id}_${usernames[i]}`).removeClass();
			$(`#result_${activity._id}_${usernames[i]}`).addClass(color);
			$(`#result_${activity._id}_${usernames[i]}`).empty();
			$(`#result_${activity._id}_${usernames[i]}`).append(completion);
		}

		let progress = Math.round((done / usernames.length) * 1000) / 10; 
		let partialprogress = Math.round((partial / usernames.length) * 1000) / 10;

		if(isNaN(progress)){
			progress = 0;
		}
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}

		$(`#result_progress_${activity._id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity._id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity._id} done`).text(progress);
		$(`#result_progress_${activity._id} partial`).text(partialprogress);
	},

	paintActivityTargets: function(activity, results){
		let usernames = Object.keys(results);

		let done = 0, partial = 0;
		
		for (var i = 0; i < usernames.length; i++) {
			$(`#${activity._id}_${usernames[i]}_target`).attr('href', results[usernames[i]]);
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
			}else{
				let content = `<div style="padding: 20px;">${JSON.stringify(result[user], null, 2)}</div>`;
				let context = $('#iframe_floating iframe')[0].contentWindow.document;
				let body = $('body', context);
				body.html(content);
				toggleAddForm('iframe_floating');
			}
		})
	},

	addLtiTool: function(){
		let tool = {
			name: $('#ltitool_name').val(),
			description: $('#ltitool_description').val(),
			url: $('#ltitool_url').val(),
			jwks_uri: $('#ltitool_jwks_uri').val(),
			login_uri: $('#ltitool_login_uri').val(),
			redirect_uri: $('#ltitool_redirect_uri').val()
		}

		Simva.addLtiTool(tool, function(error, result){
			if(error){
				$.toast({
					heading: 'Error adding the lti Tool',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				LTIToolPainter.loadToolList(function(){
					$.toast({
						heading: 'Tool Added',
						position: 'top-right',
						icon: 'success',
						stack: false
					});
					$('#ltitool_name').val('');
					$('#ltitool_description').val('');
					$('#ltitool_url').val('');
					$('#ltitool_jwks_uri').val('');
					$('#ltitool_login_uri').val('');
					$('#ltitool_redirect_uri').val('');
					changeTab($('#ltitoolpainter_tab_byexising'), 'new_activity_extras','ltitool_byexisting');
				});
			}
		});
	},

	deleteSelectedLtiTool: function(){
		let id = $('#lti_tool_id').val();

		Simva.deleteLtiTool(id, function(error, result){
			if(error){
				$.toast({
					heading: 'Error deleting the lti Tool',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				LTIToolPainter.loadToolList(function(){
					$.toast({
						heading: 'Tool Deleted',
						position: 'top-right',
						icon: 'success',
						stack: false
					});
				});
			}
		});
	}
}

//PainterFactory.addPainter(LTIToolPainter);