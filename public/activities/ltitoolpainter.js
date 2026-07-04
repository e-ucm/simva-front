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
	simple_name: 'LTI tool activity',
	commun : {},
	communSpecific : {},
	specific : {},
	utils: {},
	tools: [],

	setUtils: function(utils){
		this.utils = utils;
	},

	getExtraForm: function () {
		let form = `<div class="tabs">
				<span id="ltitoolpainter_tab_byexising" class="tab" method="byexisting" onclick="Utils.changeTab(this, \`new_activity_extras\`,\`ltitool_byexisting\`)">Existing Tool</span>
				<span class="tab" method="bynew" onclick="Utils.changeTab(this, \`new_activity_extras\`,\`ltitool_bynew\`)">New Tool</span>
			</div>
			<div id="ltitool_byexisting" class="subform selected">`;

		form += `</div>
			<div id="ltitool_bynew" class="subform" style="display: none;">

			<p><label for="ltitool_name">Name</label><input id="ltitool_name" type="text" name="ltitool_name"></p>
			<p><label for="ltitool_description">Description</label><input id="ltitool_description" type="text" name="ltitool_description"></p>
			<p><label for="ltitool_url">URL</label><input id="ltitool_url" type="text" name="ltitool_url" placeholder="https://lti-tool.test/"></p>
			<p><label for="ltitool_jwks_uri">JWKS URI</label><input id="ltitool_jwks_uri" type="text" name="ltitool_jwks_uri" placeholder=".../.well-known/jwks.json"></p>
			<p><label for="ltitool_login_uri">Login URI</label><input id="ltitool_login_uri" type="text" name="ltitool_login_uri" placeholder=".../oidc/init"></p>
			<p><label for="ltitool_redirect_uri">Redirect URI</label><input id="ltitool_redirect_uri" type="text" name="ltitool_redirect_uri" placeholder=".../launch"></p>
			<p><a class="button green" onclick="LTIToolPainter.addLtiTool()">AddTool</a></p>
			</div>`

		this.loadToolList(function(){});


		callback(null, form);
	},
	
	getEditExtraForm: function () {
		return "";
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
					form += `<option value="${this.tools[i]._id}">${this.tools[i].session_name}</option>`;
				}

				form += '</select><a style="width: 10%" class="button red" onclick="LTIToolPainter.deleteSelectedLtiTool()">X</a>';
			}else{
				form += '<p>No tools available. Create a new one.</p>'
			}

			$('#ltitool_byexisting').html(form);

			callback();
		});
	},

	extractInformation: function(form, callback){
		let activity = {};

		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let method = $('#new_activity_extras .tab.selected').attr('method');

		activity.name = formdata.activityName;
		activity.activity_type = this.supportedType;

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

	extractEditInformation: function(form, actualActivity, callback){
		let jform = $(form);
		let formdata = Utils.getFormData(jform);
		let activity = {};

		if(actualActivity.activity_name !== formdata.activityName) {
			activity.name = formdata.activityName;
		}
		callback(null, activity);
	},

	fullyPaintActivity: function(activity, participants){
		this.paintActivity(activity, participants);
		this.updateParticipants(activity, participants);
	},

	updateParticipants: function(activity, participants){
		PainterFactory.Painters["activity"].paintActivityCompletion(activity, activity.data.completion, true, participants);
		PainterFactory.Painters["activity"].paintActivityResult(activity, activity.data.result, "true", participants);
		if(activity.data.openable){
			PainterFactory.Painters["activity"].paintActivityTargets(activity, activity.data.target, participants);
		}
	},

	paintActivity: function(activity, participants){
		let tool = { name: 'Not found' };
		for (var i = 0; i < this.utils.tools.length; i++) {
			if(this.utils.tools[i]._id === activity.tool){
				tool = this.utils.tools[i];
				break;
			}
		}

		const topBar = PainterFactory.Painters['activity'].paintActivityTopBar.call(this, activity, '');
		$(`#test_${activity.session_id} .activities`).append(`<div id="activity_${activity.activity_id}" class="activity t${activity.activity_type}">
			${topBar}
			<p class="subtitle" title="${this.description || ''}">${this.simple_name}</p>
			<p>Tool ClientID: ${tool.client_id}</p>
			<div id="completion_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><span>Completed: <done>0</done>%</span></div>
			<div id="result_progress_${activity.activity_id}" class="progress"><div class="partial"></div><div class="done"></div><div></div><span>Results: <partial>0</partial>(<done>0</done>)%</span></div>
			${this.paintActivityParticipantsTable(activity, participants)}</div>`);
	},

	paintActivityParticipantsTable: function(activity, participants){
		let toret = '<table><tr><th>User</th><th>Completed</th><th>Result</th></tr>';

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			toret += `<tr><td>${PainterFactory.Painters["activity"].paintUsernameOrToken(activity, participants[i])}</td>`;
			toret += `<td id="completion_${activity.activity_id}_${participantKey}">---</td>
			<td id="result_${activity.activity_id}_${participantKey}">---</td>`;
		}

		toret += '</table>';

		return toret;
	},

	paintActivityCompletion: function(activity, status, participants=[]){
		let total = participants.length;
		if(!status) {
			return;
		}

		let done = 0;

		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);
			if(status[participantKey]){
				done++;
			}

			let completion = `<span>${status[participantKey]}</span>`
			$(`#completion_${activity.activity_id}_${participantKey}`).removeClass();
			$(`#completion_${activity.activity_id}_${participantKey}`).addClass(!status[participantKey] ? 'red' : 'green');
			$(`#completion_${activity.activity_id}_${participantKey}`).empty();
			$(`#completion_${activity.activity_id}_${participantKey}`).append(completion);
		}

		let progress = Math.round((done / total) * 1000) / 10; 

		if(isNaN(progress)){
			progress = 0;
		}

		$(`#completion_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#completion_progress_${activity.activity_id} done`).text(progress);
	},

	paintActivityResult: function(activity, results, participants=[]){
		let total = participants.length;
		if(!results) {
			return;
		}

		let done = 0, partial = 0;
		
		for (var i = 0; i < participants.length; i++) {
			const participantKey = PainterFactory.Painters["activity"].getParticipantKey(participants[i]);

			let color = 'red';
			let state = 'No Results';

			if(results[participantKey]){
				partial++;
				if(results[participantKey].submitdate){
					color = 'green';
					state = 'Completed';
					done++;
				}else{
					color = 'yellow';
					state = 'Started';
				}

				state =`<a onclick="LTIToolPainter.openResults('${activity.activity_id}','${participantKey}')">${state}</a>`
			}

			let completion = `<span>${state}</span>`
			$(`#result_${activity.activity_id}_${participantKey}`).removeClass();
			$(`#result_${activity.activity_id}_${participantKey}`).addClass(color);
			$(`#result_${activity.activity_id}_${participantKey}`).empty();
			$(`#result_${activity.activity_id}_${participantKey}`).append(completion);
		}

		let progress = Math.round((done / total) * 1000) / 10; 
		let partialprogress = Math.round((partial / total) * 1000) / 10;

		if(isNaN(progress)){
			progress = 0;
		}
		if(isNaN(partialprogress)){
			partialprogress = 0;
		}

		$(`#result_progress_${activity.activity_id} .done`).css('width', `${progress}%` );
		$(`#result_progress_${activity.activity_id} .partial`).css('width', `${partialprogress}%` );
		$(`#result_progress_${activity.activity_id} done`).text(progress);
		$(`#result_progress_${activity.activity_id} partial`).text(partialprogress);
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
				Utils.openResultContent(result[user], 'Error loading the result');
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
					Utils.changeTab($('#ltitoolpainter_tab_byexising'), 'new_activity_extras','ltitool_byexisting');
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