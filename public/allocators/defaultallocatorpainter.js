if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var DefaultAllocatorPainter = {
	supportedType: 'default',
	type_translated: "group.type",
	simple_name: "default.title",
	description: "default.description",
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

	findGroupForParticipant: function(userId){
		for(let i = 0; i < this.groups.length; i++){
			if(this.groups[i].participants && this.groups[i].participants.includes(userId)){
				return this.groups[i].group_id;
			}
		}
		return null;
	},

	getFormTitle: function(){
		return this.add_title;
	},

	isAllocatedToActivity: function(student, activity){
		// student is user_id
		let notallocated = !((typeof allocator.allocations !== 'undefined')
						&& (typeof allocator.allocations[student] !== 'undefined'));

		return (!notallocated && allocator.allocations[student] === activity.session_id)
				|| (notallocated && activity.session_id === this.tests[0].session_id);
	},

	getFormContent: function(){
		let toret = `<p>${this.participant_title}: </p><select name="user_id">`;
		for (var i = 0; i < participants.length; i++) {
			if(allocator.allocations){
				if(allocator.allocations[participants[i].user_id]){
					continue;
				}
			}

			toret += `<option value="${participants[i].user_id}">${allocator.data.displayparticipants[participants[i].user_id] || participants[i].username}</option>`;
		}

		toret += `</select><p>${this.test_title}: </p><select name="test">`;

		for (var i = 0; i < tests.length; i++) {
			toret += `<option value="${tests[i].session_id}">${tests[i].session_name}</option>`;
		}

		toret += `</select><input type="button" value="${this.add_title}" onclick="DefaultAllocatorPainter.addAllocationFromForm()">`;

		return toret;
	},

	addAllocationFromForm: function(){
		let userId = $('#edit_allocator_content select[name="user_id"]').val();
		let groupId = this.findGroupForParticipant(userId);
		this.addAllocation(groupId);
	},

	paintAllocatorForGroup: function(group, selector){
		this.allocator = group;

		let topaint = `
			<p class="subtitle italic">${this.type_title}: <span>${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
		`;
		$(selector).html(topaint);

		// Get participants for this specific group
		let groupParticipants = this.participants.filter(p => group.participants && group.participants.includes(p.user_id));

		if(groupParticipants.length > 0){
			// Find the users table and add a cell in the header before the last one 
			const table = $(selector).siblings(".participants_container").find(".participants");
			let row = $(table.find("thead tr")).first();
			row.find('th:last').before(`<th>${this.test_title}</th>`);

			for (var i = 0; i < groupParticipants.length; i++) {
				let participant = groupParticipants[i];

				// Get the allocated session for this user from allocations
				let allocatedTest = (group.allocations && group.allocations[participant.user_id]) 
					? group.allocations[participant.user_id] 
					: (this.tests.length > 0 ? this.tests[0].session_id : null);

				// Add a cell in the table before the last column with the session selector for the user row 
				row = $(table.find("tbody tr")).eq(i)
				row.find('td:last').before(`<td>
					${this.generateUserGroupSelector({
							user_id: participant.user_id, 
							test: allocatedTest,
							group_id: group.group_id
						})
					}
				</td>`);
			}
		}
	},

	generateUserGroupSelector: function(allocation){
		let topaint = `<select id="allocation_${allocation.group_id}_${allocation.user_id}"
			onchange="DefaultAllocatorPainter.updateAllocationForGroup('${allocation.group_id}', '${allocation.user_id}')">`;

		// Add all the sessions to the selector
		for (var i = 0; i < this.tests.length; i++) {
			let selected = (this.tests[i].session_id === allocation.test ? 'selected' : '');
			topaint += `<option value="${this.tests[i].session_id}" ${selected}> 
			${this.tests[i].session_name}</option>`;
		}

		topaint += '</select>';
		return topaint;
	},

	updateAllocationForGroup: function(groupId, userId){
		let tmp = this;
		const selectedTest = $(`#allocation_${groupId}_${userId}`).val();
		const participantId = parseInt(userId, 10);

		if (Number.isNaN(participantId)) {
			$.toast({
				heading: tmp.add_error,
				text: 'Invalid participant id',
				position: 'top-right',
				icon: 'error',
				stack: false
			});
			return;
		}

		Simva.allocateToSession(tmp.study.simlet_id, groupId, selectedTest, { participant_id: participantId }, function(error, result){
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
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				reloadStudy();
			}
		});
	},


	addAllocation: function(groupId){
		let tmp = this;

		let userId = $('#edit_allocator_content select[name="user_id"]').val();
		let participantId = parseInt(userId, 10);
		let test = $('#edit_allocator_content select[name="test"]').val();

		if(!userId || Number.isNaN(participantId)){
			$.toast({
				heading: tmp.add_error,
				text: `No participant selected`,
				position: 'top-right',
				icon: 'error',
				stack: false
			});
			return;
		}
		
		if(!this.allocator.allocations){
			this.allocator.allocations = {};
		}

		this.allocator.allocations[userId] = test;

		Simva.allocateToSession(this.study.simlet_id, groupId, test, { participant_id: participantId }, function(error, result){
			if(error){
				delete tmp.allocator.allocations[userId];
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
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				tmp.paintAllocator(tmp.allocator);
				reloadStudy();
			}
		});
	}
}

AllocatorFactory.addPainter(DefaultAllocatorPainter);