if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var SessionAllocatorPainter = {
	supportedType: "session",
	type_translated: "session.type",
	simple_name: "session.title",
	description: "session.description",
	add_title: "allocator.add.title",
	add_message : "add.message",
	add_error : "add.error",
	type_title: "type.title",
	participant_title: "participant.title",
	test_title: "test.title",
	
	tests: [],
	groups: [],
	participants: [],
	allocator: null,
	study: null,

	setStudy: function(study){
		this.study = study;
	},

	setTests: function(tests){
		this.tests = tests;
	},

	setParticipants: function(participants){
		this.participants = participants;
	},

	setGroups: function(groups){
		this.groups = groups;
	},

	getFormTitle: function(){
		return this.add_title;
	},

	getFormContent: function(){
		// No form needed - all sessions are automatically allocated
		return "";
	},

	isAllocatedToActivity: function(student, activity){
		// In session allocator, all participants are allocated to ALL sessions
		return true;
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;

		let topaint = `<p class="subtitle italic">${this.type_title}: <span id="allocator_type">${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<div class="session-allocator-info">
				<p><strong>All participants in this group are allocated to all sessions.</strong></p>
				<table id="allocator_sessions" class="allocations">
					<thead>
						<tr>
							<th>Session</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>`;

		for (var i = 0; i < this.tests.length; i++) {
			topaint += `<tr>
				<td>${this.tests[i].session_name}</td>
				<td><span class="badge badge-success">All Participants</span></td>
			</tr>`;
		}

		topaint += `</tbody></table>
			</div>
			<div class="session-allocator-actions">
				<input class="violet" type="button" value="Allocate All to Sessions" onclick="SessionAllocatorPainter.allocateAllToSessions()">
			</div>`;

		$('#allocator_content').html(topaint);
	},

	paintAllocatorForGroup: function(group, selector){
		this.allocator = group;

		let topaint = `<p class="subtitle italic">${this.type_title}: <span>${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<div class="session-allocator-info">
				<p><strong>All participants are allocated to all sessions.</strong></p>
				<table class="allocations">
					<thead>
						<tr>
							<th>Session</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>`;

		for (var i = 0; i < this.tests.length; i++) {
			topaint += `<tr>
				<td>${this.tests[i].session_name}</td>
				<td><span class="badge badge-success">Allocated</span></td>
			</tr>`;
		}

		topaint += `</tbody></table>
			</div>
			<div class="session-allocator-actions">
				<input class="violet" type="button" value="Re-allocate All" onclick="SessionAllocatorPainter.allocateAllForGroup('${group.group_id}')">
			</div>`;

		$(selector).html(topaint);
	},

	allocateAllToSessions: function(){
		let tmp = this;
		let sessionIds = this.tests.map(t => t.session_id);
		
		// For session allocator, we need to allocate the entire group to all sessions
		// The backend handles this when the allocator type is 'session'
		for(let i = 0; i < this.groups.length; i++){
			let groupId = this.groups[i].group_id;
			Simva.allocateToSession(tmp.study.simlet_id, groupId, sessionIds, null, function(error, result){
				if(error){
					$.toast({
						heading: tmp.add_error,
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				}else{
					$.toast({
						heading: tmp.add_message,
						text: 'Group allocated to all sessions',
						position: 'top-right',
						icon: 'success',
						stack: false
					});
					reloadStudy();
				}
			});
		}
	},

	allocateAllForGroup: function(groupId){
		let tmp = this;
		let sessionIds = this.tests.map(t => t.session_id);
		
		Simva.allocateToSession(tmp.study.simlet_id, groupId, sessionIds, null, function(error, result){
			if(error){
				$.toast({
					heading: tmp.add_error,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				$.toast({
					heading: tmp.add_message,
					text: 'Group allocated to all sessions',
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				reloadStudy();
			}
		});
	}
}

AllocatorFactory.addPainter(SessionAllocatorPainter);
